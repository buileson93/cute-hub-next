-- =====================================================================
-- Mo hinh "quan ly thiet bi thong minh" - 3 bang moi
--  1) bao_tri_chinh_sach: chu ky bao duong theo MODEL (loai thiet bi)
--  2) thiet_bi_do_dac    : telemetry / do dac time-series theo thiet bi
--  3) thiet_bi_vong_doi  : nhat ky chuyen trang thai vong doi thiet bi
-- =====================================================================

-- ---------- 1) CHINH SACH BAO DUONG THEO MODEL ----------
CREATE TABLE public.bao_tri_chinh_sach (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loai_thiet_bi_id uuid REFERENCES public.dm_loai_thiet_bi(id) ON DELETE CASCADE,
  ten text NOT NULL,
  mo_ta text,
  chu_ky_ngay integer,                 -- chu ky theo lich (ngay)
  chu_ky_gio_chay numeric,             -- chu ky theo gio van hanh
  canh_bao_truoc_ngay integer NOT NULL DEFAULT 7,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bao_tri_chinh_sach TO authenticated;
GRANT ALL ON public.bao_tri_chinh_sach TO service_role;
ALTER TABLE public.bao_tri_chinh_sach ENABLE ROW LEVEL SECURITY;

CREATE POLICY bao_tri_chinh_sach_select ON public.bao_tri_chinh_sach
  FOR SELECT USING (is_active_user(auth.uid()));
CREATE POLICY bao_tri_chinh_sach_write ON public.bao_tri_chinh_sach
  FOR ALL USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

CREATE INDEX idx_bao_tri_chinh_sach_loai ON public.bao_tri_chinh_sach(loai_thiet_bi_id);

CREATE TRIGGER trg_bao_tri_chinh_sach_updated
  BEFORE UPDATE ON public.bao_tri_chinh_sach
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 2) TELEMETRY / DO DAC ----------
CREATE TABLE public.thiet_bi_do_dac (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thiet_bi_id uuid NOT NULL REFERENCES public.thiet_bi(id) ON DELETE CASCADE,
  thoi_diem timestamptz NOT NULL DEFAULT now(),
  chi_so text NOT NULL,                 -- vi du: gio_chay, nhiet_do, dien_ap
  gia_tri numeric,
  don_vi_do text,                       -- vi du: gio, °C, V
  nguon text,                           -- thu cong / cam bien / import
  ghi_chu text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.thiet_bi_do_dac TO authenticated;
GRANT ALL ON public.thiet_bi_do_dac TO service_role;
ALTER TABLE public.thiet_bi_do_dac ENABLE ROW LEVEL SECURITY;

CREATE POLICY thiet_bi_do_dac_select ON public.thiet_bi_do_dac
  FOR SELECT USING (
    is_active_user(auth.uid())
    AND (can_manage_equipment(auth.uid()) OR can_view_thiet_bi(thiet_bi_id, auth.uid()))
  );
CREATE POLICY thiet_bi_do_dac_write ON public.thiet_bi_do_dac
  FOR ALL USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

CREATE INDEX idx_thiet_bi_do_dac_tb_thoi_diem
  ON public.thiet_bi_do_dac(thiet_bi_id, thoi_diem DESC);
CREATE INDEX idx_thiet_bi_do_dac_chi_so ON public.thiet_bi_do_dac(chi_so);

-- ---------- 3) NHAT KY VONG DOI (STATE MACHINE) ----------
CREATE TABLE public.thiet_bi_vong_doi (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thiet_bi_id uuid NOT NULL REFERENCES public.thiet_bi(id) ON DELETE CASCADE,
  tu_trang_thai_id uuid REFERENCES public.dm_trang_thai_thiet_bi(id),
  den_trang_thai_id uuid REFERENCES public.dm_trang_thai_thiet_bi(id),
  thoi_diem timestamptz NOT NULL DEFAULT now(),
  ly_do text,
  nguoi_thuc_hien uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.thiet_bi_vong_doi TO authenticated;
GRANT ALL ON public.thiet_bi_vong_doi TO service_role;
ALTER TABLE public.thiet_bi_vong_doi ENABLE ROW LEVEL SECURITY;

CREATE POLICY thiet_bi_vong_doi_select ON public.thiet_bi_vong_doi
  FOR SELECT USING (
    is_active_user(auth.uid())
    AND (can_manage_equipment(auth.uid()) OR can_view_thiet_bi(thiet_bi_id, auth.uid()))
  );
CREATE POLICY thiet_bi_vong_doi_write ON public.thiet_bi_vong_doi
  FOR ALL USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

CREATE INDEX idx_thiet_bi_vong_doi_tb ON public.thiet_bi_vong_doi(thiet_bi_id, thoi_diem DESC);

-- ---------- Trigger: tu dong ghi nhat ky vong doi khi trang_thai_id doi ----------
CREATE OR REPLACE FUNCTION public.log_thiet_bi_vong_doi()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.trang_thai_id IS DISTINCT FROM OLD.trang_thai_id THEN
    INSERT INTO public.thiet_bi_vong_doi (thiet_bi_id, tu_trang_thai_id, den_trang_thai_id, nguoi_thuc_hien)
    VALUES (NEW.id, OLD.trang_thai_id, NEW.trang_thai_id, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_thiet_bi_vong_doi
  AFTER UPDATE OF trang_thai_id ON public.thiet_bi
  FOR EACH ROW EXECUTE FUNCTION public.log_thiet_bi_vong_doi();