# GĐ3-03 — Voice Quick-log (Field Tech Mobile)

## Goal

Trang `/q/$maThietBi` có nút mic → Web Speech API → AI parse → tạo báo cáo sự cố nhanh (draft).

## Acceptance

- Nút mic lớn (tap target ≥ 56px) trên landing card.
- Nhấn giữ để nói; thả để dừng.
- Text hiển thị realtime khi nói.
- Sau khi dừng: gọi `parseIncidentText` (đã có) → điền form draft.
- User review + xác nhận → tạo sự cố.

## Tests (viết trước)

1. Component test: mock `SpeechRecognition` → phát fake transcript → hiển thị text.
2. Sau khi dừng → `parseIncidentText` được gọi với transcript.
3. Draft form hiện các field đã parse.
4. Xác nhận → sự cố được tạo với `nguon="voice"`.
5. Không hỗ trợ browser (no `SpeechRecognition`): ẩn nút mic, hiện textarea fallback.

## Steps

1. `src/lib/mirats/voice-recognition.ts` — wrap Web Speech.
2. Component `<VoiceQuickLog assetId />`.
3. Tích hợp vào `q.$maThietBi.tsx`.
4. Field mới `nguon` trong `su_co` (nếu chưa có) — migration nhỏ.

## Definition of Done

- [ ] Migration approved (nếu cần).
- [ ] Test xanh.
- [ ] Playwright mobile viewport screenshot.

## Rollback

Ẩn nút mic; giữ textarea fallback.
