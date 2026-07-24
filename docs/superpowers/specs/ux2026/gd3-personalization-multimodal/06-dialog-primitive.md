# GĐ3-06 — Dialog Primitive (Schema-driven)

## Goal
Chuẩn hoá các dialog "khai thêm / sửa nhanh" thành 1 primitive nhận schema → render form + validation + submit. Đây là bước chuẩn bị cho GenUI tương lai.

## Acceptance
- Component `<SchemaDialog schema onSubmit />`.
- Schema Zod-based, field types: text, number, select (options async), date, textarea, combobox, switch.
- Auto validation từ schema, error inline.
- Refactor 3 dialog hiện có: KhaiThemHeThong, KhaiThemThanhPhan, SuaNhanh.

## Tests (viết trước)
1. Render dialog với schema 3 field → 3 input hiện.
2. Submit thiếu field required → error inline.
3. Submit hợp lệ → `onSubmit(values)` gọi với values đúng type.
4. Async select: options load từ query.
5. Sau refactor 3 dialog: snapshot behavior giống cũ.

## Steps
1. `src/components/mirats/SchemaDialog.tsx`.
2. Adapter type Zod → react-hook-form (đã có zodResolver).
3. Field renderer switch theo `_def.typeName`.
4. Refactor 3 dialog: chuyển sang schema.
5. Verify UX không đổi.

## Definition of Done
- [ ] Component + tests xanh.
- [ ] 3 dialog refactored.
- [ ] Không regression: e2e các flow lắp/tháo/khai thêm.

## Rollback
Giữ SchemaDialog nhưng revert 3 dialog về code cũ nếu regression.
