# GĐ2-05 — Ambient Autofill

## Goal
Form sự cố / PM prefill nhẹ dựa lịch sử user + thành phần đã chọn. User luôn thấy được và có nút Undo.

## Acceptance
- Hook `useAmbientPrefill(formKey, context)` trả `{ values, sources }`.
- Prefill:
  - Đơn vị: từ profile user.
  - Kíp trực: từ ca gần nhất user thuộc.
  - Biện pháp: gợi ý từ sự cố tương tự (cùng thành phần, 30 ngày gần).
- Field được prefill có badge nhỏ "auto" + click Undo → về rỗng.
- Không prefill nếu user đã gõ thủ công.

## Tests (viết trước)
1. Mock context → hook trả values đúng.
2. UI: input có badge "auto" khi prefill; user gõ → badge biến mất.
3. Click Undo → value rỗng.
4. Nếu user đã gõ → prefill không ghi đè.

## Steps
1. Server fn `getPrefillSuggestions(context)` — join sự cố / user_profile / ca_truc.
2. Hook client cache 60s.
3. Component `<AutoFilledInput />` bọc `<Input>` + badge.
4. Áp dụng sự cố form (section 1, 4, 5).
5. Áp dụng PM form nếu có.

## Definition of Done
- [ ] Test unit + integration xanh.
- [ ] Manual: mở form → thấy 2–3 field auto-filled + badge.
- [ ] Undo hoạt động.

## Rollback
Bỏ hook, render input thường.
