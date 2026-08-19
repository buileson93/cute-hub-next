# Plan - Container Policy & Archetype Standardization

Update the MIRATS user menu to reflect the latest stage of UI migration: establishing container policies for specific archetypes (Tracker, Dashboard, Forms, Media, Kanban, Timeline, Table) to ensure visual consistency and performance.

## User Review Required

> [!IMPORTANT]
> This update defines the "Container Policy" strategy for all route archetypes. It explicitly bans "Card-in-Card" patterns, mandates edge-to-edge lists for trackers, and defines responsive behavior for Kanban and Tables.

## Proposed Changes

### UI & Presentation
- Update `src/components/mirats/app-shell/index.tsx` to replace the "Unified Anatomy & Responsive Frame" manifesto with the "Container Policy & Archetypes" manifesto.
- Set the manifest header to "Container Policy & Archetypes".
- Detail the specific policies:
    - **Tracker/Work Tool**: Assets, systems, tasks, issues, projects, licenses, docs. Edge-to-edge Table/List with dividers. Select row to open LayoutPanel. No record-level Cards.
    - **Dashboard**: Cards only for standalone KPI/widget/chart. No nested Cards. Responsive grid with minimum size protection.
    - **Forms/Settings**: FormLayout/Section. Cards only for billing/dangerous/semantic boundaries.
    - **Media/Document**: Grid cards for thumbnails only. List mode uses rows with metadata and overflow actions.
    - **Kanban**: Region-based columns, compact interactive tasks. Single-line metadata. Mobile: one status at a time or tabbed swipe.
    - **Timeline**: Vertical List rows + dividers. No per-event Cards.
    - **Table**: Column priority/visibility. Mobile: compact list item or horizontal scroll with frozen key columns. No font shrinking for column fit.
- Ensure proper JSX escaping for symbols and newlines.

## Technical Details

### Component & Logic
- **AppShell Dropdown**: Modify the `isInventoryMode` block in `src/components/mirats/app-shell/index.tsx`.

### Invariants
- No changes to business logic or Supabase RLS.
- Purely a documentation/visual text update in the user menu.
