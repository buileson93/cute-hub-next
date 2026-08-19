# Plan - Incremental Migration & Rollout Strategy

Update the MIRATS user menu to reflect the latest stage of UI migration: prioritizing an incremental rollout strategy over a full rewrite, defining a clear phased approach (P0 Foundation, P1 Core, P2 Supporting), and establishing a rigorous per-route migration loop.

## User Review Required

> [!IMPORTANT]
> This update establishes the **Rollout Strategy**: surface-by-surface migration with a strict 11-step loop per route. It forbids merging large batches of untested routes and defines the priority order for core workflows like Assets, Systems, and Projects.

## Proposed Changes

### UI & Presentation
- Update `src/components/mirats/app-shell/index.tsx` to replace the "Mobile-First & Performance" manifesto with the "Migration & Rollout Loop" manifesto.
- Set the manifest header to "Migration & Rollout Loop".
- Detail the core principles:
    - **Phased Roadmap**: P0 (Foundation, AppShell, Primitives), P1 (Assets, Systems, Projects, Documents), P2 (Dashboards, Forms, Admin).
    - **Per-Route Loop**: 11 steps including before/after snapshots, responsive contracts, logic preservation, and 5-viewport testing.
    - **Quality Gates**: No legacy wrappers, light/dark mode verification, and strict typechecking/testing before completion.
- Ensure proper JSX escaping for symbols and newlines.

## Technical Details

### Component & Logic
- **AppShell Dropdown**: Modify the `isInventoryMode` block in `src/components/mirats/app-shell/index.tsx`.

### Invariants
- No changes to business logic or Supabase RLS.
- Purely a documentation/visual text update in the user menu.
