# Kế hoạch dọn dẹp ENUM trùng trong migration (T4)

## 1. Mục tiêu
Gỡ bỏ phần thêm giá trị ENUM `change_request_loai` bị trùng và sai cách thức trong file migration `20260810041252_2d9d6b8e-da09-4cb6-a5b9-2de3df8a4be3.sql`. Việc thêm ENUM này đã được thực hiện đúng cách trong migration `20260810035917`.

## 2. Các bước triển khai

### Bước 1: Sửa file migration `20260810041252_...sql`
- Xóa bỏ khối `DO $$ ... END $$` (Phần 1: Thêm loại đề xuất mới).
- Thay thế bằng một dòng chú thích: `-- 1. Loại đề xuất mới đã được thêm bởi migration 20260810035917`.
- Giữ nguyên toàn bộ phần tạo bảng `nhiem_vu_nhap_lieu`, `dong_gop_diem`, Grants và RLS.

## 3. Kiểm tra (Xong khi)
- File `20260810041252_...sql` không còn chứa từ khóa `ALTER TYPE`.
- File vẫn giữ nguyên logic tạo 2 bảng mới (`nhiem_vu_nhap_lieu`, `dong_gop_diem`) cùng các quyền (Grants) và chính sách RLS.
- `npx tsc --noEmit` hoàn thành không có lỗi (đảm bảo không ảnh hưởng đến schema tổng thể).

## 4. Ghi chú về `dm.propose_new`
- Giá trị `'dm.propose_new'` đã được thêm vào ENUM bởi migration `035917`.
- Hiện tại hàm `approve_change_request` (migration `040009`) **chưa** có logic xử lý loại đề xuất này.
- **Vấn đề**: Nếu người dùng gửi đề xuất loại `dm.propose_new` và được admin duyệt, hàm sẽ ném lỗi `loai_not_supported` và cập nhật trạng thái đề xuất thành `applied_failed`.
- **Đề xuất xử lý (Dành cho task sau)**: Cần bổ sung nhánh `ELSIF v_row.loai = 'dm.propose_new'` vào hàm `approve_change_request`. Nhánh này nên thực hiện `INSERT` vào bảng danh mục tương ứng (được chỉ định trong payload) dựa trên thông tin đề xuất mới.
