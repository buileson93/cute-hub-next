# GĐ1-03 — Progressive Disclosure

## Goal

Form dài (sự cố, PM, form designer, khai tài sản) mặc định chỉ hiện field bắt buộc; các nhóm phụ đóng vào `<details>`/Collapsible.

## Acceptance

- Trang `/su-co/moi`: section 4 (kíp trực), section 5 (phân loại), section 6 (đánh giá) mặc định collapsed.
- Trang `/bao-tri/pm/moi`: các nhóm không bắt buộc collapsed.
- Trang designer form: panel "Advanced" collapsed.
- User expand 1 lần → state ghi vào `localStorage` per-user-per-form; lần sau mở lại giữ nguyên.

## Tests (viết trước)

1. `_app.su-co.moi.tsx` mount → `aria-expanded="false"` trên 3 section phụ.
2. Click expand → `aria-expanded="true"` + localStorage key `mirats:form:su-co:sec-4=open`.
3. Reload → giữ state.
4. Nếu section chứa field lỗi validation → auto-expand + focus field đó.

## Steps

1. Component `src/components/mirats/CollapsibleSection.tsx` (wrap shadcn Collapsible) nhận `id`, `defaultOpen`, `title`.
2. Persistence hook `src/hooks/use-persistent-collapse.ts`.
3. Refactor `_app.su-co.moi.tsx` — wrap section 4/5/6.
4. Refactor `_app.bao-tri.pm.moi.tsx` (nếu có) tương tự.
5. Refactor designer.
6. Validation hook auto-expand khi có error trong section.

## Definition of Done

- [ ] 3 form đã áp dụng.
- [ ] Tests xanh.
- [ ] Manual: reload giữ state; validation lỗi auto-expand.

## Rollback

Bỏ wrapper `CollapsibleSection`, render inline như cũ.
