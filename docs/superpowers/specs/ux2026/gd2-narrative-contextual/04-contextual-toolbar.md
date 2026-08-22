# GĐ2-04 — Contextual Toolbar

## Goal

Khi user chọn 1+ row trong bảng lớn, floating micro-toolbar bám con trỏ với 3 hành động phổ biến nhất theo domain.

## Acceptance

- Component `<ContextualToolbar selection actions position />`.
- Vị trí = ngay dưới row cuối được chọn, tự né viewport edge.
- 3 domain-preset:
  - Tài sản: `Lắp`, `Tháo`, `Xem QR`.
  - Sự cố: `Đóng`, `Xuất Word`, `Chuyển kíp`.
  - PM: `Bắt đầu`, `Hoãn`, `Xuất phiếu`.
- ESC hoặc click ngoài → ẩn.
- Bulk (chọn > 1) → chỉ hiện action hỗ trợ bulk.

## Tests (viết trước)

1. Render với 1 selection → 3 button hiện đúng.
2. Render với 3 selection → button "Xem QR" ẩn (không bulk).
3. Position: mock viewport 800x600, selection ở góc dưới → toolbar hiện phía trên row.
4. Press ESC → `onDismiss` gọi.

## Steps

1. `src/components/mirats/ContextualToolbar.tsx`.
2. Hook `useContextualPosition(ref)` tính rect + flip.
3. Tích hợp vào 3 bảng (`_app.he-thong.thanh-phan.tsx`, `_app.su-co.index.tsx`, `_app.bao-tri.pm.tsx`).
4. Xử lý bulk: props `supportsBulk?: boolean` mỗi action.

## Definition of Done

- [ ] 3 bảng đã có toolbar.
- [ ] Tests xanh.
- [ ] Manual QA: chọn row → toolbar hiện; ESC ẩn; bulk lọc đúng.

## Rollback

Gỡ `<ContextualToolbar>` khỏi 3 bảng, giữ bulk action bar cũ (đã có ở sự cố).
