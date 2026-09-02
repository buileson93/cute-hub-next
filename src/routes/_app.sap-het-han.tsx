import { createFileRoute, redirect } from "@tanstack/react-router";

// Menu "Sắp hết hạn" đã được gộp vào "Giấy phép" và "Kiểm định & Hiệu chuẩn".
// Giữ route này để redirect các link cũ (giữ nguyên query params tìm kiếm/lọc,
// thay thế history entry để nút Back không rơi lại vòng redirect).
export const Route = createFileRoute("/_app/sap-het-han")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/giay-phep", search: search as never, replace: true });
  },
});
