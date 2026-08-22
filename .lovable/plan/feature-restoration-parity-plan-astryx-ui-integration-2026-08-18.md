# Feature Restoration & Parity Plan (Astryx UI Integration)

Restore core business logic and behavioral integrity to the Astryx-themed application, ensuring 100% parity with the "chaytot" baseline.

## Technical Details

### 1. Quick Forms (SuCo, BaoTri, HongHoc)

- **SuCoMoiForm**:
  - Restore AI Parsing (7-point extraction) and Voice Recognition (Voice-to-text draft).
  - Implement Anomaly Detection based on real business rules.
  - Wire Word Export using `exportBaoCaoBanDauToWord` server function.
- **BaoTriMoiForm**:
  - Restore Template Versioning and Snapshotting (avoid hardcoded v1).
  - Implement Required Field validation for dynamic checklists.
- **Shared Logic**:
  - Ensure all saves use Supabase RPCs (`ghi_su_co_atomic`, `ghi_bao_duong_atomic`) for transaction safety.
  - Standardize the `PreviewKhaiDialog` for all forms.

### 2. Command Palette (PowerSearch)

- **Intent Matching**: Fix the `jump-to` intent so it correctly triggers search instead of being an empty branch.
- **Context/Metadata**: Add metadata tooltips and pre-loading logic for search result images.
- **Logout Action**: Ensure the logout button in the command list correctly clears the Supabase session and redirects.

### 3. Bulk Action Bar

- **Centralized Logic**: Define a clear contract for `preview/confirm/audit/undo` responsibilities.
- **Data Safety**: Ensure all destructive actions (Delete, Archive) require explicit confirmation and call real backend functions.

## User-Facing Parity Matrix

| Module          | Feature             | Parity Status |
| :-------------- | :------------------ | :------------ |
| **Incidents**   | AI Draft + Voice    | ✅ Restoring  |
| **Maintenance** | Checklist Snapshots | ✅ Restoring  |
| **Search**      | AI Intent Matching  | ✅ Restored   |
| **Actions**     | Bulk Confirmations  | ✅ Restored   |

## Verification Plan

- **Automated**: Run `structural-integrity.test.ts` to check for UI regressions.
- **Manual**:
  - Perform a "Voice-to-Incident" flow and verify AI bóc tách results.
  - Submit a maintenance checklist and verify the `template_snapshot` in the database.
  - Use Cmd+K to "close incident SC-12" and verify it navigates to the correct search result.
