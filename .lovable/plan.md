# Kế hoạch chuyển đổi Hộp thoại G1 sang ResponsiveDialog (Sheet trên Mobile)

Theo yêu cầu, thực hiện chuyển đổi 5 hộp thoại thuộc các trang hạng G1 từ `Dialog` tiêu chuẩn sang `ResponsiveDialog` để tối ưu trải nghiệm trên thiết bị di động (tự động chuyển thành Sheet trượt từ dưới lên).

## Danh sách 5 file và hộp thoại thực hiện (Xác nhận trước khi sửa)

1.  **src/routes/_app.su-co.index.tsx**: Hộp thoại "Đóng sự cố" (dòng 435-454).
2.  **src/routes/_app.danh-muc.he-thong.tsx**: Thành phần `HeThongDialog` (dòng 286-321).
3.  **src/routes/_app.danh-muc.model.tsx**: Thành phần `ModelUsageDialog` (dòng 1000-1058).
4.  **src/routes/_app.danh-muc.model.tsx**: Thành phần `MergeModelsDialog` (dòng 1065-1111).
5.  **src/components/mirats/ModelDacTinhIODialog.tsx**: Hộp thoại "Nhập / Xuất nhãn tài sản theo Mẫu" (dòng 201-324).

## Các bước thực hiện cho mỗi hộp thoại

### 1. Thay thế Component
- Import `ResponsiveDialog` từ `@/components/mirats/ResponsiveDialog`.
- Thay thế cấu trúc `<Dialog><DialogContent>...</DialogContent></Dialog>` bằng `<ResponsiveDialog>...</ResponsiveDialog>`.
- Chuyển `title` và `description` từ `DialogHeader` vào props của `ResponsiveDialog`.
- Giữ nguyên logic `open`, `onOpenChange`, các `data-testid` và nội dung bên trong.

### 2. Tối ưu nút bấm (Mobile Footer)
- Đảm bảo các nút hành động (Xác nhận/Lưu) nằm trong `DialogFooter` hoặc phần cuối của sheet.
- Trên Mobile, `ResponsiveDialog` đã có sẵn vùng `ScrollArea` cho nội dung, giúp footer luôn hiển thị ở đáy sheet.
- Kiểm tra tính tương tác khi bàn phím ảo (Virtual Keyboard) mở lên để đảm bảo nút xác nhận không bị che khuất hoàn toàn (nhờ thuộc tính `h-[94vh]` và `pb-10` trong `ResponsiveDialog`).

### 3. Xử lý các trường hợp đặc biệt
- **HeThongDialog**: Chứa `Textarea` và `Switch`. Đảm bảo khoảng cách chạm (gap) đủ rộng trên mobile.
- **ModelDacTinhIODialog**: Chứa `Textarea` lớn cho CSV. Sẽ sử dụng tính năng cuộn nội dung của `ResponsiveDialog`.
- **MergeModelsDialog**: Chứa danh sách `radio`. Đảm bảo danh sách này cuộn được bên trong nội dung sheet.

## Kiểm tra và Xác minh

### Trên Mobile (390px)
- Mở từng hộp thoại, xác nhận nó hiện ra dưới dạng Sheet trượt từ đáy.
- Kiểm tra khả năng đóng bằng cách vuốt xuống (vuốt vùng header).
- Kiểm tra nút xác nhận ở đáy trang.
- Kiểm tra việc nhập liệu (mở bàn phím) không làm mất dấu nút bấm.

### Trên Desktop
- Chụp ảnh so sánh để xác nhận giao diện Dialog không thay đổi (giữ nguyên kích thước `max-w-*`).

### Kỹ thuật
- Chạy `npm test` để đảm bảo không phá vỡ logic nghiệp vụ.

## Chi tiết kỹ thuật
- Sử dụng `ResponsiveDialog` đã có sẵn tại `src/components/mirats/ResponsiveDialog.tsx`.
- Prop `className` của `ResponsiveDialog` sẽ áp dụng cho `DialogContent` trên Desktop.
- Prop `contentClassName` sẽ áp dụng cho `SheetContent` trên Mobile.
