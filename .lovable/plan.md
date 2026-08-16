# Plan: [MIRATS ASTRYX SAFE MIGRATION — P9/9: FINAL QA + GUARDRAILS]

Final Phase of the Astryx Design System migration. Focuses on full validation, accessibility audit, automated guardrails, and documentation.

## Phase 9.1: Automated Integrity Audit
- Run `vitest src/lib/mirats/__tests__/structural-integrity.test.ts` to verify tab consistency and orphan prevention.
- Execute `bun src/scripts/check-orphaned-components.ts` (using ts-morph) for deep reference checking.
- Perform a repository-wide grep for `text-[...`, `bg-[#...`, and legacy shadcn components in migrated routes to identify remaining visual debt.

## Phase 9.2: Visual & Functional QA Matrix
- **Parity Check**: Verify 10 critical routes (Dashboard, Catalog, Forms, System Detail, Diagram, etc.) across:
    - Themes: Light / Dark.
    - Density: Compact / Comfortable.
    - Viewports: Desktop (1280), Tablet (768), Mobile (390).
    - Motion: prefers-reduced-motion (on/off).
- **Interaction Audit**:
    - Focus Management: Modal focus trap, return focus, Escape key closing.
    - Navigation: Deep-linking, breadcrumbs, Sidebar persistence.
    - Performance: Re-render monitoring on Table filter/sort.

## Phase 9.3: Accessibility (a11y) & Standards
- Verify WCAG 2.1 compliance (Contrast >= 4.5:1 for body text).
- Check `aria-label` on all icon-only buttons (MiratsIconButton).
- Validate keyboard navigation flow (Tab order) in complex forms and tables.

## Phase 9.4: Guardrails & Documentation
- **UI Standards**: Create `docs/astryx-ui-standard.md` defining:
    - Token usage rules.
    - Component decision tree (When to use Astryx vs. legacy Radix).
    - Motion and hover principles.
- **Linting Guardrail**: Add a custom script/linter warning for hardcoded hex colors or arbitrary spacing outside `ui-density.ts`.

## Phase 9.5: Cleanup & Release Preparation
- Generate final `docs/astryx-route-progress.md` confirming 100% completion (or documented legacy exceptions).
- List orphaned components for future removal (Safe Cleanup List).
- Final `npm run build` verification.

## Technical Details
- Tooling: Vitest, ts-morph, Astryx CLI, Lucide icons.
- Constraints: No functional refactoring; only visual/accessibility patches allowed.
