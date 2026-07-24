# GĐ3-01 — Per-user Layout Memory

## Goal
Mỗi user nhớ layout riêng: cột ẩn/hiện, view mode, sort, filter mặc định, panel state per route.

## Acceptance
- Bảng `user_layout_prefs (user_id, key, value jsonb)` — RLS scope user.
- Hook `useUserPref(key, default)` — đọc/ghi debounce 500ms.
- Áp dụng: bảng tài sản, bảng thành phần, bảng sự cố, tree/table/mindmap toggle.
- Reset preferences: menu user có nút "Khôi phục mặc định".

## Tests (viết trước)
1. Migration + RLS test.
2. Hook: set → reload → giá trị giữ.
3. User B không thấy prefs của user A.
4. Reset nút → xoá row → về default.

## Steps
1. Migration bảng + RLS + GRANT.
2. Server fn `getUserPrefs/setUserPref`.
3. Hook `useUserPref` với optimistic update.
4. Refactor 3 bảng dùng hook.
5. Menu user: nút Reset.

## Definition of Done
- [ ] Migration approved.
- [ ] Tests xanh.
- [ ] Manual: ẩn cột → reload → còn ẩn; đăng nhập user khác → không ảnh hưởng.

## Rollback
Drop bảng; hook fallback về default; bỏ nút Reset.
