# Plan: PDF OCR Integration into Upload Flows

Integrate the Adaptive OCR engine into `ModelTaiLieu.tsx` and `ThietBiTepDinhKem.tsx` upload workflows, providing real-time progress, resumable processing, and intelligent caching.

## 1. UI Components & Control

- Create `OcrControls.tsx` in `src/components/mirats/ocr/`:
  - Checkbox for "Extract content for search" in upload dialogs.
  - Quality profile selector (Auto, Eco, Balanced, Quality) with device-aware tooltips.
  - Progress visualization (Page X/Y, current action).
  - Status badges for document lists (Queued, Running, Partial, Completed).
  - Actions: "Re-run OCR", "Resume", "Cancel".

## 2. Integrated Upload Workflow

- Update `ModelTaiLieu.tsx` and `ThietBiTepDinhKem.tsx`:
  1. Compute SHA-256 hash using `sha256Hex` from `compress.ts` before upload.
  2. After metadata success, call `ocrRepository.queueOcr`.
  3. If OCR is enabled, trigger `OcrPipeline` in a worker.
  4. Handle lifecycle: ensure OCR failure doesn't delete the original document.

## 3. Resilience & Caching

- **Resume Logic**: Modify `pipeline.ts` to accept a `startPage` parameter, allowing the UI to resume from `processed_pages + 1`.
- **Intelligent Caching**: Before starting, check if a successful OCR record with the same `file_hash` and `ocr_version` exists to reuse results.
- **Client Cache**: Implement `idb`-based storage for temporary results to prevent data loss if the tab is closed during a long OCR task.

## 4. Maintenance & Cleanup

- Ensure `ON DELETE CASCADE` in SQL handles OCR record removal when documents are deleted.
- Invalidate OCR records if a file is replaced (hash change).

## Technical Details

- **Permissions**: Preserve existing `admin`/`phong_kt` checks.
- **Concurrency**: Adhere to device tiers defined in `device-profiler.ts`.
- **Dependencies**: `idb`, `lucide-react` (for status icons).

## User Review Required

- Should the "Resume" prompt be automatic when the user revisits a document, or should it wait for them to click "Resume" manually?
- Should we show a "Low Battery/Thermal" warning if the device might throttle during high-quality OCR?
