-- Drop the duplicate FK constraints created in the previous migration
ALTER TABLE public.thiet_bi
  DROP CONSTRAINT IF EXISTS fk_thiet_bi_danh_gia_nien_han,
  DROP CONSTRAINT IF EXISTS fk_thiet_bi_don_vi,
  DROP CONSTRAINT IF EXISTS fk_thiet_bi_don_vi_giu,
  DROP CONSTRAINT IF EXISTS fk_thiet_bi_don_vi_quan_ly,
  DROP CONSTRAINT IF EXISTS fk_thiet_bi_he_thong,
  DROP CONSTRAINT IF EXISTS fk_thiet_bi_linh_vuc,
  DROP CONSTRAINT IF EXISTS fk_thiet_bi_loai,
  DROP CONSTRAINT IF EXISTS fk_thiet_bi_model,
  DROP CONSTRAINT IF EXISTS fk_thiet_bi_nha_cung_cap,
  DROP CONSTRAINT IF EXISTS fk_thiet_bi_nha_san_xuat,
  DROP CONSTRAINT IF EXISTS fk_thiet_bi_nhom_he_thong,
  DROP CONSTRAINT IF EXISTS fk_thiet_bi_trang_thai,
  DROP CONSTRAINT IF EXISTS fk_thiet_bi_vi_tri;

-- Normalize the original "don_vi_giu" FK to ON DELETE SET NULL (was NO ACTION)
ALTER TABLE public.thiet_bi DROP CONSTRAINT IF EXISTS thiet_bi_don_vi_giu_id_fkey;
ALTER TABLE public.thiet_bi
  ADD CONSTRAINT thiet_bi_don_vi_giu_id_fkey
    FOREIGN KEY (don_vi_giu_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;

-- Drop duplicate indexes (keep one per FK column)
DROP INDEX IF EXISTS public.idx_thiet_bi_don_vi;      -- mislabeled dup of idx_thiet_bi_don_vi_quan_ly
DROP INDEX IF EXISTS public.idx_thiet_bi_vitri;       -- dup of idx_thiet_bi_vi_tri
DROP INDEX IF EXISTS public.idx_thiet_bi_nhom;        -- dup of idx_thiet_bi_nhom_he_thong
DROP INDEX IF EXISTS public.idx_tb_linh_vuc;          -- dup of idx_thiet_bi_linh_vuc
DROP INDEX IF EXISTS public.idx_thiet_bi_nsx;         -- dup of idx_thiet_bi_nha_san_xuat
DROP INDEX IF EXISTS public.idx_thiet_bi_ncc;         -- dup of idx_thiet_bi_nha_cung_cap
DROP INDEX IF EXISTS public.idx_tb_nien_han;          -- dup of idx_thiet_bi_danh_gia_nien_han