ALTER TABLE public.dm_trang_thai_thiet_bi
  ADD COLUMN IF NOT EXISTS yeu_cau_gan_slot boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.dm_trang_thai_thiet_bi.yeu_cau_gan_slot IS
  'true = thiết bị ở trạng thái này bắt buộc đang nằm trong đúng 1 khe chức năng (đang khai thác/dự phòng nóng)';