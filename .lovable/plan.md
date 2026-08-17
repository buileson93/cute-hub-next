# [MIRATS ASTRYX TEMPLATES — U10: FORM PAGE ARCHETYPE]

## Pilot Route
- `src/routes/_app.forms.new.$code.tsx`

## Proposed Refactor
- **Anatomy**:
  - Replace current root `div` with `PageFrame` (density: comfortable).
  - Use `PageHeader` for title, subtitle (code), breadcrumbs, and primary actions (Save, Submit).
  - Wrap content in `PageBody` with a max-width container (approx. 800px) for readability.
  - Divide form into logical `PageSection` units.
  - Implement a sticky `PageFooter` for the save/submit bar.
- **Visuals**:
  - Remove full-page `astryx-surface` card.
  - Standardize `Label` and `Input` appearance using `FormLabel` (Astryx typography).
  - Use `InfoHint` in header for template description.
- **UX Parity**:
  - Keep all `useQuery`, `useMutation`, and local state (`values`, `checklist`, etc.).
  - Preserve `visible_if` and `evalVisible` logic for dynamic fields.
  - Maintain the asset and system picker logic.
  - Ensure error validation messages are prominently displayed using an error summary at the top of the body if validation fails.

## Technical Tasks
1. Update imports in `src/routes/_app.forms.new.$code.tsx` to include new UI primitives.
2. Refactor the `return` JSX structure to follow `PageFrame` -> `PageHeader` -> `PageBody` -> `PageSection` pattern.
3. Clean up legacy Tailwind utility classes that conflict with the new design system.
4. Verify build and basic form interaction.
