# Plan - OCR PDF Platform Foundation for MIRATS

The user wants to implement the foundation for an OCR PDF platform in MIRATS.
Based on the codebase exploration, this foundation has already been implemented in the previous turns (migration `20260819123640_8f609fc0-ae61-4693-a1a0-ac457524dd7a.sql` and modules in `src/lib/mirats/document-ocr/`).

I will verify the implementation against the requested requirements and finalize any missing pieces or confirm completion.

## Requirements Checklist & Status

- [x] **CREATE TABLE tai_lieu_ocr**: Implemented in migration `20260819123640`.
- [x] **Fields**: `id`, `source_type`, `source_id`, `file_hash`, `status`, `page_count`, `processed_pages`, `full_text`, `normalized_text`, `pages`, `language`, `average_confidence`, `provider_id`, `quality_profile`, `ocr_version`, `error_code`, `error_message`, `created_by`, `created_at`, `updated_at`.
- [x] **Constraints**: `UNIQUE(source_type, source_id)`, `CHECK` on status and source_type.
- [x] **Page structure**: Defined in `src/lib/mirats/document-ocr/types.ts` (Zod schema).
- [x] **RLS**: Implemented in migration with inheritance logic from source documents.
- [x] **Feature Flags**: Added to `src/lib/mirats/feature-flags.ts`.
- [x] **Modules**:
    - `src/lib/mirats/document-ocr/types.ts`
    - `src/lib/mirats/document-ocr/repository.ts`
    - `src/lib/mirats/document-ocr/status.ts`
    - `src/lib/mirats/document-ocr/config.ts`
- [x] **Idempotent Migration**: Yes, uses `CREATE TABLE IF NOT EXISTS` and `CREATE OR REPLACE FUNCTION`.
- [x] **Cascade Delete**: Implemented via triggers in SQL.
- [x] **Tests**: `src/lib/mirats/document-ocr/__tests__/ocr-logic.test.ts` exists.

## Proposed Actions

1. **Verify Test Suite**: Run the existing tests to ensure the logic is sound.
2. **Typecheck**: Verify the TypeScript implementation is strict and error-free.
3. **Report**: Confirm completion to the user.

## User Review Required

> [!IMPORTANT]
> The OCR platform foundation appears to be fully implemented as per the latest request. I will run a final validation to ensure everything is working as expected.

- Are there any specific OCR providers you'd like to prioritize for the next phase?
- Should the `file_hash` invalidation logic be handled at the application level (Repository) or via a DB trigger? (Current: Repository level in `queueOcr`).
