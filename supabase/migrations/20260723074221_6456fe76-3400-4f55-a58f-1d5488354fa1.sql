
ALTER TABLE public.bao_tri_chinh_sach
  ADD COLUMN IF NOT EXISTS chu_ky_loai text NOT NULL DEFAULT 'time'
    CHECK (chu_ky_loai IN ('time','metric')),
  ADD COLUMN IF NOT EXISTS chu_ky_gia_tri numeric,
  ADD COLUMN IF NOT EXISTS metric_field text
    CHECK (metric_field IS NULL OR metric_field IN ('gio_chay','so_lan','km')),
  ADD COLUMN IF NOT EXISTS noi_dung text,
  ADD COLUMN IF NOT EXISTS nguoi_phu_trach_id uuid REFERENCES public.nhan_vien(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lan_gan_nhat_at timestamptz,
  ADD COLUMN IF NOT EXISTS lan_gan_nhat_metric numeric,
  ADD COLUMN IF NOT EXISTS advance_days integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS thiet_bi_id uuid,
  ADD COLUMN IF NOT EXISTS he_thong_id uuid,
  ADD COLUMN IF NOT EXISTS model_id uuid;

UPDATE public.bao_tri_chinh_sach
SET chu_ky_gia_tri = chu_ky_ngay
WHERE chu_ky_gia_tri IS NULL AND chu_ky_ngay IS NOT NULL AND chu_ky_ngay > 0;

UPDATE public.bao_tri_chinh_sach
SET chu_ky_gia_tri = chu_ky_gio_chay, chu_ky_loai = 'metric', metric_field = 'gio_chay'
WHERE chu_ky_gia_tri IS NULL AND chu_ky_gio_chay IS NOT NULL AND chu_ky_gio_chay > 0;

CREATE TABLE IF NOT EXISTS public.pm_cong_viec (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chinh_sach_id uuid NOT NULL REFERENCES public.bao_tri_chinh_sach(id) ON DELETE CASCADE,
  doi_tuong_type text NOT NULL CHECK (doi_tuong_type IN ('thiet_bi','he_thong')),
  doi_tuong_id  uuid NOT NULL,
  don_vi_id     uuid REFERENCES public.dm_don_vi(id) ON DELETE SET NULL,
  han           date NOT NULL,
  ky_hieu_han   text NOT NULL,
  trang_thai    text NOT NULL DEFAULT 'sap_den_han'
    CHECK (trang_thai IN ('sap_den_han','den_han','qua_han','dang_thuc_hien','hoan_thanh','bo_qua')),
  nguoi_phu_trach_id uuid REFERENCES public.nhan_vien(id) ON DELETE SET NULL,
  ghi_chu       text,
  bao_tri_id    uuid REFERENCES public.bao_tri(id) ON DELETE SET NULL,
  hoan_thanh_at timestamptz,
  bo_qua_ly_do  text,
  estimated     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chinh_sach_id, doi_tuong_id, ky_hieu_han)
);

CREATE INDEX IF NOT EXISTS idx_pm_cong_viec_han ON public.pm_cong_viec(han);
CREATE INDEX IF NOT EXISTS idx_pm_cong_viec_trang_thai ON public.pm_cong_viec(trang_thai);
CREATE INDEX IF NOT EXISTS idx_pm_cong_viec_don_vi ON public.pm_cong_viec(don_vi_id);
CREATE INDEX IF NOT EXISTS idx_pm_cong_viec_phu_trach ON public.pm_cong_viec(nguoi_phu_trach_id);
CREATE INDEX IF NOT EXISTS idx_pm_cong_viec_doi_tuong ON public.pm_cong_viec(doi_tuong_type, doi_tuong_id);

GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON public.pm_cong_viec TO authenticated;
GRANT ALL ON public.pm_cong_viec TO service_role;
GRANT ALL ON public.pm_cong_viec TO postgres, sandbox_exec;

ALTER TABLE public.pm_cong_viec ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pm_cv_select ON public.pm_cong_viec;
CREATE POLICY pm_cv_select ON public.pm_cong_viec
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'phong_kt')
    OR don_vi_id IN (SELECT don_vi_id FROM public.user_scope WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS pm_cv_update ON public.pm_cong_viec;
CREATE POLICY pm_cv_update ON public.pm_cong_viec
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'phong_kt')
    OR don_vi_id IN (SELECT don_vi_id FROM public.user_scope WHERE user_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'phong_kt')
    OR don_vi_id IN (SELECT don_vi_id FROM public.user_scope WHERE user_id = auth.uid())
  );

DROP TRIGGER IF EXISTS trg_pm_cong_viec_updated_at ON public.pm_cong_viec;
CREATE TRIGGER trg_pm_cong_viec_updated_at
  BEFORE UPDATE ON public.pm_cong_viec
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.pm_next_due_date(_policy_id uuid, _last_done timestamptz DEFAULT NULL)
RETURNS date
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE p record; base_date timestamptz;
BEGIN
  SELECT * INTO p FROM public.bao_tri_chinh_sach WHERE id = _policy_id;
  IF NOT FOUND OR NOT p.active THEN RETURN NULL; END IF;
  IF p.chu_ky_gia_tri IS NULL OR p.chu_ky_gia_tri <= 0 THEN RETURN NULL; END IF;
  IF p.chu_ky_loai = 'time' THEN
    base_date := COALESCE(_last_done, p.lan_gan_nhat_at, p.created_at);
    RETURN (base_date + (p.chu_ky_gia_tri || ' days')::interval)::date;
  ELSE
    RETURN (now() + (COALESCE(p.advance_days,7) || ' days')::interval)::date;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.pm_sinh_cong_viec(_as_of date DEFAULT current_date)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  created_count int := 0; updated_count int := 0;
  p record; t record; han_date date; ky text;
BEGIN
  FOR p IN
    SELECT * FROM public.bao_tri_chinh_sach
    WHERE active = true AND chu_ky_gia_tri IS NOT NULL AND chu_ky_gia_tri > 0
  LOOP
    FOR t IN
      SELECT 'thiet_bi'::text AS typ, tb.id AS id,
             (SELECT ht.don_vi_id FROM public.he_thong_thanh_phan tp
                JOIN public.dm_he_thong ht ON ht.id = tp.he_thong_id
                WHERE tp.thiet_bi_id = tb.id LIMIT 1) AS don_vi_id
      FROM public.thiet_bi tb
      WHERE (p.thiet_bi_id IS NOT NULL AND tb.id = p.thiet_bi_id)
         OR (p.thiet_bi_id IS NULL AND p.model_id IS NOT NULL AND tb.model_id = p.model_id)
         OR (p.thiet_bi_id IS NULL AND p.model_id IS NULL AND p.loai_thiet_bi_id IS NOT NULL AND tb.loai_thiet_bi_id = p.loai_thiet_bi_id)
      UNION ALL
      SELECT 'he_thong'::text, ht.id, ht.don_vi_id
      FROM public.dm_he_thong ht
      WHERE p.thiet_bi_id IS NULL AND p.model_id IS NULL AND p.loai_thiet_bi_id IS NULL
        AND p.he_thong_id IS NOT NULL AND ht.id = p.he_thong_id
    LOOP
      han_date := public.pm_next_due_date(p.id, p.lan_gan_nhat_at);
      IF han_date IS NULL THEN CONTINUE; END IF;
      IF han_date > _as_of + (p.advance_days || ' days')::interval THEN CONTINUE; END IF;

      ky := p.chu_ky_loai || '-' || to_char(han_date, 'YYYYMMDD');

      INSERT INTO public.pm_cong_viec (
        chinh_sach_id, doi_tuong_type, doi_tuong_id, don_vi_id,
        han, ky_hieu_han, trang_thai, nguoi_phu_trach_id, estimated
      ) VALUES (
        p.id, t.typ, t.id, t.don_vi_id, han_date, ky,
        CASE WHEN han_date < _as_of - 3 THEN 'qua_han'
             WHEN han_date <= _as_of THEN 'den_han'
             ELSE 'sap_den_han' END,
        p.nguoi_phu_trach_id, (p.chu_ky_loai = 'metric')
      )
      ON CONFLICT (chinh_sach_id, doi_tuong_id, ky_hieu_han) DO NOTHING;
      IF FOUND THEN created_count := created_count + 1; END IF;
    END LOOP;
  END LOOP;

  UPDATE public.pm_cong_viec
  SET trang_thai = CASE
      WHEN han < _as_of - 3 THEN 'qua_han'
      WHEN han <= _as_of THEN 'den_han'
      ELSE 'sap_den_han' END
  WHERE trang_thai IN ('sap_den_han','den_han','qua_han')
    AND trang_thai <> CASE
      WHEN han < _as_of - 3 THEN 'qua_han'
      WHEN han <= _as_of THEN 'den_han'
      ELSE 'sap_den_han' END;
  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RETURN jsonb_build_object('created', created_count, 'updated', updated_count, 'as_of', _as_of);
END $$;

CREATE OR REPLACE FUNCTION public.pm_hoan_thanh_cong_viec(
  _task_id uuid, _thuc_hien_at date, _nguoi_thuc_hien_id uuid,
  _ket_qua text, _van_de text DEFAULT NULL, _ghi_chu text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  cv record; policy record; new_bao_tri_id uuid; next_han date; ky text; next_pm_id uuid;
BEGIN
  SELECT * INTO cv FROM public.pm_cong_viec WHERE id = _task_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy công việc PM %', _task_id; END IF;
  IF cv.trang_thai NOT IN ('sap_den_han','den_han','qua_han','dang_thuc_hien') THEN
    RAISE EXCEPTION 'Công việc đã ở trạng thái %', cv.trang_thai;
  END IF;
  SELECT * INTO policy FROM public.bao_tri_chinh_sach WHERE id = cv.chinh_sach_id;

  INSERT INTO public.bao_tri (
    ma_bao_tri, thiet_bi, thiet_bi_id, he_thong_id,
    loai_bao_tri, ke_hoach, ngay_bat_dau, ngay_hoan_thanh,
    mo_ta_cong_viec, ket_qua, nguoi_thuc_hien, trang_thai
  ) VALUES (
    'BT-PM-' || to_char(now(), 'YYMMDDHH24MISS') || '-' || substr(_task_id::text,1,4),
    COALESCE((SELECT ma_thiet_bi FROM public.thiet_bi WHERE id = cv.doi_tuong_id), ''),
    CASE WHEN cv.doi_tuong_type = 'thiet_bi' THEN cv.doi_tuong_id END,
    CASE WHEN cv.doi_tuong_type = 'he_thong' THEN cv.doi_tuong_id END,
    'PM', policy.ten, _thuc_hien_at, _thuc_hien_at,
    COALESCE(policy.noi_dung, policy.mo_ta), _ket_qua,
    ARRAY[COALESCE(_nguoi_thuc_hien_id::text, auth.uid()::text)],
    'Hoàn thành'
  ) RETURNING id INTO new_bao_tri_id;

  UPDATE public.pm_cong_viec
  SET trang_thai = 'hoan_thanh', bao_tri_id = new_bao_tri_id,
      hoan_thanh_at = now(), ghi_chu = COALESCE(_ghi_chu, ghi_chu)
  WHERE id = _task_id;

  UPDATE public.bao_tri_chinh_sach
  SET lan_gan_nhat_at = _thuc_hien_at::timestamptz, updated_at = now()
  WHERE id = cv.chinh_sach_id;

  next_han := public.pm_next_due_date(cv.chinh_sach_id, _thuc_hien_at::timestamptz);
  IF next_han IS NOT NULL THEN
    ky := policy.chu_ky_loai || '-' || to_char(next_han, 'YYYYMMDD');
    INSERT INTO public.pm_cong_viec (
      chinh_sach_id, doi_tuong_type, doi_tuong_id, don_vi_id,
      han, ky_hieu_han, trang_thai, nguoi_phu_trach_id
    ) VALUES (
      cv.chinh_sach_id, cv.doi_tuong_type, cv.doi_tuong_id, cv.don_vi_id,
      next_han, ky, 'sap_den_han', policy.nguoi_phu_trach_id
    )
    ON CONFLICT (chinh_sach_id, doi_tuong_id, ky_hieu_han) DO NOTHING
    RETURNING id INTO next_pm_id;
  END IF;

  RETURN jsonb_build_object('bao_tri_id', new_bao_tri_id, 'next_pm_id', next_pm_id);
END $$;

CREATE OR REPLACE FUNCTION public.pm_bo_qua_cong_viec(_task_id uuid, _ly_do text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE cv record;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt')) THEN
    RAISE EXCEPTION 'Chỉ admin hoặc phòng kỹ thuật được bỏ qua công việc PM';
  END IF;
  SELECT * INTO cv FROM public.pm_cong_viec WHERE id = _task_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy công việc %', _task_id; END IF;
  UPDATE public.pm_cong_viec
  SET trang_thai = 'bo_qua', bo_qua_ly_do = _ly_do, hoan_thanh_at = now()
  WHERE id = _task_id;
  UPDATE public.bao_tri_chinh_sach
  SET lan_gan_nhat_at = now(), updated_at = now()
  WHERE id = cv.chinh_sach_id;
  RETURN jsonb_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.pm_next_due_date(uuid, timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pm_sinh_cong_viec(date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pm_hoan_thanh_cong_viec(uuid, date, uuid, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pm_bo_qua_cong_viec(uuid, text) TO authenticated, service_role;
