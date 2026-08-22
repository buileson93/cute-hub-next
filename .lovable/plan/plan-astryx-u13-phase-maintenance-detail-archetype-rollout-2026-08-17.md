# Plan - Astryx U13 Phase: Maintenance & Detail Archetype Rollout

Rollout of Astryx design language to Batch 2 (Maintenance & Operations) and Detail surfaces, ensuring high-density visual consistency and SSR safety.

## 1. Batch 2: Maintenance & Operations (U13.2) - DONE

- [x] `/bao-tri/index` -> Wrapped in `PageFrame`, standardized columns.
- [x] `/su-co/index` -> Wrapped in `PageFrame`, fixed fragment wrapping for Dialogs.
- [x] `/hong-hoc/index` (was `src/routes/_app.hong-hoc.tsx`) -> Wrapped in `PageFrame`, fixed missing imports.

## 2. Batch 3: Detail Archetype Rollout (U13.3)

- [ ] `/bao-tri/$maBaoTri` -> Migrate from `DetailLayout` to `PageFrame` + `InfoGrid` + `EdgeTabs` (Standardizing on the `Detail` archetype pilot).
- [ ] `/su-co/$maSuCo` -> Migrate to `Detail` archetype.
- [ ] `/hong-hoc/$maHongHoc` -> Migrate to `Detail` archetype.

## 3. Visual Parity Check

- Verify `PageHeader` actions consistency (size="sm" or icon-only).
- Check `PageFrame` density (standardizing on `compact` for MIRATS data density).
- Ensure `TabsContent` is edge-to-edge in Detail views.

## Technical Details

- Using `PageFrame` from `@/components/mirats/layout/PageFrame`.
- Standardizing column definitions to use `render` (ReactNode) instead of legacy `cell` (String) where applicable.
- Enforcing `compact` density for better data visualization on small screens.
