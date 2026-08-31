# Rà soát đồng bộ ngôn ngữ thiết kế & tương phản Dark mode

Nguồn số liệu: `node scripts/ui-audit.mjs` (ghi `docs/ui/u4-baseline.json`).

## 1. Danh sách điểm chưa đồng bộ

| Nhóm vi phạm | Số lượng | Mô tả |
| --- | --- | --- |
| Màu Tailwind cứng (`bg-/text-/border-<palette>-<n>`) | 1675 | Không theo token semantic, dễ mất tương phản ở Dark mode |
| Mã HEX trực tiếp trong TSX/TS | 168 | Không đổi theo theme |
| `text-[Npx]` hardcode | 949 | Không theo thang `TYPO`, không co giãn theo density |
| `text-xs` / `text-sm` / `text-base` rời rạc | 1223 / 811 / 101 | Trộn nhiều thang chữ |
| Nút icon thiếu nhãn (a11y) | 320 | Thiếu `aria-label`/tooltip |
| Route dùng `PageHeader` | 60/133 | Nhiều trang chưa theo archetype PageFrame → PageHeader → PageBody |

### Phân bố họ màu cứng
amber 521 · emerald 370 · rose 189 · red 181 · sky 158 · slate 137 · blue 96 · indigo 66 · violet 62 · orange 29 · teal 20 · green 17 · yellow 12 · cyan 9 · purple 7 · stone 6 · pink 6 · fuchsia 4 · zinc 2

### Top file vi phạm
1. `src/routes/_app.he-thong.$id.tsx` (120)
2. `src/routes/_app.du-an.$id.tsx` (110)
3. `src/routes/admin.schema.tsx` (87)
4. `src/components/mirats/NetworkOverview.tsx` (81)
5. `src/components/mirats/projects/TaskDetailSlideOver.tsx` (61)
6. `src/routes/admin.audit.tsx` (58)
7. `src/routes/_app.danh-muc.thiet-bi.tsx` (54)
8. `src/components/mirats/ChecklistRenderer.tsx` (47)
9. `src/routes/_app.so-do.$id.tsx` (46)
10. `src/components/mirats/FormFieldRuntime.tsx` (44)

## 2. Đã thống nhất (thực hiện)

`src/styles/legacy-palette-bridge.css` (layer `mirats-contrast`, ưu tiên cao hơn utilities):

- Ánh xạ toàn bộ họ màu cứng về 5 nhóm token trạng thái: `warning`, `success`, `danger`, `info`, `neutral`.
- Mỗi nhóm có 4 token: `--status-*-fg` (chữ), `--status-*-solid` (nền đặc), `--status-*-soft` (nền nhạt), `--status-*-border`.
- Bộ giá trị riêng cho Light và Dark:
  - Light: chữ dùng lightness ~0.45–0.5 (đạt AA trên nền sáng).
  - Dark: chữ dùng lightness ~0.82–0.87, nền nhạt chuyển thành lớp phủ mờ (alpha) thay vì màu 50/100 sáng chói.
- Nhờ vậy `text-amber-600`, `bg-emerald-50`, `border-red-200`… tự động đúng tương phản ở Dark mode mà không phải sửa 1675 vị trí.

## 3. Việc còn lại (đề xuất theo thứ tự)

1. Thay `text-[Npx]` bằng token `TYPO` — bắt đầu từ 10 file top.
2. Thay HEX trong TSX bằng biến CSS theme (168 chỗ).
3. Bổ sung `aria-label` cho 320 nút icon.
4. Đưa 73 route còn lại về archetype `PageFrame → PageHeader → PageBody`.
5. Sau khi call-site đã dùng token semantic, gỡ dần `legacy-palette-bridge.css`.
