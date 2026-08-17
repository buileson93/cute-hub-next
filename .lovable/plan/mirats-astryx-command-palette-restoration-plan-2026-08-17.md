---
name: MIRATS Astryx Command Palette Restoration
description: Plan for restoring a compact, one-column Command Palette following Astryx visual contracts.
type: design
---

# MIRATS Astryx Command Palette Restoration Plan

## Context
The current Command Palette uses a split-pane layout with a large preview area (340px) and image preloading. This design occupies significant screen real estate and adds unnecessary complexity for a tool intended for rapid search and navigation. The goal is to migrate to a compact, single-column anatomy consistent with the Astryx design system.

## Objectives
- Implement a single-column "search → scan → select" Command Palette.
- Remove all preview-related logic, assets, and presentation.
- Standardize dimensions and typography according to the visual contract.

## Technical Details

### Checkpoint C1: Remove Preview from Layout Primitives
- **File:** `src/components/ui/command.tsx`
- Remove the `preview` prop from `CommandDialogProps`.
- Remove the conditional rendering in `CommandDialog` that handles the split-pane layout.
- Standardize `CommandDialog` to a single column with a max-width of `sm:max-w-2xl` (approx 672px, aligning with the "min(640px, ...)" contract).

### Checkpoint C2: Cleanup CommandPalette Implementation
- **File:** `src/components/mirats/CommandPalette.tsx`
- Remove all preview-related assets (`.jpg` imports).
- Remove `PreviewCat`, `PREVIEW_IMAGES`, `DEFAULT_PREVIEW_IMAGE`, `previewImageForCat`, `cmdkPreloaded`, `preloadPreviewImages`.
- Delete `PreviewImage`, `MetaCell`, and `CommandPreview` components.
- Remove state and effects related to `modelImgUrl` and `modelImgLoading`.

### Checkpoint C3: Compact Anatomy & Styling
- **File:** `src/components/mirats/CommandPalette.tsx`
- Update `CommandItem` to be compact: label (14px) and optional one-line subtitle.
- Ensure group headings are minimal (11-12px).
- Add a compact footer with keyboard hints (↑↓ Navigate, ↵ Select, Esc Close).
- **File:** `src/components/ui/command.tsx`
- Refine `CommandInput` (48-52px height) and `CommandItem` (40-44px height) styles.
- Set `CommandList` max-height to `min(70dvh, 520px)`.

### Checkpoint C4: Responsive & States
- Ensure the palette is nearly full-width on mobile (8-16px margins).
- Hide keyboard hints on mobile.
- Verify light/dark mode contrast using semantic tokens.

### Checkpoint C5: Verification & Asset Cleanup
- Run `rg` to ensure removed assets are not used elsewhere.
- Verify `AppShell` and global keyboard listeners are functioning.
- Confirm 0 preview image requests in the browser.

## Success Criteria
- [ ] No split-pane/preview area in the Command Palette.
- [ ] Single column layout with max-width ~640px.
- [ ] Keyboard navigation and search function perfectly.
- [ ] No regression in AI intent matching or RBAC filtering.
- [ ] Asset bundle size reduced (no preview images).
