# GĐ3-02 — Recently Viewed & Pinned

## Goal
Sidebar có mục "Gần đây" (10 route/entity gần nhất) và "Ghim" (user tự pin).

## Acceptance
- Bảng `user_recent (user_id, path, label, viewed_at)` giới hạn 10 gần nhất per user.
- Bảng `user_pinned (user_id, path, label, order)` — user pin/unpin.
- Sidebar section mới ở dưới cùng.
- Auto-record khi navigate đến trang detail (`/thiet-bi/$id`, `/su-co/$id`, `/he-thong/$id`).

## Tests (viết trước)
1. Navigate 3 detail routes → sidebar "Gần đây" list đúng thứ tự.
2. Pin 1 item → xuất hiện trong "Ghim", vẫn giữ khi navigate.
3. Unpin → biến mất.
4. Giới hạn 10: navigate route 11 → cái đầu bị đẩy ra.

## Steps
1. Migration 2 bảng + RLS + GRANT.
2. Hook `useRouteTracker()` cắm vào `__root.tsx` hoặc `_authenticated/route.tsx`.
3. Component sidebar section.
4. Pin button trong header của mỗi trang detail.

## Definition of Done
- [ ] Migration approved.
- [ ] Tests xanh.
- [ ] Manual QA đủ 4 case.

## Rollback
Drop 2 bảng; gỡ section sidebar; gỡ pin button.
