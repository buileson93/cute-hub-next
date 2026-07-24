CREATE INDEX IF NOT EXISTS idx_thiet_bi_created_at_id
  ON public.thiet_bi (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_thiet_bi_don_vi_created
  ON public.thiet_bi (don_vi_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_bao_tri_active_created
  ON public.bao_tri (created_at DESC, id DESC)
  WHERE luu_tru = false OR luu_tru IS NULL;

CREATE INDEX IF NOT EXISTS idx_su_co_active_created
  ON public.su_co (created_at DESC, id DESC)
  WHERE luu_tru = false OR luu_tru IS NULL;

CREATE INDEX IF NOT EXISTS idx_cvbt_donvi_tt_denhan
  ON public.cong_viec_bao_tri (don_vi_id_snapshot, trang_thai, ngay_den_han);

CREATE INDEX IF NOT EXISTS idx_kgd_kho_vattu_created
  ON public.kho_giao_dich (kho_id, vat_tu_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_gpkt_gp_han
  ON public.giay_phep_khai_thac (gp_han)
  WHERE gp_han IS NOT NULL;