# Plan: Fix Production Build Errors (Unexpected Token/JSX Expression)

The production build is failing due to complex JSX patterns and TypeScript errors in `StandardTable.tsx` and `ThanhPhanTable.tsx`. Specifically, logical operations (`&&`, `||`) and functions returning JSX are causing issues for the Vite/Rolldown transformation step. Additionally, there are type mismatches in `ThanhPhanTable.tsx`.

## Technical Details

1.  **Build Error in `StandardTable.tsx`**:
    *   Error: `[builtin:vite-transform] Unexpected token` at `src/components/mirats/StandardTable.js:429:38`.
    *   Cause: `renderGlobalState` is called within a ternary/logical expression in the JSX. Even though it's refactored, the transformation might still be struggling with how it's being invoked or the return types.
    *   Fix: Ensure `renderGlobalState` returns a stable ReactNode (not `null` if possible, or handle the `null` result very explicitly) and refactor its usage to avoid being inside a ternary condition that returns a function result.

2.  **Type Errors in `ThanhPhanTable.tsx`**:
    *   Errors: `totalCount` does not exist in `infiniteScroll` type.
    *   Cause: `StandardTableProps` defines `infiniteScroll` without a `totalCount` property.
    *   Fix: Update `StandardTableProps` interface in `StandardTable.tsx` to include `totalCount?: number` in the `infiniteScroll` object.

3.  **Visual Text Update**:
    *   Update `src/routes/__root.tsx` to display the provided build error text as literal display text for debugging/instruction purposes as requested.

## Implementation Steps

### 1. Update `StandardTable.tsx`
*   Modify `StandardTableProps` interface to include `totalCount` in `infiniteScroll`.
*   Refactor `renderGlobalState` to return a `Fragment` or empty div instead of `null` if needed for better transformation compatibility.
*   Update JSX usage of `renderGlobalState()` to be more direct.

### 2. Update `ThanhPhanTable.tsx`
*   Ensure all usages of `StandardTable` pass the correct props following the interface update.

### 3. Update `__root.tsx`
*   Replace the placeholder text with the literal build error text provided by the user.

## Verification
*   Run `npm run build` (or `bun run build`) to ensure the production build completes successfully.
*   Check the preview to verify the text update in the root component.
