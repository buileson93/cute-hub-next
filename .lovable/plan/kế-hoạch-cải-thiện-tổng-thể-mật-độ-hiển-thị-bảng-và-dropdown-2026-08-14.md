---
name: Total Table Density Overhaul
description: Lập kế hoạch cải thiện tổng thể mật độ hiển thị bảng và dropdown để loại bỏ khoảng trắng thừa (whitespace optimization).
type: design
---

# Kế hoạch cải thiện tổng thể mật độ hiển thị Bảng và Dropdown

Người dùng không hài lòng với việc các bảng hiện tại vẫn còn quá nhiều khoảng trắng (whitespace) không cần thiết, gây lãng phí diện tích hiển thị dữ liệu quan trọng. Kế hoạch này tập trung vào việc nén không gian theo chiều dọc và chiều ngang trên toàn bộ hệ thống bảng MIRATS 2.0.

## 1. Tối ưu hóa Toolbar & Điều khiển (StandardTable)
- **Thu hẹp khoảng cách tổng thể:** Giảm `space-y-3` xuống `space-y-1.5` trong container chính của `StandardTable`.
- **Nén thanh công cụ:**
  - Giảm `px-1` của toolbar xuống `px-0`.
  - Giảm `gap-2` giữa các nhóm nút xuống `gap-1.5`.
  - Chỉnh lại phần hiển thị số trang ("1-50 / 1.000"): chuyển sang `text-[10px]` hoặc `text-[11px]`, giảm margin để sát vào các nút điều hướng.
- **Nút bấm & Input:**
  - Chuyển toàn bộ các nút trên toolbar sang `h-7` (28px) thay vì `h-8`.
  - Ô tìm kiếm: giảm `h-8` xuống `h-7`, padding nội bộ `px-2` thay vì `px-3`.

## 2. Tối ưu hóa Cấu trúc Bảng (StandardTable & Table.tsx)
- **Header Density:**
  - Giảm chiều cao `TableHeader` từ `h-8` (32px) xuống `h-7` (28px) trong chế độ compact.
  - Font chữ header: `text-[10px]` thay vì `text-[11px]`.
- **Row & Cell Density:**
  - Giảm padding ngang của `TableCell` và `TableHead` xuống `px-1.5` (6px).
  - Giảm padding dọc của `TableCell` xuống `py-0.5` (2px) hoặc `py-1` (4px).
  - Loại bỏ hoàn toàn border-r (viền phải ô) hoặc chuyển sang màu siêu nhạt (`border-border/20`) để giảm nhiễu thị giác, ưu tiên cảm giác dữ liệu liền mạch.
- **Card Integration:**
  - Nếu `StandardTable` nằm trong `Card`, đặt `CardContent` padding là `p-0` để bảng sát lề card, tạo cảm giác "công nghiệp" và chuyên nghiệp hơn.

## 3. Cải thiện linh kiện con (Badges, Chips, Select)
- **Dropdown & Select:**
  - `SelectTrigger`: Giảm chiều cao xuống `h-7`.
  - `SelectItem`: Giảm `py-1.5` xuống `py-0.5` hoặc `py-1`.
  - `SelectContent`: Giảm padding `p-1` xuống `p-0.5`.
- **Badge & CodeBadge:**
  - `Badge`: Nén `px-2` xuống `px-1`.
  - `CodeBadge`: Giảm footprint tổng thể, dùng font mono `text-[10px]`.

## 4. Typography & Visibility
- **Font Size:**
  - Dữ liệu chính: `text-[12px]`.
  - Dữ liệu phụ/Ghi chú: `text-[11px]`.
- **Truncation:**
  - Triệt để dùng `truncate` để ngăn chặn việc nội dung quá dài làm giãn chiều cao dòng.
  - Áp dụng `hover:overflow-visible` hoặc Tooltip để xem nội dung đầy đủ.

## 5. Kỹ thuật thực hiện
- Cập nhật các biến CSS trong `src/styles.css` để áp dụng mức nén mới cho các selector `table th`, `table td`.
- Điều chỉnh `src/lib/mirats/ui/ui-density.ts` để cập nhật các token chuẩn.
- Refactor `src/components/mirats/StandardTable.tsx` để xóa các wrapper padding thừa.
- Tinh chỉnh các component nguyên tử (`Input`, `Select`, `Button`) trong thư mục `src/components/ui/` để hỗ trợ size siêu nhỏ.
