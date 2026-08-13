# Kế hoạch Nâng cấp Hệ thống Độ rộng Bảng — MIRATS 2.0

## BỐI CẢNH
Hệ thống `StandardTable` hiện tại dùng Regex để parse `minW` từ chuỗi Tailwind (ví dụ `min-w-[150px]`). Cách tiếp cận này giòn, khó mở rộng cho các chế độ bố cục (layout modes) và không hỗ trợ tự căn độ rộng (auto-fit) thực sự theo nội dung.

## MỤC TIÊU
1. **Chuyển đổi sang số pixel**: Định nghĩa độ rộng rõ ràng (width, minWidth, maxWidth) thay vì chuỗi class.
2. **Ba chế độ bố cục**: Vừa khung (Fluid), Theo nội dung (Auto-fit), Tuỳ chỉnh (Custom).
3. **Tự căn THẬT**: Đo đạc nội dung thực tế (mẫu 50 dòng) để tối ưu không gian.
4. **Cải tiến HTML**: Dùng `<colgroup>` để đảm bảo Header và Body luôn đồng bộ tuyệt đối.

## KIỂM TOÁN HIỆN TRẠNG (5 Bảng lớn nhất)

| Bảng | tableKey | Cột tiêu biểu | minW hiện tại | Độ rộng thực tế (Ước tính) | Đề xuất |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Danh mục thiết bị | `danh-muc-thiet-bi` | Tên thiết bị | `min-w-[200px]` | ~250px | `minWidth: 200, width: 280` |
| Nhật ký sự cố | `su_co_nhat_ky_list` | Mô tả sự cố | `min-w-[300px]` | ~400px | `minWidth: 300, grow: 1` |
| Danh mục Model | `catalog:dm_model` | Tên Model | `min-w-[180px]` | ~200px | `minWidth: 180` |
| Thành phần thiết bị | `thanh_phan_table` | Mã tài sản | `min-w-[120px]` | ~140px | `minWidth: 120` |
| Bảo trì định kỳ | `bao_tri_phieu_list` | Tên công việc | `min-w-[250px]` | ~300px | `minWidth: 250` |

## THAY ĐỔI CẤU TRÚC DỮ LIỆU (StdColumn)

```typescript
export interface StdColumn<T> {
  // --- GIỮ NGUYÊN ---
  key: string;
  label: string;
  minW?: string; // Giữ để tương thích ngược (deprecated)
  // ... các prop khác ...

  // --- BỔ SUNG MỚI ---
  width?: number;      // Độ rộng cố định/mặc định (px)
  minWidth?: number;   // Độ rộng tối thiểu (px)
  maxWidth?: number;   // Độ rộng tối đa (px)
  grow?: number;       // Tỉ lệ giãn nở (mặc định 0 cho Auto-fit, 1 cho Fluid)
}
```

## CHIẾN LƯỢC TRIỂN KHAI

### 1. Di trú và Tương thích ngược
- Logic render sẽ ưu tiên `minWidth` (số). Nếu không có, sẽ parse từ `minW` (chuỗi).
- Nếu cả hai đều không có, fallback về `100px`.
- Không yêu cầu sửa 29 call site ngay lập tức; các call site mới sẽ dùng dạng số.

### 2. Thuật toán Tự căn (Auto-fit)
- Khi nhấn nút "Tự căn":
  1. Lấy mẫu 50 dòng đầu tiên + các dòng đang hiển thị (virtual rows).
  2. Dùng một Canvas ẩn hoặc phần tử ẩn để `measureText` nhãn tiêu đề và nội dung ô.
  3. Cộng thêm padding (thường là 24-32px).
  4. Giới hạn kết quả trong khoảng `minWidth` và `maxWidth` của cột.
  5. Lưu kết quả vào `setWidth` của `useColumnPrefs`.

### 3. Quản lý Chế độ Bố cục (Layout Modes)
Bổ sung `layoutMode` vào `ColumnPrefs` trong `use-column-prefs.ts`:
- **Fluid (Vừa khung)**: `table-fixed w-full`. Cột có `grow > 0` sẽ nhận phần dư.
- **Auto (Theo nội dung)**: `table-auto w-max`. Xuất hiện cuộn ngang nếu tổng độ rộng > khung.
- **Custom (Tuỳ chỉnh)**: Dùng độ rộng người dùng đã kéo (giữ hành vi hiện tại).

### 4. Xử lý HTML `<colgroup>`
- Thay thế việc đặt `style={{ width, minWidth }}` trực tiếp trên `TableHead` và `TableCell`.
- Render một khối `<colgroup>` ngay sau thẻ `<table>`. Điều này đảm bảo khi trình duyệt tính toán độ rộng cột, Header và Body luôn thẳng hàng 100%.

## KẾ HOẠCH CHI TIẾT THEO FILE

### Lớp 1: Cấu trúc (src/components/mirats/StandardTable.tsx)
- Bổ sung interface props và định nghĩa cột.
- Triển khai component `TableColGroup`.
- Logic tính toán `currentWidth` mới: `savedW || width || parse(minW) || 100`.

### Lớp 2: Logic đo đạc (src/lib/mirats/ui/table-geometry.ts - file mới)
- Hàm `calculateOptimalWidths(rows, columns, font)`: tách logic tính toán ra khỏi UI để dễ test.

### Lớp 3: Lưu trữ (src/lib/mirats/use-column-prefs.ts)
- Bổ sung `layoutMode` vào schema `ColumnPrefs`.
- Hàm `setLayoutMode(mode)` để chuyển đổi giữa 3 chế độ.

## DANH SÁCH TEST CẦN BỔ SUNG
1. **Test Parser**: Kiểm tra parse `minW` chuỗi sang số chính xác cho nhiều định dạng `min-w-[...]`.
2. **Test Layout Mode**: Kiểm tra class `w-full table-fixed` vs `w-max table-auto` khi đổi mode.
3. **Test ColGroup**: Đảm bảo số lượng `<col>` trong `<colgroup>` khớp với số cột đang hiển thị.
4. **Test Persistence**: Đảm bảo `layoutMode` được lưu và khôi phục đúng từ Supabase.

## RỦI RO VÀ PHƯƠNG ÁN GIẢM THIỂU
- **Hiệu năng**: Việc đo đạc nội dung chỉ chạy một lần khi nhấn nút "Tự căn", không chạy liên tục khi cuộn.
- **Giao diện**: Khi tổng độ rộng cột nhỏ hơn khung ở chế độ Auto, bảng sẽ tự động giãn cột cuối cùng hoặc cột có `grow` cao nhất để lấp đầy (nếu dùng `w-full`).
