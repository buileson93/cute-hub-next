import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { StandardTable, ColumnDef } from "@/components/mirats/StandardTable";
import { CatalogTable } from "@/components/mirats/CatalogTable";
import { RawTableWrapper } from "@/components/mirats/ui/RawTableWrapper";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTableCore, DataTableColumn } from "@/components/mirats/DataTableCore";

export const Route = createFileRoute("/lovable/table-audit")({
  component: TableAuditFixture,
});

type SampleData = { id: number; name: string; status: string; date: string; value: number };

const SAMPLE_ROWS: SampleData[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `Thực thể dữ liệu số ${i + 1}`,
  status: i % 3 === 0 ? "active" : i % 3 === 1 ? "maintenance" : "error",
  date: "2026-08-21",
  value: Math.floor(Math.random() * 1000000),
}));

const COLUMNS_STD: ColumnDef<SampleData>[] = [
  { header: "ID", key: "id", width: 60 },
  { header: "Tên thực thể", key: "name", minWidth: 200, priority: "primary" },
  { header: "Trạng thái", key: "status", width: 120, priority: "secondary" },
  { header: "Ngày cập nhật", key: "date", width: 150, priority: "secondary" },
  { header: "Giá trị", key: "value", width: 150, align: "right", priority: "detail" },
];

const COLUMNS_CORE: DataTableColumn<SampleData>[] = [
  { key: "id", header: "ID", width: 60, align: "center" },
  { key: "name", header: "Tên thực thể", minWidth: 200, sticky: true },
  { key: "status", header: "Trạng thái", type: "status", width: 120 },
  { key: "date", header: "Ngày cập nhật", type: "date", width: 120 },
  { key: "value", header: "Giá trị (VND)", type: "currency", width: 150, align: "right" },
  {
    key: "actions",
    header: "Thao tác",
    type: "actions",
    width: 100,
    align: "center",
    render: () => <Badge variant="outline">Xem</Badge>,
  },
];

function TableAuditFixture() {
  return (
    <PageBody className="space-y-12 pb-20">
      <PageHeader
        title="Table Architecture Audit (Phase U9)"
        description="Kiểm tra độ ổn định, hiệu năng và responsive của các kiến trúc bảng MIRATS."
      />

      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
          <Badge className="bg-primary">Case 0</Badge> DataTableCore (New Architecture)
        </h2>
        <DataTableCore
          rows={SAMPLE_ROWS}
          columns={COLUMNS_CORE}
          getRowId={(r) => r.id.toString()}
          maxHeight={400}
          virtualize
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Badge>Case 1</Badge> StandardTable (Data-heavy)
        </h2>
        <div className="border rounded-xl overflow-hidden bg-card">
          <StandardTable
            rows={SAMPLE_ROWS}
            columns={COLUMNS_STD as ColumnDef<unknown>[]}
            selectable
            tableKey="audit-standard"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Badge>Case 2</Badge> components/ui/table (Primitive)
        </h2>
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Invoice</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">INV001</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Credit Card</TableCell>
                <TableCell className="text-right">$250.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">INV002</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell>PayPal</TableCell>
                <TableCell className="text-right">$150.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Badge>Case 3</Badge> RawTableWrapper (Legacy Group B)
        </h2>
        <RawTableWrapper maxHeight={300}>
          <table>
            <thead>
              <tr>
                <th>Header A</th>
                <th>Header B</th>
                <th>Header C</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td>Dữ liệu A {i}</td>
                  <td>Dữ liệu B {i}</td>
                  <td>Dữ liệu C {i}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </RawTableWrapper>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Badge>Case 4</Badge> CatalogTable (Domain-Specific)
        </h2>
        <div className="border rounded-xl overflow-hidden bg-card">
          <CatalogTable
            table="dm_loai_thiet_bi"
            usageColumn="loai_thiet_bi_id"
            title="Loại thiết bị"
            singular="loại thiết bị"
            description="Quản lý danh mục chủng loại tài sản"
            icon={Badge}
            namePlaceholder="Ví dụ: Laptop, Máy in..."
          />
        </div>
      </section>
    </PageBody>
  );
}
