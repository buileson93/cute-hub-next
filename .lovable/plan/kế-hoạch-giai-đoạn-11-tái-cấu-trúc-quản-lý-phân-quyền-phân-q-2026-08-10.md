# Kế hoạch - Giai đoạn 11: Tái cấu trúc Quản lý Phân quyền (Phân quyền)

Tái cấu trúc `src/routes/_app.phan-quyen.tsx` để cải thiện khả năng đọc, bảo trì và trải nghiệm người dùng của ma trận quyền, tuân theo hướng dẫn thị giác MIRATS 2.0.

## 1. Xác minh các Giai đoạn Trước

- [x] Giai đoạn 10 (Cây hệ thống) đã xác nhận hoàn thành: Tách file lớn thành `src/components/mirats/he-thong-cay/` và mô-đun hóa logic trong `utils.ts`.

## 2. Giai đoạn 11: Phân quyền - Chi tiết triển khai

### A. Mô-đun hóa file Monolith

Tách `src/routes/_app.phan-quyen.tsx` thành các component chuyên biệt:

- `src/components/mirats/phan-quyen/RoleOverview.tsx`: Thống kê vai trò và các thẻ tóm tắt.
- `src/components/mirats/phan-quyen/PermissionMatrix.tsx`: Ma trận quyền cốt lõi với khả năng cố định tiêu đề (sticky).
- `src/components/mirats/phan-quyen/DistributionStats.tsx`: Thống kê phân bổ tài khoản theo đơn vị và khối lượng dữ liệu.
- `src/components/mirats/phan-quyen/AuditLogViewer.tsx`: Bảng nhật ký kiểm toán nâng cao.
- `src/components/mirats/phan-quyen/SecurityPolicies.tsx`: Các thẻ mô tả chính sách và tiêu chuẩn bảo mật.

### B. Nâng cao trải nghiệm người dùng (UX) cho Ma trận quyền

- **Tiêu đề/Cột cố định (Sticky)**: Triển khai tiêu đề cố định cho các vai trò và cột đầu tiên cố định cho tên bộ sưu tập (collection) để giữ ngữ cảnh khi cuộn.
- **Highlight chéo**: Thêm hiệu ứng hover làm nổi bật cả hàng và cột hiện tại (dạng dấu thập) để cải thiện khả năng đọc của lưới dữ liệu dày đặc.
- **Màu sắc ngữ nghĩa**: Chuẩn hóa màu sắc "Cấp độ" (Đầy đủ, Sửa, Xem, Không) sử dụng các token ngữ nghĩa phù hợp với theme, loại bỏ các class Tailwind cứng.
- **Chú giải tương tác**: Cho phép nhấp vào các mục chú giải để làm nổi bật các ô tương ứng trong ma trận.

### C. Cải thiện Nhật ký kiểm toán & Phân bổ dữ liệu

- **Xem chi tiết nhật ký**: Thêm Sheet hoặc Dialog để xem chi tiết đầy đủ của một bản ghi kiểm toán, bao gồm các thay đổi "trước/sau" (diff).
- **Phân bổ trực quan**: Sử dụng thanh tiến độ hoặc biểu đồ tốt hơn cho phân bổ theo đơn vị.

### D. Chất lượng mã nguồn & Sự nhất quán

- Sử dụng `StandardTable` cho nhật ký kiểm toán để nhất quán với các mô-đun khác.
- Đảm bảo việc sử dụng `PageHeader` được nhất quán.
- Chuẩn hóa việc lấy dữ liệu sử dụng `useQuery` và cơ chế cache phù hợp.

## 3. Các bước triển khai

1. **Tạo cấu trúc thư mục**: `src/components/mirats/phan-quyen/`.
2. **Di chuyển Type & Metadata**: Tạo `src/components/mirats/phan-quyen/types.ts` cho các metadata dùng chung về vai trò/quyền.
3. **Xây dựng các component con**: Triển khai các component đã tách lần lượt.
4. **Tái cấu trúc Route**: Cập nhật `src/routes/_app.phan-quyen.tsx` để sử dụng các component mới.
5. **Thêm các tính năng tương tác**: Triển khai logic sticky/hover trong `PermissionMatrix`.
6. **Hoàn thiện cuối cùng**: Kiểm tra chế độ Dark mode và khả năng hiển thị trên các màn hình khác nhau (responsive).
