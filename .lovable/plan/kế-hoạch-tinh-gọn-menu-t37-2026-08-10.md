# Kế hoạch Tinh gọn Menu (T37)

Dựa trên yêu cầu và khảo sát thực tế mã nguồn MIRATS 2.0.

## 1. Kết quả khảo sát (Giai đoạn 1)

### A. Dữ liệu sử dụng (`feature_usage_log`)
- **Kết quả:** Bảng `feature_usage_log` hiện có **0 bản ghi** trong môi trường hiện tại.
- **Kết luận:** Không thể xếp hạng dựa trên dữ liệu thực tế. Mọi đề xuất dưới đây dựa trên **phỏng đoán nghiệp vụ** và **cấu trúc hiện tại** của hệ thống, cần được chủ dự án xác nhận.

### B. Đối chiếu Route vs Menu
Hiện có **107 route** và **52 mục menu**. Phần lớn các route không có trong menu là các trang chi tiết (`$id`), trang tạo mới hoặc trang hệ thống. Tuy nhiên, có các tính năng "mồ côi" hoặc khó tìm thấy:
- `/he-thong/thanh-phan`: Trang bảng danh sách tài sản/thành phần, chỉ có lối vào từ trang Cây hệ thống.
- `/bao-cao/do-tin-cay`: Trang báo cáo quan trọng nhưng không có trong menu.
- `/gop-gach`: Tính năng gamification không được đưa lên menu chính.
- `/he-thong/thung-rac`: Quản lý dữ liệu đã xoá.

### C. Các điểm bất hợp lý đã xác nhận
1. **Trùng tên:** Workspace "Sổ lý lịch" chứa mục "Sổ lý lịch" (cùng trỏ về `/thiet-bi`).
2. **Quá thưa thớt:** "Dự án" (1 mục), "Trao đổi" (2 mục).
3. **Quá dàn trải:** Nhóm bảo trì có 4 mục phẳng, Nhóm danh mục có 8 mục phẳng chiếm diện tích lớn.

---

## 2. Các phương án đề xuất

### Phương án A — Nhẹ (Cải thiện cấu trúc)
Giữ nguyên 7 phân hệ hiện tại để không làm xáo trộn thói quen định vị.
- **Thay đổi:** Sử dụng `children` để gộp các nhóm cùng họ.
    - Gộp 4 mục Bảo trì vào một mục cha "Bảo trì & Sửa chữa".
    - Gộp 8 mục Danh mục vào mục cha "Danh mục kỹ thuật".
- **Số phân hệ:** 7.
- **Mục hiển thị cấp 1:** ~35 mục (Giảm từ 52).
- **Cú bấm tới trang chính (ví dụ Bảo trì):** 2 click (thay vì 1).
- **Ai khó chịu:** Người làm bảo trì/nhập danh mục mỗi ngày vì phải thêm 1 click mở menu.

### Phương án B — Vừa (Gộp phân hệ - Khuyên dùng)
Gộp các phân hệ nhỏ để tối ưu thanh dọc (Rail).
- **Thay đổi:**
    - Gộp "Dự án" và "Tài sản & Hồ sơ" thành phân hệ **"Tài sản & Dự án"**.
    - Gộp "Trao đổi & Hỗ trợ" vào phân hệ **"Vận hành"** hoặc **"Hệ thống"**.
    - Áp dụng `children` cho Bảo trì và Danh mục như phương án A.
- **Số phân hệ:** 5.
- **Mục hiển thị cấp 1:** ~25 mục.
- **Cú bấm:** 2 click cho các mục con, 1 click cho các mục chính.
- **Ai khó chịu:** Những người đang quen với việc "Dự án" nằm riêng biệt ở Rail.

### Phương án C — Mạnh (Tách biệt Vận hành & Quản trị)
Menu chính chỉ dành cho công việc chuyên môn hằng ngày.
- **Thay đổi:**
    - Đưa toàn bộ "Danh mục" và các mục tra cứu/báo cáo ít dùng vào một lối vào riêng (ví dụ nút "Dữ liệu gốc" ở góc dưới).
    - Phân hệ chính chỉ còn: Vận hành, Sổ lý lịch (đã gộp bảo trì), Dự án.
- **Số phân hệ:** 4 phân hệ chính + 1 vùng Quản trị riêng.
- **Mục hiển thị cấp 1:** < 20 mục.
- **Cú bấm:** 1 click cho việc hằng ngày, 2-3 click cho việc thiết lập hệ thống.
- **Ai khó chịu:** Người quản trị hệ thống vì các mục cấu hình bị giấu sâu hơn.

---

## 3. Phân tích giá trị và rủi ro

| Tiêu chí | Hiện tại | Sau khi gộp (B) | Cái giá phải trả |
| :--- | :--- | :--- | :--- |
| Độ nhiễu | Cao (52 mục) | Thấp (~25 mục) | Menu đa tầng khó quét mắt hơn |
| Rail icons | 7 icons | 5 icons | Các icon gộp có thể kém trực quan hơn |
| Tốc độ truy cập | 1 click | 1-2 click | Tăng tải nhận thức khi tìm mục con |

---

## 4. Kế hoạch triển khai (Giai đoạn 2 - Đang chờ duyệt)

1. **Sidebar.tsx:** Cập nhật để hỗ trợ `children` (hiển thị Collapsible).
2. **State:** Khôi phục `openNav` (sử dụng localStorage) để ghi nhớ trạng thái đóng/mở của các mục cha.
3. **Logic Active:** Khi truy cập route con, mục cha phải tự động mở và sáng đèn.
4. **Nav Config:** Cấu trúc lại `workspaces` trong `nav-contract.ts` theo phương án được chọn.

**DỪNG LẠI CHỜ CHỦ DỰ ÁN CHỌN PHƯƠNG ÁN (A, B, hoặc C).**
