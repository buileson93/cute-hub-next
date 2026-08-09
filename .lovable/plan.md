# Plan: UI/UX 2.0 - Phase 9 & 10 (System Tree Refactoring)

Refactor the massive `src/routes/_app.he-thong.cay.tsx` (6000+ lines) by extracting recursive rendering logic, MindMap visualization, and data processing into specialized components.

## 1. Modularization Strategy
- **Logic Extraction**: Move complex tree-building logic (`buildTree`, `buildUnitTree`) and visualization algorithms to `src/components/mirats/he-thong-cay/utils.ts`.
- **Component Splitting**:
    - `TreeView.tsx`: Recursive list-based system tree.
    - `CayMindMap.tsx`: React Flow-based mindmap visualization (extracting layout logic from `cay.tsx`).
    - `NodeSearch.tsx`: Functional search with level-based filtering.
    - `NodeEditorSheet.tsx`: Centralized form for editing all node types.
- **State Management**: Fully utilize `CayContext.tsx` to handle shared state (expanded nodes, active focus, search query, display mode) across the refactored components.

## 2. Implementation Steps
- **Step 1: Utilities**: Update `utils.ts` with the layout and tree construction logic currently in `cay.tsx`.
- **Step 2: TreeView**: Implement the recursive rendering logic in `TreeView.tsx`, including drag-and-drop support and action menus.
- **Step 3: CayMindMap**: Port the React Flow logic (nodes/edges generation, tidy-tree layout) to `CayMindMap.tsx`.
- **Step 4: Main Route Refactor**: Rewrite `src/routes/_app.he-thong.cay.tsx` to be a clean entry point that uses the new components and `CayContext`.

## 3. Technical Improvements
- Use `supabaseAdmin` in `mutations.ts` for privileged operations.
- Ensure strict type safety using `types.ts`.
- Optimize performance by moving heavy computations into `useMemo` hooks within specialized components.

## 4. Verification
- Verify that tree expansion, searching, and filtering work as before.
- Ensure the MindMap layout remains consistent and responsive.
- Test node editing and renaming via the extracted `NodeEditorSheet`.
