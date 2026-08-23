# Plan: UI/UX Text Update (Phase 11C)

Update the system status message (contextually mapped to "language selector") with the new visual regression and standardization roadmap text.

## User-facing changes
- The tooltip/aria-label on the top-bar clock will be updated to display the new MIRATS UI/UX improvement roadmap in Vietnamese.

## Technical details
- **File:** `src/components/mirats/TzClock.tsx`
    - Update `aria-label` on the `DropdownMenuTrigger` button.
- **File:** `src/components/mirats/app-shell/TopBar.tsx`
    - Wrap `<TzClock />` in `<AppTooltip />` to make the new text visible on hover as "literal display text".
    - Use `whitespace-pre-wrap` in the tooltip content to respect the newlines in the provided string.

## Verification
- Verify the `aria-label` is updated in `TzClock.tsx`.
- Verify the `TopBar` correctly displays the tooltip when hovering over the clock in the preview.
