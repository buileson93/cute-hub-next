# Plan - MIRATS Density & Token-Backed UI Restoration

Update the MIRATS user menu to reflect the latest stage of UI migration: moving from custom "UI_DENSITY" logic to Astryx token-backed density.

## User Review Required

> [!IMPORTANT]
> This update formally defines the shift towards standardized density (28-32px controls, 32-40px rows) and the elimination of arbitrary sizing (`text-[11px]`, `rounded-[...]`) in favor of official Astryx semantic tokens.

## Proposed Changes

### UI & Presentation
- Update `src/components/mirats/app-shell/index.tsx` to replace the "Visual Contract & Source Fidelity" manifesto with the "Astryx Token-Backed Density" manifesto.
- Set the manifest header to "Astryx Token-Backed Density".
- Detail the core principles:
    - **Source of Truth**: Spacing (4px base), Sizes (sm/md/lg), Radius, Semantic Typo, Shadows.
    - **Work Tool Targets**: Compact/Balanced density defaults, standardized control and row heights.
    - **Mobile Strategy**: Pseudo hit targets for accessibility, readable body text, avoiding excessive small supporting text.
    - **Density Settings**: Viewport-aware + User Override, centralized at shell root.
    - **Token Bridge**: Allowlisting for charts, but strict enforcement of tokens elsewhere.
- Ensure proper JSX escaping for newlines (`{"\n"}`) and formatting.

## Technical Details

### Component & Logic
- **AppShell Dropdown**: Modify the `isInventoryMode` block in `src/components/mirats/app-shell/index.tsx`.
- **Styling Standards**: This manifesto serves as the documentation for the next phase of CSS cleanup, guiding the removal of `data-density` nested overrides.

### Invariants
- No changes to business logic or Supabase RLS.
- Text update only (documentation within the app UI).
