import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { CatalogTable } from "@/components/mirats/CatalogTable";
import { PageHeader } from "@/components/mirats/PageHeader";


export const Route = createFileRoute("/_app/danh-muc/don-vi")({
  head: () => ({
    meta: [
      { title: "Đơn vị — Danh mục nền tảng MIRATS 2.0" },
      { name: "description", content: "Danh mục đơn vị quản lý đọc trực tiếp từ cơ sở dữ liệu." },
    ],
  }),
  component: DonViPage,
});

function DonViPage() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Danh mục đơn vị"
        icon={Building2}
        description="Quản lý danh sách các đơn vị trong hệ thống MIRATS."
      />


    <CatalogTable
      table="dm_don_vi"
      usageColumn="don_vi_id"
      title="Đơn vị"
      singular="Đơn vị"
      description="Đơn vị quản lý — tài sản trỏ tới đơn vị qua khoá ngoại."
      icon={Building2}
      namePlaceholder="VD: Đài Thông tin Duyên hải…"
      hiddenCols={["ma", "mo_ta", "active"]}
    />
    </div>
  );
}
