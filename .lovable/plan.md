# Plan - MIRATS Unified Anatomy & Responsive Frame Standards

Update the MIRATS user menu to reflect the latest stage of UI migration: moving from custom page layouts to a standardized, token-backed anatomy that reduces nested padding and optimizes mobile viewport usage.

## User Review Required

> [!IMPORTANT]
> This update formally defines the "Unified Anatomy" strategy: standardization of page frames (Tracker, Form, Detail) and responsive behavior for toolbars and headers, emphasizing mobile-first ergonomics and vertical economy.

## Proposed Changes

### UI & Presentation
- Update `src/components/mirats/app-shell/index.tsx` to replace the "Astryx Token-Backed Density" manifesto with the "Unified Anatomy & Responsive Frame" manifesto.
- Set the manifest header to "Unified Anatomy & Responsive Frame".
- Detail the core principles:
    - **Page Frame**: Standardized breadcrumbs, single action line, MoreMenu for secondary actions.
    - **PageHeader**: Sticky policy (top nav only on mobile), order of actions (primary > secondary > overflow).
    - **PageBody**: Elimination of nested padding, `min-width: 0` policy for content regions.
    - **Toolbar Responsive**: Desktop (search+filter+actions line), Tablet (popover filters), Mobile (sheet filters, full-width search, workflow-based sticky/floating actions).
    - **Typed Archetypes**: Formalizing `PageFrame`, `TrackerFrame`, `FormFrame`, and `DetailFrame`.
- Ensure proper JSX escaping for symbols (`->`) and newlines (`{"\n"}`).

## Technical Details

### Component & Logic
- **AppShell Dropdown**: Modify the `isInventoryMode` block in `src/components/mirats/app-shell/index.tsx` (lines 158-185+).
- **Archetype Documentation**: This manifesto serves as the architectural requirement for future route refactors.

### Invariants
- No changes to business logic or Supabase RLS.
- Text update only (documentation within the app UI).
