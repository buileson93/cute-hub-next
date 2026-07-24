-- Cho phép trigger `sync_search_index` chạy trong ngữ cảnh người dùng
-- authenticated (khi INSERT/UPDATE vào các bảng nghiệp vụ) có quyền ghi
-- bảng chỉ mục nội bộ `search_index`. RLS vẫn chốt truy cập ứng dụng.
GRANT INSERT, UPDATE, DELETE ON public.search_index TO authenticated;