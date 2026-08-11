---
name: "Task T41 - Model Hover Card"
description: "Implementation of hover cards for the Model column in the asset table (ThanhPhanTable.tsx) using the shared EntityHoverCard system."
type: feature
---

# T41 - Kế hoạch triển khai Thẻ thông tin Model (Hover Card)

## Giai đoạn 1: Báo cáo khảo sát & Đề xuất (Đã hoàn thành)

### 1. Ẩn số `model_id` (Bước 1)
- **Hiện trạng:** `TaiSanRow` và `ThanhPhanRow` có trường `model` (tên) và `modelId` (null). 
- **Truy vấn:** 
  - `rpc_tai_san_toan_cuc` và `rpc_thanh_phan_toan_cuc` trả về tên model trực tiếp.
  - Cần bổ sung `model_id` vào JSONB trả về của 2 RPC này.
- **Ước lượng:** Cần 1 migration SQL để cập nhật RPC. Việc này rất quan trọng để đảm bảo tra cứu chính xác theo khóa ngoại thay vì tên.

### 2. Sổ đăng ký Display Registry (Bước 2)
- **Hiện trạng:** `dm_model` ĐÃ CÓ trong `EntityLoai` (src/lib/mirats/display/types.ts) và đã được đăng ký trong `src/lib/mirats/display/registry.ts`.
- **Cần thêm:** Đảm bảo `DetailDrawer.tsx` cũng hỗ trợ `dm_model` (đã ánh xạ vào domain `danh_muc`).

### 3. Các trường hiển thị đề xuất (Bước 3)
Dựa trên bảng `dm_model`, đề xuất các trường hiện trên thẻ kèm điểm hữu ích (1-5):
1. **Hình ảnh (hinh_anh):** 5/5 (Nhận diện nhanh nhất).
2. **Số model (so_model):** 5/5 (Thông số kỹ thuật chính).
3. **P/N (p_n):** 5/5 (Tra cứu linh kiện).
4. **Nhà sản xuất (nha_san_xuat):** 4/5.
5. **Chủng loại (loai_thiet_bi):** 4/5.
6. **Mô tả (mo_ta):** 3/5 (Chỉ hiện nếu ngắn hoặc line-clamp).

*Ghi chú:* Đặc tính và Tài liệu kỹ thuật sẽ không đưa vào hover card để tránh quá tải thông tin, người dùng có thể bấm "Xem chi tiết" để xem các mục này.

### 4. Xử lý ModelUsageHoverCard (Bước 4)
- **Hiện trạng:** `ModelUsageHoverCard` hiện danh sách tài sản đang dùng mẫu đó.
- **Đề xuất:** 
  - Gộp logic: `EntityHoverCard` sẽ là khung chuẩn. 
  - Phần "Danh sách tài sản đang dùng" sẽ được chuyển thành một tab hoặc một khối "Chi tiết bổ sung" trong `EntityHoverCard` khi `loai === 'dm_model'`.
  - Tuy nhiên, để đúng yêu cầu "liếc nhanh", giai đoạn này sẽ ưu tiên hiện thông số model trước.

### 5. Bài toán hiệu năng (Bước 5)
- **Số liệu:** Có **293** model đang hoạt động.
- **Giải pháp:** Tải TOÀN BỘ danh mục model (chỉ lấy các trường cần thiết) một lần khi mở trang `ThanhPhanTable` và lưu vào cache của TanStack Query (`staleTime: 5 mins`). 
- Với 293 bản ghi, dung lượng JSON ước tính < 100KB, hoàn toàn phù hợp để giữ trong bộ nhớ client, giúp việc rê chuột hiển thị tức thì (0ms latency).

### 6. Màn hình cảm ứng (Bước 10)
- **Xử lý:** Trên thiết bị di động, bảng thường chuyển sang dạng card. Thao tác rê chuột không tồn tại.
- **Đề xuất:** Cho phép bấm vào tên Model để mở `DetailDrawer` (Drawer chi tiết) thay vì hover card. `DetailDrawer` đã dùng chung registry nên nội dung sẽ đồng nhất.

---

## Giai đoạn 2: Triển khai kỹ thuật

### 1. Database (Migration)
- Cập nhật `rpc_tai_san_toan_cuc` và `rpc_thanh_phan_toan_cuc` để trả thêm `modelId`.

### 2. Cập nhật Registry
- Bổ sung/tinh chỉnh `dm_model` view trong `registry.ts` để tối ưu các trường highlight.

### 3. Cập nhật UI (ThanhPhanTable.tsx)
- Tạo component `ModelCell` để bọc `EntityHoverCard`.
- Sử dụng hook `useQuery` để lấy danh mục model làm từ điển tra cứu tại client.
- Thay thế hiển thị văn bản thuần bằng `ModelCell`.

### 4. Hoàn thiện EntityHoverCard.tsx
- Thêm đường dẫn "Xem model này trong danh mục".
- Tích hợp `ModelThumb` để hiện ảnh.
