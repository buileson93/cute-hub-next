# Kế hoạch T46 — Chuẩn hoá liên kết Tài sản trong các nghiệp vụ vận hành

## Bối cảnh
Các bảng nghiệp vụ (`su_co`, `bao_tri`, `hong_hoc`, `ban_giao`) hiện đang lưu thông tin tài sản qua cặp cột: một cột ID (có thể trống) và một cột Tên/Mã dạng văn bản (bắt buộc). Điều này dẫn đến nguy cơ dữ liệu không đồng nhất và khó thống kê độ tin cậy.

## Kết quả xác minh hiện trạng (Giai đoạn 1)

### 1. Thống kê dữ liệu
| Bảng | Tổng số dòng | Trống Asset ID | Trống System ID | Có thể khớp lại |
| :--- | :--- | :--- | :--- | :--- |
| `su_co` | 0 | 0 | 0 | 0 |
| `bao_tri` | 0 | 0 | 0 | 0 |
| `hong_hoc` | 0 | 0 | 0 | 0 |
| `ban_giao` | 0 | 0 | - | 0 |

*Ghi chú: CSDL hiện tại chưa có dữ liệu cho các bảng nghiệp vụ này, dù đã có 832 tài sản và 848 bản ghi lắp đặt.*

### 2. Kiểm tra mâu thuẫn (Asset vs Functional Position)
- **Số dòng mâu thuẫn:** 0 (do bảng trống).
- **Ý nghĩa:** Trong tương lai, việc kiểm tra này sẽ giúp phát hiện các sự cố ghi nhầm máy (máy ghi nhận hỏng tại vị trí A nhưng thực tế đang được lắp tại vị trí B).

### 3. Lộ trình triển khai (Đề xuất)

#### Nhịp 1: Chặn từ đầu nguồn (UI/UX)
- **Mục tiêu:** Không cho phép gõ tự do tên tài sản khi tạo mới. Phải chọn từ danh sách tài sản hợp lệ.
- **Các tệp cần sửa (~6 tệp):**
  - `src/components/mirats/quick/SuCoMoiForm.tsx`
  - `src/components/mirats/quick/HongHocMoiForm.tsx`
  - `src/components/mirats/quick/BaoTriMoiForm.tsx`
  - `src/routes/_app.ban-giao.moi.tsx`
  - Các component liên quan đến chỉnh sửa (Edit Dialog).
- **Hành vi:** Sử dụng `AssetPicker` lọc theo `he_thong_id` hoặc `thanh_phan_id` đã chọn.

#### Nhịp 2: Chuẩn hoá dữ liệu lịch sử
- **Mục tiêu:** Điền các ID còn thiếu dựa trên cột văn bản (`thiet_bi`, `thiet_bi_hong`).
- **Các tệp cần tạo (~1 tệp):**
  - Migration SQL chuẩn hoá dữ liệu.
- **Hành vi:** So khớp `ten_thiet_bi` hoặc `ma_thiet_bi`. Báo cáo các dòng không thể khớp tự động.

#### Nhịp 3: Siết chặt tầng CSDL
- **Mục tiêu:** Đảm bảo không bao giờ phát sinh dữ liệu "mồ côi" nữa.
- **Các tệp cần tạo (~1 tệp):**
  - Migration SQL thêm ràng buộc `NOT NULL` và `FOREIGN KEY` (REFERENCES `thiet_bi(id)`).
- **Điều kiện:** Chỉ thực hiện khi Nhịp 2 đã dọn sạch 100% dữ liệu lỗi.

## Các cột Snapshot
- **CAM KẾT:** Giữ nguyên các cột bắt đầu bằng `snapshot_` (ví dụ: `snapshot_ma_thiet_bi`, `snapshot_ten_thiet_bi`). Các cột này phục vụ mục đích pháp lý lưu trữ trạng thái tại thời điểm xảy ra sự việc.
