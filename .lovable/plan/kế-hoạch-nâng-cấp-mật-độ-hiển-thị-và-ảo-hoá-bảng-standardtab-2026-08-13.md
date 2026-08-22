# Kế hoạch nâng cấp Mật độ hiển thị và Ảo hoá bảng (StandardTable)

Bối cảnh: Dự án đang có hệ thống `useDensity` nhưng chưa được áp dụng vào `StandardTable`. Bảng hiện dùng ảo hoá với chiều cao dòng cố định (ước lượng), chưa tối ưu cho nội dung xuống dòng hoặc các mức mật độ khác nhau.

## Mục tiêu

1. Mở rộng `Density` lên 3 mức: Gọn (32px), Vừa (40px), Thoáng (48px).
2. Kết nối `StandardTable` với hệ thống mật độ toàn cục.
3. Tối ưu ảo hoá: `estimateSize` chính xác theo mật độ và đo động cho các ô có `lineClamp > 1`.
4. Cải thiện cách tính chiều cao vùng cuộn (vùng chứa bảng).

## Các thay đổi chính

### 1. Hệ thống Mật độ (Density System)

- **File:** `src/components/mirats/DensityToggle.tsx`
  - Cập nhật type `Density`: `"compact" | "comfortable" | "spacious"`.
  - Cập nhật `DensityToggle` để xoay vòng qua 3 mức.
  - Áp dụng `data-density` tương ứng: `compact`, `comfortable`, `spacious`.
- **File:** `src/lib/mirats/ui/ui-density.ts`
  - Thêm các hằng số token cho 3 mức mật độ (Padding, Font size).
- **File:** `src/routes/_app.cai-dat.tai-khoan.tsx`
  - Thêm lựa chọn thứ 3 cho người dùng trong trang cài đặt.

### 2. Nâng cấp StandardTable.tsx

- **Tích hợp `useDensity`**: Lấy mức mật độ hiện tại để tính toán `estimatedRowHeight`.
- **Logic ảo hoá**:
  - `estimateSize`: Trả về 32, 40 hoặc 48 tuỳ theo mật độ.
  - `measureElement`: Giữ nguyên việc gắn ref vào `TableRow`, đảm bảo `rowVirtualizer.measure()` được gọi khi mật độ thay đổi hoặc cột thay đổi.
  - **Đo động**: Kích hoạt đo động tự động khi phát hiện có cột dùng `lineClamp > 1` hoặc `cell` tùy chỉnh.
- **Bố cục & CSS**:
  - Sử dụng CSS Variable hoặc Tailwind utility class theo `data-density` để kiểm soát padding và font-size của `TableCell`.
  - Cải thiện `maxHeightClass`: Chuyển sang dùng flex-1 hoặc tính toán không gian còn lại bằng `calc(100vh - header_height - footer_height)` thay vì các con số hard-coded nếu có thể.

## Bảng quyết định mật độ

| Mức mật độ            | Chiều cao dòng (Ước lượng) | Padding ô     | Cỡ chữ        | Số dòng hiển thị (khung 600px) |
| :-------------------- | :------------------------- | :------------ | :------------ | :----------------------------- |
| **Gọn (Compact)**     | 32px                       | `px-2 py-1`   | `text-[12px]` | ~18 dòng                       |
| **Vừa (Comfortable)** | 40px                       | `px-3 py-1.5` | `text-[13px]` | ~15 dòng                       |
| **Thoáng (Spacious)** | 48px                       | `px-4 py-2`   | `text-[14px]` | ~12 dòng                       |

## Đặc tả kỹ thuật & Rủi ro

### Cách tính chiều cao vùng cuộn

- Ưu tiên dùng `flex-1 min-h-0` cho container của bảng trong các trang có bố cục cố định.
- Với `max-h`, sử dụng `UI_DENSITY.TABLE_MAX_H` đã được cập nhật để phản ánh đúng khoảng trống cần trừ đi cho Header (48px) và Bottom Nav.

### Hiệu năng (Performance)

- **Ngưỡng đo động**: Chỉ gọi `measureElement` cho các dòng đang hiển thị (mặc định của TanStack Virtual).
- **Kiểm chứng**:
  - Render đầu: Mục tiêu < 100ms cho 1000 dòng.
  - Cuộn: Duy trì 60fps bằng cách giữ `overscan` ở mức 10-15.

### Rủi ro & Cách khắc phục

- **Rủi ro**: Thay đổi `estimateSize` đột ngột khi cuộn gây "nhảy" vị trí cuộn.
  - **Khắc phục**: Gọi `rowVirtualizer.measure()` ngay khi state `density` thay đổi.
- **Rủi ro**: Sticky headers bị lệch khi chiều cao dòng thay đổi động.
  - **Khắc phục**: Đảm bảo Header luôn có chiều cao cố định hoặc dùng `z-index` và `sticky` chuẩn của Tailwind.

## Danh sách file sửa đổi

1. `src/components/mirats/DensityToggle.tsx`: Mở rộng logic 3 mức.
2. `src/lib/mirats/ui/ui-density.ts`: Cập nhật hằng số token.
3. `src/components/mirats/StandardTable.tsx`: Tích hợp mật độ vào ảo hoá.
4. `src/routes/_app.cai-dat.tai-khoan.tsx`: Cập nhật UI cài đặt.
5. `src/styles.css`: (Nếu cần) Thêm các CSS variables cho mật độ.
