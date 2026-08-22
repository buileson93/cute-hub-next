# Kế hoạch Áp dụng Thang chữ TYPO cho Vỏ khung Trang

Kế hoạch này thực hiện việc chuyển đổi các class font-size thủ công sang hệ thống thang chữ chuẩn `TYPO` cho 6 component nền tảng của MIRATS, làm mẫu cho việc chuẩn hóa toàn bộ ứng dụng.

## Các bước thực hiện

### 1. Phân tích và Áp dụng (6 file mục tiêu)

Tôi sẽ thay thế các class `text-[Npx]`, `text-xs`, `text-sm` bằng các bậc `TYPO` tương ứng:

- **`src/components/mirats/PageHeader.tsx`**:
  - Breadcrumbs: Chuyển sang `TYPO.LABEL`.
  - Tiêu đề chính: Chuyển sang `TYPO.H1`.
  - Subtitle: Chuyển sang `TYPO.LABEL` (bỏ qua uppercase nếu cần).
  - Description/Tooltip: Chuyển sang `TYPO.BODY`.
- **`src/components/mirats/EmptyState.tsx`**:
  - Title: Chuyển sang `TYPO.H3` (14px-18px).
  - Description: Chuyển sang `TYPO.BODY` (12px-15px).
- **`src/components/mirats/layout/PageFrame.tsx`**, **`PageBody.tsx`**, **`PageSection.tsx`**:
  - Rà soát các class text ẩn (nếu có) để áp dụng `TYPO.BODY` làm mặc định cho container.
- **`src/components/mirats/DataState.tsx`**:
  - Đồng bộ hóa các thông báo lỗi/trạng thái với `TYPO.BODY` hoặc `TYPO.H3`.

### 2. Nguyên tắc "Không phá vỡ" (Non-breaking Rules)

- **Giữ nguyên DOM & Props**: Không thay đổi thẻ HTML, tên thuộc tính hay `data-testid` để bảo vệ các logic test hiện có.
- **Ngưỡng kích thước**: Đảm bảo không có chữ nào nhỏ hơn 12px (trừ `LABEL` 11px).
- **Phát hiện xung đột layout**: Nếu việc áp dụng `TYPO.H1` (20px+) làm tràn tiêu đề ở chế độ Mobile/Compact so với thiết kế cũ (14px), tôi sẽ dừng lại và báo cáo thay vì tự ý hạ size.

### 3. Quy trình Kiểm chứng (3 điểm bắt buộc)

1. **Kiểm thử logic**: Chạy `vitest` cho `PageHeader.test.tsx` và `EmptyState.test.tsx` để đảm bảo không lỗi runtime hoặc render.
2. **Audit số liệu**:
   - Chạy `npm run ui:audit` trước khi sửa.
   - Chạy lại sau khi sửa.
   - Báo cáo rõ sự sụt giảm số lỗi (vi phạm `text-[Npx]`) của riêng 6 file này.
3. **Xác nhận trực quan**: Kiểm tra render thực tế ở 3 mức mật độ (Compact, Comfortable, Spacious) để đảm bảo tiêu đề và nội dung cân đối.

## Công thức Ánh xạ dự kiến

| Code cũ                     | Bậc TYPO mới | Ghi chú                     |
| :-------------------------- | :----------- | :-------------------------- |
| `text-[11px] ... uppercase` | `TYPO.LABEL` | Đồng bộ với `UI_DENSITY`    |
| `text-sm ... uppercase`     | `TYPO.H1`    | Nâng cấp tiêu đề trang      |
| `text-[15px] font-bold`     | `TYPO.H3`    | Dành cho tiêu đề nhỏ/widget |
| `text-xs` (description)     | `TYPO.BODY`  | Nâng từ 12px trở lên        |
| `text-sm` (description)     | `TYPO.BODY`  | Tùy biến theo mật độ        |
