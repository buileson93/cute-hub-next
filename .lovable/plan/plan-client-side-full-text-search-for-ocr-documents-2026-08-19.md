# Plan: Client-side Full-text Search for OCR Documents

Implement a high-performance, offline-capable client-side search engine for OCR-processed PDFs using MiniSearch and IndexedDB.

## User Review Required

> [!IMPORTANT]
>
> - Search is scoped to OCR-processed documents only.
> - Initial sync might take time depending on the volume of OCR data.
> - We will use `minisearch` as the primary engine.

## Proposed Changes

### 1. Infrastructure & Storage

- **Local Database**: Initialize `mirats-document-search-v1` using `idb`.
- **Object Stores**: Create stores for `documents`, `pages`, `index_snapshots`, `sync_state`, and `device_profiles`.
- **Search Engine**: Implement `MiniSearchAdapter` satisfying a generic `DocumentSearchIndex` interface.

### 2. Search Logic

- **Normalization**: Integrate with `src/lib/mirats/search/chuan-hoa.ts` for Vietnamese accent removal.
- **Indexing**:
  - Fields: `fileName` (boost 4), `sourceCode` (boost 3), `sourceName` (boost 2), `description` (boost 2), `normalizedText` (boost 1).
  - Features: Support for prefix search, fuzzy matching, and technical codes with special characters (dots, slashes, dashes).
- **Security**: Partition data by `workspaceId` and `userId` to ensure data isolation. Clear all local partitions on logout or workspace switch.

### 3. Synchronization

- **Incremental Sync**: Fetch OCR records from Supabase based on `updated_at` to minimize bandwidth.
- **Permission Handling**: Only sync records the user is authorized to read via RLS. Remove local records if server records are deleted or permissions revoked.
- **Fallback**: Gracefully switch to online search or notify the user if IndexedDB is full or errors out.

### 4. UI Integration (Future-proofing)

- Provide a `useOcrSearch` hook for easy integration into existing Search/Command Palette components.

## Technical Details

- **Language**: TypeScript
- **Dependencies**: `minisearch`, `idb` (already in `package.json`).
- **Performance Goal**: < 100ms for 10,000 pages on mid-range hardware.
- **Persistence**: IndexedDB for large text storage, allowing offline search for synced data.

## Integration Plan

### Phase 1: Storage & Core Index (Task 1)

- Setup IndexedDB schema in `src/lib/mirats/search/ocr-index/db.ts`.
- Implement `DocumentSearchIndex` interface and `MiniSearchAdapter` in `src/lib/mirats/search/ocr-index/engine.ts`.

### Phase 2: Synchronization & Security (Task 2)

- Create `SearchSyncManager` to handle incremental updates from Supabase.
- Implement cleanup logic for logout and workspace changes in `src/lib/mirats/auth/cleanup.ts` (if applicable) or a root-level effect.

### Phase 3: Search Hook & Normalization (Task 3)

- Create `useOcrSearch` hook in `src/lib/mirats/search/ocr-index/use-ocr-search.ts`.
- Refine Vietnamese normalization logic to handle technical tokens correctly.
