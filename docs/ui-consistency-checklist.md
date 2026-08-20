# Hướng dẫn Kiểm soát Nhất quán Giao diện (UI Consistency Guard)

Tài liệu này hướng dẫn cách duy trì và sửa lỗi khi hệ thống kiểm soát UI tự động (u4-visual-contract) báo lỗi.

## 1. Khi test `u4-visual-contract.test.ts` báo lỗi
Nếu bạn thấy thông báo lỗi dạng: `Số lỗi text-[Npx] tăng thêm 1` hoặc `Phát hiện các file mới có vi phạm giao diện`, hãy thực hiện các bước sau:

### Bước 1: Xác định lỗi
Kiểm tra log của test để biết file nào đang vi phạm. Bạn cũng có thể chạy lệnh sau để xem báo cáo chi tiết:
```bash
npm run ui:audit
```

### Bước 2: Thay thế bằng Token chuẩn
- **Lỗi Typography (`text-[Npx]`)**: 
  - Thay thế bằng `TYPO.BODY`, `TYPO.H1`, v.v. từ `src/lib/mirats/ui/typography.ts`.
  - Nếu là văn bản nhỏ trong nhãn, dùng `TYPO.LABEL`.
- **Lỗi Màu sắc (`bg-blue-500`, `#HEX`)**:
  - Thay thế bằng các màu semantic: `text-primary`, `bg-secondary`, `border-border`.
  - Hoặc dùng các biến CSS theme: `var(--color-mirats-blue)`.
- **Lỗi Accessibility (`size="icon"`)**:
  - Thêm `aria-label="Tên hành động"` vào nút.
  - Hoặc bọc nút trong một `<Tooltip>`.

### Bước 3: Xác minh lại
Chạy lại test để đảm bảo số lượng vi phạm đã giảm hoặc bằng mức baseline:
```bash
npm test src/__tests__/u4-visual-contract.test.ts
```

## 2. Quy tắc Allowlist (Danh sách ngoại lệ)
Hiện tại, chúng ta đang dùng chính baseline làm allowlist. 
- **Không được phép thêm file mới** vào danh sách vi phạm.
- Khi bạn sửa xong lỗi trong một file thuộc `top20Files`, số lượng vi phạm tổng thể sẽ giảm xuống, giúp chúng ta tiến gần hơn tới mục tiêu 0 vi phạm.

## 3. Tại sao chúng ta làm việc này?
- **Đồng bộ Mật độ (Density)**: Các token chuẩn (`TYPO`) tự động thay đổi kích thước theo chế độ Compact/Spacious. Hardcode `text-[12px]` sẽ không làm được điều này.
- **Dark Mode**: Các màu semantic tự động đảo ngược màu khi chuyển chế độ tối.
- **Truy cập (A11y)**: Đảm bảo người dùng sử dụng trình đọc màn hình vẫn có thể hiểu được chức năng của các nút chỉ có icon.
