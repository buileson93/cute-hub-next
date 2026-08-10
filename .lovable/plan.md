# Plan - Task T8: Plug IndexedDB into Offline Queue

Reintegrate `IndexedDBStorage` into the offline queue system to ensure persistent synchronization across browser sessions, as specified in the Task T8 requirements.

## Proposed Changes

### 1. `src/hooks/use-offline-queue.ts`
- Update `getOfflineQueue` to use the exported `offlineStorage` instance (from `indexeddb-storage.ts`) instead of instantiating `IndexedDBStorage` directly or using `SessionStorageAdapter` in browser environments.
- Ensure the `typeof window !== "undefined"` guard is correctly applied to prevent IndexedDB access during SSR.
- Keep `SessionStorageAdapter` only as a fallback for non-browser environments (SSR) to avoid hydration errors.

### 2. `src/lib/mirats/indexeddb-storage.ts`
- Ensure the `offlineStorage` singleton is exported correctly and doesn't trigger side effects during SSR.

## Verification Plan

### Automated Tests
- Run `npm test src/lib/mirats/__tests__/offline-queue.test.ts` to ensure no regressions in queue logic.
- Run `npx tsc --noEmit` to verify type safety.

### Manual Verification (Smoke Test)
1. **Prepare**: Open the app and log in.
2. **Offline Mode**: Turn off network (via browser devtools or physical disconnect).
3. **Queue Task**: Record a new incident (su_co_create). Verify it shows in `OfflineBadge` as "1 chờ".
4. **Persist Test**: Close the browser tab/app entirely.
5. **Restore**: Re-open the app. Verify the `OfflineBadge` still shows "1 chờ" (confirming it was saved to IndexedDB).
6. **Online Sync**: Turn on network.
7. **Verify**: Wait for sync toast ("Đã đồng bộ 1 thao tác offline"). Verify the incident appears in the incident list.
