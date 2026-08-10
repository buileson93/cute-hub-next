import { StandardTable } from "@/components/mirats/StandardTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil } from "lucide-react";
import { type LicenseRow } from "@/lib/mirats/db-licenses";
import { ExpiringBadge } from "@/components/mirats/ExpiringBadge";

const loaiColor: Record<string, string> = {
  GPKT: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  "QĐ đưa vào khai thác": "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  "GCN KĐ/HC": "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
};

const statusMeta: Record<string, { label: string; className: string }> = {
  valid: { label: "Còn hiệu lực", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  expiring: { label: "Sắp hết hạn", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  expired: { label: "Đã hết hạn", className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" },
  none: { label: "Chưa có", className: "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300" },
};

interface AssetRegistryBookProps {
  rows: LicenseRow[];
  canManage: boolean;
  onEdit: (row: LicenseRow) => void;
  onView: (row: LicenseRow) => void;
}

export function AssetRegistryBook({ rows, canManage, onEdit, onView }: AssetRegistryBookProps) {
  return (
    <StandardTable<LicenseRow>
      tableKey="giay_phep_registry"
      rows={rows}
      getRowId={(r) => r.rowId}
      requireFilterToShow={false}
      columns={[
        {
          key: "so_gp",
          label: "Số GP / Mã",
          filter: "text",
          value: (r) => r.soGP ?? r.ma ?? "",
          cell: (r) => (
            <div>
              <div className="font-mono text-xs font-semibold">{r.soGP || "—"}</div>
              <div className="text-[10px] text-muted-foreground uppercase">{r.ma}</div>
            </div>
          ),
        },
        {
          key: "doi_tuong",
          label: "Đối tượng gán",
          filter: "text",
          value: (r) => r.tenReal ?? "",
          cell: (r) => (
            <div>
              <div className="font-medium text-xs">{r.tenReal || "—"}</div>
              <div className="text-[10px] text-muted-foreground">{r.nguon === "gpkt" ? "Hệ thống" : "Tài sản"}</div>
            </div>
          ),
        },
        {
          key: "loai",
          label: "Loại GP",
          filter: "cat",
          value: (r) => r.loai ?? "",
          cell: (r) => (
            <Badge variant="outline" className={cn("text-[10px] border-transparent", loaiColor[r.loai ?? ""] || "bg-muted text-muted-foreground")}>
              {r.loai || "—"}
            </Badge>
          ),
        },
        {
          key: "han_dung",
          label: "Hạn dùng",
          sortable: true,
          value: (r) => r.ngayHetHan ?? "",
          cell: (r) => (
            <div className="space-y-1">
              <div className="text-[11px] font-mono">{r.ngayHetHan ? new Date(r.ngayHetHan).toLocaleDateString("vi-VN") : "—"}</div>
              <ExpiringBadge soNgay={r.soNgayConLai} compact className="h-4 text-[9px] px-1" />
            </div>
          ),
        },
        {
          key: "trang_thai",
          label: "Trạng thái",
          filter: "cat",
          value: (r) => statusMeta[r.trangThai]?.label ?? r.trangThai,
          cell: (r) => {
            const meta = statusMeta[r.trangThai];
            return meta ? (
              <Badge variant="outline" className={cn("text-[10px] border-transparent", meta.className)}>
                {meta.label}
              </Badge>
            ) : null;
          },
        },
        {
          key: "actions",
          label: "",
          align: "right",
          cell: (r) => (
            <div className="flex justify-end gap-1">
              {r.file && (
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onView(r)}>
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              )}
              {canManage && r.nguon === "giay_phep" && (
                <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => onEdit(r)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}

import { cn } from "@/lib/utils";
