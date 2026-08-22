# Plan - Integrate OCR Results into MIRATS Search UI

Integrate OCR search results into the main search interfaces (Global Search / Power Search and Document Library), ensuring high-fidelity results with snippets, highlights, and deep-linking to specific PDF pages.

## User Review Required

> [!IMPORTANT]
>
> - **PDF Deep Linking**: The browser's native PDF viewer (`<iframe>`) will be used to scroll to pages via `#page=N`. If the browser doesn't support this (e.g., some mobile browsers), we will display a prominent "Result on Page N" message in the viewer header.
> - **Snippet Accuracy**: Snippets are generated client-side from the indexed `normalizedText`. This is fast but might not perfectly match original formatting if the OCR output was heavily structured.

## Proposed Changes

### 1. Document Library (`src/routes/_app.tai-lieu.tsx`)

- **Search Service**: Replace the basic `.includes()` filtering with a dedicated `DocumentSearchService` that leverages the local `MiniSearch` index.
- **Enhanced UI**:
  - Display OCR badges (PDF Content, Text Layer, etc.).
  - Show text snippets around keywords with highlights.
  - Add filters: "All", "Indexed", "OCR in progress", "OCR Error".
- **Integrity**: Maintain `/tai-lieu?doc=<id>` deep-linking and existing download permissions.

### 2. Global Search / Power Search (`src/components/mirats/search/PowerSearch.tsx`)

- **Result Merging**: Unify `KetQuaTim` (from RPC) and OCR results.
- **Deduplication**: Prevent duplicate entries using a composite key: `source_type + source_id + page`.
- **Ranking**: Prioritize filename/metadata matches over deep OCR content matches.
- **Performance**: Use debounced queries and cancel outdated searches to keep UI responsive.

### 3. OCR Engine & Search Logic (`src/lib/mirats/search/ocr-index/engine.ts`)

- **Snippet Generator**: Implement a robust `generateSnippet` method that finds keyword positions and extracts surrounding context.
- **Highlighting**: Implement Vietnamese-aware highlighting (accent-insensitive).
- **Metadata Integration**: Ensure the index contains all necessary fields (`sourceCode`, `sourceName`, `description`) for unified search.

### 4. PDF Viewer (`src/components/mirats/DocViewerDialog.tsx`)

- **Page Deep-linking**: Add `initialPage` and `query` props.
- **Viewer Logic**: Append `#page=N` to the URL for PDF files.
- **UI Feedback**: Add a "Result on Page N" indicator when a page is targeted.

## Technical Details

- **MiniSearch Config**:
  - Update `storeFields` to include `normalizedText` (partial/chunked) or just enough for snippet generation without bloating memory.
  - Implement a `SearchOptions` wrapper that handles the ranking logic (Filename > OCR Content).
- **Synchronization**: `SearchSyncManager` will be updated to fetch status flags (`ocr_status`) to support the new filters in the Document Library.
- **Highlighting**: Use a regex-based replacement that is accent-insensitive but preserves the original case and character representation in the output.

## Verification Plan

### Automated Tests

- Run `vitest` on `engine.ts` to verify snippet generation and highlighting logic.
- Verify `chuan-hoa.ts` correctly handles various Vietnamese input combinations (accented/unaccented).

### Manual Verification

- **Search Flow**:
  1. Open Power Search (Cmd+K).
  2. Type a keyword known to be inside a PDF.
  3. Verify a result appears with "Trang N" and a snippet.
  4. Click the result -> Verify `DocViewerDialog` opens at the correct page.
- **Document Library**:
  1. Go to `/tai-lieu`.
  2. Test search with unaccented Vietnamese keywords.
  3. Verify highlighting works.
  4. Toggle filters (All/Indexed/etc.).
