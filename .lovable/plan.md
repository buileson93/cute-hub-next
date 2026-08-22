# License Route Reliability Restoration Plan (Phase 10S)

This plan focuses on making the License Management route (`/giay-phep`) reliable, secure, and production-ready by establishing a unified database contract, implementing robust error handling, and verifying access control (RLS).

## User Review Required

> [!IMPORTANT]
> - **View Source of Truth**: `v_giay_phep` currently exists only in the database dump (`supabase/dump/schema.sql`). This plan will formalize it into a proper migration file.
> - **RLS Verification**: The view will be created with `security_invoker = on` to ensure it respects RLS of underlying tables.
> - **Role Scope**: Scoped users (e.g., department managers) will only see licenses within their assigned `don_vi_id`.

## Proposed Changes

### Database & Schema (Phase 1 & 2)
- **Unified License View**: Create a new migration file `supabase/migrations/20260822_unified_license_view.sql` containing the `CREATE OR REPLACE VIEW public.v_giay_phep` definition.
  - Ensures the view is idempotent and reviewable.
  - Sets `security_invoker = on`.
  - Maps `giay_phep` (equipment) and `giay_phep_khai_thac` (system) to a standard schema.
  - Includes `trang_thai` (valid/expiring/expired) and `so_ngay_con_lai` logic.
- **Type Generation**: Update `src/integrations/supabase/types.ts` to include the view structure (via simulation or actual CLI if possible).
- **RLS Tests**: Create `tests/license-rls.test.ts` to verify:
  - Admins can see all records.
  - Scoped users only see their department's licenses.
  - Unauthorized access is blocked.

### Data Layer (Phase 1)
- **Cleanup `db-licenses.ts`**:
  - Remove manual `as unknown` casts once types are updated.
  - Select only specific required columns instead of `*`.
  - Improve normalization logic (handling nulls, invalid dates).

### Frontend UI Reliability (Phase 3 & 4)
- **Error & Loading States**: Update `src/routes/_app.giay-phep.tsx` to handle `isLoading` and `isError`.
  - Add Skeleton loaders for charts and KPI cards.
  - Implement a dedicated "Error Component" with a "Retry" button.
  - Distinguish between "Empty" (success, 0 rows) and "Error".
- **AssetRegistryBook Stability**: Ensure `StandardTable` and its cells can handle null data or invalid dates without crashing.
- **Mutation Invalidation**: Ensure adding/editing/importing (via `GiayPhepFormDialog` or `GpktImportDialog`) correctly invalidates the `licenses_data` query key.

## Technical Details
- **View Definition**:
  ```sql
  CREATE OR REPLACE VIEW public.v_giay_phep WITH (security_invoker = on) AS
  WITH base AS (
    -- SELECT from giay_phep
    -- UNION ALL
    -- SELECT from giay_phep_khai_thac
  )
  SELECT ... FROM base;
  ```
- **Constraint**: No changes to existing button colors or layouts outside of `/giay-phep`.

## Verification Plan

### Automated Tests
- `bunx vitest tests/license-rls.test.ts`
- `bun run typecheck`
- `bun run build`

### Manual Verification (Playwright)
- Open `/giay-phep` as `admin` -> All KPIs and records visible.
- Open `/giay-phep` as a scoped `user` -> Only department records visible.
- Simulate Network Error -> Verify Error State and Retry button.
- Add a new License -> Verify list and KPI refresh.
