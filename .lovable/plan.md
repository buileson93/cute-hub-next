# Plan - MIRATS Visual Contract Restoration & Parity Implementation

Update the MIRATS user menu to reflect the latest "Visual Contract & Source Fidelity" implementation stage, emphasizing source-of-truth fidelity, vendor-safe CSS layering, and the "no-runtime-component-import" rule for production.

## User Review Required

> [!IMPORTANT]
> This change updates the technical manifesto displayed in the user menu. It defines the "Source Fidelity" strategy: how we replicate Astryx's look without bundling its React source code into production.

## Proposed Changes

### UI & Presentation
- Update `src/components/mirats/app-shell/index.tsx` to replace the previous "Parity Harness" text with the "Visual Contract & Source Fidelity" manifesto.
- Set the manifest header to "Visual Contract & Source Fidelity".
- Implement the detailed 9-step implementation roadmap (Thu thập nguyên gốc, Static CSS Vendor, CSS Layer, Anatomy & State mapping, Visual & Motion, Behavior Layer, Priority list, Reference Harness, Mobile/Real-device testing).
- Ensure 100% fidelity to the requested text while maintaining proper JSX escaping for symbols and newlines.

## Technical Details

### Component & Logic
- **AppShell Dropdown**: Modify the conditional rendering block (lines 138-181) that displays the migration manifesto.
- **JSX Escaping**: Use `{"\n"}` for line breaks and `{"<"}` / `{">"}` for angle brackets to ensure the React build remains stable.
- **ScrollArea**: Maintain the existing `ScrollArea` container for content readability.

### Invariants
- No changes to business logic or Supabase RLS.
- No changes to actual component styles in this turn (text update only).
- Keep the `isInventoryMode` flag logic as the trigger for displaying this text.
