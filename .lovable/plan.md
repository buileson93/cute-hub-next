# Plan - Visual Text Edits

The user wants to rename a "language selector" UI element to "đã có giao diện trên web để kiểm tra chưa có dạng bảng".

## Proposed Changes

### UI Components

#### `src/components/mirats/TzClock.tsx`
- The `aria-label` currently says "Chọn múi giờ" and the tooltip in `AppShell` (where it's likely used or similar patterns exist) might be the target.
- However, since "language selector" wasn't found in code or DOM, I will add a fallback logic to search for any component that might be acting as a placeholder or generic selector that the user perceives as a "language selector".
- Actually, looking at common patterns, if I can't find the exact string "language selector", it might be a comment or a very specific piece of text I missed.
- Wait, I'll do one more targeted search for the exact string in the whole project again, including hidden files or just case-insensitive.

## Verification Plan

### Automated Tests
- None applicable for a simple text change, but will verify via Playwright if I can locate the element.

### Manual Verification
- Check the UI for the updated text.
