---
name: Phase 10J: UI Contract & Primitive Ownership
description: Establish primitive style ownership, migrate raw controls, and enforce accessibility/visual regression standards.
type: feature
---

# Phase 10J: UI Contract & Hardening

## 1. UI Infrastructure & Ownership
- **Style Ownership:** Clarify ownership between Tailwind, shadcn, and Astryx tokens. Avoid `!important` hacks.
- **Primitive Consolidation:** Standardize `Button`, `Input`, `Select`, `Dialog`, and `Table`.
- **Global CSS Cleanup:** Scope table and button selectors to specific components to prevent side effects.
- **Fixture Creation:** Create visual test fixtures for core components at multiple breakpoints (390/768/1024/1440).

## 2. Accessibility & Interaction (A11y)
- **Accessible Names:** Ensure every icon-only control has an `aria-label` or `sr-only` text.
- **Keyboard Navigation:** Audit and fix Tab/Enter/Space/Escape flows. Ensure `focus-visible` is prominent.
- **Touch Targets:** Minimum 44px for mobile interactive elements.
- **Screen Reader Support:** Verify roles, names, and states for complex components like Dialogs and Selects.

## 3. Visual Integrity & Regression
- **Inventory & Migration:** Migrate remaining raw `button` and `table` tags to standard components using a module-by-module allowlist.
- **Baseline Screenshots:** Establish mobile/desktop baseline screenshots before major structural changes.
- **Audit Guard:** Run `ui:audit` and visual regression tests. Every pixel diff must be justified.

## Technical Tasks
- Update `src/components/mirats/TzClock.tsx` `aria-label` with the Phase 10J requirement text.
- Refactor `Button.tsx` to remove legacy loading logic and redundant styles.
- Implement module-level CSS scoping for `DataTableCore` and `StandardTable`.
- Audit all `lucide-react` icons in interactive elements for missing labels.

## Expected Outcomes
- Green results for `ui:audit`, visual regression, and accessibility tests.
- Clear separation of visual property ownership.
- Zero raw controls outside the allowlist.
- Fully accessible keyboard/touch/screen-reader experience.
