-- Thêm quan hệ cấp cha–con cho đơn vị (đơn vị trực thuộc / Đội)
ALTER TABLE public.dm_don_vi
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_dm_don_vi_parent ON public.dm_don_vi(parent_id);

COMMENT ON COLUMN public.dm_don_vi.parent_id IS 'Đơn vị cấp trên trực tiếp (VD: các Đội trực thuộc Trung tâm Bảo đảm kỹ thuật).';