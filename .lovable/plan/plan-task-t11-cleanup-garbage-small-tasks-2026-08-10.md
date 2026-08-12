# Plan: Task T11 - Cleanup Garbage (Small Tasks)

Cleanup redundant files, deduplicate constants, and report empty files.

## Tasks

### 1. Cleanup `change-log-utils.ts`
- **Fact**: `src/lib/mirats/change-log-utils.ts` is unused (checked with grep).
- **Fact**: `src/lib/mirats/change-log.ts` has a more robust `formatVal` implementation.
- **Action**: Delete `src/lib/mirats/change-log-utils.ts`.

### 2. Deduplicate `MAX_MB`
- **Fact**: `MAX_MB = 20` is hardcoded in two components.
- **Action**:
    - Add `export const MAX_MB = 20;` to `src/lib/mirats/storage-config.ts`.
    - Update `src/components/mirats/ModelTaiLieu.tsx` to import `MAX_MB` and remove the local declaration.
    - Update `src/components/mirats/ThietBiTepDinhKem.tsx` to import `MAX_MB` and remove the local declaration.

### 3. Empty Files Audit
- **Action**: Run `find src -type f -empty` and report the list (if any).

## Verification Plan
1. Run `npx tsc --noEmit` to ensure no broken imports or type errors.
2. Grep for `MAX_MB = 20` to verify only one definition remains.
3. Verify `src/lib/mirats/change-log-utils.ts` is gone.
