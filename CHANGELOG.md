# Changelog

Tất cả thay đổi đáng chú ý của MIRATS 2.0 được ghi tại đây.

Tuân theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/) và
[Semantic Versioning](https://semver.org/lang/vi/).

## [Unreleased]

### Added
- **Task 43 — Quản trị người dùng/vai trò & tài liệu vận hành**
  - `src/lib/mirats/quan-tri/roles.ts` — logic thuần cho gán/tháo vai trò và
    kích hoạt/khoá tài khoản, có bảo vệ "admin cuối cùng" (chống lockout).
  - `src/lib/mirats/__tests__/quan-tri-roles.test.ts` — 15 test cho canAssignRole,
    canRevokeRole, canSetActive, isLastActiveAdmin, apply helpers.
  - `src/routes/_app.quan-tri.nguoi-dung.tsx` — alias ADMIN_ONLY redirect về
    `/admin/users`.
  - `docs/ops/runbook.md` — runbook 8 tình huống vận hành thường gặp
    (auth down, lockout, RLS, import, cảnh báo, realtime, khôi phục, xoay khoá).
  - `docs/release-process.md` — SemVer, feature flag, checklist release, rollback.
  - `CHANGELOG.md` — khởi tạo file changelog.

## [0.42.0] — Task 42

### Added
- Máy trạng thái duyệt/ký `nhap → cho_duyet → da_duyet` với 4-eye rule và
  SHA-256 signHash (`src/lib/mirats/duyet-ky.ts`).
- Migration: cột `trang_thai_duyet`, `nguoi_duyet_id`, `thoi_diem_duyet`,
  `chu_ky_hash` cho `bao_tri`, `ban_giao`, `form_submission`, `su_co`; cờ
  `luu_tru` cho 6 bảng hồ sơ.
- RPC `duyet_bien_ban()`, `luu_tru_ho_so()` và triggers bảo vệ toàn vẹn.
- Báo cáo xuất `.xlsx` đa-sheet: lý lịch tài sản, bảo dưỡng kỳ, sắp hết hạn.

## [0.41.0] — Task 41

### Changed
- Tối ưu hiệu năng backend & frontend: thêm 15 database index, cấu hình
  `staleTime`, code-splitting.

## [0.40.0] — Tasks 38–40

### Added
- Global error tracking, JSONB audit triggers, exponential backoff, và
  `pg_cron` alerts.

## [0.37.0] — Tasks 36–37

### Added
- GitHub Actions cho migration dry-run và staging→prod deploy.
- Production guards cho demo data, chuẩn hoá backup/rollback.

## [0.35.0] — Tasks 33–35

### Security
- Audit 95 bảng / 136 RPC; thu hồi public execute; `soft-signout.ts`; siết
  scope biến môi trường.

## [0.32.0] — Tasks 30–32

### Added
- `DetailDrawer.tsx` URL-synced, InlineField edit, BulkActionBar.

## [0.27.0] — Tasks 27–29

### Added
- Display registry, sidebar badges realtime, EntityHoverCard.

## [0.23.0] — Tasks 23–26

### Added
- `useListControls`, `DataTable`, `ActionBar`, `FormDialog` chuẩn hoá.

## [0.19.0] — Tasks 19–22

### Added
- Bulk import engine với staging, mappers chuyên biệt, atomic RPC.

## [0.13.0] — Tasks 13–18

### Added
- `han-canh-bao.ts`, UNIQUE INDEX serial, `kho_xuat` RPC, khoá `ma_thiet_bi`.

## [0.01.0] — Tasks 1–12

### Added
- Nền tảng MIRATS 2.0: unified maintenance/incident, MTTR/MTBF, RCA.
