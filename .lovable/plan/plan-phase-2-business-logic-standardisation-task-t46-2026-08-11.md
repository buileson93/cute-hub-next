# Plan: Phase 2 - Business Logic Standardisation (Task T46)

Standardise internal business logic to use valid asset UUIDs instead of free-text names, preparing for database constraints.

## Context

- Phase 1 (UI enforcement) is complete.
- Current business tables are empty (0 rows).
- Need to ensure all ways of creating records (RPCs, background functions) use `thiet_bi_id`.

## Phase 2: Logic Standardisation

### 1. Update Server-side RPCs (DB Level)

- Review and update `ghi_su_co_atomic`, `ghi_bao_duong_atomic`, and `ghi_hong_hoc_atomic` in `supabase/dump/schema.sql`.
- Ensure they require `thiet_bi_id` and do not fallback to text if ID is missing.

### 2. Update Background Logic

- `promote_ticket_to_su_co` (schema.sql line 6402): Ensure it maps `tickets.thiet_bi_id` to `su_co.thiet_bi_id`.
- `dashboard_activity_feed`: Update to use linked tables for titles if needed, rather than snapshot text.

### 3. Cleanup Legacy Helpers

- `ghi-payload.ts`: Ensure `BuildSuCoPayloadArgs` and others treat `id` as primary, not optional.

## Phase 3: DB Constraints (Future)

- Once Phase 2 is verified, create a migration to set `NOT NULL` on UUID columns.

## Verification Plan

- Run `npx tsc --noEmit`.
- Verify new record creation via UI still works.
- Check database via `psql` to ensure `thiet_bi_id` is populated for test records.
