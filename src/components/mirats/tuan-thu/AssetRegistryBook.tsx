import { StandardTable } from "@/components/mirats/StandardTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil } from "lucide-react";
import { type LicenseRow } from "@/lib/mirats/db-licenses";
import { ExpiringBadge } from "@/components/mirats/ExpiringBadge";

import { StatusBadge } from "@/components/mirats/StatusBadge";


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
          value: (r) => r.soGP ?? r.maGiayPhep ?? "",
          cell: (r) => (
            <div>
              <div className="font-mono text-xs font-semibold">{r.soGP || "—"}</div>
              <div className="text-[10px] text-muted-foreground uppercase">{r.maGiayPhep || "—"}</div>
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
            <StatusBadge domain="bao_tri" code={r.loai} label={r.loai} />
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
          value: (r) => {
            const labels: any = { valid: 'Còn hiệu lực', expiring: 'Sắp hết hạn', expired: 'Đã hết hạn', none: 'Chưa có' };
            return labels[r.trangThai] ?? r.trangThai;
          },
          cell: (r) => {
            // "valid", "expiring", "expired", "none" aren't standard MIRATS status codes yet
            // but we use StatusBadge with domain 'thiet_bi' if we had them or 'health'
            // For now, mapping manually to StatusBadge for consistency if possible, 
            // or use a temporary local registry.
            // Let's assume 'valid' -> DANG_KHAI_THAC, 'expired' -> HONG for colors.
            const map: any = { valid: 'DANG_KHAI_THAC', expiring: 'CHO_XU_LY', expired: 'HONG', none: 'NGUNG_KHAI_THAC' };
            const labels: any = { valid: 'Còn hiệu lực', expiring: 'Sắp hết hạn', expired: 'Đã hết hạn', none: 'Chưa có' };
            return <StatusBadge domain="thiet_bi" code={map[r.trangThai]} label={labels[r.trangThai]} />;
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
