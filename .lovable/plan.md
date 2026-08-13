# Kế hoạch Chuẩn hoá Ngữ nghĩa Màu Dashboard (Compact & Semantic UI)

Bối cảnh: Dashboard hiện tại sử dụng quá nhiều màu sắc Tailwind thô (5 họ màu), thiếu quy tắc nhất quán và không tương thích tốt với Dark Mode. Nhiệm vụ là làm sạch, tinh gọn và chuyển sang hệ thống token trạng thái đã có.

## 1. Bảng Ngữ nghĩa 4 Mức Trạng thái
Dựa trên `src/lib/mirats/ui/status-tokens.ts`, thiết lập bảng quy đổi cho Dashboard:

| Mức độ | Ý nghĩa | Chữ (Text) | Nền (Bg) | Viền (Border) | Dark Mode |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Bình thường** | Trạng thái ổn định | `text-foreground` | Không màu | `border-border` | Mặc định theme |
| **Cần chú ý** | Thông tin quan trọng | `text-blue-600` | `bg-blue-500/5` | `border-blue-500/20` | `dark:text-blue-400` |
| **Cảnh báo** | Rủi ro trung bình | `text-amber-600` | `bg-amber-500/5` | `border-amber-500/20` | `dark:text-amber-400` |
| **Nguy hiểm** | Khẩn cấp/Hỏng | `text-red-600` | `bg-red-500/5` | `border-red-500/20` | `dark:text-red-400` |

## 2. Bảng Ánh xạ & Thay thế (src/routes/_app.index.tsx)

| Class cũ | Dòng | Ý nghĩa thực | Token / Thay thế |
| :--- | :--- | :--- | :--- |
| `bg-emerald-50 text-emerald-600` | 208, 211 | Availability (Tốt) | Bỏ màu nền, dùng icon/chữ default. |
| `bg-blue-50 text-blue-600` | 227, 230 | MTTR (Thông tin) | **Cần chú ý** (Blue token). |
| `bg-orange-50 text-orange-600` | 246, 249 | MTBF (Cảnh báo) | **Cảnh báo** (Amber/Orange token). |
| `bg-indigo-50 text-indigo-600` | 265, 268 | PM (Thông tin) | Bỏ màu trang trí (Indigo). |
| `text-red-600`, `border-l-red-500` | 283-291 | Sự cố khẩn | **Nguy hiểm** (Red token). Bỏ border-l-4. |
| `text-orange-600`, `border-l-orange-50` | 314-322 | Bảo trì | **Cảnh báo** (Amber token). Bỏ border-l-4. |
| `text-blue-600`, `border-l-blue-500` | 344-352 | Chất lượng dữ liệu | **Cần chú ý** (Blue token). Bỏ border-l-4. |
| `bg-orange-500/5` | 560 | Widget Task | Đồng bộ với token **Cảnh báo**. |

## 3. Danh sách Loại bỏ & Tinh gọn
- **Loại bỏ hoàn toàn**:
  - `border-l-4`: Thay bằng viền 1px hoặc dot nhỏ để tinh gọn (Apple-like).
  - Các màu nền Tailwind thô (`bg-xx-50`): Thay bằng nền opacity thấp (5%) để hoạt động tốt cả Dark/Light.
  - Màu Indigo/Emerald dùng làm trang trí cho KPI ổn định.
- **Quy tắc hiển thị**:
  - KPI Availability (99%): Chỉ dùng màu khi nó < 95% (Nguy hiểm) hoặc < 98% (Cảnh báo). Mặc định không màu.
  - Các số liệu trong `Brief hôm nay`: Chỉ tô màu con số nếu có dữ liệu khẩn cấp (>0).

## 4. Các bước thực hiện
1. **Refactor `_app.index.tsx`**: Thay thế các class thô bằng class từ `XEP_LOAI_HEALTH_TOKEN` hoặc `MUC_DO_SU_CO_TOKEN`.
2. **Đồng bộ `_app.tong-quan.tsx`**: Áp dụng chung một bộ quy tắc tiết chế.
3. **Cập nhật CSS toàn cục**: Đảm bảo các nền `bg-xxx-500/5` hiển thị sạch trên cả nền trắng và nền tối của Card.
4. **Kiểm tra**:
   - Chế độ sáng: Màu nhạt, thanh thoát.
   - Chế độ tối: Không bị chói mắt (vấn đề `bg-blue-50`), độ tương phản chữ đạt chuẩn AA.

## 5. Danh sách file sửa đổi
- `src/routes/_app.index.tsx`
- `src/routes/_app.tong-quan.tsx`
- `src/lib/mirats/ui/ui-density.ts` (nếu cần tinh chỉnh padding card)
