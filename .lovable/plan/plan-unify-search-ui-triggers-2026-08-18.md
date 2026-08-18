# Plan - Unify Search UI Triggers

The user reported that the search feature in the header has inconsistent behavior and layout issues when triggered from different buttons. Specifically, the `CommandPaletteButton` (icon button) and the `TopBar` search bar should trigger the same unified search experience.

## Analysis
- `TopBar.tsx` uses a local `open` state and renders `PowerSearch.tsx` (a newer, more feature-rich search).
- `CommandPaletteButton.tsx` dispatches a `mirats:toggle-command-palette` event.
- `CommandPalette.tsx` (an older search component) listens for this event and opens itself.
- Having two different search dialogs leads to UI inconsistency and potential "frozen" or broken layouts if they conflict.

## Proposed Changes

### 1. Unify Events
- Update `TopBar.tsx` to listen for `mirats:toggle-command-palette` and `mirats:open-command-palette` events to open the `PowerSearch` dialog.
- This ensures all triggers (keyboard shortcuts, buttons, global events) activate the same UI.

### 2. Update Triggers
- Ensure `CommandPaletteButton.tsx` continues to dispatch the correct event.
- Update `TopBar.tsx` to use the shared event listener instead of just local button state (though local state is fine for the button click itself, the event listener ensures other triggers work).

### 3. Cleanup
- Decommission `CommandPalette.tsx` to avoid two search systems running in parallel. The logic and intents from `CommandPalette.tsx` that are missing in `PowerSearch.tsx` (like Navigation commands) should be moved or verified in `PowerSearch.tsx`.
- Review `PowerSearch.tsx` to ensure it handles all intents (Navigation, AI commands, Log out) that were present in the old `CommandPalette.tsx`.

## Technical Steps

1. **Modify `src/components/mirats/app-shell/TopBar.tsx`**:
   - Add a `useEffect` to listen for `mirats:open-command-palette` and `mirats:toggle-command-palette` to set the `open` state for `PowerSearch`.

2. **Enhance `src/components/mirats/search/PowerSearch.tsx`**:
   - Ensure it includes the "Nav Commands" (Overview, System Tree, etc.) that were in `CommandPalette.tsx`.
   - Ensure AI intents (navigate, logout) are fully functional.

3. **Verify `src/components/mirats/CommandPaletteButton.tsx`**:
   - Confirmed it already dispatches `mirats:toggle-command-palette`.

4. **Deactivate `src/components/mirats/CommandPalette.tsx`**:
   - Remove its keyboard listeners or the component itself from the root if it's mounted there (it's likely mounted in a layout or root).
