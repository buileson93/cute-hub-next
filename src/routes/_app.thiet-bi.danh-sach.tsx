import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Hợp nhất màn hình Tài sản: `/thiet-bi/danh-sach` và `/danh-muc/thiet-bi`
 * dùng cùng entity (`thiet_bi`), cùng query và cùng nghiệp vụ, nên chỉ giữ một
 * màn hình chuẩn tại `/danh-muc/thiet-bi`. Route cũ chỉ còn nhiệm vụ chuyển
 * hướng để không mất deep-link đang tồn tại.
 */
export const Route = createFileRoute("/_app/thiet-bi/danh-sach")({
  beforeLoad: () => {
    throw redirect({ to: "/danh-muc/thiet-bi", replace: true });
  },
});
