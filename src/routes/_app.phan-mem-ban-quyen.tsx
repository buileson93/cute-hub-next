// ============================================================================
// /phan-mem-ban-quyen — Quản lý bản quyền phần mềm cho tài sản CNTT.
// KPI + StandardTable + Visual Analytics.
// ============================================================================
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Plus, Pencil, Laptop, AlertTriangle, Clock, Wallet, ShieldCheck, PieChart, Info, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/mirats/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";
import { BanQuyenFormDialog } from "@/components/mirats/BanQuyenFormDialog";
import { BanQuyenCapPhatDialog } from "@/components/mirats/BanQuyenCapPhatDialog";
import { useSession } from "@/hooks/use-session";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
  useBanQuyenList, useBanQuyenTongHop, STATUS_CLASS, STATUS_LABEL, dinhDangTien, type BanQuyenRow,
} from "@/lib/mirats/ban-quyen";

export const Route = createFileRoute("/_app/phan-mem-ban-quyen")({
  head: () => ({
    meta: [
      { title: "Bản quyền phần mềm — MIRATS 2.0" },
      {
        name: "description",
        content:
          "Quản lý bản quyền phần mềm: máy tính đang cài những gì, bản quyền đã gán và chưa gán thiết bị.",
      },
      { property: "og:title", content: "Bản quyền phần mềm — MIRATS 2.0" },
      { property: "og:description", content: "Theo dõi seats, hạn bản quyền và cấp phát phần mềm cho tài sản CNTT." },
    ],
  }),
  component: BanQuyenPage,
});

function BanQuyenPage() {
  const { hasRole } = useSession();
  const navigate = useNavigate();
  const canManage = hasRole("admin") || hasRole("phong_kt");
  const { data: rows = [], isLoading } = useBanQuyenList();
  const { data: kpiData, isLoading: loadingKpi } = useBanQuyenTongHop();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BanQuyenRow | null>(null);
  const [capPhatRow, setCapPhatRow] = useState<BanQuyenRow | null>(null);

  const kpi = useMemo(() => {
    if (kpiData) return kpiData;
    // Fallback client-side calculation if RPC is missing or loading
    let expiring = 0;
    let expired = 0;
    let valid = 0;
    let ghe = 0;
    let gheDung = 0;
    let chiPhi = 0;
    for (const r of rows) {
      if (r.status === "expiring") expiring++;
      else if (r.status === "expired") expired++;
      else valid++;
      
      ghe += r.so_ghe ?? 0;
      gheDung += r.gheDaDung;
      chiPhi += r.gia_tri ?? 0;
    }
    const utilization = ghe > 0 ? (gheDung / ghe) * 100 : 0;
    return { total: rows.length, expiring, expired, valid, ghe, gheDung, chiPhi, utilization };
  }, [rows, kpiData]);

  const columns: StdColumn<BanQuyenRow>[] = [
    {
      key: "ten_phan_mem",
      label: "Phần mềm",
      filter: "text",
      sortable: true,
      value: (r) => r.ten_phan_mem,
      cell: (r) => (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-medium">{r.ten_phan_mem}</span>
            {r.license_key && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Đã có License Key</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="truncate font-mono text-[10.5px] text-muted-foreground uppercase tracking-tight">
            {r.ma_ban_quyen}{r.phien_ban ? ` · v${r.phien_ban}` : ""}
          </div>
        </div>
      ),
    },
    { key: "nha_phat_hanh", label: "Nhà phát hành", filter: "cat", hideBelow: "xl", value: (r) => r.nha_phat_hanh ?? "—" },
    { key: "loai", label: "Loại", filter: "cat", hideBelow: "sm", value: (r) => r.loaiTen ?? "—" },
    {
      key: "ghe",
      label: "Sử dụng ghế (Seats)",
      align: "left",
      sortable: true,
      hideBelow: "2xl",
      value: (r) => (r.so_ghe == null ? "∞" : `${r.gheDaDung}/${r.so_ghe}`),
      sortValue: (r) => (r.so_ghe == null ? -1 : r.gheDaDung / r.so_ghe),
      cell: (r) => {
        if (r.so_ghe == null) return <span className="text-xs text-muted-foreground font-mono italic">∞ (Không giới hạn)</span>;
        const pct = Math.round((r.gheDaDung / r.so_ghe) * 100);
        return (
          <div className="w-full max-w-[140px] space-y-1">
            <div className="flex justify-between text-[11px] tabular-nums font-medium">
              <span>{r.gheDaDung}/{r.so_ghe}</span>
              <span className={pct >= 90 ? "text-red-500" : "text-muted-foreground"}>{pct}%</span>
            </div>
            <Progress 
              value={pct} 
              className="h-1.5" 
              indicatorClassName={
                (pct >= 95 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500")
              }
            />
            {r.deviceSummary && r.deviceSummary.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {r.deviceSummary.slice(0, 3).map(ma => (
                  <Badge key={ma} variant="outline" className="text-[9px] px-1 py-0 h-4 font-mono bg-muted/30">{ma}</Badge>
                ))}
                {r.deviceSummary.length > 3 && (
                  <span className="text-[9px] text-muted-foreground font-medium">+{r.deviceSummary.length - 3}</span>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "ngay_het_han",
      label: "Thời hạn",
      sortable: true,
      hideBelow: "xl",
      value: (r) => r.ngay_het_han ?? "",
      cell: (r) => (
        <div className="text-xs">
          <div className={cn(
            "font-medium",
            r.status === "expired" ? "text-red-600" : r.status === "expiring" ? "text-amber-600" : "text-foreground"
          )}>
            {r.ngay_het_han ?? "Vĩnh viễn"}
          </div>
          {r.soNgayConLai !== null && r.soNgayConLai >= 0 && (
            <div className="text-[10px] text-muted-foreground italic">
              Còn {r.soNgayConLai} ngày
            </div>
          )}
        </div>
      ),
    },
    {
      key: "trang_thai",
      label: "Trạng thái",
      filter: "cat",
      hideBelow: "sm",
      value: (r) => STATUS_LABEL[r.status],
      cell: (r) => (
        <Badge variant="secondary" className={cn("px-2 py-0 h-5 text-[10px] font-semibold uppercase tracking-wider", STATUS_CLASS[r.status])}>
          {STATUS_LABEL[r.status]}
        </Badge>
      ),
    },
    {
      key: "gia_tri",
      label: "Giá trị",
      align: "right",
      sortable: true,
      hideBelow: "2xl",
      value: (r) => r.gia_tri ?? "",
      sortValue: (r) => r.gia_tri ?? -1,
      cell: (r) => <span className="tabular-nums text-sm font-medium">{dinhDangTien(r.gia_tri)}</span>,
    },
    {
      key: "actions",
      label: "Thao tác",
      align: "right",
      cell: (r) => (
        <div className="inline-flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-secondary"
            title="Chi tiết"
            onClick={(e) => {
              e.stopPropagation();
              navigate({ to: "/phan-mem-ban-quyen/$ma", params: { ma: r.ma_ban_quyen } });
            }}
          >
            <ExternalLink className="h-3.5 w-3.5 text-primary" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs font-semibold hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
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
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-secondary"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(r);
                setFormOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={KeyRound}
        title="Quản lý bản quyền phần mềm"
        help="Hệ thống theo dõi giấy phép phần mềm (Software Asset Management) gắn với hạ tầng CNTT."
        actions={
          canManage ? (
            <Button
              size="sm"
              className="shadow-sm transition-transform active:scale-95"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Thêm bản quyền mới
            </Button>
          ) : null
        }
      />

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6 shadow-sm">
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold text-primary">Thông tin hệ thống</div>
            <p className="text-sm leading-relaxed text-muted-foreground/90 font-medium">
              Hiện nay đã có tính năng để phần mềm bản quyền cấp phát cho máy tính (Laptop/PC) thuộc quyền sử dụng của nhân viên nào. 
              Bạn có thể gán tài sản cho nhân viên trong danh mục Tài sản, sau đó cấp phát bản quyền cho tài sản đó tại đây hoặc từ Sổ lý lịch tài sản.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 sm:grid-cols-2">
        <Kpi 
          icon={KeyRound} 
          label="Tổng bản quyền" 
          value={kpi.total} 
          description={`${kpi.valid} đang hoạt động`}
          color="primary"
        />
        <Kpi 
          icon={Clock} 
          label="Sắp hết hạn" 
          value={kpi.expiring} 
          description="Cần gia hạn trong 60 ngày"
          color="warning"
        />
        <Kpi 
          icon={AlertTriangle} 
          label="Đã quá hạn" 
          value={kpi.expired} 
          description="Cần xử lý ngay"
          color="destructive"
        />
        <Kpi
          icon={Wallet}
          label="Tổng ngân sách"
          value={dinhDangTien(kpi.chiPhi)}
          description="Giá trị tài sản phần mềm"
          color="slate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-muted/60 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20 border-b border-muted/40">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> 
                Chi tiết License
              </CardTitle>
              <CardDescription className="text-[11px]">
                Theo dõi hiệu lực và cấp phát license theo ghế (Seats)
              </CardDescription>
            </div>
            <div className="text-[10px] font-medium text-muted-foreground bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-muted/60 tabular-nums shadow-sm">
              Đã nạp {rows.length} mục
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <StandardTable<BanQuyenRow>
              tableKey="phan_mem_ban_quyen_visual"
              rows={rows}
              getRowId={(r) => r.id}
              onRowClick={(r) => navigate({ to: "/phan-mem-ban-quyen/$ma", params: { ma: r.ma_ban_quyen } })}
              requireFilterToShow={false}
              emptyContent={
                <div className="py-20 text-center flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground/40">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {isLoading ? "Đang truy xuất dữ liệu bản quyền…" : "Hệ thống chưa ghi nhận bản quyền phần mềm nào"}
                  </div>
                </div>
              }
              columns={columns}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted/60">
          <CardHeader className="pb-3 border-b border-muted/40 bg-muted/10">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              Hiệu suất sử dụng Ghế
            </CardTitle>
            <CardDescription className="text-[11px]">
              Tỷ lệ cấp phát license cho tài sản
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <div className="relative h-28 w-28">
                {/* Visual donut representation via CSS */}
                <svg className="h-full w-full" viewBox="0 0 100 100">
                  <circle 
                    className="text-muted/30 stroke-current" 
                    strokeWidth="10" 
                    fill="transparent" 
                    r="40" 
                    cx="50" 
                    cy="50" 
                  />
                  <circle 
                    className={cn(
                      "stroke-current transition-all duration-1000 ease-out",
                      kpi.utilization >= 90 ? "text-red-500" : kpi.utilization >= 70 ? "text-amber-500" : "text-primary"
                    )}
                    strokeWidth="10" 
                    strokeDasharray={`${kpi.utilization * 2.51} 251.2`} 
                    strokeLinecap="round" 
                    fill="transparent" 
                    r="40" 
                    cx="50" 
                    cy="50" 
                    transform="rotate(-90 50 50)" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold tabular-nums tracking-tighter">
                    {Math.round(kpi.utilization)}%
                  </span>
                  <span className="text-[9px] font-medium text-muted-foreground uppercase">Tỷ lệ dùng</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-[11px] font-semibold flex items-center gap-1.5 justify-center">
                  <span className="text-primary">{kpi.gheDung}</span> / <span className="text-muted-foreground">{kpi.ghe}</span>
                  <span className="text-muted-foreground font-normal">Ghế đã cấp</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Cảnh báo tài nguyên</div>
              <UsageItem label="Seats khả dụng" value={kpi.ghe - kpi.gheDung} total={kpi.ghe} color="bg-emerald-500" />
              <UsageItem label="Licenses quá hạn" value={kpi.expired} total={kpi.total} color="bg-red-500" />
              <UsageItem label="Sắp hết hạn" value={kpi.expiring} total={kpi.total} color="bg-amber-500" />
            </div>

            <div className="rounded-xl bg-primary/5 p-4 border border-primary/10">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Info className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-primary">Mẹo vận hành</div>
                  <p className="text-[10px] leading-relaxed text-muted-foreground/90 font-medium">
                    Hãy thu hồi bản quyền (Cap phat {"->"} Thu hoi) khi máy tính bị hỏng hoặc thanh lý để tối ưu hóa chi phí phần mềm.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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

function UsageItem({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end">
        <span className="text-[11px] font-semibold text-foreground/80">{label}</span>
        <span className="text-[10px] font-bold tabular-nums">{value}</span>
      </div>
      <Progress value={pct} className="h-1 bg-muted/40" indicatorClassName={color} />
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  description,
  color = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  description?: string;
  color?: "primary" | "warning" | "destructive" | "slate";
}) {
  const colorMap = {
    primary: "text-primary bg-primary/10 border-primary/20",
    warning: "text-amber-600 bg-amber-50 border-amber-200",
    destructive: "text-red-600 bg-red-50 border-red-200",
    slate: "text-slate-600 bg-slate-50 border-slate-200",
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 group">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors group-hover:bg-white dark:group-hover:bg-slate-800",
          colorMap[color]
        )}>
          <Icon className="h-6 w-6 stroke-[2px]" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-0.5">{label}</div>
          <div className="text-xl font-black tabular-nums tracking-tight">
            {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
          </div>
          {description && <div className="text-[10px] font-medium text-muted-foreground/70 truncate">{description}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

