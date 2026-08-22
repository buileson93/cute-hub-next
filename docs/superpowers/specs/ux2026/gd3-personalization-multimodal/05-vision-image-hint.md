# GĐ3-05 — Vision Image Hint

## Goal

Upload ảnh hiện trường vào sự cố → AI phân tích → gợi ý mô tả sơ bộ, gắn tag phân loại.

## Acceptance

- Field upload ảnh trong form sự cố (đa ảnh, tối đa 5).
- Server fn `analyzeIncidentImage(url)` gọi Lovable AI vision model.
- Trả: `{ short_description, suggested_category, keywords[] }`.
- User thấy suggestion + button "Áp dụng" từng phần.
- Ảnh lưu vào Storage bucket `su-co-images` (RLS).

## Tests (viết trước)

1. Bucket tồn tại + RLS đúng.
2. Server fn với image test → trả object đúng shape.
3. UI: upload ảnh → suggestion hiện.
4. Click "Áp dụng mô tả" → field mô tả cập nhật.

## Steps

1. Migration: bucket `su-co-images` + RLS insert authenticated, read owner/admin.
2. Server fn dùng Lovable AI vision.
3. Component `<VisionImageHint images onApply />`.
4. Tích hợp form sự cố section ảnh.

## Definition of Done

- [ ] Bucket + RLS.
- [ ] Test xanh.
- [ ] Manual: upload 1 ảnh → thấy suggestion → apply → field cập nhật.

## Rollback

Ẩn suggestion; giữ upload ảnh thường.
