-- T43: Ngăn chặn một tài sản bị ghi nhận đang lắp ở hai vị trí cùng lúc.
-- Bước 1: Xóa chỉ mục thường hiện tại (nếu có).
DROP INDEX IF EXISTS public.idx_gan_chuc_nang_thiet_bi_open;

-- Bước 2: Tạo chỉ mục UNIQUE để chặn trùng lặp tài sản đang lắp (den_ngay IS NULL).
-- Lưu ý: Việc tạo này sẽ thất bại nếu còn dữ liệu trùng lặp. 
-- Người dùng cần dọn dẹp dữ liệu bẩn trước khi migration này có thể chạy thành công.
CREATE UNIQUE INDEX IF NOT EXISTS uq_gcn_thiet_bi_active 
ON public.gan_chuc_nang (thiet_bi_id) 
WHERE (den_ngay IS NULL);

-- Cấp quyền (mặc dù bảng đã có quyền, nhưng tốt nhất nên đảm bảo chỉ mục này được hệ thống nhận diện đúng).
GRANT SELECT ON TABLE public.gan_chuc_nang TO authenticated;
GRANT SELECT ON TABLE public.gan_chuc_nang TO anon;
