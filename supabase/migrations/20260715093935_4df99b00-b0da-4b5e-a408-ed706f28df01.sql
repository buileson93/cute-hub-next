-- Additive: thêm cột `mau` (nullable text) cho dm_dac_tinh & dm_loai_thiet_bi
ALTER TABLE public.dm_dac_tinh ADD COLUMN IF NOT EXISTS mau text;
ALTER TABLE public.dm_loai_thiet_bi ADD COLUMN IF NOT EXISTS mau text;

-- Seed màu mặc định cho đặc tính hiện có (cột `nhom` đã bị loại bỏ ở đợt trước,
-- nên fallback về màu xám). Chỉ ghi khi mau IS NULL để idempotent.
UPDATE public.dm_dac_tinh SET mau = 'xam' WHERE mau IS NULL;