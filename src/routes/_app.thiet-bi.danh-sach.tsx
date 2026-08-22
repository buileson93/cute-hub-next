import { createFileRoute } from "@tanstack/react-router";
import { PageBody } from "@/components/mirats/PageBody";
import { PageHeader } from "@/components/mirats/PageHeader";
import { DataTableCore, type DataTableColumn } from "@/components/mirats/DataTableCore";
import { useDbTaxonomy } from "@/lib/mirats/db-taxonomy";
import { DataState } from "@/components/mirats/DataState";
import { useMemo } from "react";

export const Route = createFileRoute("/_app/thiet-bi/danh-sach")({
  head: () => ({
    meta: [
      { title: "Danh sách thiết bị — MIRATS" },
      { name: "description", content: "Quản lý danh sách thiết bị tập trung." },
    ],
  }),
  component: ThietBiListPage,
});

function ThietBiListPage() {
  const { data: taxo, isLoading, error } = useDbTaxonomy();

  const columns = useMemo<DataTableColumn<any>[]>(
    () => [
      { key: "ma_thiet_bi", header: "Mã thiết bị", sticky: true, width: 120 },
      { key: "ten", header: "Tên thiết bị", width: 250 },
      { key: "trang_thai", header: "Trạng thái", type: "status", width: 150 },
      { key: "model", header: "Model", width: 150 },
      { key: "serial", header: "Số Serial", width: 150 },
      { key: "nha_san_xuat", header: "Nhà sản xuất", width: 150 },
      { key: "don_vi", header: "Đơn vị", width: 120 },
      { key: "ngay_mua", header: "Ngày mua", type: "date", width: 120 },
      { key: "gia_tri", header: "Giá trị", type: "currency", width: 150, align: "right" },
    ],
    [],
  );

  const state = isLoading
    ? "loading"
    : error
      ? "error"
      : !taxo?.devices.length
        ? "empty"
        : "success";

  return (
    <PageBody className="flex flex-col">
      <PageHeader
        title="Danh sách thiết bị"
        subtitle="Quản lý tập trung toàn bộ tài sản thiết bị"
      />

      <div className="flex-1 min-h-0 p-4">
        <DataState state={state}>
          <DataTableCore
            rows={taxo?.devices || []}
            columns={columns}
            getRowId={(row) => row.ma_thiet_bi || row.id}
            fitViewport
            className="border shadow-sm"
          />
        </DataState>
      </div>
    </PageBody>
  );
}
