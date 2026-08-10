import { StandardTable } from "@/components/mirats/StandardTable";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type GiaoDichRow, LOAI_GD_META } from "@/lib/mirats/kho";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

interface StockMovementLogProps {
  rows: GiaoDichRow[];
  isLoading: boolean;
}

export function StockMovementLog({ rows, isLoading }: StockMovementLogProps) {
  return (
    <StandardTable
      tableKey="vat_tu_giaodich_list"
      rows={rows}
      getRowId={(g) => g.id}
      requireFilterToShow={false}
      trangThai={{ dangTai: isLoading }}
      emptyContent={
        <div className="py-8 text-center text-sm text-muted-foreground">
          Chưa có giao dịch nào.
        </div>
      }
      columns={[
        {
          key: "so_ct",
          label: "Số CT",
          filter: "text",
          value: (g) => g.so_ct ?? "",
          cell: (g) => <span className="font-mono text-[11px]">{g.so_ct ?? "—"}</span>,
        },
        {
          key: "ngay",
          label: "Ngày",
          sortable: true,
          hideBelow: "xl",
          value: (g) => g.ngay,
          cell: (g) => <span className="text-sm">{new Date(g.ngay).toLocaleDateString("vi-VN")}</span>,
        },
        {
          key: "vat_tu",
          label: "Vật tư",
          filter: "text",
          value: (g) => g.vat_tu?.ten ?? "",
          cell: (g) => <span className="text-sm">{g.vat_tu?.ten ?? "—"}</span>,
        },
        {
          key: "kho",
          label: "Kho",
          filter: "cat",
          hideBelow: "md",
          value: (g) => g.kho?.ten ?? "",
          cell: (g) => <span className="text-sm">{g.kho?.ten ?? "—"}</span>,
        },
        {
          key: "loai",
          label: "Loại",
          filter: "cat",
          hideBelow: "sm",
          value: (g) => LOAI_GD_META[g.loai].label,
          cell: (g) => {
            const meta = LOAI_GD_META[g.loai];
            return (
              <Badge variant="outline" className={cn("border-transparent", meta.cls)}>
                {meta.label}
              </Badge>
            );
          },
        },
        {
          key: "so_luong",
          label: "Số lượng",
          align: "right",
          sortable: true,
          value: (g) => g.so_luong,
          cell: (g) => {
            const meta = LOAI_GD_META[g.loai];
            return (
              <span
                className={cn(
                  "text-right font-mono font-semibold",
                  meta.nhap ? "text-emerald-600" : "text-red-600",
                )}
              >
                {meta.nhap ? "+" : "−"}
                {fmt(g.so_luong)} {g.vat_tu?.don_vi_tinh ?? ""}
              </span>
            );
          },
        },
      ]}
    />
  );
}
