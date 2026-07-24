ALTER TABLE public.ban_giao
  ADD COLUMN IF NOT EXISTS chu_ky_url text,
  ADD COLUMN IF NOT EXISTS da_chap_nhan boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS thoi_diem_chap_nhan timestamptz;

COMMENT ON COLUMN public.ban_giao.chu_ky_url IS 'Đường dẫn ảnh chữ ký (bucket chu-ky) khi người nhận ký xác nhận cấp phát/bàn giao';
COMMENT ON COLUMN public.ban_giao.da_chap_nhan IS 'Người nhận đã ký xác nhận biên bản bàn giao hay chưa';
COMMENT ON COLUMN public.ban_giao.thoi_diem_chap_nhan IS 'Thời điểm ký xác nhận';