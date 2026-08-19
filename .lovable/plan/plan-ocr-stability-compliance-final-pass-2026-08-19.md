# Plan: OCR Stability & Compliance Final Pass

Implementation of the final stability round for the adaptive Vietnamese PDF OCR feature, focusing on resource management, security, and rollout phases.

## 1. Scope Cleanup & Validation
- Audit all recent changes to ensure only OCR and PDF search related files are affected.
- Run `vitest` for the OCR test suite.
- Run `tsgo` for type checking.

## 2. Bundle Optimization (Lazy Loading)
- Update `TesseractProvider` to lazy-load language data and the WASM worker only when `recognize` or `warmup` is called.
- Ensure `pdfjs-dist` worker initialization is handled efficiently.

## 3. Resource & Memory Management
- **Worker Termination**: Ensure Tesseract workers are explicitly terminated in `dispose()` methods and when `OcrPipeline` or `BatchProcessor` is interrupted.
- **Cleanup**: Verify `Object.revokeObjectURL` is called for any created signed URLs or temporary file blobs.
- **Canvas Lifecycle**: Ensure `disposeCanvas` is consistently called in `OcrPipeline` catch blocks and after successful processing.

## 4. Security & Compliance
- **RLS Verification**: Test `tai_lieu_ocr` policies against:
    - Admin (manage source document)
    - Reader (read source document)
    - No access (unauthorized)
- **Data Privacy**: Ensure no raw OCR text or signed URLs are emitted in `console.log`. Replace existing logs with generic status messages.

## 5. Rollout Strategy Implementation
- Update `ocrConfig` and `adaptiveOcrSelector` to support the phased rollout:
    - **Stage 1**: Text-layer extraction only (Tesseract disabled by default).
    - **Stage 2**: Enable Tesseract for test group (via local storage or specific user role).
    - **Stage 3**: Full adaptive selection enabled.
- Implement feature flag guards in `OcrPipeline` to revert to old behavior (no OCR) if flags are off.

## 6. Operations & Documentation
- Create `docs/mirats/ocr-operations.md` covering:
    - Architecture Overview.
    - Troubleshooting (Memory limits, WASM errors).
    - Rollback/Rollforward instructions.
    - Feature flag management.

## Technical Details

### Rollout Matrix Logic
```typescript
// src/lib/mirats/document-ocr/adaptive-selector.ts refinement
if (!ocrConfig.isEnabled) return textLayerProvider;
if (ocrConfig.rolloutStage === 1) return textLayerProvider;
// ... adaptive logic for Stages 2-4
```

### Memory Leak Prevention
- Wrap `OcrPipeline.process` in a `try...finally` to ensure `extractor.close()` and `canvas` disposal.
- Monitor `performance.memory` (where available) and auto-pause `BatchProcessor` at 85% heap usage (already partially implemented, will harden).

### Quality Assurance Checklist
- Verify CER/WER metrics meet target (< 2.5% for digital PDFs).
- Verify deep-linking to `#page=N` works post-OCR search.
- Test "Resume" functionality for partially processed documents.
