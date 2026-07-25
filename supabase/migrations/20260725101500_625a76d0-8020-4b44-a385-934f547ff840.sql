-- Approval workflow + deadlines + alerts for maintenance campaigns

-- 1) Approval columns on hang_muc
ALTER TABLE public.dot_bao_duong_hang_muc
  ADD COLUMN IF NOT EXISTS duyet_trang_thai text NOT NULL DEFAULT 'chua_gui',
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approval_note text,
  ADD COLUMN IF NOT EXISTS han_hoan_thanh date;

ALTER TABLE public.dot_bao_duong_hang_muc
  DROP CONSTRAINT IF EXISTS dot_bao_duong_hang_muc_duyet_chk;
ALTER TABLE public.dot_bao_duong_hang_muc
  ADD CONSTRAINT dot_bao_duong_hang_muc_duyet_chk
  CHECK (duyet_trang_thai IN ('chua_gui','cho_duyet','da_duyet','tu_choi'));

-- 2) Per-unit deadline milestones
CREATE TABLE IF NOT EXISTS public.dot_bao_duong_han (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dot_id uuid NOT NULL REFERENCES public.dot_bao_duong(id) ON DELETE CASCADE,
  don_vi_id uuid NOT NULL REFERENCES public.dm_don_vi(id),
  han_ngay date NOT NULL,
  mo_ta text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dot_id, don_vi_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dot_bao_duong_han TO authenticated;
GRANT ALL ON public.dot_bao_duong_han TO service_role;
ALTER TABLE public.dot_bao_duong_han ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dbd_han_read" ON public.dot_bao_duong_han FOR SELECT TO authenticated USING (true);
CREATE POLICY "dbd_han_write_kt" ON public.dot_bao_duong_han TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'phong_kt'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'phong_kt'));
CREATE TRIGGER trg_dbd_han_upd BEFORE UPDATE ON public.dot_bao_duong_han
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3) Harden hang_muc RLS: unit can write only if not approved and dot not closed
DROP POLICY IF EXISTS dbd_hm_write_dv ON public.dot_bao_duong_hang_muc;
CREATE POLICY "dbd_hm_write_dv" ON public.dot_bao_duong_hang_muc TO authenticated
  USING (
    don_vi_id = get_user_don_vi_id(auth.uid())
    AND duyet_trang_thai <> 'da_duyet'
    AND EXISTS (
      SELECT 1 FROM public.dot_bao_duong d
      WHERE d.id = dot_id AND d.trang_thai NOT IN ('dong','huy')
    )
  )
  WITH CHECK (
    don_vi_id = get_user_don_vi_id(auth.uid())
    AND duyet_trang_thai <> 'da_duyet'
    AND EXISTS (
      SELECT 1 FROM public.dot_bao_duong d
      WHERE d.id = dot_id AND d.trang_thai NOT IN ('dong','huy')
    )
  );

-- KT/admin policy already exists (dbd_hm_write_kt) allowing all writes.

-- 4) Harden dot_bao_duong: prevent edits after closed except by admin
DROP POLICY IF EXISTS dot_bd_write_kt ON public.dot_bao_duong;
CREATE POLICY "dot_bd_write_kt" ON public.dot_bao_duong TO authenticated
  USING (
    (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'phong_kt'))
    AND (trang_thai <> 'dong' OR has_role(auth.uid(),'admin'))
  )
  WITH CHECK (
    (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'phong_kt'))
    AND (trang_thai <> 'dong' OR has_role(auth.uid(),'admin'))
  );

-- 5) RPCs: submit / approve / reject
CREATE OR REPLACE FUNCTION public.dot_hm_submit(p_hang_muc_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_dv uuid; v_user uuid := auth.uid(); v_dot_status text; v_duyet text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT hm.don_vi_id, hm.duyet_trang_thai, d.trang_thai::text
    INTO v_dv, v_duyet, v_dot_status
  FROM public.dot_bao_duong_hang_muc hm
  JOIN public.dot_bao_duong d ON d.id = hm.dot_id
  WHERE hm.id = p_hang_muc_id;
  IF v_dv IS NULL THEN RAISE EXCEPTION 'hang_muc_not_found'; END IF;
  IF v_dot_status IN ('dong','huy') THEN RAISE EXCEPTION 'dot_closed'; END IF;
  IF v_duyet = 'da_duyet' THEN RAISE EXCEPTION 'already_approved'; END IF;
  IF NOT (has_role(v_user,'admin') OR has_role(v_user,'phong_kt')
          OR v_dv = get_user_don_vi_id(v_user)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.dot_bao_duong_hang_muc
     SET duyet_trang_thai = 'cho_duyet',
         submitted_at = now(),
         submitted_by = v_user
   WHERE id = p_hang_muc_id;
END; $$;

CREATE OR REPLACE FUNCTION public.dot_hm_approve(p_hang_muc_id uuid, p_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF NOT (has_role(v_user,'admin') OR has_role(v_user,'phong_kt')) THEN
    RAISE EXCEPTION 'forbidden_only_kt';
  END IF;
  UPDATE public.dot_bao_duong_hang_muc
     SET duyet_trang_thai = 'da_duyet',
         approved_at = now(),
         approved_by = v_user,
         approval_note = p_note,
         trang_thai = CASE WHEN trang_thai::text = 'chua_bat_dau'
                           THEN 'hoan_thanh'::dot_bao_duong_hm_trang_thai
                           ELSE trang_thai END
   WHERE id = p_hang_muc_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'hang_muc_not_found'; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.dot_hm_reject(p_hang_muc_id uuid, p_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF NOT (has_role(v_user,'admin') OR has_role(v_user,'phong_kt')) THEN
    RAISE EXCEPTION 'forbidden_only_kt';
  END IF;
  UPDATE public.dot_bao_duong_hang_muc
     SET duyet_trang_thai = 'tu_choi',
         approval_note = p_note,
         approved_at = NULL,
         approved_by = NULL
   WHERE id = p_hang_muc_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'hang_muc_not_found'; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.dot_hm_unlock(p_hang_muc_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF NOT has_role(v_user,'admin') THEN RAISE EXCEPTION 'forbidden_admin_only'; END IF;
  UPDATE public.dot_bao_duong_hang_muc
     SET duyet_trang_thai = 'chua_gui',
         approved_at = NULL, approved_by = NULL,
         submitted_at = NULL, submitted_by = NULL,
         approval_note = NULL
   WHERE id = p_hang_muc_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.dot_hm_submit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dot_hm_approve(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dot_hm_reject(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dot_hm_unlock(uuid) TO authenticated;

-- 6) Alerts function: per-unit progress + overdue/near-due counts
CREATE OR REPLACE FUNCTION public.dot_bao_duong_canh_bao(
  p_dot_id uuid,
  p_sap_han_ngay integer DEFAULT 3
)
RETURNS TABLE(
  don_vi_id uuid, don_vi_ma text, don_vi_ten text,
  han_ngay date,
  tong integer, hoan_thanh integer, cho_duyet integer, da_duyet integer,
  qua_han integer, sap_han integer,
  muc_do text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH items AS (
    SELECT hm.*,
           COALESCE(hm.han_hoan_thanh, h.han_ngay) AS eff_han
    FROM public.dot_bao_duong_hang_muc hm
    LEFT JOIN public.dot_bao_duong_han h
      ON h.dot_id = hm.dot_id AND h.don_vi_id = hm.don_vi_id
    WHERE hm.dot_id = p_dot_id
  ),
  agg AS (
    SELECT
      i.don_vi_id,
      MAX(i.eff_han) AS eff_han,
      COUNT(*)::int AS tong,
      COUNT(*) FILTER (WHERE i.trang_thai = 'hoan_thanh')::int AS hoan_thanh,
      COUNT(*) FILTER (WHERE i.duyet_trang_thai = 'cho_duyet')::int AS cho_duyet,
      COUNT(*) FILTER (WHERE i.duyet_trang_thai = 'da_duyet')::int AS da_duyet,
      COUNT(*) FILTER (WHERE i.eff_han IS NOT NULL
                         AND i.eff_han < CURRENT_DATE
                         AND i.duyet_trang_thai <> 'da_duyet'
                         AND i.trang_thai <> 'hoan_thanh')::int AS qua_han,
      COUNT(*) FILTER (WHERE i.eff_han IS NOT NULL
                         AND i.eff_han >= CURRENT_DATE
                         AND i.eff_han <= (CURRENT_DATE + (p_sap_han_ngay || ' days')::interval)::date
                         AND i.duyet_trang_thai <> 'da_duyet'
                         AND i.trang_thai <> 'hoan_thanh')::int AS sap_han
    FROM items i
    GROUP BY i.don_vi_id
  )
  SELECT
    a.don_vi_id,
    dv.ma AS don_vi_ma,
    dv.ten AS don_vi_ten,
    a.eff_han AS han_ngay,
    a.tong, a.hoan_thanh, a.cho_duyet, a.da_duyet,
    a.qua_han, a.sap_han,
    CASE
      WHEN a.qua_han > 0 THEN 'qua_han'
      WHEN a.sap_han > 0 THEN 'sap_han'
      WHEN a.tong > 0 AND a.tong = a.da_duyet THEN 'hoan_tat'
      ELSE 'on_track'
    END AS muc_do
  FROM agg a
  JOIN public.dm_don_vi dv ON dv.id = a.don_vi_id
  ORDER BY dv.ma;
$$;
GRANT EXECUTE ON FUNCTION public.dot_bao_duong_canh_bao(uuid, integer) TO authenticated;