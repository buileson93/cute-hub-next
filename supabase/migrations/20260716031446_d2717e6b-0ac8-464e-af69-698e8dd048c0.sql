
-- BAO_TRI
CREATE TABLE public.bao_tri (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ma_bao_tri text UNIQUE NOT NULL,
  thiet_bi text NOT NULL,
  thiet_bi_id uuid,
  he_thong text,
  he_thong_id uuid,
  don_vi text,
  thanh_phan_id uuid,
  loai_bao_tri text,
  ke_hoach text,
  ngay_bat_dau date NOT NULL DEFAULT current_date,
  ngay_hoan_thanh date,
  mo_ta_cong_viec text,
  ket_qua text,
  chi_phi numeric DEFAULT 0,
  nguoi_thuc_hien text[] DEFAULT '{}',
  don_vi_thuc_hien text,
  trang_thai text DEFAULT 'Đang thực hiện',
  file_bien_ban text,
  snapshot_ma_thiet_bi text,
  snapshot_ten_thiet_bi text,
  snapshot_he_thong text,
  snapshot_don_vi text,
  snapshot_vi_tri text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bao_tri TO authenticated;
GRANT ALL ON public.bao_tri TO service_role;
ALTER TABLE public.bao_tri ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bao_tri_select" ON public.bao_tri FOR SELECT TO authenticated USING (true);
CREATE POLICY "bao_tri_write" ON public.bao_tri FOR ALL TO authenticated
  USING (public.has_role(public.current_uid(), 'admin') OR public.has_role(public.current_uid(), 'phong_kt'))
  WITH CHECK (public.has_role(public.current_uid(), 'admin') OR public.has_role(public.current_uid(), 'phong_kt'));

-- HONG_HOC
CREATE TABLE public.hong_hoc (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ma_hong_hoc text UNIQUE NOT NULL,
  thanh_phan_id uuid,
  thiet_bi_hong text NOT NULL,
  thiet_bi_hong_id uuid,
  su_co text,
  ngay_hong date NOT NULL DEFAULT current_date,
  bo_phan_hong text,
  mo_ta_hong_hoc text,
  phuong_an text,
  thiet_bi_thay_the text,
  thiet_bi_thay_the_id uuid,
  vat_tu_su_dung text[] DEFAULT '{}',
  chi_phi numeric DEFAULT 0,
  nguoi_thuc_hien text[] DEFAULT '{}',
  don_vi_thuc_hien text,
  ket_qua text,
  ngay_hoan_thanh date,
  trang_thai text DEFAULT 'Đang xử lý',
  file_dinh_kem text,
  snapshot_ma_thiet_bi text,
  snapshot_ten_thiet_bi text,
  snapshot_he_thong text,
  snapshot_don_vi text,
  snapshot_vi_tri text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hong_hoc TO authenticated;
GRANT ALL ON public.hong_hoc TO service_role;
ALTER TABLE public.hong_hoc ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hong_hoc_select" ON public.hong_hoc FOR SELECT TO authenticated USING (true);
CREATE POLICY "hong_hoc_write" ON public.hong_hoc FOR ALL TO authenticated
  USING (public.has_role(public.current_uid(), 'admin') OR public.has_role(public.current_uid(), 'phong_kt'))
  WITH CHECK (public.has_role(public.current_uid(), 'admin') OR public.has_role(public.current_uid(), 'phong_kt'));

-- SU_CO
CREATE TABLE public.su_co (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ma_su_co text UNIQUE NOT NULL,
  thiet_bi text NOT NULL,
  thiet_bi_id uuid,
  he_thong text,
  he_thong_id uuid,
  don_vi text,
  thanh_phan_id uuid,
  ngay_phat_hien timestamptz NOT NULL DEFAULT now(),
  nguoi_bao_cao text,
  muc_do text,
  anh_huong_dhb text,
  hien_tuong text,
  nguyen_nhan text,
  bien_phap_xu_ly text,
  thoi_diem_khac_phuc timestamptz,
  thoi_gian_gian_doan numeric,
  nguoi_xu_ly text[] DEFAULT '{}',
  trang_thai text DEFAULT 'Mới',
  lien_ket_hong_hoc text,
  file_dinh_kem text,
  bao_cao_ban_dau jsonb,
  ma_nhom_bc text,
  van_de_id uuid,
  snapshot_ma_thiet_bi text,
  snapshot_ten_thiet_bi text,
  snapshot_he_thong text,
  snapshot_don_vi text,
  snapshot_vi_tri text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.su_co TO authenticated;
GRANT ALL ON public.su_co TO service_role;
ALTER TABLE public.su_co ENABLE ROW LEVEL SECURITY;
CREATE POLICY "su_co_select" ON public.su_co FOR SELECT TO authenticated USING (true);
CREATE POLICY "su_co_write" ON public.su_co FOR ALL TO authenticated
  USING (public.has_role(public.current_uid(), 'admin') OR public.has_role(public.current_uid(), 'phong_kt'))
  WITH CHECK (public.has_role(public.current_uid(), 'admin') OR public.has_role(public.current_uid(), 'phong_kt'));

-- BAN_GIAO
CREATE TABLE public.ban_giao (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ma_ban_giao text UNIQUE NOT NULL,
  thiet_bi text NOT NULL,
  thiet_bi_id uuid,
  loai_ban_giao text,
  nguoi_giao text,
  nguoi_nhan text,
  don_vi_nhan text,
  ngay_nhan date NOT NULL DEFAULT current_date,
  ngay_tra date,
  tinh_trang_khi_nhan text,
  tinh_trang_khi_tra text,
  file_bien_ban text,
  trang_thai text DEFAULT 'Đang mượn',
  ghi_chu text,
  snapshot_ma_thiet_bi text,
  snapshot_ten_thiet_bi text,
  snapshot_he_thong text,
  snapshot_don_vi text,
  snapshot_vi_tri text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ban_giao TO authenticated;
GRANT ALL ON public.ban_giao TO service_role;
ALTER TABLE public.ban_giao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ban_giao_select" ON public.ban_giao FOR SELECT TO authenticated USING (true);
CREATE POLICY "ban_giao_write" ON public.ban_giao FOR ALL TO authenticated
  USING (public.has_role(public.current_uid(), 'admin') OR public.has_role(public.current_uid(), 'phong_kt'))
  WITH CHECK (public.has_role(public.current_uid(), 'admin') OR public.has_role(public.current_uid(), 'phong_kt'));

-- Indexes
CREATE INDEX ON public.bao_tri (thiet_bi_id);
CREATE INDEX ON public.bao_tri (thanh_phan_id);
CREATE INDEX ON public.hong_hoc (thanh_phan_id);
CREATE INDEX ON public.hong_hoc (thiet_bi_hong_id);
CREATE INDEX ON public.su_co (thiet_bi_id);
CREATE INDEX ON public.su_co (thanh_phan_id);
CREATE INDEX ON public.su_co (van_de_id);
CREATE INDEX ON public.ban_giao (thiet_bi_id);
