# UX 2026 — Roadmap nâng cấp MIRATS

> Phong cách: superpowers (obra/superpowers). Mỗi bước là 1 spec nhỏ, độc lập, có acceptance test cụ thể — RED trước, GREEN sau. Không được implement khi test chưa được viết.

## Nguyên tắc

1. **TDD bắt buộc**: mỗi spec liệt kê test cases trước phần Steps. Test viết trước → chạy đỏ → code → chạy xanh.
2. **Một spec một mục tiêu**: khi thấy spec > 120 dòng, tách nhỏ.
3. **Không nhảy bước**: hoàn tất checklist "Definition of Done" trước khi mở spec kế.
4. **Rollback plan**: mỗi spec có block "Rollback" nêu cách gỡ sạch nếu hỏng.
5. **Không phá kiến trúc**: tuân thủ `mirats-edit-ssot-design.md`, quy tắc RLS + GRANT, quy ước 1 tài sản ↔ nhiều thành phần.

## Cấu trúc

```
ux2026/
├── README.md                          ← file này
├── gd1-foundation-calm/               ← Nền tảng & Calm UX (2 tuần)
│   ├── 01-motion-tokens.md
│   ├── 02-notification-center.md
│   ├── 03-progressive-disclosure.md
│   ├── 04-empty-states.md
│   ├── 05-a11y-audit.md
│   └── 06-perf-pass.md
├── gd2-narrative-contextual/          ← Narrative + Contextual + Ambient (3 tuần)
│   ├── 01-daily-brief-rpc.md
│   ├── 02-narrative-overview.md
│   ├── 03-command-palette-v2.md
│   ├── 04-contextual-toolbar.md
│   ├── 05-ambient-autofill.md
│   └── 06-anomaly-hint.md
└── gd3-personalization-multimodal/    ← Cá nhân hoá + Đa phương thức (3–4 tuần)
    ├── 01-per-user-layout-memory.md
    ├── 02-recently-viewed-pinned.md
    ├── 03-voice-quick-log.md
    ├── 04-qr-scanner-inapp.md
    ├── 05-vision-image-hint.md
    └── 06-dialog-primitive.md
```

## Ưu tiên

GĐ 1 → GĐ 2 → GĐ 3. Không được nhảy sang GĐ 2 khi GĐ 1 còn spec chưa DONE.

## Cách chạy 1 spec

1. Đọc spec.
2. Viết test theo mục **Tests** → chạy → xác nhận đỏ.
3. Thực hiện **Steps**.
4. Chạy lại test → xanh.
5. Tick từng dòng **Definition of Done**.
6. Nếu hỏng → làm theo **Rollback**.

## Trạng thái

| GĐ  | Spec                      | Trạng thái                                                                                                                                                                                                                                  |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 01-motion-tokens          | DONE                                                                                                                                                                                                                                        |
| 1   | 02-notification-center    | DONE (bảng `notifications` + RLS user_id, `NotificationBell` realtime + badge + mark all read)                                                                                                                                              |
| 1   | 03-progressive-disclosure | DONE                                                                                                                                                                                                                                        |
| 1   | 04-empty-states           | DONE (component `EmptyState` icon 48px + role=status, áp dụng ≥6 chỗ: sự cố, PM, tài sản, catalog, notification, tuân thủ)                                                                                                                  |
| 1   | 05-a11y-audit             | DONE (script `scripts/a11y-lint.mjs` 0 vi phạm; focus-visible token trong `styles.css`; `h-screen`=0; `<img>` thiếu alt=0; report `/tmp/a11y/lint-report.txt`)                                                                              |
| 1   | 06-perf-pass              | DONE (`scripts/perf-budget.mjs` OK: 635 chunks, max 256.5 KB gzip < 400 KB; build không warning; form designer + xyflow + exceljs đã tách chunk riêng)                                                                                      |
| 2   | 01-daily-brief-rpc        | DONE (function `rpc_daily_brief` trả 8 metric + generated_at, EXPLAIN ANALYZE 7.9ms; hook `useDailyBrief` refetch 5 phút; component `DailyBrief` render trong `/`)                                                                          |
| 2   | 02-narrative-overview     | DONE                                                                                                                                                                                                                                        |
| 2   | 03-command-palette-v2     | DONE                                                                                                                                                                                                                                        |
| 2   | 04-contextual-toolbar     | DONE                                                                                                                                                                                                                                        |
| 2   | 05-ambient-autofill       | DONE (`usePrefillKipTruc`/`usePrefillBienPhap` cache 60s; `AutoFilledBadge` + `useAmbientApply` áp dụng ở `/su-co/moi` mục 4 kíp trực & 5 biện pháp; undo về rỗng, không ghi đè khi user gõ; tests 4/4 xanh)                                |
| 2   | 06-anomaly-hint           | DONE (MV `mv_asset_anomaly` + `refresh_mv_asset_anomaly()`; pg_cron `0 */6 * * *`; `rpc_tai_san_toan_cuc` join z_score/incident_count_90d → `soSuCo90n`/`anomalyScore`; `<AnomalyBadge>` render z≥2 trong `ThanhPhanTable`; tests 3/3 xanh) |
| 3   | 01-per-user-layout-memory | DONE                                                                                                                                                                                                                                        |
| 3   | 02-recently-viewed-pinned | DONE                                                                                                                                                                                                                                        |
| 3   | 03-voice-quick-log        | DONE                                                                                                                                                                                                                                        |
| 3   | 04-qr-scanner-inapp       | DONE                                                                                                                                                                                                                                        |
| 3   | 05-vision-image-hint      | DONE                                                                                                                                                                                                                                        |
| 3   | 06-dialog-primitive       | DONE (primitive + tests; refactor 3 dialog cũ để riêng)                                                                                                                                                                                     |
