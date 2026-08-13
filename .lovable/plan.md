# Kế hoạch Tinh gọn và Chuẩn hóa Bảng Thành phần Hệ thống

Kế hoạch này tập trung vào việc cải thiện hệ thống phân cấp thông tin (Information Hierarchy) cho `ThanhPhanTable.tsx`, giúp người dùng phân biệt rõ ràng giữa **Vai trò (Component)** và **Tài sản vật lý (Asset)**, đồng thời giảm tải thị giác mà không làm mất dữ liệu.

## 1. Lựa chọn định danh chính

-   **Định danh chính:** **Tên thành phần (`ten`)**.
-   **Lý do:** Trong vận hành kỹ thuật, người dùng thường tra cứu theo chức năng hoặc vị trí chức năng (ví dụ: "Bơm cao áp số 1", "Quạt thông gió hầm"). Mã kỹ thuật (`ma`) thường mang tính máy móc hoặc lịch sử, khó nhớ hơn tên chức năng.

## 2. Phân lớp thông tin (Layering)

Dòng dữ liệu sẽ được phân tách thành 3 lớp rõ rệt:

1.  **Lớp Thành phần (Vai trò - Role):** Chứa thông tin về "chỗ trống" trong hệ thống (`ten`, `ma`, `viTri`, `trangThai`).
2.  **Lớp Tài sản (Thực thể - Entity):** Chứa thông tin về thiết bị vật lý đang lắp vào chỗ đó (`thietBiTen`, `thietBiMa`, `serial`, `model`...). Đánh dấu là `inherited` (kế thừa).
3.  **Lớp Bối cảnh (Hệ thống - Context):** Chứa thông tin về vị trí trong cây thư mục (`heThong`, `nhomHeThong`, `phanLoai`).

## 3. Cấu trúc một dòng sau khi làm gọn

Một dòng (row) sẽ hiển thị tập trung như sau:

-   **Ô "Thành phần hệ thống" (Gộp):**
    -   Dòng 1: Tên thành phần (Bold, Primary text).
    -   Dòng 2: Mã thành phần (CodeBadge nhỏ, font monospace, mờ hơn để thể hiện tính phụ trợ).
-   **Ô "Tài sản đang lắp" (Gộp):**
    -   **Nếu đã lắp:**
        -   Dòng 1: Tên tài sản (Link màu primary, có gạch chân khi hover).
        -   Dòng 2: Mã tài sản (CodeBadge tiêu chuẩn) + MultiRoleBadge (nếu có).
    -   **Nếu chưa lắp:** Hiển thị một khung `Badge` nét đứt (dashed border) với icon `Unplug` và chữ "Trống" (màu Amber/Muted) để nhận diện ngay lập tức khi quét mắt.

## 4. Danh sách thay đổi Cột (Mapping Table)

| Cột hiện tại | Thuộc lớp | Thay đổi | Nơi xem lại nếu bị ẩn |
| :--- | :--- | :--- | :--- |
| **Thành phần hệ thống** (`ten`) | Thành phần | **Giữ (Ghim)**. Gộp thêm `ma` xuống dòng 2. | Luôn hiện. |
| **Mã thành phần** (`ma`) | Thành phần | **Chuyển thành phụ**. Gộp vào cột `ten`. | Cột `ten` hoặc Bảng "Đầy đủ". |
| **Hệ thống** | Bối cảnh | Giữ. | Cột `heThong`. |
| **Vị trí lắp đặt** (`viTri`) | Thành phần | Giữ. | Cột `viTri`. |
| **Trạng thái** | Thành phần | Giữ. | Cột `trangThai`. |
| **Tài sản đang lắp** (`thietBi`) | Tài sản | **Gộp**. `thietBiTen` + `thietBiMa` xuống dòng 2. | Luôn hiện (mặc định). |
| **20+ cột Inherited** | Tài sản | **Gán Group: "Tài sản"**. Đánh dấu `inherited: true`. | Nút "Cột hiển thị" > Nhóm "Tài sản". |

## 5. Danh sách nhãn cột đổi tên

| Nhãn cũ | Nhãn mới | Lý do |
| :--- | :--- | :--- |
| Thành phần hệ thống | **Thành phần & Mã** | Phản ánh đúng nội dung gộp. |
| Tài sản đang lắp | **Tài sản & Mã** | Phản ánh đúng nội dung gộp. |
| Vị trí lắp đặt | **Vị trí vật lý** | Phân biệt rõ với "Vị trí trong cây hệ thống". |
| Số thành phần đang gắn | **Đa vai trò** | Ngắn gọn, chuyên môn hơn (Multi-role). |

## 6. Rà soát quy tắc tìm kiếm

Hiện tại việc nối 17 trường (`join(" ")`) dễ gây khớp sai (ví dụ tìm năm `2024` ra model có số đó).
-   **Giải pháp:** Tinh gọn chuỗi `join` chỉ tập trung vào các định danh mạnh: `ma`, `ten`, `thietBiMa`, `thietBiTen`, `serial`, `pN`, `maTaiSanBravo`, `viTri`. Các trường thuộc tính như "Năm SX", "Ngày mua" sẽ loại bỏ khỏi chuỗi tìm kiếm chung để tránh nhiễu, người dùng có thể dùng bộ lọc cột (column filter) để tìm chính xác các trường này.

## Chi tiết kỹ thuật (dành cho lập trình viên)

-   Sử dụng thuộc tính `inherited: true` và `group: "Tài sản"` trong định nghĩa cột của `StandardTable`.
-   Cập nhật `THANH_PHAN_PRESETS` để phản ánh các cột đã gộp (loại bỏ `ma` và `thietBiMa` khỏi danh sách visible vì đã gộp).
-   Dùng component `Icon` từ `lucide-react` để bổ sung chỉ báo trực quan cho cột kế thừa (ví dụ icon `Package` nhỏ bên cạnh header cột kế thừa).
-   Trong `StandardTable`, logic `renderAutoCell` sẽ được nâng cấp để hỗ trợ hiển thị `inherited` marker nếu cần (tuy nhiên yêu cầu là dùng cơ chế sẵn có, nên ta sẽ tập trung vào style trong `ThanhPhanTable`).

---
*Ghi chú: Mọi thay đổi tuân thủ việc giữ nguyên khóa (`key`) để không làm hỏng cấu hình lưu trữ của người dùng.*
