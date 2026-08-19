# OCR Backlog Processing Tool Implementation Plan

Build a client-side administrative tool to process OCR for existing PDF documents that were uploaded before the OCR feature was implemented.

## User Review Required

> [!IMPORTANT]
> The processing happens entirely on the user's device (client-side). This protects the server from high CPU usage but means the admin must keep the tab open during the process.

- **Storage Strategy**: Should we prioritize processing documents for specific critical equipment first, or just go in chronological order?
- **Resource Limits**: The default batch size is 1 document at a time to prevent memory issues. Is this acceptable, or should we allow configurable concurrency?

## Proposed Changes

### 1. Data Layer & Repository (Backend)

- **New Repository Methods**: Update `src/lib/mirats/document-ocr/repository.ts`.
  - `getOcrStats()`: Get counts of total, indexed, partial, and failed PDFs.
  - `listUnprocessedPdfs(filters)`: Query `model_tai_lieu` and `thiet_bi_tep_dinh_kem` for documents without a corresponding `completed` record in `tai_lieu_ocr`.
  - `getBatchOcrStatus(ids)`: Bulk fetch status for a list of IDs.
- **Admin Functions**: Create `src/lib/mirats/document-ocr/ocr-admin.functions.ts` for server-side queries if complex joins are needed (using `createServerFn`).

### 2. OCR Engine Enhancements (Frontend Logic)

- **Adaptive Batch Processor**: Create `src/lib/mirats/document-ocr/batch-processor.ts`.
  - Implement sequential processing with pause/resume capability.
  - Resource monitoring: Monitor `performance.memory` (if available) and abnormal `time/page` increases to trigger auto-pausing.
  - Tab visibility management: Automatically pause when `document.visibilityState === 'hidden'` for extended periods.
- **Improved Error Handling**:
  - Implement specific error codes: `PDF_ENCRYPTED`, `PDF_TOO_LARGE`, `URL_EXPIRED`, `ACCESS_DENIED`.
  - Exponential backoff retry logic (capped at 3 attempts).

### 3. Administrative UI Components

- **Admin Route**: Create `src/routes/_app.admin.ocr.tsx`.
  - Dashboard showing OCR health metrics (Total, Completed, Pending, Failed).
  - Advanced filters: Source (Model/Asset), Size, Page count, Status.
- **Control Panel**:
  - Selection: Individual documents or small batches.
  - Quality Profiles: Toggle between Auto, Eco, Balanced, and Quality.
  - Session Limits: User-defined page limit for the current session.
- **Real-time Monitoring**:
  - Progress table showing current provider, time per page, and confidence scores.
  - Resume button for failed or partial tasks.

### 4. Security & Performance Guardrails

- **Storage Access**: Always use short-lived signed URLs fetched per document.
- **Memory Management**: Explicitly call `extractor.close()`, `disposeCanvas()`, and nullify Blob references after each document to prevent leaks.
- **Worker Management**: Ensure Tesseract/PDF.js workers are terminated if the batch is stopped.

## Technical Details

### OCR Stats Interface
```typescript
interface OcrStats {
  totalDocs: number;
  completed: number;
  partial: number;
  failed: number;
  pending: number;
}
```

### Auto-Pause Logic
- Trigger pause if `performance.memory.usedJSHeapSize` exceeds 80% of `jsHeapSizeLimit`.
- Trigger pause if `timePerPage` exceeds 3x the baseline average for the current device tier.

### Navigation Integration
- Add "Quản trị OCR" to the sidebar under the Admin section in `src/components/mirats/app-shell/AppShell.tsx`.
