# Plan for T26: Restoring TopBar Utilities

Restoring 5 missing utility components to the `TopBar` in the MIRATS 2.0 interface. These components were lost during the `AppShell` refactoring.

## Component Analysis (Verification)

1.  **NotificationBell**:
    *   **File**: `src/components/mirats/NotificationBell.tsx`
    *   **Props**: None.
    *   **Self-hiding**: No, but uses `useSession` and `useNotifications`.
    *   **Mobile**: Has `aria-label` and `sr-only` for screen readers.
    *   **Aria-label**: Managed internally (lines 31, 107).

2.  **QrScanButton**:
    *   **File**: `src/components/mirats/QrScanButton.tsx`
    *   **Props**: None.
    *   **Aria-label**: Managed internally (line 21).
    *   **Tooltip**: Managed internally (line 16).

3.  **TzClock**:
    *   **File**: `src/components/mirats/TzClock.tsx`
    *   **Props**: None.
    *   **Mobile**: Hardcoded `hidden lg:flex` (line 46).
    *   **Aria-label**: Managed internally (line 47).

4.  **RecentPinnedRailButton**:
    *   **File**: `src/components/mirats/RecentPinnedRailButton.tsx`
    *   **Props**: None.
    *   **Aria-label**: Managed internally (line 19).
    *   **Tooltip**: Managed internally (line 14).

5.  **GlobalSearch**:
    *   **File**: `src/components/mirats/GlobalSearch.tsx`
    *   **Note**: Per request point 5, I will check if `TopBar` search already satisfies the need. `TopBar.tsx` currently has a dummy search input. `CommandPalette` handles the actual search logic triggered by `⌘K`.

## Implementation Strategy

### Step 1: Update `TopBar.tsx`
*   Import: `NotificationBell`, `QrScanButton`, `TzClock`, `RecentPinnedRailButton`.
*   Layout: Add a flex container on the right side of `TopBar`.
*   Responsive Logic:
    *   `NotificationBell`: Always visible.
    *   `QrScanButton`: Always visible (priority for mobile field work).
    *   `RecentPinnedRailButton`: Wrap in `DesktopOnly` or use Tailwind `hidden md:flex`.
    *   `TzClock`: Wrap in `DesktopOnly` or use Tailwind `hidden md:flex`. (Note: `TzClock` already has `lg:flex` inside, I should probably check if I should override it or respect it).

### Step 2: GlobalSearch vs CommandPalette
*   `TopBar.tsx` currently has a search input (lines 10-20).
*   `CommandPalette.tsx` is already in `AppShell.tsx`.
*   I will verify if the current search input in `TopBar` is wired to anything. If it's a dummy, I'll keep it but ensure it doesn't conflict or duplicate `GlobalSearch`. The request says "ô tìm kiếm (đã xử ở T21)". I'll check T21 history if possible, or just look at the code.

### Step 3: Verification
*   Run `npx tsc --noEmit`.
*   Run `npm run test`.
*   Verify visual layout on mobile/desktop.

## Proposed Changes

### `src/components/mirats/app-shell/TopBar.tsx`
*   Remove the dummy search input if it's redundant.
*   Add the 4 utilities in the requested order.
*   Apply responsive visibility rules.

## Verification Plan

### Automated
*   `npx tsc --noEmit`
*   `npm run test`

### Manual/Visual (Playwright)
*   Check desktop view for all icons.
*   Check mobile view (iPhone SE/12) for QR and Bell presence, and lack of others.
*   Verify `aria-label` existence.
