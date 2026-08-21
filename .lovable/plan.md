# Plan: Fix UI Overlaps and Search Icon Visibility (Phase U7.3)

The user reports persistent UI issues: buttons overlapping in the dashboard toolbar and the search icon missing in the Header. Analysis shows that the `Button` component lacks `relative` positioning, causing its absolute children (like the loading spinner) to misalign. Additionally, the dashboard buttons need to be standardized to match the robust Header button pattern.

## User Review Required

> [!IMPORTANT]
> I will simplify the `Button` component and refactor the dashboard toolbar to use the same logic as the Header buttons, which have proven to be more stable.

- Do you prefer the dashboard buttons to have a background color (like "Cá nhân hóa") or be ghost/outline as they currently are? (I will keep current variants but fix the layout).

## Technical Details

### 1. Button Component Stabilization
- Modify `src/components/ui/button.tsx`:
    - Add `relative` to `buttonVariants` to ensure absolute-positioned children (like the loading spinner) are anchored correctly.
    - Standardize `renderContent` to prevent internal layout shifts.

### 2. TopBar Search Icon Visibility
- Modify `src/components/mirats/app-shell/TopBar.tsx`:
    - Ensure the `Search` icon has `flex-shrink: 0` and explicit size.
    - Verify color contrast for the search icon against the `bg-[#0074e2]/5` background.

### 3. Dashboard Toolbar Refactor
- Modify `src/routes/_app.index.tsx`:
    - Refactor the `flex` container holding "Thêm Widget", "Khôi phục", and "Cá nhân hóa".
    - Ensure `gap-2` is respected and items don't overlap by removing any conflicting absolute positioning or negative margins.
    - Add `aria-label` to all buttons.

### 4. Style Synchronization
- Check `src/styles/astryx-component-skins.css` for any `astryx-control` styles that might be forcing fixed widths or absolute positioning.

## Verification Plan

### Automated Tests
- Run `lovable-exec "bunx playwright test tests/ui/structural-integrity.test.ts"` to check for general layout stability.
- Use a custom script to verify the visibility and position of the search icon.

### Manual Verification
- Inspect the preview at `http://localhost:8080/` to ensure the buttons in the dashboard toolbar are correctly spaced and not overlapping.
- Verify the magnifying glass icon is visible in the TopBar.
