// ============================================================================
// /phan-mem-ban-quyen — Quản lý bản quyền phần mềm cho tài sản CNTT.
// KPI + StandardTable (đồng bộ với các trang danh sách khác trong hệ thống).
// ============================================================================
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Plus, Pencil, Laptop, AlertTriangle, Clock, Wallet } from "lucide-react";
import { PageHeader } from "@/components/mirats/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";
import { BanQuyenFormDialog } from "@/components/mirats/BanQuyenFormDialog";
import { BanQuyenCapPhatDialog } from "@/components/mirats/BanQuyenCapPhatDialog";
import { useSession } from "@/hooks/use-session";
import {
  useBanQuyenList, STATUS_CLASS, STATUS_LABEL, dinhDangTien, type BanQuyenRow,
} from "@/lib/mirats/ban-quyen";

export const Route = createFileRoute("/_app/phan-mem-ban-quyen")({
  head: () => ({
    meta: [
      { title: "Bản quyền phần mềm — MIRATS 2.0" },
      {
        name: "description",
        content:
          "Quản lý bản quyền phần mềm cho máy tính/máy chủ: số ghế, thời hạn, chi phí và cấp phát theo tài sản.",
      },
      { property: "og:title", content: "Bản quyền phần mềm — MIRATS 2.0" },
      { property: "og:description", content: "Theo dõi seats, hạn bản quyền và cấp phát phần mềm cho tài sản CNTT." },
    ],
  }),
  component: BanQuyenPage,
});

function BanQuyenPage() {
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");
  const { data: rows = [], isLoading } = useBanQuyenList();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BanQuyenRow | null>(null);
  const [capPhatRow, setCapPhatRow] = useState<BanQuyenRow | null>(null);

  const kpi = useMemo(() => {
    let expiring = 0;
    let expired = 0;
    let ghe = 0;
    let gheDung = 0;
    let chiPhi = 0;
    for (const r of rows) {
      if (r.status === "expiring") expiring++;
      if (r.status === "expired") expired++;
      ghe += r.so_ghe ?? 0;
      gheDung += r.gheDaDung;
      chiPhi += r.gia_tri ?? 0;
    }
    return { total: rows.length, expiring, expired, ghe, gheDung, chiPhi };
  }, [rows]);

  const columns: StdColumn<BanQuyenRow>[] = [
    {
      key: "ten_phan_mem",
      label: "Phần mềm",
      filter: "text",
      sortable: true,
      value: (r) => r.ten_phan_mem,
      cell: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{r.ten_phan_mem}</div>
          <div className="truncate font-mono text-xs text-muted-foreground">
            {r.ma_ban_quyen}
            {r.phien_ban ? ` · ${r.phien_ban}` : ""}
          </div>
        </div>
      ),
    },
    { key: "nha_phat_hanh", label: "Nhà phát hành", filter: "cat", value: (r) => r.nha_phat_hanh ?? "" },
    { key: "loai", label: "Loại bản quyền", filter: "cat", value: (r) => r.loaiTen ?? "" },
    { key: "don_vi", label: "Đơn vị", filter: "cat", value: (r) => r.donViTen ?? "" },
    {
      key: "ghe",
      label: "Ghế (dùng/tổng)",
      align: "right",
      sortable: true,
      value: (r) => (r.so_ghe == null ? "Không giới hạn" : `${r.gheDaDung}/${r.so_ghe}`),
      sortValue: (r) => (r.so_ghe == null ? -1 : r.gheDaDung / r.so_ghe),
      cell: (r) =>
        r.so_ghe == null ? (
          <span className="text-xs text-muted-foreground">Không giới hạn</span>
        ) : (
          <span
            className={`tabular-nums text-sm ${r.gheDaDung >= r.so_ghe ? "font-semibold text-red-600" : ""}`}
          >
            {r.gheDaDung}/{r.so_ghe}
          </span>
        ),
    },
    {
      key: "ngay_het_han",
      label: "Hết hạn",
      sortable: true,
      value: (r) => r.ngay_het_han ?? "",
      cell: (r) => <span className="text-sm text-muted-foreground">{r.ngay_het_han ?? "—"}</span>,
    },
    {
      key: "trang_thai",
      label: "Trạng thái",
      filter: "cat",
      value: (r) => STATUS_LABEL[r.status],
      cell: (r) => (
        <Badge variant="secondary" className={STATUS_CLASS[r.status]}>
          {STATUS_LABEL[r.status]}
        </Badge>
      ),
    },
    {
      key: "gia_tri",
      label: "Giá trị",
      align: "right",
      sortable: true,
      value: (r) => r.gia_tri ?? "",
      sortValue: (r) => r.gia_tri ?? -1,
      cell: (r) => <span className="tabular-nums text-sm">{dinhDangTien(r.gia_tri)}</span>,
    },
    {
      key: "actions",
      label: "Thao tác",
      align: "right",
      cell: (r) => (
        <div className="inline-flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2"
            title="Xem/cấp phát cho tài sản"
            onClick={(e) => {
              e.stopPropagation();
              setCapPhatRow(r);
            }}
          >
            <Laptop className="h-3.5 w-3.5" /> Cấp phát
          </Button>
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              title="Sửa bản quyền"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(r);
                setFormOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={KeyRound}
        title="Bản quyền phần mềm"
        help="Theo dõi bản quyền phần mềm gắn với máy tính/máy chủ: số ghế đã dùng, thời hạn gia hạn và chi phí theo đơn vị."
        actions={
          canManage ? (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Thêm bản quyền
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={KeyRound} label="Tổng bản quyền" value={kpi.total} />
        <Kpi icon={Clock} label="Sắp hết hạn" value={kpi.expiring} tone="text-amber-600" />
        <Kpi icon={AlertTriangle} label="Đã hết hạn" value={kpi.expired} tone="text-red-600" />
        <Kpi
          icon={Wallet}
          label="Tổng chi phí"
          value={dinhDangTien(kpi.chiPhi)}
          tone="text-foreground/70"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Danh sách bản quyền — ghế đã dùng {kpi.gheDung}/{kpi.ghe || "—"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StandardTable<BanQuyenRow>
            tableKey="phan_mem_ban_quyen_list"
            rows={rows}
            getRowId={(r) => r.id}
            requireFilterToShow={false}
            emptyContent={
              <div className="py-10 text-center text-muted-foreground">
                {isLoading ? "Đang tải…" : "Chưa có bản quyền phần mềm nào"}
              </div>
            }
            columns={columns}
          />
        </CardContent>
      </Card>

      <BanQuyenFormDialog open={formOpen} onOpenChange={setFormOpen} row={editing} />
      <BanQuyenCapPhatDialog
        open={!!capPhatRow}
        onOpenChange={(v) => {
          if (!v) setCapPhatRow(null);
        }}
        banQuyen={capPhatRow}
        canManage={canManage}
      />
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
          <Icon className={`h-5 w-5 ${tone ?? "text-foreground/70"}`} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className={`text-xl font-semibold tabular-nums ${tone ?? ""}`}>
            {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}