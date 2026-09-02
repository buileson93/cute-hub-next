import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Task 43 — Alias route ADMIN_ONLY cho Quản trị người dùng.
 * Thực thi ở `/admin/users`; route này chỉ redirect (replace + giữ query params).
 */
export const Route = createFileRoute("/_app/quan-tri/nguoi-dung")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/admin/users", search: search as never, replace: true });
  },
});
