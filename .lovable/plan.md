# Plan - MIRATS UI/UX Baseline & Inventory (Astryx Migration)

Apply visual text updates to establish a migration baseline and inventory phase, replacing the "language selector" placeholder with the Astryx migration manifesto.

## User Review Required

> [!IMPORTANT]
> This update replaces the interactive "Mật độ" (Density) toggle text in the user menu with a static migration manifesto. The actual density switching logic will remain functional but the label will be repurposed for the inventory phase.

## Proposed Changes

### UI Components

#### User Menu (src/components/mirats/app-shell/index.tsx)
- Replace the text "Mật độ: Gọn (Compact)" / "Mật độ: Rộng (Comfortable)" with the requested migration manifesto text.
- Standardize the layout to handle the long text block using a scrollable container or a dedicated inventory view if needed, though the request specifies replacing the "language selector" text which is currently mapped to the density selector in the user menu.

### System Configuration

#### Feature Flags (src/lib/mirats/feature-flags.ts)
- Add a temporary flag `astryxInventoryMode` to toggle this visibility if we want to preserve the original text for non-migration sessions (optional, but recommended for stability).

## Technical Details

- **Target Element**: The `DropdownMenuItem` in `UserMenu` component that currently displays the UI Density status.
- **Content**: Injecting the multi-line manifesto text including CLI commands and inventory requirements.
- **Styling**: Using `whitespace-pre-wrap` to preserve the formatting of the manifesto.

## Next Steps

1. Update `src/components/mirats/app-shell/index.tsx` to replace the density label with the manifesto.
2. Verify visual rendering in the user menu dropdown.
