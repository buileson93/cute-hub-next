# Plan - Mobile-First & Performance Standards

Update the MIRATS user menu to reflect the latest stage of UI migration: prioritizing mobile-first design (starting from 360px) and performance optimization, while ensuring responsive consistency across forms, tables, and complex views like Kanban/Gantt.

## User Review Required

> [!IMPORTANT]
> This update mandates a **Mobile-First** approach: 360px baseline, no generic `md:` hacks, and strict rules for navigation, forms, and heavy modules (OCR/Gantt/Maps). It also introduces performance standards like virtualization and lazy loading.

## Proposed Changes

### UI & Presentation
- Update `src/components/mirats/app-shell/index.tsx` to replace the "Container Policy & Archetypes" manifesto with the "Mobile-First & Performance" manifesto.
- Set the manifest header to "Mobile-First & Performance".
- Detail the core principles:
    - **Viewport Test**: 360px baseline, then expanding to tablet/desktop.
    - **Global Layout**: No horizontal scroll (except intended), safe-area support, mobile-friendly dialogs/sheets.
    - **Navigation**: Official MobileNav, max 4-5 actions, route change focus management.
    - **Forms**: Single column on mobile, full-width inputs, sticky footers with safe-area.
    - **Table/List**: Metadata economy, primary actions only, accessible swipe alternatives.
    - **Complex Views**: Kanban (status selector), Gantt (overview + horizontal pan), Timeline (marker standardization).
    - **Performance**: Lazy loading for heavy assets, virtualization for long lists, image dimension reservations to avoid CLS.
- Ensure proper JSX escaping for symbols and newlines.

## Technical Details

### Component & Logic
- **AppShell Dropdown**: Modify the `isInventoryMode` block in `src/components/mirats/app-shell/index.tsx`.

### Invariants
- No changes to business logic or Supabase RLS.
- Documentation/visual text update in the user menu.
