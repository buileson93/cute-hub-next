# Kế hoạch: Lập bản đồ nợ cấu trúc (Phase U5 - Giai đoạn 1)

Việc lập bản đồ nợ cấu trúc là bước chuẩn bị quan trọng để dọn dẹp hệ thống trong Phase U5. Kế hoạch này tập trung vào việc tạo ra công cụ kiểm tra tự động và ghi lại con số hiện trạng (baseline).

## Mục tiêu

- Tạo script `scripts/code-audit.mjs` để đo lường các chỉ số về chất lượng mã nguồn.
- Ghi nhận hiện trạng vào `docs/ui/u5-baseline.json`.
- Cấu hình lệnh `npm run code:audit`.

## Phạm vi thực hiện

- Chỉ tạo mới 2 file: `scripts/code-audit.mjs` và `docs/ui/u5-baseline.json`.
- Tuyệt đối không sửa đổi mã nguồn trong thư mục `src/`.

## Các chỉ số cần đo (8 điểm)

1. **Top 30 file lớn nhất**: Loại trừ các file sinh tự động (`routeTree.gen.ts`, `supabase/types.ts`).
2. **Export không sử dụng**: Tìm các export không có nơi gọi (phân tích tĩnh).
3. **Import vòng (Circular Dependencies)**: Liệt kê các vòng lặp import nếu có.
4. **Trùng tên Component**: Tìm các file .tsx trùng tên ở các thư mục khác nhau (VD: `StatusDot`).
5. **Thống kê ngưỡng file**: Số file vượt 800 dòng và 1200 dòng.
6. **Độ dài trung bình thư mục**: Tính cho `src/components` và `src/lib/mirats`.
7. **Dependencies thừa**: Gói trong `package.json` không có import tương ứng trong `src/`.
8. **Vi phạm kiến trúc Route**: Đếm số lần gọi `useQuery` hoặc `supabase` trực tiếp trong `src/routes`.

## Kỹ thuật triển khai

- Sử dụng Node.js nội bộ (fs, path) để quét file.
- Sử dụng `glob` (nếu có sẵn) hoặc đệ quy để duyệt thư mục.
- Sử dụng Regex để đếm các vi phạm kiến trúc và import.

## Kiểm tra và Bàn giao

- Chạy `node scripts/code-audit.mjs` và kiểm tra file JSON đầu ra.
- So khớp kết quả với "Số đồ đã biết" để đảm bảo tính chính xác của bộ đếm.
- Cung cấp số liệu cụ thể trong báo cáo hoàn tất.
