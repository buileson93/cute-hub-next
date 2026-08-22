# Plan: Task T12 - Final Review Phase 3 (Read-only)

Perform a comprehensive system check after tasks T1-T11 to ensure stability and cleanliness. This task is **read-only**.

## Verification steps

### 1. Static analysis

- Run `npx tsc --noEmit` to check for TypeScript errors.
- Run `npm run lint` to check for linting violations.

### 2. Automated tests

- Run `npm test` (vitest) to verify all 137 test files pass.

### 3. Build & Performance

- Run `npm run build` to generate the production bundle.
- Pipe build output to `/tmp/build.log`.
- Run `node scripts/perf-budget.mjs /tmp/build.log` to verify chunks stay under the 400 KB gzip budget.

### 4. Codebase hygiene

- Run `find src -type f -empty` to identify empty files.
- Identify new files created in recent turns that are currently not imported by anything.
- Inventory specific patterns:
  - Count files using `hideBelow` (from `StandardTable` responsiveness).
  - Count files using `DesktopOnly`.
  - Count occurrences of `lazy(`.

## Reporting

- Every error or finding will include: **File name**, **Line number**, and **Priority** ("blocker" / "should fix" / "later").
- **No code will be modified.**
