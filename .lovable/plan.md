# Kế hoạch Cải thiện UI/UX Toàn diện MIRATS (Phase 11B)

Kế hoạch này tập trung vào việc chuẩn hóa toàn bộ giao diện website dựa trên tiêu chuẩn của trang **Thành phần & Tài sản** (chuẩn Astryx Stone), đảm bảo tính hiện đại, đồng nhất và tối ưu trải nghiệm người dùng.

## 1. Mục tiêu & Nguyên tắc chủ đạo
- **Lấy trang `he-thong/thanh-phan` làm chuẩn**: Sử dụng hệ thống bảng ảo hóa (Virtual Table), Header dính (Sticky Header), và sidebar trượt (Responsive Sheet).
- **Hiện đại hóa (Modernize)**: Chuyển đổi các component cũ sang hệ thiết kế Astryx với bo góc chuẩn (12px container, 6px control), typography 7 bậc (Geist Sans), và bảng màu MIRATS Blue (#0074e2).
- **Đồng nhất (Consistency)**: Áp dụng cùng một cấu trúc `PageFrame` -> `PageHeader` -> `PageBody` cho tất cả các route chính.

## 2. Các hạng mục cải thiện chi tiết

### A. Chuẩn hóa Cấu trúc Trang (Layout Architecture)
- Rà soát tất cả các route chính (/dashboard, /su-co, /bao-tri, /thiet-bi).
- Thay thế các div container tự do bằng `PageFrame` và `PageBody` để đảm bảo khoảng cách (padding) và mật độ (density) đồng nhất theo `ui-density.ts`.
- Đảm bảo quy tắc **"Một Scroll Owner"**: Chỉ có container chứa dữ liệu chính (bảng/mindmap) được phép cuộn dọc, tránh tình trạng 2 thanh cuộn chồng nhau.

### B. Nâng cấp Hệ thống Bảng (DataTable Modernization)
- Cập nhật `StandardTable` để hỗ trợ **Keyset Pagination** và **Infinite Scroll** cho tất cả các danh sách (không chỉ riêng Thành phần).
- Áp dụng `HorizontalScrollRail` (thanh cuộn ngang dính ở đáy) cho các bảng có nhiều cột để người dùng không phải cuộn xuống cuối bảng mới thấy thanh cuộn.
- Tối ưu hóa **GPU Acceleration** cho các hiệu ứng hover và scroll trên bảng.

### C. Trải nghiệm Form & Dialog (Responsive Interaction)
- Chuyển toàn bộ các form nhập liệu (Thêm mới/Sửa) sang `ResponsiveDialog`.
- **Desktop**: Trượt từ phải vào (Sheet) để người dùng vẫn thấy được bối cảnh dữ liệu bên dưới.
- **Mobile**: Trượt từ dưới lên (Bottom Sheet) để tối ưu không gian thao tác bằng một tay.

### D. Tinh chỉnh Visual & Typography
- Áp dụng font **IBM Plex Mono** cho tất cả các con số, mã hiệu, và dữ liệu kỹ thuật để tăng tính chính xác khi đọc.
- Sử dụng **Tooltip** thay cho các đoạn mô tả dài trong bảng để giảm nhiễu thị giác.
- Chuẩn hóa các `Badge` và `StatusBadge` theo hệ màu trạng thái mới (Success/Warning/Error chuẩn OKLCH).

## 3. Lộ trình thực hiện (Vertical Slice)
1. **Bước 1**: Cập nhật `PageHeader` và `TopBar` để đồng bộ màu thương hiệu và font chữ chuẩn.
2. **Bước 2**: Refactor trang Dashboard/Tổng quan sang kiến trúc Widget-based với mật độ Astryx.
3. **Bước 3**: Cập nhật các trang Nghiệp vụ (Sự cố, Bảo trì) sang hệ thống `StandardTable` ảo hóa.
4. **Bước 4**: Kiểm tra hồi quy bằng Playwright để đảm bảo không bị khuất nội dung (Occlusion Test) trên mọi kích thước màn hình.

## 4. Xác nhận kỹ thuật
Việc nâng cấp này chỉ thay đổi lớp hiển thị (Presentation Layer) và logic UI, hoàn toàn không làm ảnh hưởng đến dữ liệu gốc (Database) hay logic RLS hiện tại.

---
*Sau khi bạn phê duyệt kế hoạch này, tôi sẽ bắt đầu triển khai theo từng module.*
