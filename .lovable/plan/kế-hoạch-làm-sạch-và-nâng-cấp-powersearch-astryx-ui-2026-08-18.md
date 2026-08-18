# Kế hoạch làm sạch và nâng cấp PowerSearch (Astryx UI)

Mục tiêu là biến `PowerSearch` thành trung tâm chỉ huy (Command Center) hiện đại, sạch sẽ theo tiêu chuẩn Astryx, loại bỏ các thành phần dư thừa và tối ưu hóa trải nghiệm tìm kiếm thông minh.

## Các thay đổi chính

### 1. Làm sạch giao diện (UI Cleanup)
- **Cấu trúc lại Dialog**: Chỉnh lại kích thước tối đa (`max-w-3xl`) và chiều cao phù hợp để không chiếm quá nhiều không gian nhưng vẫn đủ hiển thị thông tin.
- **Header hiện đại**: 
  - Tối ưu hóa `CommandInput` để có độ tương phản tốt hơn, font chữ Geist 15px.
  - Căn chỉnh icon `Search` và phím tắt `⌘K` đồng bộ với `TopBar`.
- **Tối ưu hóa Cột Phải (Quick Analysis)**:
  - Thay thế "Mẹo tìm kiếm" tĩnh bằng các thông số ngữ cảnh thực tế (Số lượng thiết bị/hệ thống đang có).
  - Sử dụng các thẻ (Cards) mini để hiển thị "Trạng thái AI" và "Độ khớp" với màu sắc semantic (success, info).
  - Loại bỏ hoàn toàn phần `↑↓ Điều hướng` và các gợi ý thừa.

### 2. Nâng cấp chức năng (Functionality Enhancement)
- **Phân loại kết quả (Tab Logic)**:
  - Cập nhật `filteredRows` để hỗ trợ tab "Hành động" (Actions) hiển thị các lệnh AI và lệnh hệ thống.
  - Tích hợp kết quả từ `useTimKiemToanCuc` một cách mượt mà hơn, tránh trùng lặp với `useGlobalSearch`.
- **Hành động AI & Hệ thống**:
  - Tăng cường nhận diện ý định (Intent): "Tạo biên bản", "Báo hỏng", "Chuyển đơn vị".
  - Hiển thị rõ ràng các lệnh hệ thống: Đăng xuất, Cài đặt, Nhật ký.
- **Trải nghiệm gõ (Typing Experience)**:
  - Cải thiện logic tô sáng (`Highlight`) để xử lý tiếng Việt chính xác hơn (đã có trong `global-search.tsx`).
  - Đảm bảo phím tắt `Enter` và các phím mũi tên hoạt động ổn định trên mọi loại kết quả.

### 3. Đồng bộ hóa kiến trúc (Architecture Sync)
- **Unify Search Entry Points**: Đảm bảo tất cả các nút tìm kiếm trong hệ thống (TopBar, Sidebar, Mobile) đều kích hoạt cùng một instance `PowerSearch`.
- **Dữ liệu thật**: Loại bỏ các placeholder cuối cùng nếu còn sót lại, sử dụng `useSession` để lọc lệnh theo quyền (RBAC).

## Chi tiết kỹ thuật

### Tệp tin thay đổi:
- `src/components/mirats/search/PowerSearch.tsx`: Refactor layout, gỡ bỏ navigation hint, nâng cấp preview panel.
- `src/components/ui/command.tsx`: (Nếu cần) Tinh chỉnh CSS cho `CommandDialog` để khớp với layout mới.

### Các bước thực hiện:
1. **Refactor Cột Trái (Results)**: Căn chỉnh padding, gap, và typography cho các `CommandItem`.
2. **Refactor Cột Phải (Preview)**: Thiết kế lại các widget phân tích nhanh.
3. **Logic Tab**: Gắn logic lọc cho tab "Hành động".
4. **Cleanup Footer**: Chỉ giữ lại `Enter Mở` và căn giữa.

## Kiểm thử (QA)
- [ ] Gõ "logout" hoặc "dang xuat" xuất hiện lệnh AI đăng xuất.
- [ ] Kết quả tìm kiếm thiết bị hiển thị đúng Badge hệ thống cha.
- [ ] Không còn text "Điều hướng" ở chân trang.
- [ ] Giao diện Responsive: Ẩn cột phải trên mobile, giữ cột trái full width.
