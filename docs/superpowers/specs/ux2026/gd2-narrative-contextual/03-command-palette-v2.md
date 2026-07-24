# GĐ2-03 — Command Palette v2 (Intent-based)

## Goal
Mở rộng Cmd+K từ navigation-only sang execute-action: "gán TB123 vào TPHT_045", "đóng sự cố SC-12", "tạo PM cho HT ADS-B".

## Acceptance
- Registry intent: `mount-asset`, `unmount-asset`, `close-incident`, `create-pm`, `jump-to`.
- Fuzzy match tên tài sản / mã / thành phần.
- AI parse fallback khi không match rule (Lovable AI, model rẻ).
- Preview action + confirm trước khi thực thi.
- Log mọi intent thực thi vào `lich_su_thao_tac`.

## Tests (viết trước)
1. Unit `matchIntent("gán TB123 vào TPHT_045")` → `{kind:"mount-asset", asset:"TB123", component:"TPHT_045"}`.
2. Unit `matchIntent("đóng sự cố SC-12")` → `{kind:"close-incident", id:"SC-12"}`.
3. Unit input nhập nhoè → AI fallback được gọi (mock).
4. E2E: mở palette → gõ intent → confirm → RPC được gọi → toast success + row cập nhật realtime.

## Steps
1. `src/lib/mirats/command-intent.ts` — rule regex + confidence score.
2. `src/lib/mirats/command-intent-ai.functions.ts` — server fn AI parse fallback.
3. Refactor palette component: nếu match intent → render preview card thay list.
4. Confirm button → gọi RPC tương ứng (đã có: `lap_tai_san_vao_thanh_phan`, cần bổ sung `dong_su_co`).
5. Log vào `lich_su_thao_tac` với kind="cmdk".

## Definition of Done
- [ ] 5 intent hoạt động end-to-end.
- [ ] Unit tests xanh.
- [ ] Playwright: gõ "gán X vào Y" → xác nhận → gán thành công.

## Rollback
Feature flag `NEXT_CMDK_INTENTS=false` → về palette navigation cũ.
