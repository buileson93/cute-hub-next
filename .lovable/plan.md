# Kế hoạch Phase 10H: Data Loading Optimization & Integrity

Mục tiêu: Tối ưu hóa việc tải dữ liệu, loại bỏ việc nạp dữ liệu dư thừa trên toàn trang, và xử lý triệt để các trường hợp dữ liệu bị cắt âm thầm (silent truncation) thông qua chiến lược phân loại và benchmark cụ thể.

## 1. Inventory & Phân loại Query
- Lập danh sách (inventory) cho 71 vị trí sử dụng `.slice/.limit` và 30 vị trí gọi `fetchAllRows`.
- Phân loại từng query thành các nhóm:
    - **Intentional bounded lookup**: Lookup có chủ đích giới hạn (như Top 5, Latest 10).
    - **Server paged**: Phân trang phía server.
    - **Infinite/Keyset**: Danh sách cuộn vô hạn hoặc dùng keyset pagination.
    - **Export-only**: Chỉ dùng để xuất dữ liệu.
    - **Bug silent truncation**: Các trường hợp giới hạn cứng gây mất dữ liệu không mong muốn.

## 2. Tối ưu hóa ScopeProvider & Eager Loading
- Loại bỏ việc nạp toàn bộ danh mục (operations, taxonomy, licenses) tại root hoặc trong các provider dùng chung trên mọi route.
- Chuyển sang nạp dữ liệu ở cấp route (Route-level query) hoặc sử dụng Lazy Provider/Suspense.
- Thực thi bộ lọc phía server (RLS hoặc query params) theo đơn vị trước khi gửi dữ liệu về trình duyệt.

## 3. Cải thiện Trải nghiệm Danh sách (User-facing Lists)
- Hiển thị số lượng bản ghi hiện có / tổng số bản ghi (`loaded/total count`).
- Đảm bảo logic Filter và Sort áp dụng trên toàn bộ phạm vi dữ liệu, không chỉ trên dữ liệu đã tải về client.
- Áp dụng Keyset/Infinite scroll cho các danh sách lớn.

## 4. Hotspot Payloads & Benchmark
- Thay thế `select *` bằng danh sách các cột thực sự cần thiết tại các điểm nóng (high-traffic routes).
- Thực hiện Benchmark (Query count, Bytes transferred, TTFB, Memory usage) trước và sau khi tối ưu trên một **Route Pilot** trước khi triển khai hàng loạt.
- Xử lý Export lớn thông qua server-side job hoặc streaming thay vì nạp hàng chục nghìn dòng vào UI.

## 5. Lộ trình Triển khai (Pilot & Rollout)
- **Pilot**: Chọn một route phức tạp (ví dụ: `/thiet-bi` hoặc `/tai-lieu`) để áp dụng toàn bộ chuẩn 10H.
- Kiểm tra tính đúng đắn của Filter/Sort/Export trên Pilot.
- Đo đạc hiệu năng và so sánh với baseline trước khi áp dụng cho các route còn lại.
