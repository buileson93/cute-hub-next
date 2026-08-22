# GĐ2-02 — Narrative Overview

## Goal

Trang `/` mở đầu bằng block tường thuật "Hôm nay có gì thay đổi" dạng câu văn ngắn, click vào từng cụm nhảy đến bảng đã lọc.

## Acceptance

- Component `<DailyBrief />` render 3–5 câu dựa trên `useDailyBrief()`.
- Mỗi câu có link deep-filter (VD: "3 giấy phép sắp hết hạn trong 7 ngày" → `/giay-phep?filter=expiring7`).
- Widget số hiện tại (KPI cards) đẩy xuống dưới.
- Loading = skeleton 3 dòng, không spinner.

## Tests (viết trước)

1. Mock `useDailyBrief` trả full data → snapshot render đúng 5 câu.
2. Click câu GP → navigate URL đúng.
3. Loading state → skeleton shown.
4. Empty (mọi số = 0) → hiện câu "Không có việc gấp — chúc ngày làm việc suôn sẻ." + ẩn CTA.

## Steps

1. `src/components/mirats/DailyBrief.tsx`.
2. Compose câu (dùng i18n-ready template):
   - "**{n}** giấy phép sắp hết hạn trong 7 ngày."
   - "**{n}** sự cố đang mở, trong đó {c} nghiêm trọng."
   - "**{n}** phiếu bảo trì quá hạn, {d} sắp đến hạn tuần này."
   - "Ca của bạn còn **{n}** đầu việc."
3. Reorder `_app.index.tsx`: `DailyBrief` trên cùng, KPI xuống dưới.
4. Filter query params trên các bảng đích đã hỗ trợ chưa? Nếu chưa, spec phụ.

## Definition of Done

- [ ] Component xanh test.
- [ ] Screenshot 3 trạng thái (loading / có việc / empty).
- [ ] Click qua 4 câu đều navigate đúng.

## Rollback

Ẩn `<DailyBrief />`, đưa KPI cards lên lại.
