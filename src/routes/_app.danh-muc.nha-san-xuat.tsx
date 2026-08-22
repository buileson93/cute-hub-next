import { createFileRoute } from "@tanstack/react-router";
import { Factory } from "lucide-react";
import { CatalogTable } from "@/components/mirats/CatalogTable";
import { NhaSanXuatTools } from "@/components/mirats/NhaSanXuatTools";

export const Route = createFileRoute("/_app/danh-muc/nha-san-xuat")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({
    q: typeof s.q === "string" && s.q.trim() ? s.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Nhà sản xuất — Danh mục MIRATS" },
      {
        name: "description",
        content:
          "Danh mục nhà sản xuất (manufacturers): quản lý tập trung để chọn nhanh khi khai tài sản và model.",
      },
    ],
  }),
  component: () => (
    <CatalogTable
      table="dm_nha_san_xuat"
      usageColumn="nha_san_xuat_id"
      title="Nhà sản xuất"
      singular="Nhà sản xuất"
      description=""
      icon={Factory}
      namePlaceholder="VD: Honeywell, Vaisala, Cisco…"
      hiddenCols={["active"]}
      headerActions={<NhaSanXuatTools />}
    />
  ),
});
