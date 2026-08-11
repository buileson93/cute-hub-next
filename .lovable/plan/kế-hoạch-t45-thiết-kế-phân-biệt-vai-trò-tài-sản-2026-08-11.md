# Kế hoạch T45: Thiết kế phân biệt Vai trò tài sản

## 1. Báo cáo hiện trạng (Bước 1-4)

### Bước 1: Thống kê dữ liệu thực tế
| Tiêu chí | Số lượng |
| :--- | :--- |
| Tổng số tài sản (`thiet_bi`) | 832 |
| Tài sản ĐANG lắp (`gan_chuc_nang` chưa đóng) | 827 |
| Có `he_thong_id` nhưng CHƯA lắp | 2 |
| `he_thong_id` trống | 3 |
| Tài sản là linh kiện (`la_linh_kien = true`) | 0 |
| Trạng thái cấp phát: `san_sang` | 832 |

**Nhận xét:** Đa số tài sản (99.4%) đã được lắp vào vị trí. Nhóm "đáng ngờ" (có hệ thống nhưng chưa lắp) chỉ có 2 dòng.

### Bước 2: Kiểm tra nhóm không có hệ thống
Chỉ có 3 tài sản trống `he_thong_id`:
1. `TB_5XH671XN` - Recorder Audio Box (Audio Box)
2. `TB_4QTPLAJH` - TEST QA 1784332423 (Rỗng loại)
3. `TB_SPH65VB2` - Thiết bị Serial to Ethernet (Truyền dẫn)

**Kết luận:** Dữ liệu này cho thấy các tài sản hiện tại hầu hết là tài sản hệ thống. Chưa thấy sự xuất hiện rõ rệt của Công cụ dụng cụ (CCDC) nhập liệu riêng biệt.

### Bước 3: Suy luận vai trò từ chủng loại
Dựa trên `dm_loai_thiet_bi`:
- **Suy luận được là CCDC:** Máy tính xách tay (có cột `la_may_tinh` trong `dm_loai_thiet_bi`), Handset/Headset, Loudspeaker.
- **Suy luận được là Tài sản hệ thống:** Máy thu/phát VHF, CWP, VCCS, AWOS, Radar...
- **Khó phân biệt:** Cấp nguồn, Chống sét, Truyền dẫn (có thể thuộc hệ thống hoặc là CCDC dùng chung).

### Bước 4: Kiểm tra tính nhất quán Phân loại
- `phan_loai` (text): 609 dòng (chứa dữ liệu hỗn hợp: "Nhóm 1", "Cắt lọc sét", "Truyền dẫn").
- `phan_loai_id` (FK): 829 dòng (Trỏ về N1/N2/N3).
- **Mâu thuẫn:** `phan_loai` đang bị dùng sai mục đích (nhét cả chủng loại vào). Nguồn tin cậy duy nhất về N1/N2/N3 hiện tại là `phan_loai_id`.

---

## 2. Đề xuất thiết kế (Bước 5)

### Câu A: Vai trò tài sản (Bản chất - Tĩnh)
Thêm cột mới vào bảng `public.thiet_bi`:
- **Tên cột:** `vai_tro`
- **Kiểu dữ liệu:** `text`
- **Ràng buộc (Constraint):** `CHECK (vai_tro IN ('he_thong', 'ccdc', 'vat_tu'))`
- **Giá trị mặc định:** `'he_thong'` (dựa trên dữ liệu hiện có).
- **Cách gán cho 828 dòng cũ:** 
  1. Mặc định tất cả là `he_thong`.
  2. Cập nhật thành `ccdc` cho các loại máy tính (`la_may_tinh = true`) hoặc các loại phụ kiện cầm tay.

### Câu B: Trạng thái vận hành (Vị trí - Động)
**Tuyệt đối không lưu thành cột.** Trạng thái này sẽ được tính toán (Computed/Virtual) thông qua Logic:
- `DANG_LAP`: Nếu có dòng `gan_chuc_nang` đang mở.
- `TRONG_KHO`: Nếu KHÔNG có dòng `gan_chuc_nang` đang mở VÀ `vai_tro = 'vat_tu'`.
- `DU_PHONG`: Nếu KHÔNG có dòng `gan_chuc_nang` đang mở VÀ `vai_tro = 'he_thong'`.
- `DANG_MUON`: Nếu có dòng `thiet_bi_cap_phat` chưa trả (áp dụng cho CCDC).

---

## 3. Quy tắc mới và Hiệu quả (Bước 6)

| Quy tắc | Tác dụng | Số ca chặn được |
| :--- | :--- | :--- |
| Chặn lắp CCDC vào thành phần hệ thống | Tránh sai lệch cây phân cấp kỹ thuật | ~10 (dự kiến) |
| Cảnh báo thiếu GPKT chỉ cho `vai_tro = 'he_thong'` | Giảm nhiễu thông báo cho máy tính, tai nghe | ~50 thông báo thừa |
| Tự động chuyển trạng thái `vat_tu` -> `he_thong` khi lắp | Đảm bảo vòng đời tài sản khép kín | Toàn bộ quy trình |

---
**DỪNG LẠI TẠI ĐÂY VÀ CHỜ DUYỆT.**
