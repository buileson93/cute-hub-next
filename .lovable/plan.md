# Plan: Fix UI Integrity and Overlap Issues (Phase U7.2)

The current layout issues (overlaps, misalignments) are primarily caused by the `Button` component forcing a `justify-center` layout and redundant wrappers, which conflicts with buttons requiring specific alignments (like the search bar in `TopBar`).

## Technical Changes

### 1. Button Component Refactoring
- **File:** `src/components/ui/button.tsx`
- **Fix:** Remove hardcoded `justify-center` and redundant wrappers in `renderContent`.
- **Improvement:** Implement a cleaner `loading` state that preserves the button's dimensions without introducing extra layout constraints or forcing gaps. It will now respect the button's own flex layout (e.g., `justify-between`).

### 2. CSS Skin Standardization
- **File:** `src/styles/astryx-component-skins.css`
- **Fix:** Remove the forced `justify-center` from the `.astryx-control` class. This allows Tailwind utility classes (like `justify-start` or `justify-between`) to work as expected without needing `!important`.

### 3. TopBar Search UI Robustness
- **File:** `src/components/mirats/app-shell/TopBar.tsx`
- **Fix:** Simplify the inner layout of the search button to ensure the Search icon, Placeholder text, and Shortcut key (Cmd+K) are properly spaced and never overlap, even when the container shrinks.
- **Change:** Ensure it uses `flex-1` correctly for the text portion to push the shortcut to the right.

### 4. Layout Protection in Page Header
- **File:** `src/components/mirats/PageHeader.tsx`
- **Fix:** Ensure action buttons are properly managed to prevent overflow on medium screens before the mobile menu kicks in.

## Verification Plan
1. **Visual Check:** Inspect the `TopBar` search bar and "KHÔI PHỤC", "CÁ NHÂN HÓA" buttons in the Technical Incidents page (`/su-co`).
2. **Loading State Check:** Trigger loading states on various buttons to ensure they don't jump or change size.
3. **Responsive Check:** Scale the viewport to ensure the search bar and headers adapt gracefully without text overlapping icons.
