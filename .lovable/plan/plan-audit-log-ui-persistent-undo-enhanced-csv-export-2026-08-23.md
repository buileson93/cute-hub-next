# Plan: Audit Log UI, Persistent Undo & Enhanced CSV Export

Upgrade the system with an administrative Audit Log view, persistent multi-step undo for bulk actions, and enhanced CSV export capabilities with progress tracking.

## User Review Required

> [!IMPORTANT]
> The audit log requires a table named `nhat_ky_he_thong`. I will verify if it exists or create a migration if needed.
> Persistent undo will use `localStorage` to survive page reloads during the 10-second window.

## Proposed Changes

### Visual Text Edits (Roadmap)
- Update `TopBar.tsx` and `TzClock.tsx` roadmap text to include new Phase 11M tasks.

### 1. Audit Log Administration UI
- Create `src/routes/_app.admin.nhat-ky.tsx`.
- Implement a `StandardTable` to display `nhat_ky_he_thong`.
- Add filters:
  - User (combobox from `auth.users` via RPC or view).
  - Action type (bulk_delete, export_csv, etc.).
  - Date range (from/to).
- Details view: Show JSON `chi_tiet` in a formatted dialog.

### 2. Persistent Undo Mechanism
- Refactor `StandardTable.tsx` to store `pendingDeletions` in `localStorage`.
- Each pending item will include `ids`, `domain`, `timestamp`, and `ten`.
- On mount, `StandardTable` will check `localStorage` for its specific `tableKey` and resume the countdown if `< 10s` has passed.
- Clear `localStorage` only after successful API deletion or manual undo.

### 3. Enhanced CSV Export & Progress
- Update `TableExportDialog.tsx` to handle large exports (e.g., 5000+ rows).
- Introduce a "Generating..." state with a progress bar.
- Use `requestIdleCallback` or chunked processing for `buildCsv` to prevent UI thread blocking.
- Add "Success/Failure" status messages with links to the generated file or error logs.

### 4. Playwright E2E Integrity Tests
- Create `tests/audit-undo-integrity.test.py`:
  - **Undo Persistence**: Trigger bulk delete, refresh page, verify "Undo" button still exists and works.
  - **RBAC Enforcement**: Log in as a non-admin, verify `onBulkDelete` and CSV export are blocked/hidden if `canWrite` is false.
  - **Audit Logging**: Perform a deletion/export and verify a new row appears in the `nhat_ky_he_thong` table.

## Technical Details

- **Database**: Ensure `nhat_ky_he_thong` has RLS policies allowing admins to SELECT.
- **State Management**: Use `sessionStorage` or `localStorage` for `scrollOffset` (existing) and `pendingDeletions` (new).
- **Concurrency**: Prevent multiple CSV generation tasks from overlapping.
- **RBAC**: Integrate with `src/lib/mirats/quyen.ts`'s `canWrite` function.

```typescript
// Proposed structure for localStorage pendingDeletions
interface PendingDeletion {
  tableKey: string;
  ids: string[];
  domain: string;
  expiry: number; // Date.now() + 10000
}
```
