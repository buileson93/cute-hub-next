# Kế hoạch T44 — Kết nối Kho và Tài sản

## Xác minh hiện trạng (Giai đoạn 1)

Dựa trên dữ liệu thực tế và cấu trúc CSDL trong `supabase/dump/schema.sql`:

1.  **Xác minh 4 điều kiện tiền đề:**
    *   **ĐÚNG:** Bảng `vat_tu` có `model_id` nhưng không có cột trỏ sang `thiet_bi`.
    *   **ĐÚNG:** Bảng `kho` và `kho_giao_dich` chỉ làm việc với `vat_tu_id`, không tham chiếu `thiet_bi`.
    *   **ĐÚNG:** Cột `thiet_bi.vat_tu_du_phong` là kiểu `text` (chữ tự do).
    *   **ĐÚNG:** Cột `hong_hoc.vat_tu_su_dung` là `text[]` (mảng chữ), trong khi `kho_giao_dich` dùng `lien_ket_hong_hoc_id` (UUID).

2.  **Số liệu thực tế (Bước 1):**
    *   Số dòng `vat_tu`: **1** (dữ liệu test: `RLSTEST Vat tu`), `model_id` là NULL.
    *   Số tài sản (`thiet_bi`) có `vat_tu_du_phong` khác rỗng: **0**.
    *   Số dòng `hong_hoc`: **0** (không có hỏng hóc nào được ghi nhận).
    *   Số dòng `kho_giao_dich` có `lien_ket_hong_hoc_id` khác rỗng: **0**.
    *   *Nhận xét:* Hệ thống hiện tại có 832 tài sản nhưng sổ kho gần như trống rỗng (chỉ có 2 giao dịch test). Người dùng chưa có thói quen nhập liệu vào sổ kho.

3.  **Dữ liệu cũ (Bước 2):**
    *   Do số dòng có `vat_tu_du_phong` là 0, không có dữ liệu chữ cũ để phân tích. Tuy nhiên, cấu trúc `text` cho thấy đây là ghi chú tự do, khó có thể tự động chuyển đổi sang bảng `vat_tu` mà không có sự can thiệp của con người.

4.  **Phản biện kiến trúc (Bước 3):**
    *   **Bảng `vat_tu.loai`:** Có 2 giá trị `DU_PHONG` và `TIEU_HAO`. Hiện tại nó đang được dùng để phân biệt vật tư dự phòng (có thể thay thế) và vật tư tiêu hao (dùng là hết).
    *   **Đề xuất "Vật tư theo dõi từng cái" là `thiet_bi` với `vai_tro = 'vat_tu'`:**
        *   **ĐƯỢC:** Tận dụng được toàn bộ hạ tầng của `thiet_bi`: số series, lịch sử bảo trì, giấy phép, vòng đời. Khi lắp lên máy (`gan_chuc_nang`), không cần tạo bản ghi mới, chỉ cần đổi trạng thái/vị trí.
        *   **MẤT:** Làm phức tạp bảng `thiet_bi` nếu số lượng vật tư nhỏ (ốc, vít, cáp) quá lớn. Tuy nhiên, ốc vít nên thuộc loại "vật tư tiêu hao" (số lượng), không cần theo dõi từng cái.
        *   **TRƯỜNG HỢP HỎNG:** Khi một vật tư có số hiệu (serial) nhưng lại được nhập vào kho dưới dạng số lượng (ví dụ: nhập 10 cái Card nhưng không ghi serial từng cái). Lúc này sổ kho sẽ không khớp với danh sách tài sản.
    *   **Kết luận:** Đồng ý với đề xuất. Những vật tư "đắt tiền" hoặc cần theo dõi vòng đời (có Serial Number) nên là `thiet_bi` (vai trò `vat_tu`). Những thứ đếm theo số lượng (ốc, vít, mỡ) thì ở lại bảng `vat_tu`.

5.  **Giải pháp "Khung nhìn mới" (Bước 4):**
    *   **Giả thuyết:** "Chỉ cần khung nhìn mới, không cần cột mới" là **ĐÚNG MỘT PHẦN**.
    *   Cả `thiet_bi` và `vat_tu` đều có `model_id`.
    *   (1) *Còn mấy cái thay thế?*: `SELECT count(*) FROM thiet_bi WHERE model_id = ... AND vai_tro = 'vat_tu' AND ...` cộng với `SELECT sum(so_luong) FROM view_ton_kho WHERE model_id = ...`.
    *   (2) *Dùng cho tài sản nào?*: Truy vấn ngược từ `model_id` sang các `thiet_bi` (đang ở trạng thái lắp) có cùng `model_id`.
    *   (3) *Thay khi nào, từ kho nào?*: Cần nối `thiet_bi.id` hoặc `model_id` với `kho_giao_dich`. Hiện tại `kho_giao_dich` chưa có link này cho loại vật tư là `thiet_bi`.
    *   **Đề xuất:** Tạo một `VIEW` tổng hợp tồn kho theo `model_id`, gộp cả dữ liệu từ `vat_tu` (số lượng) và `thiet_bi` (danh sách serial).

6.  **Xử lý cột cũ (Bước 5):**
    *   Giữ nguyên `vat_tu_du_phong` và `vat_tu_su_dung` để bảo tồn lịch sử. Trong UI, các trường này sẽ được ẩn hoặc để ở chế độ "Read-only" đối với dữ liệu cũ, thay thế bằng các UI Picker chọn từ danh sách `model` hoặc `thiet_bi`.

## Giai đoạn 2 — Thực thi (Chờ duyệt)

*   Sẽ cập nhật chi tiết sau khi Giai đoạn 1 được duyệt.

---
*Dừng lại tại đây để chờ duyệt bằng văn bản.*
