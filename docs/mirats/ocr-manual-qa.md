# Manual QA Checklist: MIRATS Adaptive OCR

## 1. UI Responsiveness
- [ ] Verify that the "Quản trị OCR" page remains responsive during batch processing.
- [ ] Confirm that clicking navigation items (Sidebar) works while OCR is running.
- [ ] Check if the browser UI (tabs, scrolling) is smooth during processing.

## 2. Capability Detection & Profiling
- [ ] Open DevTools and verify `mirats_ocr_profiler` IndexedDB exists.
- [ ] Check "Benchmark" tab in Admin OCR to see the detected tier (Low/Medium/High).
- [ ] (Desktop) Verify WebGPU/SIMD flags are correctly reported.
- [ ] (Mobile) Verify it correctly defaults to "Low" tier and "Eco" profile.

## 3. Accuracy & Vietnamese Handling
- [ ] Search for a Vietnamese term with accents (e.g., "Hệ thống").
- [ ] Search for the same term without accents (e.g., "he thong").
- [ ] Verify that both return the same document results.
- [ ] Check snippets in Search Results for correct highlighting.

## 4. Deep Linking
- [ ] Click a search result with a snippet from a specific page.
- [ ] Verify the PDF viewer opens at that exact page.
- [ ] Check if the page indicator matches the snippet page number.

## 5. Persistence & Resume
- [ ] Start a batch process.
- [ ] Close the tab/browser mid-process.
- [ ] Reopen the Admin OCR page and verify the document status is "Partial" or "Completed" (if finished).
- [ ] Confirm that "Resume" picks up from the last unprocessed page.

## 6. Security & Partitioning
- [ ] Verify that OCR results from one workspace do not appear in another.
- [ ] Confirm that technical tokens (S/N, P/N) are correctly indexed and searchable.

## 7. Resource Management
- [ ] Monitor Memory usage in Task Manager during 50+ page OCR.
- [ ] Verify that Blobs are revoked and memory is released after document completion.
- [ ] Check if "Pause on Hidden" works when switching tabs.
