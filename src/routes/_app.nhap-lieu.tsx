// Route đã gộp vào /admin/nhap-lieu — chỉ giữ redirect để tránh 404 cho bookmark cũ.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/nhap-lieu")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/admin/nhap-lieu", search: search as never, replace: true });
  },
});
