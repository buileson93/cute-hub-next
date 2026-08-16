# MIRATS ASTRYX SAFE MIGRATION — P8/9 Report (Batch 1)

## Shell Retheming
- `src/components/mirats/app-shell/AppShell.tsx`: Applied `astryx-shell`, `astryx-shell-rail`, and `astryx-shell-sidebar` semantic classes. Mapped `bg-background` to `bg-surface-sunken` for improved contrast.
- `src/components/mirats/app-shell/Sidebar.tsx`: Integrated `astryx-nav-item` classes and `astryx-text-label-bold` for navigation groups.
- `src/components/mirats/app-shell/TopBar.tsx`: Themed search input with `bg-surface-muted/50` and applied Astryx typography.
- `src/components/mirats/app-shell/index.tsx`: Updated `UserMenu` and `TourButton` hover states to `hover:bg-surface-muted`.

## Batch 1: Dashboard & Overview (5/109 routes)
- `src/routes/_app.index.tsx` (Dashboard): Migrated to `MiratsPageHeader` and `MiratsPageBody`. Fixed `-mx-6` alignment for `HeartBeatStrip`.
- `src/routes/_app.tong-quan.tsx` (KPI Overview): Swapped legacy PageLayout for Astryx-themed counterparts.
- `src/routes/_app.thong-ke.laptop.tsx`: Restructured layout using `MiratsPageHeader` and `MiratsPageBody`. Corrected `subtitle` prop to `description`.
- `src/routes/_app.tuoi-tho.tsx`: Replaced legacy header and integrated `MiratsPageBody`.
- `src/routes/_app.chat-luong-du-lieu.tsx`: Ported to new layout wrappers.

## Inventory Progress
- **Inventory Created**: `docs/astryx-route-progress.md` (109 physical routes).
- **Batch 1 Status**: 5 routes completed (100% green).
- **Anti-Regression**: Verified Sidebar collapse/expand and localStorage persistence.

## Next Steps
- **Batch 2**: Catalog and List routes (`src/routes/_app.danh-muc.*`).
