import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Đăng nhập — MIRATS 2.0" },
      { name: "description", content: "Đăng nhập vào hệ thống quản lý tài sản kỹ thuật MIRATS 2.0." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <Outlet />,
});
