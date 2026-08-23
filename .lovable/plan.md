# Kế hoạch Khắc phục Lỗi Build, Tối ưu Hiệu suất và Trải nghiệm Bảng/Cây (Phase 11E)

Khắc phục lỗi cú pháp CSS gây treo build, tối ưu hóa cơ chế tải dữ liệu lớn cho bảng và cải thiện tốc độ phản hồi cảm nhận của Cây Hệ thống.

## 1. Khắc phục Lỗi Kỹ thuật & Build
- **Sửa lỗi CssSyntaxError trong `src/styles.css`:** Kiểm tra và chuẩn hóa thứ tự các `@import`, đảm bảo chúng nằm ở đầu file và tuân thủ quy tắc của Tailwind v4/Lightning CSS. Loại bỏ các lỗi cú pháp tiềm ẩn (dấu ngoặc dư, biến CSS sai định dạng).
- **Cập nhật lộ trình UI/UX:** Thay đổi nội dung tooltip tại `TzClock.tsx` và `TopBar.tsx` sang văn bản tiếng Việt mới như yêu cầu (nhiệm vụ 11E).

## 2. Tối ưu hóa Bảng Dữ liệu (StandardTable)
- **Nút "Tải hết dữ liệu" (Fetch All):** Thêm nút "Tải tất cả" cạnh chỉ báo Infinite Scroll. Khi bấm, hệ thống sẽ thực hiện tải toàn bộ dữ liệu còn lại từ backend (keyset pagination không giới hạn số dòng cho đến khi hết).
- **Debounce Search/Filter:** Triển khai `useDebounce` (300ms) cho các ô tìm kiếm trong bảng để tránh gọi API liên tục khi người dùng đang nhập, đồng bộ chính xác với logic Keyset Pagination để trả về đúng tập kết quả.
- **Tối ưu Selection:** Đảm bảo "Select All" hoạt động chính xác cả khi đang tải thêm dữ liệu (chọn toàn bộ dòng hiện có trong client).

## 3. Cải thiện Hiệu suất Cây Hệ thống (Hierarchy)
- **Kỹ thuật "Hiển thị tức thì" (Optimistic Tree Rendering):**
    - Hiển thị khung xương (Skeleton) hoặc các cấp cao (Phân loại/Nhóm) ngay lập tức từ cache trong khi tải chi tiết các cấp thấp hơn (Hệ thống/Tài sản).
    - Sử dụng `Suspense` và `placeholderData` của TanStack Query để tránh màn hình trắng hoặc xoay vòng loading quá lâu.
- **Tối ưu Layout MindMap:** Giảm thiểu tính toán hình học (geometry) lại từ đầu mỗi khi dữ liệu thay đổi nhỏ, ưu tiên cập nhật node hiện tại.
- **Nghiên cứu Delay Loading:** Tìm hiểu nguyên nhân bảng hiển thị chậm (do JS render nặng hay API chậm) và áp dụng Web Workers hoặc Virtualization sâu hơn cho TreeView nếu cần.

## Chi tiết kỹ thuật
- **File ảnh hưởng:** `src/styles.css`, `src/components/mirats/StandardTable.tsx`, `src/routes/_app.he-thong.cay.tsx`, `src/lib/mirats/db/keyset-supabase.ts`.
- **Logic Tải All:** Sử dụng loop trong server function hoặc client handler gọi `fetchKeyset` liên tục cho đến khi `ket: true`.
- **CSS:** Đảm bảo `@custom-variant` và `@theme` không bị ngắt quãng bởi các quy tắc style thô.
