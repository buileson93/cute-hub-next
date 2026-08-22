# Kế hoạch T41: Khôi phục EntityHoverCard cho cột Model

Khôi phục tính năng xem nhanh thông tin model (thẻ rê chuột) trong bảng tài sản `ThanhPhanTable.tsx` bằng cách sử dụng `EntityHoverCard.tsx`.

## Phân tích & Trả lời các ẩn số (Giai đoạn 1)

### 1. Ẩn số `model_id`

- **Tình trạng:** Hiện tại `rpc_tai_san_toan_cuc` và `rpc_thanh_phan_toan_cuc` **KHÔNG** trả về `model_id`. Chúng chỉ trả về `model` (tên text).
- **Hệ quả:** Nếu không có `model_id`, `EntityHoverCard` không thể lấy đúng dữ liệu từ registry hoặc cache mà phải dựa vào tên (sai nguyên tắc).
- **Đề xuất:** Cần sửa 2 hàm RPC trong database để bổ sung trường `modelId`.
  - Sửa `rpc_tai_san_toan_cuc`: Thêm `'modelId', tb.model_id` vào `jsonb_build_object`.
  - Sửa `rpc_thanh_phan_toan_cuc`: Thêm `'modelId', tb.model_id` vào `jsonb_build_object`.
- **Ước lượng công việc:** Thêm 1 turn để cập nhật SQL migration. Đây là điều kiện tiên quyết.

### 2. Sổ đăng ký `registry.ts`

- **Tình trạng:** Danh sách thực thể hiện tại (`EntityLoai`) **CHƯA** có `dm_model`.
- **Cách thêm:**
  - Thêm `"dm_model"` vào `EntityLoai` trong `types.ts`.
  - Định nghĩa cấu trúc hiển thị cho `dm_model` trong `R` của `registry.ts`.
  - Cần thêm `renderField` hỗ trợ ảnh (`hinh_anh`) hoặc xử lý ảnh riêng trong `EntityHoverCard`.

### 3. Các trường hiển thị đề xuất cho Model (Thang điểm 1-5)

- `ten`: Tên model (5) - Tiêu đề chính.
- `ma`: Mã nội bộ (3).
- `so_model`: Model Number (5) - Cực kỳ quan trọng để tra cứu.
- `p_n`: Part Number (5) - Cực kỳ quan trọng để đặt hàng/thay thế.
- `hinh_anh`: Ảnh minh họa (5) - Nhận diện nhanh.
- `nha_san_xuat`: NSX (4).
- `loai_thiet_bi`: Chủng loại (4).
- `mo_ta`: Mô tả (2) - Thường dài, cân nhắc cắt ngắn.

### 4. `ModelUsageHoverCard` vs `EntityHoverCard`

- `ModelUsageHoverCard` hiện tại đang dùng để hiện "Danh sách tài sản đang dùng model này" (ngược lại với yêu cầu hiện tại).
- **Đề xuất:** Dùng `EntityHoverCard` cho mục đích "Xem chi tiết model". Giữ `ModelUsageHoverCard` cho mục đích "Xem danh sách sử dụng" trong trang danh mục. Tuy nhiên, nếu muốn đồng nhất, có thể tích hợp danh sách sử dụng vào phần `chiTiet` của `EntityHoverCard` khi loai là `dm_model`.

### 5. Bài toán hiệu năng & Dữ liệu

- **Số liệu:** Danh mục model hiện có **293 bản ghi** (nhỏ).
- **Giải pháp:**
  - Tải toàn bộ danh mục model (`dm_model`) một lần khi vào trang `ThanhPhanTable` (hoặc dùng `useQuery` với `staleTime` dài).
  - Map `modelId` từ dòng bảng với cache danh mục để lấy object đầy đủ truyền vào `EntityHoverCard`.
  - Không fetch từng bản ghi khi rê chuột.

## Các bước thực hiện (Giai đoạn 2 - Sau khi được duyệt)

1. **Database:** Chạy migration bổ sung `modelId` vào 2 RPC liên quan.
2. **Registry:**
   - Cập nhật `types.ts` thêm `dm_model`.
   - Cập nhật `registry.ts` định nghĩa view cho `dm_model`.
3. **ThanhPhanTable.tsx:**
   - Cập nhật kiểu `TaiSanRow` và `ThanhPhanRow` thêm `modelId: string`.
   - Tạo hook/selector lấy danh sách model và map vào dòng bảng.
   - Bọc nội dung cột `model` bằng `EntityHoverCard`.
   - Sử dụng `ModelThumb` để hiện ảnh.
4. **Màn hình cảm ứng:** Trên mobile, bảng chuyển sang dạng Card, `EntityHoverCard` (dùng `hover-card` của shadcn) thường không kích hoạt tốt trên touch. Sẽ để người dùng click vào tên model để mở Drawer chi tiết (hành vi mặc định của hệ thống) thay vì hover card.

## Kiểm tra

- `npx tsc --noEmit`
- `npm run test`
