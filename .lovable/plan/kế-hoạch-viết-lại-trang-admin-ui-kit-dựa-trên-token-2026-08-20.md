# Kế hoạch: Viết lại trang Admin UI Kit dựa trên Token

Hệ thống UI Kit hiện tại đang được viết tay (hardcoded), dẫn đến nguy cơ sai lệch so với thực tế khi các token thay đổi. Kế hoạch này sẽ chuyển đổi trang `admin.ui-kit.tsx` sang cơ chế sinh tự động từ nguồn sự thật duy nhất (Source of Truth).

## Thay đổi kỹ thuật

### 1. Tự động hóa nội dung (Dynamic Generation)

- Thay vì viết tay các ví dụ, sử dụng vòng lặp `map` qua các registry:
  - **Typography**: Lặp qua các khóa của `TYPO` trong `src/lib/mirats/ui/typography.ts`.
  - **Status**: Lặp qua `STATUS_REGISTRY` từ `src/lib/mirats/ui/status-registry.ts` và `TYPO_STATUS` từ `src/lib/mirats/ui/status-tokens.ts`.
  - **Actions**: Lặp qua các variants của `Button` được định nghĩa trong `src/components/ui/button.tsx` và `ACTION_PATTERNS` trong `src/lib/mirats/ui/action-patterns.ts`.
- Đảm bảo khi thêm một token mới vào thư viện, nó sẽ tự động xuất hiện trên UI Kit.

### 2. Dọn dẹp và chuẩn hóa (Cleaning & Standardization)

- Loại bỏ toàn bộ các class viết cứng (ví dụ: `text-[11px]`, `border-[#0074e2]`, `text-green-600`).
- Thay thế bằng các class từ `TYPO` hoặc `UI_DENSITY`.
- Sửa lỗi thông tin font chữ: Chỉnh từ "Figtree" thành "Geist" (font thực tế đang dùng).

### 3. Bổ sung các hệ thống còn thiếu

- Thêm tab **Bảng và Số**: Trình bày các biến thể mật độ bảng (Table Density) và định dạng số (Tabular numbers).
- Thêm tab **Nền và Mật độ**: Trình bày hệ thống màu nền semantic và các mức mật độ `compact`, `comfortable`, `spacious`.

### 4. Kiểm thử (Testing)

- Tạo file test `src/routes/__tests__/ui-kit.test.tsx`.
- Kiểm tra số lượng ví dụ render ra phải khớp với số lượng token trong registry.

## Các tệp bị ảnh hưởng

- `src/routes/admin.ui-kit.tsx`: Viết lại toàn bộ component để sử dụng dữ liệu từ token.
- `src/routes/__tests__/ui-kit.test.tsx`: Tạo mới để bảo vệ tính toàn vẹn của UI Kit.

## Cách kiểm chứng

1. **Tự động cập nhật**: Thêm một token trạng thái giả vào `TYPO_STATUS`, mở trang UI Kit và xác nhận nó xuất hiện. Xóa đi sau khi kiểm tra.
2. **Kiểm tra UI**: Chuyển đổi giữa 3 mức mật độ và xác nhận các ví dụ typography/spacing cập nhật chính xác theo `UI_DENSITY`.
3. **Chạy test**: `npm test src/routes/__tests__/ui-kit.test.tsx` phải đạt 100% pass.
