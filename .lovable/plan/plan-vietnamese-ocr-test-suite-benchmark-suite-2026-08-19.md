# Plan: Vietnamese OCR Test Suite & Benchmark Suite

Implement a comprehensive testing and benchmarking framework for the Adaptive Vietnamese OCR system to ensure reliability, performance, and accuracy across various device profiles and document types.

## 1. Fixture & Benchmark Data (Module 1)
- Create `src/lib/mirats/document-ocr/__tests__/fixtures/benchmark-docs.ts` containing metadata for various test cases:
    - Digital PDF (Unicode)
    - Scanned PDF (150/200/300 DPI simulations)
    - Faint text (Low contrast Vietnamese)
    - Mixed English/Vietnamese content
    - Technical specification tables
    - Technical tokens (S/N, P/N, Serial, Model, Coordinates, Units)
    - Rotated pages (90/180 degrees)
    - Skewed/Grey background scans
    - Hybrid PDF (Text layer + Image)
    - Large/Malformed/Encrypted PDFs (Negative cases)

## 2. Metric Calculation Engine (Module 2)
- Implement `src/lib/mirats/document-ocr/__tests__/utils/metrics.ts`:
    - **CER** (Character Error Rate) using Levenshtein distance.
    - **WER** (Word Error Rate).
    - **Technical Accuracy**: Subset metric for technical tokens and numbers.
    - **Confidence Score Tracking**: Aggregation of provider-reported confidence.
    - **Performance Metrics**: Time per page, Peak memory usage (canvas size), Worker count.
    - **Search Latency**: Measure client-side full-text search speed.

## 3. Device Profile Emulation (Module 3)
- Enhance `src/lib/mirats/document-ocr/device-profiler.ts` with a mockable interface for testing:
    - `low`: 2 cores, low memory, no WebGPU.
    - `medium`: 4-8 cores, WASM SIMD enabled.
    - `high`: WebGPU + SIMD enabled.
    - `null`: Missing all modern API capabilities.

## 4. Test Suite Implementation (Module 4)
- **Unit Tests**:
    - `adaptive-selector.test.ts`: Verify profile-based provider selection logic.
    - `pipeline-logic.test.ts`: Test cancel/retry/resume state machine.
    - `postprocess-vi.test.ts`: Validate technical token preservation and accent normalization.
- **Integration Tests**:
    - `ocr-benchmark.test.ts`: Run the pipeline against fixtures and assert metric thresholds.
    - `search-accuracy.test.ts`: Verify accented/unaccented search consistency and snippet accuracy.
- **Security Tests**:
    - `security-partitioning.test.ts`: Ensure no data leakage between workspace/user contexts (verify userId filters in search sync).

## 5. Admin Benchmark UI (Module 5)
- Update `src/routes/_app.admin.ocr.tsx`:
    - Add a "Benchmark" tab.
    - Display real-time CER/WER vs Target metrics.
    - Show device profile performance waterfall.
    - List quality gate status (Provider vs Tesseract benchmark results).

## 6. QA Checklist
- Create `docs/mirats/ocr-manual-qa.md` with:
    - UI non-blocking verification (main thread responsiveness during processing).
    - Page linking accuracy (clicking snippet opens PDF at correct page).
    - Resume behavior after network interruption.
    - Memory leak check procedure.

## Technical Details
- Use `vitest` for automated test execution.
- Use `levenshtein-edit-distance` (or local implementation) for CER.
- Mock `navigator` and `performance` APIs for device profiling tests.
- Mock `supabase` RPC calls for repository tests.
