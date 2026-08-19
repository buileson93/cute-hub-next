# Plan: Finalize Testing and Rollout for Project Workspace, Timeline, API, and Extension

Finalize the implementation by establishing a robust testing suite, implementing feature flags for controlled rollout, and preparing comprehensive documentation and guides.

## 1. Infrastructure: Feature Flags & Phased Rollout

Enable controlled deployment using feature flags and a kill switch mechanism.

- Add flags to `src/lib/mirats/feature-flags.ts`:
    - `projectWorkspaceV2`: New project management modules.
    - `projectTimeline`: Unified vertical activity timeline.
    - `externalDocumentApi`: Access to correspondence/upload APIs.
    - `browserExtensionUpload`: Specifically for extension-driven uploads (kill switch).
- Implement a 4-phase rollout strategy:
    - **Phase 1**: Internal stabilization (Timeline & Project OS).
    - **Phase 2**: Admin Alpha (API Key & Upload API).
    - **Phase 3**: Allowlisted Beta (Browser Extension).
    - **Phase 4**: General Availability (OCR, Deep Search, and Backfill).

## 2. Testing Suite: Unit & Integration

Establish verification guards to prevent regressions in security or data integrity.

- **Unit Tests (`vitest`)**:
    - `LeanUXCanvas`: Verify versioned upsert logic.
    - `ProjectTimeline`: Verify chronological sorting and multi-source filtering.
    - `ApiKeySecurity`: Deep verification of HMAC-SHA256 entropy and scope parsing.
    - `PdfValidation`: Test magic-byte checks and filename sanitization.
- **Integration Tests**:
    - **RBAC & Scopes**: Verify a key with `projects:read` cannot invoke `project_correspondence:write`.
    - **Project Boundary**: Verify that limiting a key to "Project A" prevents access to "Project B" (404 behavior).
    - **Idempotency**: Ensure concurrent retry of the same `idempotency_key` results in a single database record.
    - **Revocation Flow**: Verify that revoking a key mid-upload session immediately terminates subsequent steps.
    - **OCR Artifacts**: Verify that valid existing artifacts are reused and don't block document ingestion.

## 3. Extension E2E & UI QA

Verify the bridge between the browser extension and the MIRATS UI.

- **Extension E2E**:
    - Pairing flow (Key entry -> success).
    - Search synchronization (finding projects/tasks via extension).
    - Resilience: Handling offline state, token expiry, and rate limiting.
- **Astryx UI QA**:
    - Verify `ProjectTimeline` uses edge-to-edge vertical chronology without "card soup".
    - Ensure inspector panels are responsive and accessible.
    - Audit semantic color tokens in dark mode.

## 4. Final Delivery: Reports & Documentation

Provide transparency and operational guides.

- **Security & Threat Model**: Formal document mapping RLS, API hashing, and audit logging to the threat model.
- **OpenAPI / Contract**: Define the `/api/public/ext/` contract for external integrations.
- **User Guides**:
    - Admin: How to rotate/revoke API keys.
    - User: How to install the extension and link it to projects.
- **Rollback Procedure**: Clear steps to trigger the kill switch or revert to legacy project views.

## Technical Details

- **Test Framework**: `vitest` for logic/unit, `playwright` for integration/E2E.
- **Storage**: RLS-aware storage policies for PDF uploads.
- **CI/CD Integration**: Integration of `structural-integrity.test.ts` into the main build pipeline.
