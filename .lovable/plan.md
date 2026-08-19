# Kế hoạch Khắc phục Triệt để Màu sắc Nút trên toàn Website

Mục tiêu: Loại bỏ hoàn toàn tình trạng nút "Hoàn tất" (và các nút tương tự) bị nền xám chữ trắng, thay thế bằng màu xanh MIRATS (#0074e2) chuẩn thương hiệu với độ tương phản cao.

## 1. Đồng bộ Design Tokens (CSS)
- Cập nhật `src/styles.css`: Định nghĩa lại các biến màu trong `@layer astryx-brand` để đảm bảo độ ưu tiên cao nhất.
- Cố định `--primary`: `oklch(0.55 0.2 260)` (tương đương #0074e2).
- Cố định `--primary-foreground`: `oklch(1 0 0)` (Trắng tuyệt đối).
- Cố định `--accent`: `oklch(0.55 0.2 260 / 0.1)` (10% xanh cho hover).
- Cố định `--accent-foreground`: `var(--primary)`.

## 2. Chuẩn hóa Component Button (Shadcn)
- Cập nhật `src/components/ui/button.tsx`: Kiểm tra lại mapping của variant `default` để chắc chắn nó sử dụng đúng `bg-primary` và `text-primary-foreground`.

## 3. Khắc phục Logic Component
- **Dashboard (`src/routes/_app.index.tsx` & `src/routes/_app.tong-quan.tsx`)**:
    - Sửa nút "Cá nhân hóa/Hoàn tất" sử dụng `variant={isEditing ? "default" : "outline"}`.
    - Loại bỏ hoàn toàn các class ghi đè màu sắc thủ công hoặc class `cn` phức tạp gây xung đột.
- **Cây Hệ thống (`src/routes/_app.he-thong.cay.tsx`)**:
    - Sửa nút "Chế độ Chỉnh sửa" tương tự dashboard.
- **Thành phần dùng chung**:
    - `StandardTable.tsx`: Nút lọc/hành động dùng `variant="outline"` với viền màu xanh nhẹ, hover hiện nền xanh.
    - `BulkActionBar.tsx`: Nút hành động dùng `variant="default"` để nổi bật trên thanh dark.
    - `ListToolbar.tsx`: Nút "Xuất" dùng màu thương hiệu đồng bộ.

## 4. Kiểm tra và Làm sạch (Audit)
- Rà soát toàn bộ code để xóa bỏ các class như `!bg-[#0074e2]`, `!text-white` hoặc `bg-white` trên các nút có `variant="outline"`.
- Đảm bảo tính nhất quán trên cả Light mode và Dark mode thông qua biến CSS.

---
**Kỹ thuật:** Sử dụng Design Tokens để giải quyết gốc rễ vấn đề thay vì ghi đè (override) cục bộ.
