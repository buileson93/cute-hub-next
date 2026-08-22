# MIRATS OCR Operations & Troubleshooting

## 1. Architecture Overview

The OCR system follows an **Adaptive Client-Side Pipeline** model:

1.  **Capability Detection**: Detects device CPU, Memory, and Web APIs (WebGPU/WASM).
2.  **Provider Registry**: Dynamic loading of `pdf.js` (text layer) and `Tesseract.js` (OCR).
3.  **Pipeline**:
    - Classification (determine if OCR is needed).
    - Preprocessing (Binarization/Denoising).
    - Extraction (OCR/Text-layer).
    - Post-processing (Vietnamese normalization).
4.  **Persistence**: Results saved to `tai_lieu_ocr` in the database.
5.  **Search**: IndexedDB via `MiniSearch` for < 100ms local full-text search.

## 2. Troubleshooting

### Memory Limits

- **Problem**: OCR stops with "Memory pressure" warning.
- **Reason**: The `BatchProcessor` monitors `performance.memory` and pauses if JS heap usage exceeds 85%.
- **Solution**: Close unnecessary tabs, or reduce concurrency in Admin OCR settings.

### WASM Failures

- **Problem**: "Tesseract worker failed to initialize".
- **Reason**: CSP blocks, missing WASM support, or network failure downloading Tesseract assets.
- **Solution**: The system fallbacks to CDN (jsDelivr) if local assets fail. Ensure `https://cdn.jsdelivr.net` is whitelisted.

### Quality Issues (Vietnamese)

- **Problem**: Vietnamese characters are mangled.
- **Reason**: Low DPI render or incorrect language profile.
- **Solution**: Increase DPI to `300` in settings. Ensure `vie+eng` is selected.

## 3. Rollout & Rollback

### Feature Flags

Manage via `import.meta.env` or database settings:

- `documentOcrEnabled`: Total toggle.
- `VITE_OCR_ROLLOUT_STAGE`:
  - `1`: Only text extraction (safe).
  - `2`: Tesseract enabled for small files.
  - `3`: Full adaptive enabled.

### Rollback

If a regression occurs:

1. Set `VITE_OCR_ROLLOUT_STAGE=1`.
2. Disable `documentOcrEnabled`.
3. If database errors occur, run the latest migration rollback (delete `tai_lieu_ocr` table).

## 4. Security

- RLS policies ensure users can only OCR documents they already have access to.
- Raw text is never logged to production console.
- Signed URLs expire after 1 hour and are revoked immediately after download.
