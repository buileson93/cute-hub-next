-- Cập nhật bảng nhan_vien với các trường bổ sung từ file Excel
ALTER TABLE public.nhan_vien 
ADD COLUMN IF NOT EXISTS don_vi text,
ADD COLUMN IF NOT EXISTS chuc_vu text,
ADD COLUMN IF NOT EXISTS dien_thoai text,
ADD COLUMN IF NOT EXISTS ngay_sinh date;

-- Đảm bảo các quyền truy cập
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nhan_vien TO authenticated;
GRANT ALL ON public.nhan_vien TO service_role;
GRANT SELECT ON public.nhan_vien TO anon;
