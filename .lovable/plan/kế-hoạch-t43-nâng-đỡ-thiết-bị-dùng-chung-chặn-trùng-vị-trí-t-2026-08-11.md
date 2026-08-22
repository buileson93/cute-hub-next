# Kế hoạch T43 — Nâng đỡ thiết bị dùng chung (Chặn trùng vị trí tài sản)

Ngăn chặn tình trạng một tài sản vật lý (`thiet_bi`) được ghi nhận đang lắp ở hai vị trí chức năng (`gan_chuc_nang`) cùng một lúc bằng cách thắt chặt chỉ mục CSDL và cải thiện thông báo lỗi giao diện.

## Giai đoạn 1: Xác minh và Dọn dẹp dữ liệu (Chỉ đọc)

- **Bước 1: Xác minh chỉ mục hiện tại**
  - Đã xác minh qua `schema.sql`:
    - `uq_gcn_thanh_phan_active` (UNIQUE trên `thanh_phan_id` WHERE `den_ngay IS NULL`) -> ĐÚNG.
    - `idx_gan_chuc_nang_thiet_bi_open` (INDEX thường trên `thiet_bi_id` WHERE `den_ngay IS NULL`) -> ĐÚNG (chưa UNIQUE).
- **Bước 2: Kiểm tra dữ liệu bẩn**
  - Chạy truy vấn đếm tài sản đang lắp ở nhiều nơi.
  - Kết quả sơ bộ: Có **4 tài sản** đang bị trùng.
  - Danh sách chi tiết:
    - `TB_EK1WX2N0` (RA-7203): 2 vị trí (Máy thu ULTIMATE_BACKUP).
    - `TB_7BMBV5M5` (Bộ nguồn AC/DC): 2 vị trí (a2 test, Bộ nguồn AC/DC).
    - `TB_5TCXP7HD` (TA-7650 ULTIMATE_BACKUP): 2 vị trí (Máy phát ULTIMATE_BACKUP).
    - `TB_MVVSK3VP` (IC-A200): 2 vị trí (Máy thu phát ULTIMATE_BACKUP).
  - **DỪNG LẠI và báo cáo cho Chủ dự án** để quyết định đóng bản ghi nào trước khi tiến hành Giai đoạn 2.

- **Bước 3: Phân tích Trigger**
  - `trg_sync_thiet_bi_from_thanh_phan`: Cập nhật `vi_tri_id` và `don_vi_id` trên bảng `thiet_bi` theo thành phần đang lắp. Nếu lắp 2 nơi, cột này sẽ bị ghi đè lung tung theo dòng lắp cuối.
  - `validate_thiet_bi_he_thong_khi_lap`: Chỉ tự động gán `he_thong_id` cho thiết bị nếu nó đang trống. KHÔNG kiểm tra xem thiết bị đã bận ở đâu chưa.
  - Xác nhận: Cả hai trigger đều không chặn được lỗi trùng lặp.

## Giai đoạn 2: Củng cố CSDL (Khi dữ liệu bẩn = 0)

- **Bước 4: Tạo Migration mới**
  - Xóa `idx_gan_chuc_nang_thiet_bi_open`.
  - Tạo `uq_gcn_thiet_bi_active` mới là **UNIQUE INDEX** trên `thiet_bi_id` WHERE `den_ngay IS NULL`.
  - Đảm bảo script chạy lại được (idempotent).
- **Bước 5: Kiểm tra bảng `gan_linh_kien`**
  - Đã kiểm tra: Bảng này **ĐÃ CÓ** chỉ mục UNIQUE `uq_glk_linh_kien_active`. Không bị lỗi tương tự.

## Giai đoạn 3: Cải thiện Giao diện & Thông báo lỗi

- **Bước 6: Xử lý lỗi tại `ThanhPhanChiTietDialog.tsx`**
  - Cập nhật hàm `errMsg` hoặc logic bắt lỗi trong `doLap` / `doChuyen`.
  - Nếu gặp lỗi UNIQUE constraint từ Postgres, truy vấn ngược lại bảng `gan_chuc_nang` để tìm vị trí hiện tại của thiết bị đó.
  - Hiển thị thông báo: "Tài sản [Mã] đang được lắp tại vị trí [Tên thành phần]. Vui lòng tháo ra trước khi lắp vào đây."
- **Bước 7: Viết Test Case**
  - Tạo test scenario: Thử lắp 1 tài sản đã bận vào vị trí mới và kiểm tra xem có hiện đúng thông báo lỗi không.

## Chi tiết kỹ thuật

- Bảng mục tiêu: `public.gan_chuc_nang`.
- Migration: Sử dụng `DROP INDEX IF EXISTS` và `CREATE UNIQUE INDEX`.
- Frontend: Bổ sung logic xử lý ngoại lệ trong hook `useLapThietBi` và giao diện `ThanhPhanChiTietDialog`.
