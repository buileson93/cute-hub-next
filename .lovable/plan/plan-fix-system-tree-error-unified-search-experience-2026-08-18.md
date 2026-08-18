# Plan: Fix System Tree Error & Unified Search Experience

The goal is to fix the runtime error in the System Tree page (`/he-thong/cay`) and unify the search experience between the header search bar and the `Cmd+K` PowerSearch.

## Proposed Changes

### 1. Fix `/he-thong/cay` Runtime Error
The "Something went wrong" error is likely due to complex data processing or missing checks in `buildTree` when handling thousands of devices.
- **Investigation & Fix**:
    - Audit `src/routes/_app.he-thong.cay.tsx` for potential undefined access in `buildTree`.
    - Add safety checks for `db_taxonomy` data and `devices` mapping.
    - Wrap the `buildTree` logic in a `useMemo` with proper fallbacks.
    - Fix the `nav` search param synchronization which might be causing infinite redirect loops if params aren't stable.

### 2. Unified Search Experience
Currently, the header search is a standard input, while `Cmd+K` opens a rich PowerSearch dialog. They should be unified.
- **TopBar Refactor**:
    - Update `src/components/mirats/app-shell/TopBar.tsx` to remove the native search behavior.
    - Make the search input a visual trigger that always opens the `PowerSearch` dialog (matching `Cmd+K` behavior).
- **PowerSearch Synchronization**:
    - Ensure `PowerSearch` properly handles focus when opened via the header trigger.
    - Remove redundant search components if any (e.g., `NodeSearch` in the System Tree page might be confusing; we'll check if it should stay or be integrated).

### 3. Header Search Match `Cmd+K`
- Standardize all search entry points to use `src/components/mirats/search/PowerSearch.tsx`.
- Wire the global search icon and input field to the same `onOpenChange` state used by the keyboard shortcut.

## Technical Details
- **Route**: `src/routes/_app.he-thong.cay.tsx`
- **Components**: 
    - `src/components/mirats/app-shell/TopBar.tsx`
    - `src/components/mirats/search/PowerSearch.tsx`
    - `src/components/mirats/he-thong-cay/NodeSearch.tsx`
- **State Management**: Using `useState` in `TopBar` for search modal visibility and TanStack Router's `useNavigate` for navigation.
