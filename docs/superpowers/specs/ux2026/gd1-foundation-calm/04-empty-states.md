# GĐ1-04 — Empty States có cá tính

## Goal

Bảng/list trống hiện illustration nhẹ + CTA cụ thể, thay vì text "Không có dữ liệu".

## Acceptance

- Component `<EmptyState icon title description action />` chuẩn hoá.
- Áp dụng: bảng sự cố, bảng PM, tài sản, thành phần, notification center, tuân thủ.
- Mỗi empty state có CTA hành động chính (ví dụ "Tạo báo cáo trắng").
- Illustration là SVG lucide/inline, không tải ảnh.

## Tests (viết trước)

1. Render `<EmptyState title="X" description="Y" />` → có role="status" + text "X".
2. Bảng sự cố mock rỗng → hiện `EmptyState` với CTA "Tạo sự cố".
3. Click CTA → navigate `/su-co/moi`.

## Steps

1. `src/components/mirats/EmptyState.tsx`.
2. Style: icon 48px muted, title medium, description muted-foreground, CTA outline button.
3. Refactor 6 nơi (list ở trên).

## Definition of Done

- [ ] Component tạo + test xanh.
- [ ] Áp dụng ≥ 6 chỗ.
- [ ] Screenshot 3 empty states khác nhau.

## Rollback

Revert 6 chỗ, xoá component.
