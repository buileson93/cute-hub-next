# MIRATS 2.0 Project Lean Framework Architecture

## 1. Domain Entities & Database Mapping

### Core Tables (Additive)
- `project_framework_settings`: Feature flags (lean_ux_enabled, shape_up_enabled, ops_lane_enabled) and cycle defaults.
- `lean_ux_canvases`: 8-part canvas tied to project_id.
- `lean_ux_hypotheses`: Validatable statements linked to canvas/outcomes.
- `lean_ux_experiments`: Evidence-based tests for hypotheses.
- `pitches`: 5-part Shaping artifacts (Problem, Appetite, Solution, Rabbit Holes, No-Gos).
- `pitch_scopes`: Named work packages within a pitch (maps to Hill Chart markers).
- `betting_rounds`: Governance periods for investment decisions.
- `cycles`: Execution windows (Small 1-2w, Big 6w, Cooldown 2w).
- `hill_updates`: History of marker movements on the Hill Chart.
- `project_dossiers`: Sequential document registers for project artifacts.
- `dossier_documents`: Specific document records with versioning and storage links.

### Data Reuse Strategy
- `du_an`: Primary host for all framework data.
- `du_an_cong_viec`: Tasks will be linked to `pitch_scopes` to unify Hill Chart and Kanban/Gantt.
- `profiles`: Reuse existing RBAC and user identifiers.
- `storage`: Use existing buckets for dossier attachments with strict RLS.

## 2. UI Archetypes (Astryx Parity)
- **Discovery (PageFrame)**: 2-column responsive layout for Lean UX Canvas.
- **Delivery (Segmented View)**: Toolbar switching between Hill Chart (Visual), Kanban (Flow), and Gantt (Timeline).
- **Operations (Compact Table)**: Focused view on P0/P1 incidents with WIP indicators.
- **Dossier (Data Grid)**: High-density register with "Incomplete Metadata" support.

## 3. Security & RLS
- Every new table MUST have project-level RLS tied to `auth.uid()`.
- Grant SELECT/INSERT/UPDATE/DELETE to `authenticated` role.
- Use `saveEntityFieldSecurely.ts` for all field-level updates to ensure audit trails.
