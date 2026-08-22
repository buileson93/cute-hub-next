# Plan - Project Lean Operating System (MIRATS 2.0)

Establish a Lean UX + Shape Up + Lightweight Operations Kanban framework within the project management module, along with a sequential Project Dossier register.

## Discovery and Audit (C0)

- Audit `src/routes/_app.du-an.$id.tsx` and data models for project/task/Gantt/Kanban.
- Baseline existing workflows and capture screenshots for regression testing.
- Verify RBAC roles (`quan_ly_du_an`, `to_truong`, `admin`) and storage policies.

## Infrastructure and Feature Flags (C1)

- Create `docs/project-lean-framework.md` mapping reuse strategies for existing tables.
- Add `project_framework_settings` table to control feature visibility (Lean UX, Shape Up, Ops Lane).
- Implement additive migrations for new domain entities (Discovery, Shaping, Cycles, Hill, Dossier).

## Lean UX Discovery (C2)

- Implement `LeanUXCanvas` component (8 sections) with drafting and validation states.
- Connect Canvas to `Hypotheses` and `Experiments` with evidence linking.
- Ensure SSR-safe forms and RBAC enforcement for discovery actions.

## Shaping and Betting (C3-C4)

- Build `PitchEditor` (Problem, Appetite, Solution, Rabbit Holes, No-Gos).
- Implement `BettingTable` for leadership decision-making with capacity conflict detection.
- Add lifecycle management for Pitches (Shaping -> Ready -> Bet/Not Bet).

## Delivery and Hill Chart (C5-C6)

- Implement `Cycle` management (Small Batch, Big Batch, Cooldown) with fixed-time/variable-scope rules.
- Build `HillChart` visualization (Uncertainty vs. Execution) with keyboard controls and history.
- Ensure Hill Chart markers are linked to task scopes but track "unknowns," not task completion %.

## Segmented Delivery View (C7)

- Integrate Hill | Kanban | Gantt as segmented views in the Project Detail `Delivery` tab.
- Ensure all views share the same task source of truth (no data duplication).
- Verify no regression in existing Gantt/Kanban drag-and-drop or filtering behaviors.

## Operations Lane (C8)

- Implement parallel lightweight Kanban for urgent incidents (P0/P1).
- Add WIP limit enforcement and interruption tracking for build cycles.
- Reuse existing ticket/task engine for operational items.

## Project Dossier (C9)

- Create `DossierRegister` for sequential document logging (Tên, Trích yếu, Ngày, Hình thức, Cơ quan).
- Allow saving documents with missing metadata ("Cần bổ sung").
- Implement versioning, secure file storage, and Vietnamese-friendly Excel/CSV export.

## Metrics and Final QA (C10-C12)

- Build `LeanDashboard` metrics: Shipping Rate, Scope Cut Ratio, Meeting Overhead, Hill Staleness.
- Conduct final QA: 1280/768/390 viewports, Light/Dark modes, SSR stability, and RBAC security.
- Pilot the framework on a single project before workspace-wide rollout.

## Technical Details

- **Stack**: React 19.2, TanStack Start/Router, Supabase RLS, Tailwind v4, Astryx UI.
- **Constraints**: No direct `.update()` calls in UI (use `saveEntityFieldSecurely.ts`).
- **Data Protection**: Tenant isolation and server-side RBAC validation for all document access.
