# MIRATS ASTRYX SAFE MIGRATION — P7/9: HIGH-RISK INTERACTIONS

## Overview
Phase 7 focuses on complex interactive surfaces: `StandardTable`, `Dialog`, `Sheet`, `Drawer`, `CommandPalette`, and `Toast`. The goal is visual standardization while preserving 100% of existing behavior, especially virtualization, gestures, and focus management.

## Parity Matrix

| Component | Strategy | Implementation Detail | Risk |
|-----------|----------|-----------------------|------|
| `StandardTable` | **Retheme** | Keep existing orchestration (`tanstack/react-virtual`, custom responsive hooks). Apply Astryx tokens to `src/components/ui/table.tsx`. | **Medium**: Virtualization depends on precise row/cell heights. |
| `Dialog` | **Hybrid** | Migrate simple call sites to Astryx `Dialog`. Keep `src/components/ui/dialog.tsx` (Radix) for complex nested cases, applying Astryx tokens. | **Low**: Standard modal behavior. |
| `Sheet` | **Retheme** | Keep Radix `Sheet`. Apply Astryx layout/border/shadow tokens. | **Low**: Animation and side-slide behavior is stable. |
| `Drawer` | **Retheme** | Keep Vaul `Drawer`. Apply Astryx layout/border/shadow tokens. | **Low**: Gesture-based interaction is critical. |
| `Command` | **Migrate** | Replace custom `GlobalSearch.tsx` markup with Astryx `CommandPalette`. Keep `useGlobalSearch` data logic. | **Low**: Astryx component is built for this. |
| `Toast` | **Retheme** | Keep Sonner `Toaster`. Style toast elements with Astryx tokens. | **Low**: Sonner handles timing and undo logic well. |

## Implementation Steps

### Batch 1: Table & Catalog (Low-Risk Retheming)
1. **Tokenize Table Primitives**: Update `src/components/ui/table.tsx` to use Astryx CSS classes (e.g., `astryx-table`, `astryx-table-row`) and design tokens for borders, padding, and background.
2. **StandardTable Sync**: Ensure `StandardTable.tsx` correctly propagates these changes, especially for sticky headers and numeric mono alignment.
3. **Catalog Verification**: Verify `ThietBiTable` and other data-dense tables for alignment parity.

### Batch 2: Overlays & Portals (Focus & Z-Index)
1. **Tokenize Dialog/Sheet/Drawer**: Update `src/components/ui/dialog.tsx`, `sheet.tsx`, and `drawer.tsx` to use Astryx overlay backgrounds, border-radius, and shadows.
2. **Pilot Dialog Migration**: Migrate a small dialog (e.g., `DeleteConfirmation`) to use the native Astryx `Dialog` component.
3. **Portal Safety**: Verify z-index layering for nested popovers inside dialogs.

### Batch 3: Search & Notifications (Input & Timing)
1. **Global Search Migration**: Refactor `src/components/mirats/GlobalSearch.tsx` to use `CommandPalette` from `@astryxdesign/core/CommandPalette`.
2. **Toast Theming**: Update `src/components/ui/sonner.tsx` classes to match Astryx `Toast` appearance (info/error colors, radius).

## Invariants (Non-negotiable)
- **DOM Stability**: Do not change the `StandardTable` row/cell structure used by `useVirtualizer`.
- **Keyboard/A11y**: Escape to close, focus traps, and screen reader announcements must remain intact.
- **Data Logic**: `useGlobalSearch`, `useColumnPrefs`, and table filtering logic remain untouched.

## Verification Checklist
- [ ] **Table**: 1,185+ records scroll smoothly with `tanstack/react-virtual`.
- [ ] **Mobile**: Drawer gestures (drag to close) work on touch devices.
- [ ] **Overlay**: Focus returns to the trigger button after closing a dialog.
- [ ] **Search**: Cmd+K (if applicable) opens search; Arrow keys navigate results.
- [ ] **Toast**: Action/Undo buttons in toasts are functional and styled correctly.
