# Plan: IMPLEMENTATION MODE — TREE/MINDMAP DISPLAY NAME CONTRACT ONLY

Fix the issue where meaningful component names (`_thanhPhanTen`) are ignored in the Hierarchy Tree and Mindmap, being replaced by raw UUIDs, business codes, or fallback asset names.

## Root Cause Analysis
- `thiet_bi` query correctly fetches `gan_chuc_nang.he_thong_thanh_phan(id, ma_thanh_phan, ten)`.
- `_thanhPhanTen` is correctly mapped in the `DbDevice` object.
- However, `resolveThietBi` in `db-taxonomy.ts` (used by `TreeView` and `CayMindMap`) ignores this field.
- Multiple resolvers (`tbLabel`, `tbMind`, `resolveThietBi`) have inconsistent logic and fallback to raw codes/UUIDs.

## Display Name Contract
For a device node linked to a component:
1. **Primary Label**: `_thanhPhanTen` (trimmed, valid).
2. **Fallback 1**: If missing, lookup component name by `_thanhPhanId` in registry.
3. **Fallback 2**: `d.ten` (asset name).
4. **Fallback 3**: `_modelTen` or meaningful device type.
5. **Final Fallback**: "Chưa có tên". Never show raw UUID/Code as primary.

**Secondary Metadata**: Mã thành phần (`_thanhPhanMa`), mã tài sản (`ma_thiet_bi`) are shown only in tooltips or CodeBadges.

## Technical Details

### Phase 1: Unified Display Resolver
Move naming logic from individual components to a central, typed resolver in `db-taxonomy.ts`.

```typescript
type NodeDisplayIdentity = {
  primaryLabel: string;
  componentName?: string;
  assetName?: string;
  componentCode?: string;
  assetCode?: string;
  canonicalComponentId?: string;
  canonicalAssetId: string;
  source: "component" | "registry" | "asset" | "model" | "type" | "missing";
};

// resolveDeviceDisplayIdentity(device, overrides, registry): NodeDisplayIdentity
```

### Phase 2: Implementation Steps
1. **`db-taxonomy.ts`**:
   - Add `NodeDisplayIdentity` type.
   - Implement `resolveDeviceDisplayIdentity` logic following the contract.
   - Refactor `resolveThietBi` to use this new logic or return the identity object.
2. **`TreeView.tsx` & `CayMindMap.tsx`**:
   - Update to use the unified resolver.
   - Display `primaryLabel` as the main node text.
   - Move codes to tooltips via `TruncatedNodeLabel`.
3. **`TruncatedNodeLabel.tsx`**:
   - Update to handle the new identity object if necessary, or ensure it clearly labels "Mã thành phần" vs "Mã tài sản".
4. **`utils.ts`**:
   - Review `buildTree` to ensure it doesn't accidentally fallback to composite keys for display.

## Verification Plan
1. **Unit Tests**: Create `tests/taxonomy-resolver.test.ts` to verify the naming hierarchy (Component > Asset > Model > Type).
2. **Visual Check**: Open the Mindmap and Tree for a node where component name is known but asset name is different. Verify the component name is primary.
3. **Tooltip Check**: Hover over nodes to verify that codes are still accessible but not intrusive.
4. **Regression**: Run existing build and lint checks.
