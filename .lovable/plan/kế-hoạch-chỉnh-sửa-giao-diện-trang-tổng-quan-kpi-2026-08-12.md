# Kế hoạch chỉnh sửa giao diện trang Tổng quan KPI

Trang Tổng quan KPI (`src/routes/_app.tong-quan.tsx`) hiện đang có một số chi tiết trang trí gây rối mắt. Kế hoạch này sẽ làm gọn giao diện, chuẩn hóa Tooltip và điều chỉnh mật độ hiển thị (padding/gap) theo yêu cầu.

## Các thay đổi chính

### 1. Làm gọn CardTitle và chuyển mô tả sang Tooltip
Sửa 4 vị trí tiêu đề biểu đồ/danh sách để đưa đoạn mô tả dài vào Tooltip:
- **Xu hướng sự cố theo tháng (12 tháng)**
- **Heatmap sự cố (90 ngày) — thứ × giờ**
- **Top thiết bị hỏng hóc (90 ngày)**
- **Hạn giấy phép & kiểm định (90 ngày tới)**

**Cách thực hiện:**
- Loại bỏ thẻ `<p className="text-[10px] ...">` bên trong `CardTitle`.
- Thêm icon `Info` (lucide-react) cỡ nhỏ cạnh tiêu đề.
- Gắn Tooltip của shadcn cho icon `Info` này để hiển thị lại nội dung mô tả.
- Đảm bảo `CardTitle` hiển thị trên một dòng duy nhất.

### 2. Cập nhật component `HealthTile`
- Loại bỏ dòng text mô tả hiển thị trực tiếp (italic 10px).
- Chuyển `description` thành Tooltip hiển thị khi hover vào tile.
- Đảm bảo không còn chữ nghiêng cỡ 10px trong component này.

### 3. Điều chỉnh tiêu đề và thông tin hàng 1 (Hành động khẩn cấp)
- Đổi tiêu đề section từ "Hành động khẩn cấp" về "Brief hôm nay".
- Loại bỏ đoạn text phụ "Theo dõi các chỉ số vận hành quan trọng trong thời gian thực".
- Cập nhật MTTR `HealthTile`: Đổi link `to="/su-co"` thành `to="/bao-tri"`.

### 4. Chuẩn hóa mật độ hiển thị (UI Density)
Kiểm tra và điều chỉnh `src/lib/mirats/ui/ui-density.ts` để đạt được cấu hình `flex w-full flex-col gap-4 p-4 md:p-6`:
- `PAGE_PADDING`: Chuyển từ `px-4 py-4 lg:px-6` thành `p-4 md:p-6`.
- `SECTION_GAP`: Chuyển từ `space-y-4` thành `gap-4`.

**Lưu ý về PageBody:**
- Cập nhật `src/components/mirats/PageBody.tsx` để hỗ trợ `flex flex-col` và `w-full` khi sử dụng `gap-4`.
- Việc thay đổi `UI_DENSITY` sẽ ảnh hưởng toàn cục, cần đảm bảo không phá vỡ layout các trang khác (đã được thiết kế để dùng chung token này).

## Chi tiết kỹ thuật

### Tệp tin ảnh hưởng:
1. `src/lib/mirats/ui/ui-density.ts`: Thay đổi token mật độ.
2. `src/components/mirats/PageBody.tsx`: Cập nhật cấu trúc flex để tương thích với `gap-4`.
3. `src/routes/_app.tong-quan.tsx`: 
    - Import `Info` và các thành phần `Tooltip`.
    - Refactor 4 khối `CardTitle`.
    - Refactor `HealthTile`.
    - Sửa text/link ở hàng 1.

### Kiểm tra:
- Chạy `npx tsc --noEmit` để đảm bảo không có lỗi TypeScript.
- Kiểm tra hiển thị thực tế: tiêu đề card gọn gàng, tooltip hoạt động, padding/gap nhất quán.
