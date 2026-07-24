-- =====================================================================
-- Tai cau truc MO RONG (khong pha vo tinh nang hien co):
-- + 3 bang moi: dm_linh_vuc, dm_danh_gia_nien_han, giay_phep_khai_thac
-- + Mo rong dm_he_thong (linh vuc, don vi, 15 truong giay phep)
-- + Mo rong thiet_bi (vong doi tai san, linh vuc, don vi, nien han)
-- + View canh bao nien han
-- Giu nguyen toan bo cot & tinh nang hien tai (tim kiem, RLS, dinh kem...)
-- =====================================================================

-- 1) BANG DANH MUC MOI: LINH VUC
CREATE TABLE IF NOT EXISTS public.dm_linh_vuc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ma text NOT NULL UNIQUE,
  ten text NOT NULL,
  mo_ta text,
  thu_tu int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_linh_vuc TO authenticated;
GRANT SELECT ON public.dm_linh_vuc TO anon;
GRANT ALL ON public.dm_linh_vuc TO service_role;
ALTER TABLE public.dm_linh_vuc ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lv_read_active" ON public.dm_linh_vuc FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "lv_write_manager" ON public.dm_linh_vuc FOR ALL TO authenticated USING (public.can_manage_equipment(auth.uid())) WITH CHECK (public.can_manage_equipment(auth.uid()));
CREATE TRIGGER trg_dm_linh_vuc_updated_at BEFORE UPDATE ON public.dm_linh_vuc FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) BANG DANH MUC MOI: DANH GIA NIEN HAN
CREATE TABLE IF NOT EXISTS public.dm_danh_gia_nien_han (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ma text NOT NULL UNIQUE,
  ten text NOT NULL,
  mo_ta text,
  thu_tu int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_danh_gia_nien_han TO authenticated;
GRANT SELECT ON public.dm_danh_gia_nien_han TO anon;
GRANT ALL ON public.dm_danh_gia_nien_han TO service_role;
ALTER TABLE public.dm_danh_gia_nien_han ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nh_read_active" ON public.dm_danh_gia_nien_han FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "nh_write_manager" ON public.dm_danh_gia_nien_han FOR ALL TO authenticated USING (public.can_manage_equipment(auth.uid())) WITH CHECK (public.can_manage_equipment(auth.uid()));
CREATE TRIGGER trg_dm_nien_han_updated_at BEFORE UPDATE ON public.dm_danh_gia_nien_han FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) MO RONG dm_he_thong: lien ket linh vuc / don vi + 15 truong giay phep khai thac
ALTER TABLE public.dm_he_thong
  ADD COLUMN IF NOT EXISTS linh_vuc_id uuid REFERENCES public.dm_linh_vuc(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS don_vi_id uuid REFERENCES public.dm_don_vi(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ten_he_thong_theo_gp text,
  ADD COLUMN IF NOT EXISTS nam_sx_theo_gp text,
  ADD COLUMN IF NOT EXISTS gp_so text,
  ADD COLUMN IF NOT EXISTS gp_ngay_cap text,
  ADD COLUMN IF NOT EXISTS gp_han text,
  ADD COLUMN IF NOT EXISTS kieu_thiet_bi_gp text,
  ADD COLUMN IF NOT EXISTS so_san_xuat_gp text,
  ADD COLUMN IF NOT EXISTS noi_san_xuat_gp text,
  ADD COLUMN IF NOT EXISTS muc_dich_gp text,
  ADD COLUMN IF NOT EXISTS pham_vi_hoat_dong_gp text,
  ADD COLUMN IF NOT EXISTS ma_dia_chi_kt_gp text,
  ADD COLUMN IF NOT EXISTS dia_diem_dat_gp text,
  ADD COLUMN IF NOT EXISTS thoi_gian_hoat_dong_gp text,
  ADD COLUMN IF NOT EXISTS gp_cu_bai_bo text,
  ADD COLUMN IF NOT EXISTS thanh_phan_theo_gp text;
CREATE INDEX IF NOT EXISTS idx_ht_linh_vuc ON public.dm_he_thong(linh_vuc_id);
CREATE INDEX IF NOT EXISTS idx_ht_don_vi ON public.dm_he_thong(don_vi_id);
CREATE INDEX IF NOT EXISTS idx_ht_nhom ON public.dm_he_thong(nhom_he_thong_id);

-- 4) MO RONG thiet_bi: vong doi tai san + lien ket linh vuc/don vi/nien han
ALTER TABLE public.thiet_bi
  ADD COLUMN IF NOT EXISTS thanh_phan text,
  ADD COLUMN IF NOT EXISTS p_n text,
  ADD COLUMN IF NOT EXISTS nam_san_xuat int,
  ADD COLUMN IF NOT EXISTS nam_dua_vao_khai_thac int,
  ADD COLUMN IF NOT EXISTS linh_vuc_id uuid REFERENCES public.dm_linh_vuc(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS don_vi_id uuid REFERENCES public.dm_don_vi(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS danh_gia_nien_han_id uuid REFERENCES public.dm_danh_gia_nien_han(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phan_loai text,
  ADD COLUMN IF NOT EXISTS noi_quan_ly text,
  ADD COLUMN IF NOT EXISTS giay_phep_khai_thac text,
  ADD COLUMN IF NOT EXISTS giay_phep_tan_so text,
  ADD COLUMN IF NOT EXISTS so_nam_su_dung int,
  ADD COLUMN IF NOT EXISTS ty_le_tuoi_tho numeric(6,3),
  ADD COLUMN IF NOT EXISTS vat_tu_du_phong text,
  ADD COLUMN IF NOT EXISTS thong_ke_hong_hoc text,
  ADD COLUMN IF NOT EXISTS de_xuat_phuong_an text,
  ADD COLUMN IF NOT EXISTS de_xuat_tiep_tuc text,
  ADD COLUMN IF NOT EXISTS de_xuat_khac text,
  ADD COLUMN IF NOT EXISTS thoi_diem_dieu_chuyen text,
  ADD COLUMN IF NOT EXISTS noi_chuyen_di text,
  ADD COLUMN IF NOT EXISTS noi_chuyen_den text,
  ADD COLUMN IF NOT EXISTS ly_do_dieu_chuyen text,
  ADD COLUMN IF NOT EXISTS thoi_diem_cham_dut text,
  ADD COLUMN IF NOT EXISTS quyet_dinh_cham_dut text,
  ADD COLUMN IF NOT EXISTS noi_cat_giu text,
  ADD COLUMN IF NOT EXISTS do_tin_cay text,
  ADD COLUMN IF NOT EXISTS nguon_du_lieu text;
CREATE INDEX IF NOT EXISTS idx_tb_linh_vuc ON public.thiet_bi(linh_vuc_id);
CREATE INDEX IF NOT EXISTS idx_tb_don_vi_new ON public.thiet_bi(don_vi_id);
CREATE INDEX IF NOT EXISTS idx_tb_nien_han ON public.thiet_bi(danh_gia_nien_han_id);

-- 5) Cap nhat RLS doc thiet_bi: cho phep loc theo CA don_vi_id (moi) LAN don_vi_quan_ly_id (cu)
DROP POLICY IF EXISTS "thiet_bi_read_scope" ON public.thiet_bi;
CREATE POLICY "thiet_bi_read_scope" ON public.thiet_bi FOR SELECT TO authenticated
USING (
  public.is_active_user(auth.uid()) AND (
    public.can_manage_equipment(auth.uid())
    OR NOT (don_vi_quan_ly_id IS DISTINCT FROM public.get_user_don_vi_id(auth.uid()))
    OR NOT (don_vi_id IS DISTINCT FROM public.get_user_don_vi_id(auth.uid()))
  )
);

-- 6) BANG giay_phep_khai_thac (mot dong / mot giay phep, tham chieu he thong)
CREATE TABLE IF NOT EXISTS public.giay_phep_khai_thac (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  he_thong_id uuid REFERENCES public.dm_he_thong(id) ON DELETE SET NULL,
  don_vi text,
  tram text,
  he_thong_folder text,
  gp_so text,
  gp_ngay text,
  gp_han text,
  gp_cu text,
  ten_he_thong_theo_gp text,
  nam_sx_gp text,
  he_thong_csdl text,
  trang_thai_doi_chieu text,
  kieu_thiet_bi text,
  so_san_xuat text,
  noi_san_xuat text,
  muc_dich text,
  pham_vi text,
  ma_dia_chi text,
  dia_diem text,
  thoi_gian text,
  thanh_phan_theo_gp text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.giay_phep_khai_thac TO authenticated;
GRANT ALL ON public.giay_phep_khai_thac TO service_role;
ALTER TABLE public.giay_phep_khai_thac ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gpkt_read_active" ON public.giay_phep_khai_thac FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "gpkt_write_manager" ON public.giay_phep_khai_thac FOR ALL TO authenticated USING (public.can_manage_equipment(auth.uid())) WITH CHECK (public.can_manage_equipment(auth.uid()));
CREATE TRIGGER trg_gpkt_updated_at BEFORE UPDATE ON public.giay_phep_khai_thac FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7) VIEW canh bao nien han (security_invoker -> ap dung RLS cua nguoi dung)
CREATE OR REPLACE VIEW public.v_canh_bao_nien_han
WITH (security_invoker = true) AS
SELECT tb.ma_thiet_bi, tb.ten_thiet_bi, tb.so_nam_su_dung, tb.ty_le_tuoi_tho, tb.de_xuat_phuong_an
FROM public.thiet_bi tb
JOIN public.dm_danh_gia_nien_han n ON n.id = tb.danh_gia_nien_han_id
WHERE n.ma IN ('NH-QUA','NH-QUA-23');
GRANT SELECT ON public.v_canh_bao_nien_han TO authenticated;