# 04 — Naming convention

## Ngôn ngữ

- Tiếng Việt **không dấu** cho identifier code + DB (bảng, cột, biến, hàm).
- Tiếng Việt có dấu chỉ ở UI text + comment.
- Thuật ngữ hàng không: giữ nguyên tiếng Anh (`ATC`, `VOR`, `DME`, `ILS`, `NAVAID`, `AWOS`).

## Database

| Loại | Quy ước | Ví dụ |
|---|---|---|
| Bảng | `snake_case`, số nhiều tự nhiên | `thiet_bi`, `dm_he_thong`, `su_co` |
| Danh mục | Prefix `dm_` | `dm_don_vi`, `dm_model` |
| Bảng nối | Ghép 2 tên | `he_thong_thanh_phan`, `gan_chuc_nang` |
| Bảng log/lịch sử | Suffix `_lich_su` / `_log` | `su_co_lich_su`, `audit_log` |
| Cột | `snake_case` | `don_vi_id`, `ngay_tao` |
| Foreign key | `<bang>_id` | `thiet_bi_id`, `he_thong_id` |
| Function | `snake_case`, verb đầu | `khai_them_*`, `agent_add_*`, `can_*`, `has_role` |
| Function internal | Prefix `_` | `_sync_3lop`, `_validate_*` |
| Trigger function | Suffix `_trigger` hoặc verb rõ | `audit_row_change` |
| Enum | `snake_case` | `app_role` |

## Mã tài sản / thành phần

- Tài sản: `TSHT_<prefix>_<code>` do RPC sinh.
- Thành phần hệ thống: `TPHT_<code>`.
- Hệ thống: `HT_<code>`.

## TypeScript

| Loại | Quy ước | Ví dụ |
|---|---|---|
| File component | `PascalCase.tsx` | `ThanhPhanTable.tsx` |
| File logic | `kebab-case.ts` | `su-co-state.ts` |
| Server fn file | `<domain>.functions.ts` | `rbac.functions.ts` |
| Server-only file | `<domain>.server.ts` | `backup.server.ts` |
| Hook | `use-*.ts` (kebab) | `use-session.ts` |
| Route | flat dot, `_app.<path>.tsx` | `_app.he-thong.cay.tsx` |
| Component export | `PascalCase` | `KhaiThemDialogs` |
| Function/const | `camelCase` | `getMyPermissions` |
| Type | `PascalCase` | `AppRole`, `MyPerms` |
| Enum-like const | `SCREAMING_SNAKE` | `NAV_CONTRACT` |

## Query key

- Prefix theo domain: `['rbac','my-perms']`, `['thiet-bi','list', filters]`.
- Không dùng chuỗi tự do.
