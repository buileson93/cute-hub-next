---
name: T22 — Sửa điều kiện hiển thị tooltip trong Sidebar
description: Chỉ hiện tooltip cho menu item khi sidebar đang thu gọn, sử dụng logic React thay vì Tailwind class.
type: feature
---

# T22 — Sidebar Tooltip Display Logic

## Problem
- Tooltips currently show on mobile (where labels are visible) but are hidden on desktop (where they are needed when collapsed).
- The implementation uses `md:hidden` which incorrectly targets screen size rather than the `collapsed` state.

## Solution
- Use the `collapsed` prop to conditionally wrap menu items with `Tooltip`.
- If `collapsed` is true: Render `Tooltip` -> `TooltipTrigger` -> `Link`.
- If `collapsed` is false: Render `Link` directly.
- Remove `md:hidden` from `TooltipContent`.
- Maintain `key` and other `Link` props correctly during branching.

## Constraints
- Do not modify `src/components/ui/tooltip.tsx`.
- Do not add new `TooltipProvider`.
- Maintain accessibility with `aria-label` for screen readers.
