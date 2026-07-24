
-- 1) Backfill: mọi giá trị lạ (NULL/rỗng/khác) về DU_PHONG
UPDATE public.vat_tu
SET loai = 'DU_PHONG'
WHERE loai IS NULL
   OR btrim(loai) = ''
   OR loai NOT IN ('DU_PHONG', 'TIEU_HAO');

-- 2) Chuẩn hoá cột: default + NOT NULL
ALTER TABLE public.vat_tu
  ALTER COLUMN loai SET DEFAULT 'DU_PHONG',
  ALTER COLUMN loai SET NOT NULL;

-- 3) CHECK constraint (drop nếu đã tồn tại từ lần chạy trước)
ALTER TABLE public.vat_tu
  DROP CONSTRAINT IF EXISTS vat_tu_loai_check;

ALTER TABLE public.vat_tu
  ADD CONSTRAINT vat_tu_loai_check
  CHECK (loai IN ('DU_PHONG', 'TIEU_HAO'));
