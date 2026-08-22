---
title: Fix User Creation and Set Up Technical Accounts
description: Resolve metadata mismatch in admin user creation and configure requested technical accounts with appropriate roles.
---

## Background

The user reported issues creating new accounts via the admin panel. Investigation reveals a metadata mismatch: the admin user creation server function was sending `ho_ten` in `user_metadata`, while the database trigger likely expects `full_name`. Additionally, specific technical accounts need to be created or updated with the "Phòng kỹ thuật" role (`phong_kt`).

## Objectives

1. **Fix User Creation Logic**: Update `src/lib/admin-users.functions.ts` to use `full_name` in `user_metadata` to match Supabase defaults/triggers.
2. **Verify/Fix Role Assignments**: Ensure the requested accounts have the `phong_kt` role and are active.
3. **Audit and Cleanup**: Verify that all created accounts are confirmed and ready for use.

## Technical Details

### 1. Fix `createUser` Metadata

Update `src/lib/admin-users.functions.ts`:

- Change `user_metadata: { ho_ten: data.ho_ten }` to `user_metadata: { full_name: data.ho_ten, ho_ten: data.ho_ten }` to ensure compatibility with standard Supabase triggers while maintaining legacy field support.

### 2. Configure Requested Accounts

We will ensure the following accounts are set up correctly:

| Email                      | Name (Ho Ten)       | Role       | Status |
| :------------------------- | :------------------ | :--------- | :----- |
| `vuhongson@vatm.vn`        | Vũ Hồng Sơn         | `phong_kt` | Active |
| `trannguyenbaoanh@vatm.vn` | Trần Nguyễn Bảo Anh | `phong_kt` | Active |
| `tranquangvinh@vatm.vn`    | Trần Quang Vinh     | `phong_kt` | Active |
| `nguyenluonggiam@vatm.vn`  | Nguyễn Lương Giám   | `phong_kt` | Active |
| `doanhuutuan@vatm.vn`      | Đoàn Hữu Tuấn       | `phong_kt` | Active |

_Note: `doanhuutuan@vatm.vn` currently has the `ktv` role and will be updated to `phong_kt`._

### 3. Implementation Steps

- **Step 1**: Modify `src/lib/admin-users.functions.ts` to fix the metadata field name.
- **Step 2**: Update `doanhuutuan@vatm.vn` role from `ktv` to `phong_kt` in `user_roles` table.
- **Step 3**: Ensure all accounts are marked as `active` in the `profiles` table.
- **Step 4**: Verify that `confirmed_at` is set for all these users in `auth.users` (automated via SQL).

## Verification Plan

1. **Test User Creation**: Attempt to create a test account through the admin UI (if possible) or verify the logic manually.
2. **Database Audit**: Run a final query to check that all 5 accounts have the correct `ho_ten`, `active` status, and `phong_kt` role.
3. **Session Test**: (Optional) Use Playwright to verify that the login page accepts credentials for one of the new accounts (if a known password exists).
