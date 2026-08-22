# Kế hoạch Chuẩn hoá Ngữ nghĩa Màu Dashboard (Compact & Semantic UI)

Bối cảnh: Dashboard hiện tại sử dụng quá nhiều màu sắc Tailwind thô (5 họ màu), thiếu quy tắc nhất quán và không tương thích tốt với Dark Mode. Nhiệm vụ là làm sạch, tinh gọn và chuyển sang hệ thống token trạng thái đã có.

## 1. Bảng Ngữ nghĩa 4 Mức Trạng thái

Dựa trên `src/lib/mirats/ui/status-tokens.ts`, thiết lập bảng quy đổi cho Dashboard:

| Mức độ          | Ý nghĩa              | Chữ (Text)        | Nền (Bg)         | Viền (Border)         | Dark Mode             |
| :-------------- | :------------------- | :---------------- | :--------------- | :-------------------- | :-------------------- |
| **Bình thường** | Trạng thái ổn định   | `text-foreground` | Không màu        | `border-border`       | Mặc định theme        |
| **Cần chú ý**   | Thông tin quan trọng | `text-blue-600`   | `bg-blue-500/5`  | `border-blue-500/20`  | `dark:text-blue-400`  |
| **Cảnh báo**    | Rủi ro trung bình    | `text-amber-600`  | `bg-amber-500/5` | `border-amber-500/20` | `dark:text-amber-400` |
| **Nguy hiểm**   | Khẩn cấp/Hỏng        | `text-red-600`    | `bg-red-500/5`   | `border-red-500/20`   | `dark:text-red-400`   |

## 2. Bảng Ánh xạ & Thay thế (src/routes/\_app.index.tsx)

| Class cũ                                 | Dòng     | Ý nghĩa thực       | Token / Thay thế                                          |
| :--------------------------------------- | :------- | :----------------- | :-------------------------------------------------------- |
| `bg-emerald-50 text-emerald-600`         | 208, 211 | Availability (Tốt) | Bỏ màu nền, dùng icon/chữ mặc định.                       |
| `bg-blue-50 text-blue-600`               | 227, 230 | MTTR (Thông tin)   | **Cần chú ý** (Blue token).                               |
| `bg-orange-50 text-orange-600`           | 246, 249 | MTBF (Cảnh báo)    | **Cảnh báo** (Amber token).                               |
| `bg-indigo-50 text-indigo-600`           | 265, 268 | PM (Thông tin)     | Bỏ màu nền, dùng icon/chữ mặc định.                       |
| `text-red-600`, `border-l-red-500`       | 283-291  | Sự cố khẩn         | **Nguy hiểm** (Red token). Bỏ border-l-4, dùng viền 2px.  |
| `text-orange-600`, `border-l-orange-500` | 314-322  | Bảo trì            | **Cảnh báo** (Amber token). Bỏ border-l-4, dùng viền 2px. |
| `text-blue-600`, `border-l-blue-500`     | 344-352  | Chất lượng dữ liệu | **Cần chú ý** (Blue token). Bỏ border-l-4, dùng viền 2px. |
| `bg-orange-500/5`                        | 560      | Widget Task        | Đồng bộ với token **Cảnh báo**.                           |

## 3. Danh sách Loại bỏ & Tinh gọn

- **Loại bỏ hoàn toàn**:
  - `border-l-4`: Thay bằng viền mảnh 2px hoặc dải màu 2px bên trái (relative position) để tinh gọn.
  - Các màu nền Tailwind thô (`bg-xx-50`): Thay bằng nền opacity thấp (5%) hoặc bỏ hẳn.
  - Màu Indigo/Emerald dùng làm trang trí cho KPI đang ở trạng thái tốt.
- **Quy tắc hiển thị**:
  - KPI Availability: Mặc định không màu nếu đạt Target.
  - Các số liệu trong `Brief hôm nay`: Chỉ tô màu khi có dữ liệu cần chú ý/nguy hiểm (>0).

## 4. Các bước thực hiện

1. **Refactor `_app.index.tsx`**: Thay thế các class thô bằng class từ `XEP_LOAI_HEALTH_TOKEN` hoặc `MUC_DO_SU_CO_TOKEN` (Amber/Red/Blue).
2. **Refactor `_app.tong-quan.tsx`**: Đồng bộ logic màu sắc để đảm bảo tính nhất quán giữa hai trang dashboard.
3. **Kiểm tra Dark Mode**: Đảm bảo toàn bộ thẻ Card không bị chói và chữ có độ tương phản tốt.

## 5. Danh sách file sửa đổi

- `src/routes/_app.index.tsx`
- `src/routes/_app.tong-quan.tsx`
