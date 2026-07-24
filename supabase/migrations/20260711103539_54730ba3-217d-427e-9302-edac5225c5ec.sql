-- Vị trí địa lý theo phân cấp: thêm cột cấp trên (cha) tự tham chiếu.
ALTER TABLE public.dm_vi_tri
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.dm_vi_tri(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_dm_vi_tri_parent ON public.dm_vi_tri(parent_id);