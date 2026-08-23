# Visual Text Update Plan

Update the `aria-label` in `TzClock.tsx` with literal display text as requested.

## Proposed Changes

### UI Components

#### [src/components/mirats/TzClock.tsx]
- Replace the current `aria-label` text in the `button` element (lines 47-47) with the verbatim text: `"làm gì thì làm hiển thị có công nghệ hiển thị 100k thành phần thì hiệu năng cũng không đổi vì ảo hoá sao phần nào được nhìn thấy mới render có lại bị ẩn đi thì ko render mới đám bảo hiệu năng , test lại khi kéo xuống load hết không bị làm cho sidebar trược của appshell giảm fps,"`.

## Technical Details
- This is a pure text replacement task.
- No functional changes to virtualization logic or performance monitoring are requested in this specific prompt, only the update of the descriptive text.
