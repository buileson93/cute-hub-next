
-- Task 47 — Kiểm định / Hiệu chuẩn thiết bị

-- 1) Cột chế độ KĐ/HC trên thiết bị
ALTER TABLE public.thiet_bi
  ADD COLUMN IF NOT EXISTS che_do_kd_hc text NOT NULL DEFAULT 'KHONG';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'thiet_bi_che_do_kd_hc_chk'
  ) THEN
    ALTER TABLE public.thiet_bi
      ADD CONSTRAINT thiet_bi_che_do_kd_hc_chk
      CHECK (che_do_kd_hc IN ('KHONG','KIEM_DINH','HIEU_CHUAN'));
  END IF;
END $$;

-- 2) Bảng chứng chỉ thiết bị
CREATE TABLE IF NOT EXISTS public.chung_chi_thiet_bi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thiet_bi_id uuid NOT NULL REFERENCES public.thiet_bi(id) ON DELETE CASCADE,
  loai text NOT NULL CHECK (loai IN ('KIEM_DINH','HIEU_CHUAN')),
  so_giay_chung_nhan text NOT NULL,
  ngay_bat_dau date,
  ngay_het_han date,
  ghi_chu text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX IF NOT EXISTS idx_chung_chi_tb ON public.chung_chi_thiet_bi(thiet_bi_id);
CREATE INDEX IF NOT EXISTS idx_chung_chi_het_han ON public.chung_chi_thiet_bi(ngay_het_han);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chung_chi_thiet_bi TO authenticated;
GRANT ALL ON public.chung_chi_thiet_bi TO service_role;

ALTER TABLE public.chung_chi_thiet_bi ENABLE ROW LEVEL SECURITY;

-- Đọc: theo đơn vị của thiết bị hoặc quản lý thiết bị
DROP POLICY IF EXISTS chung_chi_read ON public.chung_chi_thiet_bi;
CREATE POLICY chung_chi_read ON public.chung_chi_thiet_bi
  FOR SELECT TO authenticated
  USING (
    public.can_manage_equipment(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.thiet_bi tb
      WHERE tb.id = chung_chi_thiet_bi.thiet_bi_id
        AND tb.don_vi_quan_ly_id IS NOT DISTINCT FROM public.get_user_don_vi_id(auth.uid())
    )
  );

-- Ghi: chỉ quản lý thiết bị (admin | phong_kt)
DROP POLICY IF EXISTS chung_chi_write ON public.chung_chi_thiet_bi;
CREATE POLICY chung_chi_write ON public.chung_chi_thiet_bi
  FOR ALL TO authenticated
  USING (public.can_manage_equipment(auth.uid()))
  WITH CHECK (public.can_manage_equipment(auth.uid()));

-- 3) Mở rộng view v_sap_het_han: UNION thêm nguồn chứng chỉ thiết bị
CREATE OR REPLACE VIEW public.v_sap_het_han
WITH (security_invoker = true) AS
SELECT 'bao_hanh'::text AS loai,
    t.id AS thiet_bi_id,
    COALESCE(t.ten_thiet_bi, t.ma_thiet_bi) AS ten,
    t.han_bao_hanh AS ngay_het_han,
    (t.han_bao_hanh - (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) AS so_ngay_con_lai
   FROM public.thiet_bi t
  WHERE t.han_bao_hanh IS NOT NULL
UNION ALL
 SELECT 'giay_phep'::text AS loai,
    v.thiet_bi_id,
    COALESCE(v.so_giay_phep, v.ten_doi_tuong) AS ten,
    v.ngay_het_han,
    (v.ngay_het_han - (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) AS so_ngay_con_lai
   FROM public.v_giay_phep v
  WHERE v.ngay_het_han IS NOT NULL AND v.bi_thay_the = false
UNION ALL
 SELECT 'chung_chi'::text AS loai,
    c.thiet_bi_id,
    (COALESCE(tb.ten_thiet_bi, tb.ma_thiet_bi, '') || ' — ' || c.loai || ' ' || c.so_giay_chung_nhan) AS ten,
    c.ngay_het_han,
    (c.ngay_het_han - (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) AS so_ngay_con_lai
   FROM public.chung_chi_thiet_bi c
   JOIN public.thiet_bi tb ON tb.id = c.thiet_bi_id
  WHERE c.ngay_het_han IS NOT NULL;

GRANT SELECT ON public.v_sap_het_han TO authenticated, service_role;
