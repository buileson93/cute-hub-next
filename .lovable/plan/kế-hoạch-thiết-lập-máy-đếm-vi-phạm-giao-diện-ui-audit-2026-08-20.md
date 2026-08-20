# Kế hoạch Thiết lập Máy đếm Vi phạm Giao diện (UI Audit)

Kế hoạch này tập trung vào việc tạo công cụ quét tự động để kiểm soát các vi phạm UI và chốt số liệu mốc cho dự án MIRATS, đảm bảo tính nhất quán và khả năng truy cập.

## Các bước thực hiện

### 1. Chuẩn bị thư mục và tệp mới
- Tạo tệp `scripts/ui-audit.mjs` để chứa logic quét.
- Tạo thư mục `docs/ui/` và tệp `docs/ui/u4-baseline.json` để lưu kết quả.

### 2. Triển khai Logic Quét (scripts/ui-audit.mjs)
Script sẽ thực hiện các nhiệm vụ sau:
- **Duyệt tệp**: Sử dụng `fs` để quét đệ quy các tệp `.tsx` và `.ts` trong `src/`.
- **Thống kê Typography**:
    - Quét các class `text-[Npx]` bằng Regex, phân nhóm theo giá trị (ví dụ: `text-[13px]`) và theo từng tệp.
    - Đếm `text-xs`, `text-sm`, `text-base` cụ thể trong `src/routes` và `src/components/mirats`.
- **Thống kê Màu sắc**:
    - Tìm các class màu Tailwind cứng (ví dụ: `bg-blue-500`, `text-red-600`, `border-gray-200`).
    - Tìm các mã màu HEX viết trực tiếp trong mã nguồn (ví dụ: `#FFFFFF`, `#0074e2`).
- **Thống kê Thành phần**:
    - Đếm các variant của `Button` (ví dụ: `variant="outline"`, `variant="ghost"`).
    - Tìm các trường hợp dùng `size="icon"` nhưng thiếu thuộc tính `aria-label` và không có component `Tooltip` bao quanh.
- **Thống kê Layout**:
    - Tính tỷ lệ các tệp trong `src/routes` có sử dụng component `PageHeader`.
- **Báo cáo**:
    - In bảng thống kê ra console.
    - Tìm ra Top 20 tệp có tổng số vi phạm cao nhất.

### 3. Ghi dữ liệu Baseline
- Lấy commit hash hiện tại qua lệnh `git rev-parse HEAD`.
- Lưu toàn bộ kết quả quét vào `docs/ui/u4-baseline.json` kèm dấu thời gian.

### 4. Tích hợp NPM Script
- Cập nhật `package.json` để thêm lệnh `"ui:audit": "node scripts/ui-audit.mjs"`.

## Chi tiết kỹ thuật
- **Ngôn ngữ**: Node.js (ESM).
- **Thư viện**: Chỉ sử dụng các module có sẵn của Node.js (`fs`, `path`, `child_process`) để đảm bảo tốc độ và không phụ thuộc bên ngoài.
- **Kiểm tra**: Chạy lệnh quét hai lần để đảm bảo tính ổn định của bộ đếm (Idempotency).

## Mục tiêu số liệu (Baseline)
Dựa trên yêu cầu, bộ đếm sẽ hướng tới việc xác nhận các mốc sau:
- `text-[Npx]`: ~966
- `text-xs`: ~1245
- `text-sm`: ~861
- Màu palette cứng: ~504
- HEX trong TSX: ~204
- Button variant: outline (603), ghost (308), secondary (130), destructive (38), default (12).
- Icon không nhãn: ~115
- PageHeader: 60/111 routes.
