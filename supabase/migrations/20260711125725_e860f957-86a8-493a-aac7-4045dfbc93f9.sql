ALTER TABLE public.dm_nha_san_xuat ADD COLUMN IF NOT EXISTS xuat_xu text;
COMMENT ON COLUMN public.dm_nha_san_xuat.xuat_xu IS 'Xuất xứ / quốc gia của nhà sản xuất';