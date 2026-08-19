# Plan - MIRATS Astryx Exact Parity Stage

The goal is to update the visual text in the User Menu to reflect the **Astryx Exact Parity** stage for MIRATS. This phase focuses on technical compatibility, component vendor/swizzle modes, and the standardized adapter mapping between shadcn and Astryx.

## Proposed Changes

### App Shell

- Update the "Astryx Migration Roadmap" text block in `src/components/mirats/app-shell/index.tsx` (lines 145-186) to display the new "Astryx Exact Parity" manifesto.
- The content will cover:
    - Upstream pin details (React 19+, version 0.4.5).
    - Step 1: Compatibility Report (React DOM, dependency tree, StyleX compiler).
    - Step 2: Component Modes (Official Dist, Swizzle/Vendor, CSS Compatibility).
    - Step 3: Testing Order (from primitives to complex layouts).
    - Step 4: Adapter Map (shadcn to Astryx component mapping).

## Technical Details

- No code logic or business rules will be modified.
- The `astryxInventoryMode` feature flag remains active to show this information in the UI.
- All new lines and special characters will be correctly escaped for JSX compatibility.

## Verification Plan

### Manual Verification
- Open the User Menu in the preview.
- Verify the content under "Lộ trình di chuyển Astryx" matches the new manifesto.
- Ensure the scrollable area correctly displays all 4 steps and the adapter map.
- Confirm no UI regressions or hydration errors in the console.
