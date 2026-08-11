# Plan: Asset Role Differentiation (Task T45)

I have audited the database and current source code to design a robust way to differentiate between System Assets, Tools & Equipment (CCDC), and Spare Parts.

## Giai đoạn 1: Báo cáo kết quả khảo sát

### 1. Thống kê dữ liệu thực tế (Bước 1)

| Tiêu chí | Số lượng | Ghi chú |
| :--- | :--- | :--- |
| Tổng số tài sản (`thiet_bi`) | **832** | |
| Tài sản ĐANG lắp (`gan_chuc_nang` chưa đóng) | **831** | Gần như toàn bộ đã được gán vị trí |
| Có `he_thong_id` nhưng CHƯA lắp | **2** | |
| `he_thong_id` để trống | **3** | Nhóm đáng ngờ nhất |
| Tài sản là linh kiện (`la_linh_kien = true`) | **0** | Hiện chưa sử dụng cờ này |
| Tài sản ở trạng thái `san_sang` | **832** | Tất cả đều đang 'sẵn sàng' |

**Trạng thái cấp phát:** Toàn bộ 832 tài sản đều đang ở trạng thái `san_sang`.

### 2. Kết luận nhóm không có hệ thống (Bước 2)

Danh sách 3 tài sản có `he_thong_id` trống:
1. `TB_5XH671XN` - Recorder Audio Box (Loại: Audio Box)
2. `TB_4QTPLAJH` - TEST QA 1784332423 (Loại: Trống)
3. `TB_SPH65VB2` - Thiết bị Serial to Ethernet (Loại: Truyền dẫn và thiết bị trung gian)

**Kết luận:** Dữ liệu hiện tại chủ yếu là tài sản hệ thống. Nhóm trống hệ thống là do nhập liệu chưa xong hoặc dữ liệu test, chưa thấy sự hiện diện rõ rệt của CCDC (máy tính cá nhân, thiết bị đo rời).

### 3. Khả năng suy luận từ chủng loại (Bước 3)

- **Suy luận được:** Các chủng loại như "Máy thu VHF", "Máy phát VHF", "VCCS", "AWOS" chắc chắn là **Tài sản hệ thống**.
- **Không suy luận được:** "Cấp nguồn", "Chống sét", "Truyền dẫn" có thể là tài sản hệ thống (lắp trong tủ) hoặc CCDC/vật tư dự phòng tùy mục đích sử dụng.
- **Hiện trạng:** Cờ `la_may_tinh` trong `dm_loai_thiet_bi` đang để `false` toàn bộ, nên chưa dùng để lọc CCDC tự động được.

### 4. Hiện trạng phân loại (Bước 4)

Có sự chồng chéo giữa 3 nguồn:
- `thiet_bi.phan_loai` (text): 609 dòng có dữ liệu (ví dụ: "Truyền dẫn", "Cảm biến"). Chứa thông tin về đặc tính kỹ thuật.
- `thiet_bi.phan_loai_id` (FK): 829 dòng đã ánh xạ sang Nhóm 1/2/3. Đây là nguồn tin cậy nhất về mức độ quan trọng.
- `src/lib/mirats/phan-loai.ts`: Chứa danh mục cứng Nhóm 1/2/3 và logic phân loại dựa trên mã hệ thống.

**Nhận xét:** `phan_loai_id` đang được dùng để quản lý mức độ quan trọng (Nhóm 1/2/3), không phải vai trò (Hệ thống/CCDC).

### 5. Thiết kế đề xuất (Bước 5)

Tôi đề xuất tách bạch hai khái niệm: **Bản chất (Vai trò)** và **Trạng thái (Vị trí)**.

#### Câu A: Đây là loại tài sản gì? (Vai trò - Role)
Thêm cột mới vào bảng `public.thiet_bi`:
- **Tên cột:** `vai_tro`
- **Kiểu dữ liệu:** `text`
- **Ràng buộc:** `CHECK (vai_tro IN ('he_thong', 'ccdc', 'vat_tu'))`
- **Giá trị mặc định:** `'he_thong'` (phù hợp với 99% dữ liệu hiện tại).
- **Gán dữ liệu:** Chạy script gán `'he_thong'` cho toàn bộ 832 dòng hiện có.

#### Câu B: Nó đang ở đâu/làm gì? (Vị trí - Location/State)
**KHÔNG lưu thành cột.** Tính toán động (Computed State) trong View hoặc Logic Frontend:
- **Đang lắp:** Có dòng `gan_chuc_nang` chưa đóng (`den_ngay IS NULL`).
- **Trong kho:** Không có dòng `gan_chuc_nang` active và không có `thiet_bi_cap_phat` active.
- **Đang cấp phát (cho mượn):** Có dòng `thiet_bi_cap_phat` chưa trả.

### 6. Quy tắc mới (Bước 6)

Khi có cột `vai_tro`, ta sẽ áp dụng các quy tắc sau:
1. **Chặn lắp CCDC vào hệ thống:** Cấm tạo `gan_chuc_nang` cho tài sản có `vai_tro = 'ccdc'`. (Chặn được 0 lỗi hiện tại vì chưa có CCDC, nhưng ngăn lỗi tương lai).
2. **Lọc cảnh báo giấy phép:** Chỉ kiểm tra thiếu giấy phép khai thác cho tài sản `vai_tro = 'he_thong'` và `phan_loai_id` là Nhóm 1.
3. **Quản lý vật tư:** Tài sản `vai_tro = 'vat_tu'` sẽ được ưu tiên hiển thị trong các module quản lý kho, thay vì hiện trong cây hệ thống.

## Giai đoạn 2: Triển khai (Đã được duyệt)

### 1. Migration CSDL
- Tạo file migration:
  - Thêm cột `vai_tro` vào `thiet_bi`.
  - Thêm `CHECK` constraint.
  - Gán giá trị mặc định `'he_thong'`.
  - Cập nhật toàn bộ dữ liệu hiện có thành `'he_thong'`.
  - Cập nhật GRANT trên bảng `thiet_bi`.

### 2. Cập nhật mã nguồn
- Cập nhật `src/integrations/supabase/types.ts` (nếu cần thiết, hoặc chờ hệ thống tự gen).
- Cập nhật các component hiển thị chi tiết tài sản để hiển thị/chỉnh sửa `vai_tro`.
- Cập nhật logic lọc cảnh báo giấy phép.
- Cập nhật logic tạo `gan_chuc_nang` để kiểm tra `vai_tro`.

