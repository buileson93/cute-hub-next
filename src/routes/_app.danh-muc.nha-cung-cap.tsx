import { createFileRoute } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { CatalogTable } from "@/components/mirats/CatalogTable";
import { CatalogTools } from "@/components/mirats/CatalogTools";

export const Route = createFileRoute("/_app/danh-muc/nha-cung-cap")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({
    q: typeof s.q === "string" && s.q.trim() ? s.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Nhà cung cấp — Danh mục MIRATS" },
      {
        name: "description",
        content:
          "Danh mục nhà cung cấp (suppliers): đơn vị cung ứng, mua sắm tài sản — chọn nhanh khi khai tài sản.",
      },
    ],
  }),
  component: () => (
    <CatalogTable
      table="dm_nha_cung_cap"
      usageColumn="nha_cung_cap_id"
      title="Nhà cung cấp"
      singular="Nhà cung cấp"
      description="Đơn vị cung ứng/mua sắm tài sản (suppliers). Dùng cho hồ sơ mua sắm & bảo hành."
      icon={Truck}
      namePlaceholder="VD: Công ty TNHH ABC…"
      headerActions={
        <CatalogTools
          config={{
            table: "dm_nha_cung_cap",
            rpc: "gop_nha_cung_cap",
            labelSingular: "nhà cung cấp",
            slugPrefix: "NCC",
            textCols: [{ key: "mo_ta", header: "Mô tả" }],
            counts: [
              {
                key: "tb",
                header: "Tài sản",
                rels: [{ table: "thiet_bi", col: "nha_cung_cap_id" }],
              },
            ],
          }}
        />
      }
    />
  ),
});
