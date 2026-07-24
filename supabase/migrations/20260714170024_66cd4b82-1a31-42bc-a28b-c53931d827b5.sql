
-- 1) Bảng nhân viên (nguồn tham chiếu cho ban_giao)
CREATE TABLE IF NOT EXISTS public.nhan_vien (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ma_nhan_vien TEXT NOT NULL UNIQUE,
  ho_ten TEXT NOT NULL,
  don_vi TEXT,
  chuc_vu TEXT,
  email TEXT,
  dien_thoai TEXT,
  hoat_dong BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nhan_vien TO authenticated;
GRANT ALL ON public.nhan_vien TO service_role;

ALTER TABLE public.nhan_vien ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nhan_vien read authenticated" ON public.nhan_vien;
CREATE POLICY "nhan_vien read authenticated" ON public.nhan_vien
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "nhan_vien write admin" ON public.nhan_vien;
CREATE POLICY "nhan_vien write admin" ON public.nhan_vien
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt'));

DROP TRIGGER IF EXISTS trg_nhan_vien_updated_at ON public.nhan_vien;
CREATE TRIGGER trg_nhan_vien_updated_at
  BEFORE UPDATE ON public.nhan_vien
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Seed danh sách nhân viên mẫu (idempotent)
INSERT INTO public.nhan_vien (ma_nhan_vien, ho_ten, don_vi, chuc_vu) VALUES
  ('NV001','Nguyễn Văn An','CRA','KTV'),
  ('NV002','Trần Thị Bình','CLA','KTV'),
  ('NV003','Lê Minh Cường','THO','KTV'),
  ('NV004','Phạm Thu Hà','PCA','KTV'),
  ('NV005','Hoàng Đức Duy','PBA','KTV'),
  ('NV006','Vũ Thị Em','PLK','KTV'),
  ('NV007','Đặng Văn Phúc','CRA','KTV'),
  ('NV008','Bùi Thị Giang','CLA','KTV'),
  ('NV009','Ngô Minh Hải','THO','KTV'),
  ('NV010','Đỗ Thu Hương','PCA','KTV'),
  ('NV011','Lý Văn Khoa','PBA','KTV'),
  ('NV012','Trịnh Thị Lan','PLK','KTV')
ON CONFLICT (ma_nhan_vien) DO NOTHING;

-- 3) FK từ ban_giao sang nhan_vien
ALTER TABLE public.ban_giao
  ADD COLUMN IF NOT EXISTS nguoi_giao_id UUID REFERENCES public.nhan_vien(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS nguoi_nhan_id UUID REFERENCES public.nhan_vien(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ban_giao_nguoi_giao_id ON public.ban_giao(nguoi_giao_id);
CREATE INDEX IF NOT EXISTS idx_ban_giao_nguoi_nhan_id ON public.ban_giao(nguoi_nhan_id);

-- 4) Backfill: match theo ho_ten của text hiện có
UPDATE public.ban_giao b
SET nguoi_giao_id = nv.id
FROM public.nhan_vien nv
WHERE b.nguoi_giao_id IS NULL
  AND b.nguoi_giao IS NOT NULL
  AND trim(lower(b.nguoi_giao)) = trim(lower(nv.ho_ten));

UPDATE public.ban_giao b
SET nguoi_nhan_id = nv.id
FROM public.nhan_vien nv
WHERE b.nguoi_nhan_id IS NULL
  AND b.nguoi_nhan IS NOT NULL
  AND trim(lower(b.nguoi_nhan)) = trim(lower(nv.ho_ten));
