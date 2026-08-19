# Plan: Adaptive OCR Extension - Shared Artifacts & Runtime Metrics

Extension of the OCR platform to allow secure sharing of OCR results between clients and collective hardware intelligence via runtime metrics.

## 1. Database Schema Expansion
Create a new migration implementing:
- `ocr_artifact`: Stores SHA-256 indexed OCR results.
- `tai_lieu_ocr_link`: Links documents to artifacts, enforcing RLS inheritance.
- `ocr_runtime_profile_stats`: Aggregated hardware performance metrics (no PII/fingerprinting).
- `find_reusable_ocr_artifact` RPC: Secure lookup for existing artifacts.
- `publish_ocr_artifact` RPC: Secure idempotent artifact submission.
- `report_ocr_runtime_metric` RPC: Rate-limited metric aggregation.

## 2. Shared Artifact Infrastructure (`src/lib/mirats/document-ocr/`)
- **`artifact-repository.ts`**: Handles logic for calculating SHA-256 and communicating with artifact RPCs.
- **`artifact-reuse.ts`**: Implementation of the reuse flow (check hash -> verify rights -> apply).
- **`sync-outbox.ts`**: IndexedDB-based queue for offline support and retries.
- **Compatibility Engine**: Logic to verify `ocr_version` and `model_checksum` matches.

## 3. Runtime Intelligence & Metrics
- **`runtime-metrics.ts`**: Captures performance data, sanitizes it into hardware buckets (CPU cores, memory ranges, WebGPU support), and reports to the backend.
- **Adaptive Selector Refinement**: Uses aggregated `ocr_runtime_profile_stats` as a secondary hint for provider selection.

## 4. UI & Feedback
- Update OCR badges to distinguish between "Shared Artifact" and "Local Processing".
- Add "Offline / Pending Sync" states to document lists.
- Display technical metadata (provider version, confidence) for transparency.

## 5. Security & Privacy Controls
- Enforce strict RLS: no direct access to `ocr_artifact` via hash without a valid document link.
- Hardware buckets: group concurrency (e.g., 1-2, 3-4 cores) and memory to prevent fingerprinting.
- Signed URL lifecycle management: revoke immediately after use.

## Technical Details

### Hardware Bucketing Logic
```typescript
const cpuBucket = concurrency <= 2 ? '1-2' : concurrency <= 4 ? '3-4' : concurrency <= 8 ? '5-8' : '9+';
const memBucket = memory <= 2 ? '<=2' : memory <= 4 ? '3-4' : memory <= 8 ? '5-8' : '9+';
```

### Artifact Selection Priority
1. `human_reviewed` = true
2. Highest `technical_token_accuracy`
3. Highest `quality_score` / `average_confidence`
4. Latest compatible `ocr_version`

### Verification Checklist
- [ ] User A OCRs file X -> User B (same document access) gets result instantly.
- [ ] User C (no access to document) cannot query if file X exists by hash.
- [ ] Changing a single byte in file X results in a new hash and no reuse.
- [ ] Offline runs sync correctly with idempotency keys.
