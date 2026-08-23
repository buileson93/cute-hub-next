# Plan - Visual Text Replacement

Apply a specific visual text edit to the `TzClock` component's `aria-label`, replacing the previous implementation mode text with the provided Vietnamese description about egg storage.

## User Review Required

> [!IMPORTANT]
> This change updates the `aria-label` of the clock button in the top bar. This text is typically used by screen readers and for internal task tracking in this project's current state.

- **Target Component**: `src/components/mirats/TzClock.tsx`
- **New Text**: "Để ngoài nhiệt độ phòng: Trứng đã luộc chín chỉ để được tối đa khoảng 2 tiếng. Sau thời gian này, vi khuẩn dễ xâm nhập qua lớp màng bảo vệ đã mất khi luộc. [1, 2, 3]"

## Technical Details

### 1. Update `TzClock.tsx`
- Replace the multi-line string in the `aria-label` prop of the `<button>` element (around line 47).
- The text will be updated from the current "IMPLEMENTATION MODE — THÀNH PHẦN & TÀI SẢN DATA MODE ONLY..." block to the new literal text.

```typescript
// src/components/mirats/TzClock.tsx
<button
  type="button"
  className="..."
  aria-label={`Để ngoài nhiệt độ phòng:\u00a0Trứng đã luộc chín chỉ để được tối đa khoảng 2 tiếng. Sau thời gian này, vi khuẩn dễ xâm nhập qua lớp màng bảo vệ đã mất khi luộc.\u00a0[1,\u00a02,\u00a03]`}
>
```
