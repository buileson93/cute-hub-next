# Plan - Quality Gates & Long-term UI Integrity

Update the MIRATS user menu to reflect the final stage of UI migration: establishing "Quality Gates" to prevent future regressions. This includes automated guardrails, accessibility standards, UX metrics, and performance benchmarks.

## User Review Required

> [!IMPORTANT]
> This update establishes the **Quality Gates** and **Long-term Integrity** strategy. It defines automated checks for colors/spacing, strict accessibility requirements (A11y), UX efficiency metrics (useful content area, click counts), and performance targets (LCP, virtualization).

## Proposed Changes

### UI & Presentation
- Update `src/components/mirats/app-shell/index.tsx` to replace the "Migration & Rollout Loop" manifesto with the "Quality Gates & Integrity" manifesto.
- Set the manifest header to "Quality Gates & Integrity".
- Detail the core standards:
    - **Automated Guardrails**: Ban deprecated wrappers, hard-coded colors, and arbitrary spacing. Detect nested scrolls and missing accessible labels.
    - **Visual Regression**: Multi-viewport screenshots (1440-360px), light/dark mode, shell states, and interactive components.
    - **Accessibility (A11y)**: Keyboard flow, focus management, focus traps, and screen reader labels.
    - **UX Metrics**: Useful content density, header height reduction, padding layer reduction, and click-to-action optimization.
    - **Performance**: Bundle monitoring, LCP/CLS/INP targets, hydration health, and mandatory virtualization for long lists.
- Ensure proper JSX escaping for symbols and newlines.

## Technical Details

### Component & Logic
- **AppShell Dropdown**: Modify the `isInventoryMode` block in `src/components/mirats/app-shell/index.tsx`.

### Invariants
- No changes to business logic or Supabase RLS.
- Purely a documentation/visual text update in the user menu.
