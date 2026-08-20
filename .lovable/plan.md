# Kế hoạch khắc phục PowerSearch (Cmd+K) và cập nhật văn bản

Người dùng báo cáo tính năng Command K bị lỗi (chỉ còn danh sách tài sản và cấu trúc hệ thống, mất khả năng tìm kiếm linh hoạt) và yêu cầu thay đổi văn bản "language selector" thành một thông báo lỗi cụ thể cho nút `/he-thong/cay`.

## Phân tích hiện trạng
- `PowerSearch.tsx` sử dụng hook `useTimKiemToanCuc` để gọi RPC `tim_kiem_toan_cuc`.
- Nếu kết quả tìm kiếm chỉ hiện "Danh sách tài sản" và "Cấu trúc hệ thống" (phần Gợi ý khi query trống), có thể `useTimKiemToanCuc` đang không trả về dữ liệu hoặc RPC bị lỗi.
- Văn bản "language selector" không tìm thấy trực tiếp trong code, có thể là một label động hoặc fallback trong component `TzClock` hoặc một tooltip nào đó đã bị thay đổi trước đây. Tuy nhiên, yêu cầu của người dùng là thay đổi nó thành: `"tính năng command K sao lại biến mất chỉ còn danh sách tài sản và cấu trúc hệ thống tìm và khắc phục lỗi"`.

## Các bước thực hiện

### 1. Sửa lỗi tìm kiếm PowerSearch
- Kiểm tra `src/lib/mirats/search/tim-kiem.ts`: Đảm bảo `supabase` client được import đúng (hiện đang là `@/integrations/backend/client`, cần kiểm tra xem nó có hoạt động không hay nên dùng `@/integrations/supabase/client`).
- Kiểm tra RPC `tim_kiem_toan_cuc` trong Database xem có bị mất hoặc thay đổi logic không.
- Đảm bảo `PowerSearch` xử lý đúng trạng thái loading và lỗi.

### 2. Cập nhật văn bản thông báo lỗi
- Thay đổi văn bản từ "language selector" thành "tính năng command K sao lại biến mất chỉ còn danh sách tài sản và cấu trúc hệ thống tìm và khắc phục lỗi" tại các vị trí liên quan (như tooltip hoặc label trong TopBar).


### 3. Tối ưu trải nghiệm Command K
- Đảm bảo `PowerSearch` luôn mở rộng và hiển thị đầy đủ các nhóm kết quả (Tài sản, Hệ thống, OCR, v.v.).

## Chi tiết kỹ thuật
- File ảnh hưởng:
    - `src/components/mirats/search/PowerSearch.tsx`
    - `src/lib/mirats/search/tim-kiem.ts`
    - `src/components/mirats/TzClock.tsx` (hoặc nơi chứa "language selector")
- RPC Database: `tim_kiem_toan_cuc`.
