# Plan: PowerSearch Cleanup and Functional Parity

Improve the PowerSearch (Command Palette) component to align with the MIRATS high-density UI standard and restore missing functional parity with the `chaytot` version.

## UI Modernization & Cleanup

- **Dynamic Preview**: Replace static "AI Hints" with a context-aware metadata panel that updates based on the currently hovered or focused search result.
- **Preview Content**: For Systems, show child count; for Assets, show parent system and status; for Documents, show expiry/type.
- **Section Headers**: Standardize and slim down the right-column headers to use 10px bold tracking-widest typography.
- **Unified Shortcuts**: Center the keyboard hints (Open/Close) and ensure they are visually consistent.

## Functional Parity & Action Engine

- **Intent Restoration**: Fully wire `mount-asset`, `unmount-asset`, `close-incident`, and `create-pm` intents from `matchIntent` to functional handlers.
- **Smart Actions**: Show high-confidence AI actions at the top of the "All" and "Action" tabs.
- **Action Mapping**: Map "Action" tab items to real system routes and AI commands, respecting user roles (`useSession`).
- **Deep Linking**: Ensure all search results navigate to the correct routes, including tab-specific links (e.g., Legal tab for documents).

## Search & Filtering Refinement

- **Tab Consistency**: Ensure "Asset", "System", and "Document" tabs pull results correctly from both `useGlobalSearch` and `useTimKiemToanCuc`.
- **Result Density**: Standardize the rendering of search hits to include entity icons, title highlighting, and consistent metadata badges (e.g., System name for Assets).
- **Recent Items**: Maintain a compact "Recent" section when the query is empty.

## Technical Details

- Update `src/components/mirats/search/PowerSearch.tsx` to handle `onMouseEnter` and `onFocus` on `CommandItem` to update the preview state.
- Refactor the right-column conditional rendering to switch between "Empty State Hints" and "Result Preview".
- Add a new helper `handleExecuteIntent` in `PowerSearch.tsx` to handle complex actions like "Close Incident" or "Create PM".
- Fix the `DialogContent` padding and height to ensure the UI feels "fixed" to the frame without clipping.

## Verification Plan

- **Smoke Test**: Open Cmd+K, type "SC-12" to see "Close Incident" action.
- **Hover Test**: Hover over a "System" result to see the preview update with its details.
- **Tab Test**: Switch between "Asset" and "System" tabs to verify filtering logic.
- **Action Test**: Go to "Action" tab and verify role-based commands are visible.
- **Navigation Test**: Click a result and verify it leads to the correct deep link.
