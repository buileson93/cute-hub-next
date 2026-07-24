
-- === N2: change_request ===

DO $$ BEGIN
  CREATE TYPE public.change_request_status AS ENUM ('pending','approved','rejected','cancelled','applied_failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.change_request_loai AS ENUM (
    'cay.delete_node','cay.restore_node','cay.hard_delete_node','cay.reorg',
    'thiet_bi.change_model','thiet_bi.change_don_vi',
    'he_thong.change_nhom','he_thong.change_don_vi',
    'danh_muc.merge','danh_muc.deactivate',
    'role.grant','role.revoke'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.change_request (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loai             public.change_request_loai NOT NULL,
  payload          jsonb NOT NULL,
  ghi_chu          text,
  nguoi_tao        uuid NOT NULL REFERENCES auth.users(id),
  trang_thai       public.change_request_status NOT NULL DEFAULT 'pending',
  ly_do            text,
  resolved_by      uuid REFERENCES auth.users(id),
  resolved_at      timestamptz,
  applied_audit_id uuid,
  error_message    text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_change_request_pending
  ON public.change_request(trang_thai) WHERE trang_thai='pending';
CREATE INDEX IF NOT EXISTS idx_change_request_nguoi_tao
  ON public.change_request(nguoi_tao);
CREATE INDEX IF NOT EXISTS idx_change_request_created_at
  ON public.change_request(created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.change_request TO authenticated;
GRANT ALL ON public.change_request TO service_role;

ALTER TABLE public.change_request ENABLE ROW LEVEL SECURITY;

-- SELECT: người tạo, hoặc admin, hoặc phong_kt
DROP POLICY IF EXISTS "cr_select" ON public.change_request;
CREATE POLICY "cr_select" ON public.change_request
  FOR SELECT TO authenticated
  USING (
    nguoi_tao = auth.uid()
    OR public.has_role(auth.uid(),'admin'::app_role)
    OR public.has_role(auth.uid(),'phong_kt'::app_role)
  );

-- INSERT: chỉ admin/phong_kt, và phải là chính mình, luôn pending
DROP POLICY IF EXISTS "cr_insert" ON public.change_request;
CREATE POLICY "cr_insert" ON public.change_request
  FOR INSERT TO authenticated
  WITH CHECK (
    nguoi_tao = auth.uid()
    AND trang_thai = 'pending'
    AND (
      public.has_role(auth.uid(),'admin'::app_role)
      OR public.has_role(auth.uid(),'phong_kt'::app_role)
    )
  );

-- UPDATE (chốt cuối, RPC SECURITY DEFINER mới là đường chính):
--   a) admin duyệt CR của người khác  → cho phép
--   b) người tạo huỷ CR pending của chính mình → cho phép
-- Cấm self-approve: admin không được UPDATE CR do chính mình tạo.
DROP POLICY IF EXISTS "cr_update" ON public.change_request;
CREATE POLICY "cr_update" ON public.change_request
  FOR UPDATE TO authenticated
  USING (
    (public.has_role(auth.uid(),'admin'::app_role) AND nguoi_tao <> auth.uid())
    OR (nguoi_tao = auth.uid() AND trang_thai = 'pending')
  )
  WITH CHECK (
    (public.has_role(auth.uid(),'admin'::app_role) AND nguoi_tao <> auth.uid())
    OR (nguoi_tao = auth.uid() AND trang_thai IN ('pending','cancelled'))
  );

-- Không cho DELETE (huỷ = UPDATE trang_thai='cancelled')
DROP POLICY IF EXISTS "cr_no_delete" ON public.change_request;
CREATE POLICY "cr_no_delete" ON public.change_request
  FOR DELETE TO authenticated
  USING (false);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.tg_change_request_touch()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_change_request_touch ON public.change_request;
CREATE TRIGGER trg_change_request_touch
  BEFORE UPDATE ON public.change_request
  FOR EACH ROW EXECUTE FUNCTION public.tg_change_request_touch();

GRANT EXECUTE ON FUNCTION public.tg_change_request_touch() TO authenticated, service_role;

-- === RPC: create_change_request ===
CREATE OR REPLACE FUNCTION public.create_change_request(
  p_loai   public.change_request_loai,
  p_payload jsonb,
  p_ghi_chu text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id  uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;
  IF NOT (public.has_role(v_uid,'admin'::app_role) OR public.has_role(v_uid,'phong_kt'::app_role)) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'invalid_payload' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.change_request(loai, payload, ghi_chu, nguoi_tao)
  VALUES (p_loai, p_payload, NULLIF(btrim(p_ghi_chu), ''), v_uid)
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;

GRANT EXECUTE ON FUNCTION public.create_change_request(public.change_request_loai, jsonb, text) TO authenticated;

-- === RPC: cancel_change_request ===
CREATE OR REPLACE FUNCTION public.cancel_change_request(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.change_request%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.change_request WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  IF v_row.nguoi_tao <> v_uid THEN RAISE EXCEPTION 'not_authorized' USING ERRCODE='42501'; END IF;
  IF v_row.trang_thai <> 'pending' THEN RAISE EXCEPTION 'invalid_state' USING ERRCODE='22023'; END IF;

  UPDATE public.change_request
     SET trang_thai='cancelled', resolved_by=v_uid, resolved_at=now()
   WHERE id = p_id;
END $$;

GRANT EXECUTE ON FUNCTION public.cancel_change_request(uuid) TO authenticated;

-- === RPC: reject_change_request ===
CREATE OR REPLACE FUNCTION public.reject_change_request(p_id uuid, p_ly_do text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.change_request%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE='28000'; END IF;
  IF NOT public.has_role(v_uid,'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE='42501';
  END IF;
  IF length(coalesce(btrim(p_ly_do),'')) < 5 THEN
    RAISE EXCEPTION 'ly_do_required (min 5 chars)' USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_row FROM public.change_request WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  IF v_row.nguoi_tao = v_uid THEN RAISE EXCEPTION 'self_action_forbidden' USING ERRCODE='42501'; END IF;
  IF v_row.trang_thai <> 'pending' THEN RAISE EXCEPTION 'invalid_state' USING ERRCODE='22023'; END IF;

  UPDATE public.change_request
     SET trang_thai='rejected', ly_do=btrim(p_ly_do), resolved_by=v_uid, resolved_at=now()
   WHERE id = p_id;
END $$;

GRANT EXECUTE ON FUNCTION public.reject_change_request(uuid, text) TO authenticated;

-- === RPC: approve_change_request (dispatcher) ===
CREATE OR REPLACE FUNCTION public.approve_change_request(p_id uuid, p_ly_do text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.change_request%ROWTYPE;
  v_pl  jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE='28000'; END IF;
  IF NOT public.has_role(v_uid,'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE='42501';
  END IF;

  SELECT * INTO v_row FROM public.change_request WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  IF v_row.nguoi_tao = v_uid THEN RAISE EXCEPTION 'self_approve_forbidden' USING ERRCODE='42501'; END IF;
  IF v_row.trang_thai <> 'pending' THEN RAISE EXCEPTION 'invalid_state' USING ERRCODE='22023'; END IF;

  v_pl := v_row.payload;

  BEGIN
    -- Dispatch theo loai. Các nhánh chưa hỗ trợ → RAISE để rơi vào EXCEPTION dưới.
    IF v_row.loai = 'danh_muc.merge' THEN
      PERFORM public.merge_danh_muc(
        (v_pl->>'entity')::text,
        (v_pl->>'keep_id')::uuid,
        (v_pl->>'drop_id')::uuid,
        p_ly_do
      );

    ELSIF v_row.loai = 'danh_muc.deactivate' THEN
      EXECUTE format('UPDATE public.%I SET active = false WHERE id = $1', v_pl->>'entity')
        USING (v_pl->>'id')::uuid;

    ELSIF v_row.loai = 'role.grant' THEN
      INSERT INTO public.user_roles(user_id, role)
      VALUES ((v_pl->>'user_id')::uuid, (v_pl->>'role')::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;

    ELSIF v_row.loai = 'role.revoke' THEN
      DELETE FROM public.user_roles
       WHERE user_id = (v_pl->>'user_id')::uuid
         AND role = (v_pl->>'role')::app_role;

    ELSIF v_row.loai = 'thiet_bi.change_don_vi' THEN
      UPDATE public.thiet_bi
         SET don_vi_id = (v_pl->>'to_don_vi_id')::uuid
       WHERE id = (v_pl->>'thiet_bi_id')::uuid;

    ELSIF v_row.loai = 'he_thong.change_nhom' THEN
      UPDATE public.dm_he_thong
         SET nhom_he_thong_id = (v_pl->>'to_nhom_id')::uuid
       WHERE id = (v_pl->>'he_thong_id')::uuid;

    ELSIF v_row.loai = 'he_thong.change_don_vi' THEN
      UPDATE public.dm_he_thong
         SET don_vi_id = (v_pl->>'to_don_vi_id')::uuid
       WHERE id = (v_pl->>'he_thong_id')::uuid;

    ELSE
      RAISE EXCEPTION 'loai_not_supported: %', v_row.loai USING ERRCODE='0A000';
    END IF;

    UPDATE public.change_request
       SET trang_thai='approved',
           ly_do = NULLIF(btrim(coalesce(p_ly_do,'')),''),
           resolved_by=v_uid, resolved_at=now()
     WHERE id = p_id;

    RETURN p_id;

  EXCEPTION WHEN OTHERS THEN
    UPDATE public.change_request
       SET trang_thai='applied_failed',
           ly_do = NULLIF(btrim(coalesce(p_ly_do,'')),''),
           resolved_by=v_uid, resolved_at=now(),
           error_message = SQLERRM
     WHERE id = p_id;
    RAISE;
  END;
END $$;

GRANT EXECUTE ON FUNCTION public.approve_change_request(uuid, text) TO authenticated;
