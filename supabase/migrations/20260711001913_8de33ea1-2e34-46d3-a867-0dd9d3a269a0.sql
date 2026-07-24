-- 1) FOREIGN KEY constraints (ON DELETE SET NULL) for all _id columns on thiet_bi
ALTER TABLE public.thiet_bi
  ADD CONSTRAINT fk_thiet_bi_don_vi
    FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_thiet_bi_don_vi_quan_ly
    FOREIGN KEY (don_vi_quan_ly_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_thiet_bi_don_vi_giu
    FOREIGN KEY (don_vi_giu_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_thiet_bi_vi_tri
    FOREIGN KEY (vi_tri_id) REFERENCES public.dm_vi_tri(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_thiet_bi_he_thong
    FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_thiet_bi_nhom_he_thong
    FOREIGN KEY (nhom_he_thong_id) REFERENCES public.dm_nhom_he_thong(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_thiet_bi_linh_vuc
    FOREIGN KEY (linh_vuc_id) REFERENCES public.dm_linh_vuc(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_thiet_bi_loai
    FOREIGN KEY (loai_thiet_bi_id) REFERENCES public.dm_loai_thiet_bi(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_thiet_bi_model
    FOREIGN KEY (model_id) REFERENCES public.dm_model(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_thiet_bi_nha_san_xuat
    FOREIGN KEY (nha_san_xuat_id) REFERENCES public.dm_nha_san_xuat(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_thiet_bi_nha_cung_cap
    FOREIGN KEY (nha_cung_cap_id) REFERENCES public.dm_nha_cung_cap(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_thiet_bi_trang_thai
    FOREIGN KEY (trang_thai_id) REFERENCES public.dm_trang_thai_thiet_bi(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_thiet_bi_danh_gia_nien_han
    FOREIGN KEY (danh_gia_nien_han_id) REFERENCES public.dm_danh_gia_nien_han(id) ON DELETE SET NULL;

-- 2) Indexes for filtering / joining
CREATE INDEX IF NOT EXISTS idx_thiet_bi_don_vi ON public.thiet_bi(don_vi_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_don_vi_quan_ly ON public.thiet_bi(don_vi_quan_ly_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_don_vi_giu ON public.thiet_bi(don_vi_giu_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_vi_tri ON public.thiet_bi(vi_tri_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_he_thong ON public.thiet_bi(he_thong_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_nhom_he_thong ON public.thiet_bi(nhom_he_thong_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_linh_vuc ON public.thiet_bi(linh_vuc_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_loai ON public.thiet_bi(loai_thiet_bi_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_model ON public.thiet_bi(model_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_nha_san_xuat ON public.thiet_bi(nha_san_xuat_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_nha_cung_cap ON public.thiet_bi(nha_cung_cap_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_trang_thai ON public.thiet_bi(trang_thai_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_danh_gia_nien_han ON public.thiet_bi(danh_gia_nien_han_id);