# Phase 10G: Data Correctness & Hardening

IMPLEMENTATION MODE — DATA CORRECTNESS ONLY.

## Goals
- Hardening AI Chat persistence with idempotency and user ownership.
- Fixing R2 cleanup to protect metadata on failure and correct counters.
- Auditing and fixing mutation error handling across the app.
- Visual edit of the TzClock component for superpower documentation.

## Proposed Changes

### 1. AI Chat Hardening (`src/routes/api/chat.ts`)
- **Idempotency**: Use a message ID (from client or generated) to ensure `onFinish` doesn't double-persist or re-persist history.
- **Ownership**: Verify the `conversation_id` belongs to the `userId` before any message insertion.
- **Error Handling**: Explicitly check for Supabase errors during insertion and return appropriate status codes.
- **Retry Logic**: Support idempotent retries by checking for existing message IDs before inserting.

### 2. R2 Cleanup Hardening (`src/routes/api/public/hooks/r2-cleanup.ts`)
- **Atomic-like logic**: Move metadata deletion (`supabaseAdmin.from("r2_file").delete()`) inside a check that verifies R2 deletion was successful.
- **Per-item results**: Track and return specific success/failure for each object instead of a global counter that might be misleading.
- **Orphan Reconciliation**: Add logic to handle cases where DB record exists but R2 object is gone, or vice-versa (reconciliation).

### 3. Mutation Audit & Error Handling
- **Audit**: Identify all `useMutation` hooks that call `toast.success` without checking for the `.error` property of the result or handling the `onError` callback.
- **Fixes**:
    - Ensure `onError` always calls `toast.error(error.message)`.
    - Ensure `toast.success` only fires AFTER the mutation and any invariant checks (like RLS or domain logic) succeed.
    - Standardize batches of 5-10 mutations at a time.
- **Transactional Logic**: For multi-step mutations, wrap them in Supabase RPCs or implement client-side compensation logic (rollback).

### 4. Visual Documentation (`src/components/mirats/TzClock.tsx`)
- Update the `aria-label` of the `DropdownMenuTrigger` button to the requested implementation mode documentation text verbatim.

## Technical Details
- **AI**: Use `uiMessages` in `onFinish` but only persist the new assistant message by comparing against existing IDs or using the last index.
- **R2**: Use `r2Delete` result to decide whether to proceed with DB cleanup.
- **Testing**:
    - Simulate network failures during multi-step mutations to verify rollback.
    - Verify chat message uniqueness after multiple `onFinish` triggers.
    - Verify R2 metadata preservation when S3 endpoint is unreachable.

## Commit Strategy
- `fix(ai): persist chat messages idempotently`
- `fix(storage): preserve metadata on deletion failure`
- `fix(data): surface mutation failures`
