# Plan: Adaptive PDF OCR Pipeline Implementation

Implement a paginated PDF processing pipeline that intelligently combines native text extraction with adaptive OCR for Vietnamese documents, ensuring high accuracy and performance across devices.

## 1. Foundation & Classification
- Create `page-classifier.ts` to implement the "OCR or not" logic based on `meaningfulWordCount` (<5 words), character count (<40), and image-to-text ratio.
- Implement `preprocess.ts` for canvas-based image enhancement: adaptive threshold, grayscale, contrast, and basic denoising.

## 2. Vietnamese Post-processing
- Create `postprocess-vi.ts` to handle:
    - Text normalization for search (accent removal/folding).
    - Separation of `rawText` (immutable) and `correctedText` (dictionary-aided).
    - Preservation rules for technical strings (Serial, P/N, Coordinates).

## 3. PDF Extraction & Pipeline
- Create `pdf-extractor.ts` as a thin wrapper around `pdfjs-dist` to handle rendering and text layer extraction without the 8-page limit of the legacy GPKT extractor.
- Implement `pipeline.ts` to orchestrate the multi-step flow:
    1. Try native text -> 2. Classify -> 3. (Optional) Preprocess & OCR -> 4. Post-process -> 5. Emit progress.
- Implement `pdf-ocr.worker.ts` for off-main-thread processing using Vite's worker support.

## 4. Integration & Compatibility
- Update `src/lib/mirats/gpkt-pdf-text.ts` to use the new `pdf-extractor.ts` logic while maintaining its specialized coordinate normalization (WGS-84).
- Add `progress` and `abort` support to the main `recognize` flow.

## Technical Details
- **Memory**: Explicit canvas disposal (`width=0`, `height=0`) after each page.
- **Concurrency**: Default to sequential; scale up to 2-4 only on "High" tier devices.
- **Languages**: Default to `vie+eng`.
- **Dependencies**: `pdfjs-dist`, `tesseract.js`, standard canvas APIs.

## User Review Required
- Should documents over 100 pages be automatically batched (e.g., 20 pages at a time) or show a range selector by default?
- Is there a specific dictionary or list of technical terms/units that should NEVER be corrected during post-processing?
