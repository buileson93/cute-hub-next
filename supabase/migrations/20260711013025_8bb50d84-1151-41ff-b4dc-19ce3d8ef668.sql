ALTER TABLE public.vi_tri_media
  ADD COLUMN IF NOT EXISTS vi_do double precision,
  ADD COLUMN IF NOT EXISTS kinh_do double precision,
  ADD COLUMN IF NOT EXISTS do_chinh_xac double precision,
  ADD COLUMN IF NOT EXISTS chup_luc timestamptz;

COMMENT ON COLUMN public.vi_tri_media.vi_do IS 'Vĩ độ (latitude) nơi chụp ảnh, lấy từ GPS thiết bị';
COMMENT ON COLUMN public.vi_tri_media.kinh_do IS 'Kinh độ (longitude) nơi chụp ảnh, lấy từ GPS thiết bị';
COMMENT ON COLUMN public.vi_tri_media.do_chinh_xac IS 'Độ chính xác GPS (mét)';
COMMENT ON COLUMN public.vi_tri_media.chup_luc IS 'Thời điểm chụp/ghi nhận vị trí (client timestamp)';