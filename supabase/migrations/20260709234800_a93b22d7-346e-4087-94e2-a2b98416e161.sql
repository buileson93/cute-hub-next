-- Sửa lỗi thiếu GRANT trên 3 bảng "quản lý thiết bị thông minh".
-- Không có anon vì mọi policy đều theo auth.uid() (chỉ người dùng đã đăng nhập).

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bao_tri_chinh_sach TO authenticated;
GRANT ALL ON public.bao_tri_chinh_sach TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.thiet_bi_do_dac TO authenticated;
GRANT ALL ON public.thiet_bi_do_dac TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.thiet_bi_vong_doi TO authenticated;
GRANT ALL ON public.thiet_bi_vong_doi TO service_role;