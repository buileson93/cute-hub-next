import { StandardTable } from "@/components/mirats/StandardTable";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type TonKhoRow, LOAI_VAT_TU_META } from "@/lib/mirats/kho";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

interface SparePartsTableProps {
  rows: TonKhoRow[];
  isLoading: boolean;
}

export function SparePartsTable({ rows, isLoading }: SparePartsTableProps) {
  return (
    <StandardTable
      tableKey="vat_tu_ton_list"
      rows={rows}
      getRowId={(r) => `${r.vat_tu_id}-${r.kho_id}`}
      requireFilterToShow={false}
      trangThai={{ dangTai: isLoading }}
      emptyContent={
        <div className="py-8 text-center text-sm text-muted-foreground">
          Chưa có dữ liệu tồn kho.
        </div>
      }
      columns={[
        {
          key: "vat_tu",
          label: "Vật tư",
          filter: "text",
          value: (r) => r.ten_vat_tu,
          cell: (r) => (
            <div>
              <div className="font-medium">{r.ten_vat_tu}</div>
              {r.ma_vat_tu && (
                <div className="font-mono text-[11px] text-muted-foreground">{r.ma_vat_tu}</div>
              )}
            </div>
          ),
        },
        {
          key: "loai",
          label: "Loại",
          filter: "cat",
          hideBelow: "sm",
          value: (r) => LOAI_VAT_TU_META[r.loai].label,
          cell: (r) => {
            const m = LOAI_VAT_TU_META[r.loai];
            return (
              <Badge variant="outline" className={cn("border-transparent", m.cls)}>
                {m.label}
              </Badge>
            );
          },
        },
        {
          key: "kho",
          label: "Kho",
          filter: "cat",
          hideBelow: "md",
          value: (r) => r.ten_kho,
          cell: (r) => <span className="text-sm">{r.ten_kho}</span>,
        },
        {
          key: "ton",
          label: "Tồn",
          align: "right",
          sortable: true,
          value: (r) => r.ton_kho,
          sortValue: (r) => r.ton_kho,
          cell: (r) => {
            const low = r.ton_kho < r.muc_ton_toi_thieu;
            return (
              <span className={cn("text-right font-mono font-semibold", low && "text-red-600")}>
                {fmt(r.ton_kho)} {r.don_vi_tinh}
              </span>
            );
          },
        },
        {
          key: "dinh_muc",
          label: "Định mức",
          align: "right",
          sortable: true,
          value: (r) => r.muc_ton_toi_thieu,
          cell: (r) => (
            <span className="text-right font-mono text-sm text-muted-foreground">
              {fmt(r.muc_ton_toi_thieu)}
            </span>
          ),
        },
      ]}
    />
  );
}
