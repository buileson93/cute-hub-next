# GĐ1-02 — Notification Center

## Goal
Thay dòng toast rơi mất bằng Notification Center có lịch sử (24h). Toast chỉ dùng cho phản hồi hành động tức thời của chính user; sự kiện realtime từ hệ thống → notification center.

## Acceptance
- Bảng `thong_bao_user` có RLS scope `auth.uid()`.
- Icon chuông trong header, badge số chưa đọc.
- Popover danh sách, click → điều hướng link, đánh dấu đã đọc.
- Realtime cập nhật khi có row mới.
- Nút "Đánh dấu tất cả đã đọc".

## Tests (viết trước)
1. Migration test: insert 1 thông báo cho user A → user B query không thấy (RLS pass).
2. Component test `NotificationBell.tsx`: mount với 3 unread → badge hiển thị "3".
3. Click item → `onOpen` được gọi + `read_at` được update (mock supabase).
4. Realtime: emit fake INSERT → badge tăng 1 không cần refresh.
5. E2E (playwright): mở app, gọi RPC seed 1 thông báo → chuông đỏ → click → điều hướng đúng.

## Steps
1. Migration: `CREATE TABLE public.thong_bao_user (id uuid pk, user_id uuid fk, kind text, title text, body text, link text, read_at timestamptz null, created_at timestamptz default now())` + GRANT authenticated + RLS `auth.uid() = user_id` + service_role ALL.
2. Component `src/components/mirats/NotificationBell.tsx` dùng `usePagedQuery` + subscribe channel `thong_bao_user:user_id=eq.<uid>`.
3. Thêm vào `src/components/mirats/AppHeader.tsx` bên trái đồng hồ.
4. Refactor các nơi đang toast sự kiện realtime (sự cố mới, PM overdue, GP hết hạn) → insert vào `thong_bao_user` thay vì toast.
5. Playwright script `/tmp/browser/notif-center/run.py`.

## Definition of Done
- [ ] Migration approved + applied.
- [ ] Unit tests xanh.
- [ ] Playwright screenshot xác nhận chuông + popover.
- [ ] Toast rơi mất đã được thay ở ít nhất 3 chỗ.

## Rollback
Drop bảng `thong_bao_user`; gỡ `NotificationBell` khỏi header; khôi phục toast cũ ở các nơi đã refactor (tag commit).
