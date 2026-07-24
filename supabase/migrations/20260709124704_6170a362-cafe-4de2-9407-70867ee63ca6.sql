ALTER TABLE public.thiet_bi   ADD COLUMN IF NOT EXISTS ma_tai_san_bravo text;
ALTER TABLE public.dm_he_thong ADD COLUMN IF NOT EXISTS ma_tai_san_bravo text;

COMMENT ON COLUMN public.thiet_bi.ma_tai_san_bravo   IS 'Mã tài sản Bravo (cột vật lý cố định, áp dụng cho mọi thiết bị)';
COMMENT ON COLUMN public.dm_he_thong.ma_tai_san_bravo IS 'Mã tài sản Bravo (cột vật lý cố định, áp dụng cho mọi hệ thống)';

CREATE INDEX IF NOT EXISTS idx_thiet_bi_ma_tai_san_bravo   ON public.thiet_bi (ma_tai_san_bravo);
CREATE INDEX IF NOT EXISTS idx_dm_he_thong_ma_tai_san_bravo ON public.dm_he_thong (ma_tai_san_bravo);