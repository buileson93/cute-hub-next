# Kế hoạch tinh gọn giao diện (Compact UI Audit & Plan)

Dựa trên kết quả kiểm toán mã nguồn hiện tại, giao diện đang sử dụng hỗn hợp giữa các token sơ khai và các class Tailwind hard-coded. Đặc biệt, "Compact Mode" đã có nền móng trong CSS nhưng chưa được áp dụng triệt để qua hệ thống token React.

## A. Bảng kiểm toán thành phần hiện tại

| Thành phần | File chính | Class hiện tại | Kích thước thực tế | Đề xuất giá trị gọn | Ảnh hưởng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **App Header** | `AppShell.tsx` | `h-14` | 56px | 48px (`h-12`) | Tăng diện tích dọc cho nội dung |
| **Sidebar Rail** | `AppShell.tsx` | `w-16` | 64px | 56px (`w-14`) | Tinh gọn thanh điều hướng chính |
| **Sub-sidebar** | `AppShell.tsx` | `w-60` | 240px | 220px | Mở rộng vùng làm việc ngang |
| **Sidebar Item** | `Sidebar.tsx` | `px-3 py-2 gap-3` | ~40px height | `px-2 py-1 gap-2` | Hiển thị được nhiều menu hơn |
| **Page Padding** | `ui-density.ts` | `p-4 md:p-6` | 24px | `p-3 md:p-4` | Giảm khoảng trắng bao quanh |
| **Card Content** | `Card.tsx` (UI) | `p-6` | 24px | `p-4` | Quan trọng nhất để giảm độ loãng |
| **Table Row** | `StandardTable.tsx` | `estimateSize: 48` | 48px | 36px | Tăng mật độ dữ liệu hàng |
| **Section Gap** | `ui-density.ts` | `gap-4` | 16px | `gap-3` | Gắn kết các khối dữ liệu |

## B. Danh sách class spacing hard-code (Cần chuyển sang Token)

Các class này xuất hiện phổ biến (>20 lần) và đang phá vỡ tính nhất quán khi muốn chuyển đổi mật độ:

1.  `p-6` và `px-6`: Thường dùng trong Card, Sheet, Dialog. (Xuất hiện nhiều nhất).
2.  `gap-4` và `gap-8`: Thường dùng trong layout lưới và Sidebar.
3.  `space-y-4` và `space-y-6`: Dùng trong các form và danh sách card.
4.  `rounded-2xl` (16px) và `rounded-xl` (12px): Cần đưa về biến `--radius`.

## C. Các điểm Padding cộng dồn (Double Padding)

Giao diện đang bị hiện tượng "whitespace chồng lấn" tại:
- **PageBody (`p-6`) + Card (`p-6`)**: Tổng cộng 48px lề trái/phải trước khi thấy chữ.
- **Dialog (`p-6`) + Form (`space-y-4`)**: Khoảng cách từ tiêu đề đến ô nhập liệu quá lớn.
- **StandardTable (`space-y-3`) + Toolbar (`px-1`)**: Gây lệch nhẹ so với nội dung bảng phía dưới.

## D. Đề xuất bộ Token mật độ mới (`ui-density.ts`)

```typescript
export const UI_DENSITY = {
  // Mode: Comfortable (Mặc định hiện tại)
  comfortable: {
    page_p: "p-4 md:p-6",
    section_g: "gap-4",
    card_p: "p-6",
    table_row_h: "48",
    font_base: "text-base",
    header_h: "h-14",
  },
  // Mode: Compact (Mục tiêu SnowUI)
  compact: {
    page_p: "p-3 md:p-4",
    section_g: "gap-3",
    card_p: "p-4",
    table_row_h: "36",
    font_base: "text-sm",
    header_h: "h-12",
  }
}
```

## E. Thành phần KHÔNG được thu nhỏ (Safe Zones)

Để đảm bảo khả dụng (Accessibility), các mục sau sẽ giữ nguyên kích thước:
1.  **Vùng chạm Mobile**: Các nút trong `MobileNav` giữ chiều cao tối thiểu 44px.
2.  **Ô nhập liệu (Height)**: Không giảm dưới 32px để đảm bảo dễ bấm và hiển thị font chữ tiếng Việt không bị cắt dấu (descenders).
3.  **Nút hành động chính (Primary Actions)**: Giữ kích thước `h-10` trong các form quan trọng để tránh bấm nhầm.

## F. Ước lượng hiệu quả (1440x900)

Sau khi áp dụng bộ token Compact:
- **Dữ liệu bảng**: Tăng từ ~12 hàng lên ~18 hàng hiển thị (tăng **50%**).
- **KPI Card**: Hiển thị được 5-6 card trên một hàng thay vì 4.
- **Dashboard**: Giảm được ~150px chiều dọc lãng phí từ header và padding, giúp thấy được biểu đồ ngay khi load trang mà không cần cuộn.

## Lộ trình thực hiện (Implementation Plan)

1.  **Phase 1**: Cập nhật `src/lib/mirats/ui/ui-density.ts` để hỗ trợ đa mật độ (Context hoặc CSS Variables).
2.  **Phase 2**: Thay thế các class hard-coded (`p-6`, `gap-4`) trong các component lõi (`PageBody`, `PageHeader`, `ActionBar`) bằng token.
3.  **Phase 3**: Chỉnh sửa `AppShell` và `Sidebar` để hỗ trợ co giãn theo biến môi trường.
4.  **Phase 4**: Tinh chỉnh CSS Global (`styles.css`) để ép các component shadcn (Button, Input) tuân thủ mật độ mới.
