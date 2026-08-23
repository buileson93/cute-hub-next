# Plan - Phase 11L: Bulk Actions, Undo & Security Enhancements

Implement undo for bulk deletion, enhanced CSV export with saved configurations, audit logging, and improved table states with RBAC.

## User Review Required

> [!IMPORTANT]
> - The **Undo** feature will use a "delayed execution" pattern (10-second window) to avoid complex database schema changes (like soft-delete columns).
> - **Audit Logs** will be stored in a new or existing system-wide log table.
> - **RBAC** will follow the existing `src/lib/mirats/quyen.ts` matrix.

## Proposed Changes

### 1. Visual Text & Roadmap
- Update `TopBar.tsx` (Tooltip) and `TzClock.tsx` (aria-label) with the new Vietnamese roadmap text verbatim.

### 2. StandardTable: Bulk Delete & Undo
- **Delayed Delete**: Modify `onBulkDelete` in `StandardTable.tsx` to:
  1. Remove rows from local state immediately.
  2. Show a `sonner` toast with an "Undo" button.
  3. Start a 10-second timer.
  4. If "Undo" is clicked: Restore local state and cancel the timer.
  5. If time expires: Execute the actual Supabase delete query.
- **Audit Log**: Record the bulk delete event upon actual execution.

### 3. CSV Export: Saved Configurations
- Update `TableExportDialog.tsx`:
  - Add a "Lưu cấu hình cột" (Save column config) checkbox.
  - Use `localStorage` keyed by `tableKey` to persist selected columns.
  - Automatically load saved config when the dialog opens.
- **Audit Log**: Record the export event (who, what scope, how many rows).

### 4. UI/UX Improvements
- **Empty/Selection States**:
  - Enhance `BulkActionBar` to show a clearer hint when no rows are selected.
  - Update `StandardTable` loading state to prevent layout shift during infinite scroll fetches.
- **RBAC Enforcement**:
  - Integrate `canWrite(domain, roles)` into `StandardTable`'s `allowBulkDelete` logic.
  - Hide export buttons for unauthorized roles if defined in the policy.

### 5. Verification (E2E)
- Create `tests/table-actions-integrity.test.py`:
  - Verify Shift-click selection.
  - Test Bulk Delete -> Undo flow (ensure items reappear).
  - Test Bulk Delete -> Execution (ensure items are gone from DB).
  - Verify CSV export dialog remembers column selection.

## Technical Details
- **State Management**: Use `useTransition` or simple state refs for the deletion timer to ensure stability across renders.
- **Persistence**: `localStorage` prefix `mirats:table-export-cols:<tableKey>`.
- **Database**: Ensure `nhat_ky_he_thong` (or equivalent) has RLS policies allowing `authenticated` to INSERT logs.
