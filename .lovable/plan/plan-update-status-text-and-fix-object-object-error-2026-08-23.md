# Plan: Update Status Text and Fix `[object Object]` Error

The user has reported an `[object Object]` error and requested to update the status text in the `TzClock` component's `aria-label`.

## Technical Details

- **File**: `src/components/mirats/TzClock.tsx`
- **Change**: Update the `aria-label` attribute of the button within `TzClock`.
- **Investigation**: Check for potential `[object Object]` rendering issues in the inventory tables (`ComponentTablePanel.tsx`, `AssetTablePanel.tsx`) or data fetching logic (`keyset-supabase.ts`) that might have been introduced in the previous turn.

## Proposed Changes

### 1. Presentation Layer
- Replace the existing `aria-label` content in `src/components/mirats/TzClock.tsx` with the literal text: `"bị lỗi [object Object] kiểm tra lại"`.

### 2. Bug Investigation (`[object Object]` error)
- Review `src/components/mirats/inventory/ComponentTablePanel.tsx` and `AssetTablePanel.tsx` for any places where an object might be passed directly to a JSX node (e.g., in a cell renderer or a label).
- Specifically check the `cell` renderers for the "Thành phần & Mã" column and other newly modified columns.

## Verification Plan

- **Visual Check**: Verify that the `aria-label` in `TzClock` is updated.
- **Runtime Check**: Inspect the browser console (if possible via logs) or use Playwright to identify where the `[object Object]` error is occurring in the UI.
- **Build Check**: Run `npm run build:dev` to ensure no new syntax errors are introduced.
