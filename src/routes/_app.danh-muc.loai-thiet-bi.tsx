import { createFileRoute } from "@tanstack/react-router";
import { Tag } from "lucide-react";
import { CatalogTable } from "@/components/mirats/CatalogTable";
import { CatalogTools } from "@/components/mirats/CatalogTools";

export const Route = createFileRoute("/_app/danh-muc/loai-thiet-bi")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({
    q: typeof s.q === "string" && s.q.trim() ? s.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Chủng loại — Danh mục MIRATS" },
      {
        name: "description",
        content:
          "Danh mục chủng loại (categories): phân loại tài sản & model để lọc, thống kê và nhập liệu nhất quán.",
      },
    ],
  }),
  component: () => (
    <CatalogTable
      table="dm_loai_thiet_bi"
      usageColumn="loai_thiet_bi_id"
      title="Chủng loại"
      singular="Chủng loại"
      description="Phân loại tài sản/model (categories). Dùng để lọc, gom nhóm và thống kê."
      icon={Tag}
      namePlaceholder="VD: Máy tính, Switch, Máy phát UHF…"
      hiddenCols={["ma", "active"]}
      nameBadge
      headerActions={
        <CatalogTools
          config={{
            table: "dm_loai_thiet_bi",
            rpc: "gop_loai_thiet_bi",
            labelSingular: "chủng loại",
            slugPrefix: "LTB",
            textCols: [{ key: "mo_ta", header: "Mô tả" }],
            counts: [
              { key: "mau", header: "Mẫu", rels: [{ table: "dm_model", col: "loai_thiet_bi_id" }] },
              {
                key: "tb",
                header: "Tài sản",
                rels: [{ table: "thiet_bi", col: "loai_thiet_bi_id" }],
              },
            ],
            childExport: {
              label: "Xuất kèm mẫu",
              table: "dm_model",
              fkCol: "loai_thiet_bi_id",
              filePrefix: "loai-thiet-bi-kem-mau",
              childLabel: "model",
              cols: [
                { key: "p_n", header: "P/N" },
                { key: "mo_ta", header: "Mô tả" },
              ],
              refs: [
                {
                  col: "nha_san_xuat_id",
                  refTable: "dm_nha_san_xuat",
                  csvKey: "nha_san_xuat",
                  header: "Nhà sản xuất",
                },
              ],
            },
          }}
        />
      }
    />
  ),
});
