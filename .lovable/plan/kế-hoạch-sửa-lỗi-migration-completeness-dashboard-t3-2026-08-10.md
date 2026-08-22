# Kế hoạch sửa lỗi migration completeness_dashboard (T3)

## 1. Mục tiêu

Sửa lỗi file migration `20260810000000_completeness_dashboard.sql` đang trỏ sai tên bảng `he_thong` (không tồn tại) thành `dm_he_thong` và cập nhật các tên trường/cú pháp SQL cho đúng với thực tế dữ liệu.

## 2. Các bước triển khai

### Bước 1: Sửa file `supabase/migrations/20260810000000_completeness_dashboard.sql`

- Thay thế toàn bộ `public.he_thong` bằng `public.dm_he_thong`.
- Trong hàm `calculate_completeness`:
  - Thay `ten_he_thong` thành `ten`.
  - Thay `ma_he_thong` thành `ma`.
- Trong trigger và hàm trigger:
  - Đảm bảo tham chiếu đúng `dm_he_thong`.
- Trong phần `UPDATE` dữ liệu:
  - Sử dụng cú pháp bí danh: `UPDATE public.thiet_bi t SET ... to_jsonb(t)`.
  - Sử dụng cú pháp bí danh: `UPDATE public.dm_he_thong h SET ... to_jsonb(h)`.
- Đảm bảo logic tương đương với bản vá `20260810042815_07c23232-5110-4a44-97cd-2328a9d5e310.sql`.

## 3. Kiểm tra (Xong khi)

- `grep -n "public.he_thong " supabase/migrations/20260810000000_completeness_dashboard.sql` không trả về kết quả.
- Nội dung logic của file `20260810000000` khớp với file `042815`.
- Không có thay đổi nào ở code frontend (.ts/.tsx).
- `npx tsc --noEmit` sạch.
