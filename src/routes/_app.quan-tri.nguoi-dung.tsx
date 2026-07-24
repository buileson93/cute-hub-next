import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Task 43 — Alias route ADMIN_ONLY cho Quản trị người dùng.
 * Thực thi ở `/admin/users`; route này chỉ redirect về trang chính.
 */
export const Route = createFileRoute("/_app/quan-tri/nguoi-dung")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/users" });
  },
});
