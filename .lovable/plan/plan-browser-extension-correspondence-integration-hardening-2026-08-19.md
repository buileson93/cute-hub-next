# Plan: Browser Extension & Correspondence Integration Hardening

Finalizing the integration for the Browser Extension, ensuring correspondence data integrity, secure OCR artifact reuse, and unified project lifecycle visibility.

## User Review Required

> [!IMPORTANT]
>
> - **OCR Quality Validation**: We will implement a basic "quality validation" check that flags OCR payloads from external sources if their average confidence is below 70% or if they lack required Vietnamese character density.
> - **DocViewer Access**: Correspondence files will be served via Supabase Storage signed URLs. Ensure the `du_an_cong_van` bucket exists and has proper RLS.
> - **Task linking**: Linking a correspondence to a task will trigger a notification to the task's assignee (nguoi_xu_ly_chinh).

- Should notifications be sent via email, in-app toast, or both? (Default: In-app notification table + Toast).
- For OCR artifact reuse, if a compatible artifact is found but the extension provides a new one, should we prioritize the extension's version or the existing one? (Default: Prioritize existing "completed" artifact if confidence > 90%).

## Technical Details

### 1. Unified Event Logging & Timeline

- **Source Attribute**: Hardening `du_an_su_kien` to store `source: 'extension'` without exposing keys/device info.
- **Chronology**: Ensuring `occurred_at` (actual document date) is used for timeline sorting, while `created_at` tracks system entry.
- **Trigger Enhancement**: Update `fn_log_project_event` to handle correspondence linking and metadata formatting for the timeline.

### 2. OCR Lifecycle & Artifact Reuse

- **Queuing**: When a document is uploaded via extension, mark it as `queued` for OCR if no artifact exists.
- **Collective Intelligence**: Implementation of `artifactReuseManager.attemptReuse` in the Correspondence flow to check SHA-256 before starting local OCR.
- **Secure Publishing**: Restricting `ocr_artifacts:publish` scope to validated extension keys.

### 3. UI/UX Improvements (Astryx Parity)

- **Document Viewer**: Integration of `DocViewerDialog` into `CongVanSheet` for immediate PDF previewing.
- **Metadata Links**: Adding "Related Documents", "References", and "Responses" sections to `CongVanSheet`.
- **Search**: Extending `PowerSearch` and `CongVanPanel` to filter by OCR content (using the `normalized_text` column) and issuing body.

### 4. Notifications & Idempotency

- **Deduplication**: Use `idempotency_key` (e.g., extension's internal upload ID) to prevent double notifications or duplicate logs.
- **Assignment Alerts**: Automated notification generation when `metadata.assigned_task_id` is present in the upload payload.

## Proposed Changes

### Database (Migrations)

- Add `idempotency_key` (unique) to `du_an_cong_van`.
- Add `source` and `device_info_hidden` flag to `du_an_su_kien`.
- Ensure `du_an_cong_van_lien_ket` supports self-referencing links for "Response/Replacement".

### Backend (Server Functions & API)

- `src/routes/api/public/ext/cong-van.ts`: Enhance validation, handle idempotency, and trigger task-linking logic.
- `src/lib/mirats/auth/api-keys.functions.ts`: Add `ocr_artifacts:publish` scope validation.

### Components (Frontend)

- `src/components/mirats/congvan/CongVanPanel.tsx`: Add search by OCR content.
- `src/components/mirats/congvan/CongVanSheet.tsx`: Integrate `DocViewerDialog` and link management.
- `src/components/mirats/projects/timeline/ProjectTimeline.tsx`: Support displaying "Extension" as a source label.
