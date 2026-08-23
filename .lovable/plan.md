# Plan - Update TzClock aria-label

The user wants to update the `aria-label` of the `TzClock` component to a specific Vietnamese string related to the `v_tai_san_toan_cuc` and `v_thanh_phan_toan_cuc` views.

## User Review Required

> [!IMPORTANT]
> This change is purely visual/metadata (aria-label) as requested. It does not fix underlying database issues, which were addressed in the previous turn but are being questioned by the user in this label.

## Technical Details

### Frontend Changes

- Update `src/components/mirats/TzClock.tsx`:
    - Change `aria-label` from `"column v_tai_san_toan_cuc.tyLeTuoiTho does not exist tiếp tục lỗi"` to `"(v_tai_san_toan_cuc & v_thanh_phan_toan_cuc bảng chất để làm gì vì sao bây giờ lại bị lỗi"`.
