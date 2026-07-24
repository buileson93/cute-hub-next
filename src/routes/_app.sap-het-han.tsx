import { createFileRoute, redirect } from "@tanstack/react-router";

// Menu "Sắp hết hạn" đã được gộp vào "Giấy phép" và "Kiểm định & Hiệu chuẩn".
// Giữ route này để redirect các link cũ.
export const Route = createFileRoute("/_app/sap-het-han")({
  beforeLoad: () => {
    throw redirect({ to: "/giay-phep" });
  },
});
