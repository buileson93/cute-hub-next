# Plan: Project OS & OS Lifecycle Audit

Review and optimize the Project Management (Lean OS), Document Timeline (Cong Van), and Storage modules to align with Astryx Design Standards and resolve identified P0/P1 bugs.

## Current Architecture Diagram

```text
[UI: _app.du-an.$id] --(view: kanban/gantt/discovery/hoso/cong-van)--> [Components]
      |
      +-- [LeanUXCanvas] <-> [Public.lean_ux_canvases]
      +-- [HillChart] <-> [Public.pitch_scopes] (Hardcoded mock currently)
      +-- [CongVanPanel] <-> [useCongVanData] <-> [Public.du_an_cong_van*]
      +-- [DossierRegister] <-> [Public.project_dossiers] (Hardcoded mock currently)

[Storage] <-> [r2.functions.ts] <-> [Cloudflare R2 / supabaseAdmin]
```

## Problem Identification (Audit Results)

### P0: Runtime & Logic Errors

1.  **Rules of Hooks Violation**: `Route.useSearch()` is called after an early return in `src/routes/_app.du-an.$id.tsx` (Line 165). This will crash React if `loadingDA` is true.
2.  **State Mismatch (Canvas)**: `LeanUXCanvas.tsx` inserts a new record every save because it doesn't capture the returned `id` from the initial insert.
3.  **Fragmented Search**: Kanban, Gantt, and List views in Project Detail use local search state instead of unified header search.

### P1: Missing Integrations

4.  **Mock Data**: `HillChart`, `DossierRegister`, and `OperationsLane` are using hardcoded mock data instead of the `project_lean_framework.sql` tables.
5.  **Navigation Gaps**: `TabsContent` for `hoso` exists, but there is no `TabsTrigger` for it in the main UI.
6.  **Timeline**: Cong Van has a timeline, but there is no unified project timeline (combining milestones + documents).

### P2: UI/UX (Astryx Parity)

7.  **Density**: Kanban and Gantt views need to adopt Astryx density tokens (`data-density="comfortable"`).
8.  **Interactive Gantt**: Current Gantt is read-only; needs drag/drop and dependency management.

## Technical Tasks

### 1. Unified Project & Storage API

- Fix `LeanUXCanvas` to query by `project_id` on mount and update local state with `id` after insert.
- Connect `HillChart` to `pitch_scopes` and `DossierRegister` to `dossier_documents`.
- Implement `can_edit_cong_viec` RPC check for granular RLS.

### 2. Document & Extension Readiness

- **Storage Adapter**: Review `r2.functions.ts` to ensure it supports large PDF uploads via presigned URLs.
- **Extension API**: Design a public endpoint `/api/public/ext/cong-van` that accepts PDF + metadata from a browser extension, verifying via a project-specific `API_KEY`.

### 3. Astryx UI Alignment

- Refactor `CongVanPanel` to use the Astryx `LayoutPanel` (Master-Detail) for viewing document details.
- Replace generic `Badge` statuses with Astryx `StatusDot` for project health.

## Proposed Files to Modify

- `src/routes/_app.du-an.$id.tsx`: Fix hooks, add missing tabs, unify search.
- `src/components/mirats/projects/discovery/LeanUXCanvas.tsx`: Fix persistence logic.
- `src/components/mirats/projects/delivery/HillChart.tsx`: Connect to DB.
- `src/components/mirats/projects/dossier/DossierRegister.tsx`: Connect to DB.
- `src/lib/mirats/r2.functions.ts`: Harden security and upload session logic.

## Chrome/Edge Extension Manifest (V3 Draft)

```json
{
  "manifest_version": 3,
  "name": "MIRATS Cong Van Capture",
  "permissions": ["activeTab", "storage"],
  "host_permissions": ["*://*.lovable.app/*", "https://vatm.app/*"],
  "action": { "default_popup": "popup.html" }
}
```

## Risk & Rollback

- **Risk**: RLS changes might block existing project access.
- **Rollback**: Keep existing `du_an_cong_viec` table logic active while migrating to Lean OS cycles.

Do not write code until this plan is approved.
