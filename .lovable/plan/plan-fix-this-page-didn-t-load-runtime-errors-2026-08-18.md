# Plan - Fix "This page didn't load" Runtime Errors

The user is experiencing recurring "This page didn't load" errors across various parts of the application. This error is triggered by the `ErrorComponent` in `src/routes/__root.tsx`, which catches unhandled runtime errors in the route hierarchy.

## Analysis

The "This page didn't load" error is a generic fallback. Based on recent changes and common failure points in TanStack Start/Supabase projects:

1. **SSR Hydration Mismatches**: Browser-only code running during SSR.
2. **Context Provider Nesting**: Hooks being called outside their required providers (e.g., `ReactFlow`, `CayContext`).
3. **Data Fetching/Processing Errors**: Errors during `useQuery` or `useMemo` when data is missing or malformed (e.g., `buildTree` logic).
4. **Invalid Hook Calls**: Conditional hook calls or improper ordering.

## Proposed Changes

### 1. Root Error Component Enhancement

- Improve `ErrorComponent` in `src/routes/__root.tsx` to show more descriptive error details (message and stack trace) in development mode to help users and agents diagnose the specific cause.
- Add a "Clear Cache & Home" button that clears `localStorage` and `queryClient` to resolve persistent state-related crashes.

### 2. System Tree & MindMap Stability

- **`src/routes/_app.he-thong.cay.tsx`**:
  - Add a `CatchBoundary` or specific `errorComponent` to the route to isolate crashes within the System Tree from the rest of the app shell.
  - Ensure `devices` and `taxonomy` are fully loaded and not undefined before passing to `buildTree`.
  - Wrap `buildTree` in a more robust `try-catch` block inside `useMemo`.
- **`src/components/mirats/he-thong-cay/CayMindMap.tsx`**:
  - Stabilize `useReactFlow` usage. It should only be used inside the `ReactFlowProvider`.
  - Add safety checks for `rf` (ReactFlow instance) before calling methods like `fitView` or `project`.

### 3. Global Data Fetching Guards

- Review `useQuery` calls in `_app.index.tsx` and `_app.tong-quan.tsx` for potential undefined access.
- Ensure `supabase` client calls are properly handled, especially when results might be null or errors occur during SSR.

## Technical Details

- **Error Isolation**: Use `@tanstack/react-router`'s `errorComponent` at the route level to prevent sub-page crashes from breaking the entire `AppShell`.
- **SSR Safety**: Use `useHydrated` hook or `useEffect` for any logic that touches `window`, `document`, or `localStorage`.
- **Data Integrity**: Add Zod validation or explicit null checks in `buildTree` and `filterTreeByBadge` to prevent `Cannot read property 'x' of undefined`.

## Verification Plan

- **Manual Test**: Navigate through `/he-thong/cay`, `/tong-quan`, and `/du-an` to check for crashes.
- **Automated Check**: Use Playwright to detect the presence of "This page didn't load" text on key routes.
- **Console Audit**: Check for "Invalid Hook Call" or "Hydration failed" warnings in the browser console.
