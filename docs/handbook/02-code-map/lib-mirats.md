# 02 — Code map: `src/lib/mirats/`

154 module logic domain thuần TypeScript (unit-test được, không side-effect trừ khi tên có `.functions.ts`/`.server.ts`).

## Nhóm theo chức năng

### Danh mục & quality (N1)

- `danh-muc-quality.ts` — dedupe, Levenshtein, đề xuất merge.
- `danh-muc-refs.ts` — resolve reference giữa danh mục.
- `data-quality.ts`, `data-quality.functions.ts` — báo cáo chất lượng dữ liệu.
- `entity-resolve.ts`, `rename-entity.ts` — chuẩn hoá + đổi tên xuyên bảng.
- `taxonomy-invariant.ts` — bất biến taxonomy.

### Tài sản, hệ thống, thành phần

- `he-thong-thanh-phan.ts` — CRUD thành phần, resolver đơn vị.
- `cay-reorg.ts`, `cay-delete.ts` — move/delete node cây, sinh audit.
- `so-ly-lich.ts` — sổ lý lịch tài sản (aggregate view).
- `ma-thiet-bi.ts` — generate mã tài sản (TSHT*, THHT*…).
- `thiet-bi-khe-linh-kien.ts`, `khe-gan.ts` — khe linh kiện.
- `topology.ts`, `system-graph.ts`, `graph-*.ts` — N13.
- `lien-ket.ts` — liên kết hệ thống.
- `record-snapshot.ts`, `record-timeline.ts` — history N3.
- `device-movement-history.ts` — lịch sử lắp/tháo.

### Vận hành (N4/N5/N6)

- `su-co-*.ts` — FSM sự cố, workflow, validate, insert helper.
- `hong-hoc-state.ts`, `van-de-state.ts`, `cong-viec-state.ts` — state machine.
- `bao-tri-*.ts` — form + KPI + consistency.
- `pm.ts`, `cong-viec-bao-tri.ts` — PM lịch, sinh công việc.
- `canh-bao-het-han.ts`, `canh-bao.ts`, `han-canh-bao.ts` — N5.
- `pl04-metrics.ts`, `reliability.ts`, `metrics.ts` — N9.

### Forms (Form Designer 2.0)

- `form-schema.ts`, `form-designer-io.ts`, `field-form.ts` — schema field.
- `form-include*.ts` — include cross-template.
- `form-signer.ts`, `chu-ky.ts`, `duyet-ky.ts`, `sig-canonical.ts` — ký số + canonical string.
- `form-visibility.ts`, `checklist*.ts` — required_if / section_repeat / checklist.
- `form-word.ts` — export Word.
- `form-attachments.ts`.

### Import/Export (N10)

- `import/core.ts` + `import/types.ts` — engine dry-run thuần.
- `import-engine.ts`, `import-staging.ts`, `import-config.ts` — orchestration.
- `import-alias.functions.ts`, `import-apply.functions.ts`, `import-export.functions.ts`, `import-staging.functions.ts` — server side.
- `allinone-template.ts`, `export-template.ts`.

### AI, ambient, voice, vision

- `ask-ai.ts`, `command-intent.ts`, `command-intent-ai.functions.ts` — Command Palette v2.
- `prefill-suggestions.ts` — ambient autofill.
- `voice-recognition.ts` — Web Speech.
- `nhan-qr.ts`, `qr.ts` — QR (N7).
- `crop-image.ts`, `image-compress.ts`, `awos-grounding.ts` — vision hint.

### RBAC & quyền

- `quyen.ts` — ma trận GHI (đã đọc trong context).
- `scope.tsx` — provider unit scope.
- `feature-flags.ts`.

### DB helper

- `db/*` (thư mục con) — helper Supabase.
- `db-*.ts` — aggregate, expiring, licenses, taxonomy, smart search.
- `paged.ts`, `paginate.ts` — pagination.
- `offline-cache.ts`, `offline-queue.ts` — N11.

### UI helper

- `ui/*` — shared UI utility.
- `motion.ts`, `mau-sac.ts`, `display.ts`, `format.ts` — trình bày.
- `layer-vocab.tsx` — vocab lớp cây.
- `nav/`, `nav-contract.ts` — nav definition.
- `column-prefs.ts`, `editable-columns.ts`, `thiet-bi-columns.ts` — column config.
- `search/`, `global-search.tsx` — search index.
- `registry.ts`, `types.ts`.

### Backup, audit, ops

- `change-log.ts`, `change-request.ts` — N2.
- `rollback-preview.ts`, `fail-action.ts`.
- `backup.functions.ts` / `backup.server.ts` (ngoài mirats).

### Server-only

- `command-intent-ai.functions.ts`, `data-quality.functions.ts`, `import-*.functions.ts`, `thanh-phan-log.functions.ts`, `pdf-render.server.ts`.

## Quy ước

- File `.functions.ts` → xuất `createServerFn`; component gọi qua `useServerFn`.
- File `.server.ts` → chỉ import từ file `.server.ts` khác (import protection).
- File thuần `.ts` → pure logic, không đụng Supabase → dùng cho unit test.
