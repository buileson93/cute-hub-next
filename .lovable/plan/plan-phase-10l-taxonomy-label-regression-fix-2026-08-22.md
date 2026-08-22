# Plan - Phase 10L: Taxonomy Label Regression Fix

Update the visual status text and implement a systematic fix for the taxonomy label regression in the hierarchical tree and master diagrams.

## User Review Required

> [!IMPORTANT]
> This phase focuses strictly on fixing the regression where UUIDs or technical codes are shown instead of human-readable Vietnamese names in the tree and mindmap views. No CSS changes are permitted in this prompt.

### 1. Visual Status Update
- **Target**: `src/components/mirats/TzClock.tsx`
- **Action**: Verbatim replacement of `aria-label` with the Phase 10L instruction text.

### 2. Core Fix: Taxonomy Resolver
- **Issue**: Nodes in "CÂY PHÂN CẤP / SƠ ĐỒ TỔNG THỂ" display UUIDs or codes because mapping logic falls back to raw keys when lookups fail.
- **Implementation**:
    - Create typed resolvers in `src/lib/mirats/db-taxonomy.ts` that index by both `id` and `ma`.
    - Normalize tree models to use canonical IDs for relationships but human-readable labels for display.
    - Ensure UI components (`CayMindMap.tsx`, `TruncatedNodeLabel`) consistently use the `label` property.
    - Enhance tooltips to show both name and code.

## Technical Details

### 1. Documentation Update
- Update `src/components/mirats/TzClock.tsx`.
- Replace existing `aria-label` content with the provided instructions for Phase 10L verbatim.

### 2. Systematic Debugging & Testing
- Create a characterization test (`tests/taxonomy-regression.test.ts`) that reproduces the label fallback issue using a fixture with mixed UUID/code references.
- Implement controlled logging in development to verify namespace mapping at each tree level.

### 3. Resolver Implementation
- Define `resolvePhanLoai`, `resolveNhom`, `resolveHeThong`, and `resolveThietBi` in `src/lib/mirats/db-taxonomy.ts`.
- These resolvers must handle both UUID and business code lookups efficiently via Maps.

### 4. Tree & Mindmap Normalization
- Refactor `buildTree` logic in `src/routes/_app.he-thong.cay.tsx` and `CayMindMap.tsx` to use the new resolvers.
- Prevent duplicate nodes caused by inconsistent reference types (UUID vs. code).
- Ensure search, export, and rename functions remain connected to the correct canonical IDs.

### 5. UI Polish (No CSS)
- Update `TruncatedNodeLabel` to properly render names as primary text and codes in tooltips/secondary metadata.
- Handle edge cases (orphan refs, deleted categories) by showing "Chưa có tên" + code instead of raw UUIDs.
