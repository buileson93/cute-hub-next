import { PageHeader } from "@/components/mirats/PageHeader";
import { createFileRoute } from "@tanstack/react-router";
import { InfoHint } from "@/components/mirats/InfoHint";
import { useMemo, useState } from "react";
import {
  Search, ExternalLink, CheckCircle2, AlertTriangle, Clock, Ban, Building2, ShieldCheck, CalendarClock, Plus, Pencil, Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// NOTE: Bảng tổng hợp bên dưới (Phân bổ theo đơn vị, Hệ thống thiếu GP mới) giữ nguyên <Table>
// vì mang tính CHI TIẾT/tổng hợp không phải danh sách thao tác. Chỉ danh sách chính chuyển sang StandardTable.
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Combobox } from "@/components/mirats/Combobox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { type LicenseStatus } from "@/lib/mirats/metrics";
import { DEFAULT_NGAY_SAP_HET_HAN } from "@/lib/mirats/han-canh-bao";
import { useScope } from "@/lib/mirats/scope";
import { useLicensesData, type LicenseRow } from "@/lib/mirats/db-licenses";
import { useSession } from "@/hooks/use-session";
import { GiayPhepFormDialog } from "@/components/mirats/GiayPhepFormDialog";
import { DocViewerDialog } from "@/components/mirats/DocViewerDialog";
import { GpktImportDialog } from "@/components/mirats/GpktImportDialog";
import { GpktBulkImportDialog } from "@/components/mirats/GpktBulkImportDialog";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";
import { ExpiringBadge } from "@/components/mirats/ExpiringBadge";


export const Route = createFileRoute("/_app/giay-phep")({
  head: () => ({
    meta: [
      { title: "Giấy phép & Tuân thủ — MIRATS 2.0" },
      { name: "description", content: "M7 — Quản lý giấy phép khai thác/kỹ thuật tài sản, cảnh báo hết hạn và theo dõi tuân thủ." },
      { property: "og:title", content: "Giấy phép & Tuân thủ — MIRATS 2.0" },
      { property: "og:description", content: "Cảnh báo hết hạn 30/60/90 ngày, phân bổ theo đơn vị và nơi cấp." },
    ],
  }),
  component: GiayPhepPage,
});

const loaiLabel: Record<string, string> = {
  GPKT: "GP khai thác",
  "QĐ đưa vào khai thác": "QĐ khai thác",
  "GCN KĐ/HC": "GCN kiểm định",
};
const loaiColor: Record<string, string> = {
  GPKT: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  "QĐ đưa vào khai thác": "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  "GCN KĐ/HC": "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
};
const statusMeta: Record<LicenseStatus, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  valid: { label: "Còn hiệu lực", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", icon: CheckCircle2 },
  expiring: { label: "Sắp hết hạn", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", icon: Clock },
  expired: { label: "Đã hết hạn", className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300", icon: AlertTriangle },
  none: { label: "Chưa có", className: "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300", icon: Ban },
};


function GiayPhepPage() {
  const { donVi } = useScope();
  const { licenses: giayPhep } = useLicensesData();
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<LicenseRow | null>(null);
  const [viewerRow, setViewerRow] = useState<LicenseRow | null>(null);
  const [gpktOpen, setGpktOpen] = useState(false);
  const [gpktBulkOpen, setGpktBulkOpen] = useState(false);
  const donViMap = useMemo(() => new Map(donVi.map((d) => [d.ma, d])), [donVi]);
  
  const [tab, setTab] = useState("current");
  const [query, setQuery] = useState("");
  const [loaiFilter, setLoaiFilter] = useState("all");
  const [noiFilter, setNoiFilter] = useState("all");
  const [dvFilter, setDvFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<LicenseStatus | "all">("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const loaiOptions = useMemo(() => Array.from(new Set(giayPhep.map((l) => l.loai).filter((v): v is string => !!v))).sort(), [giayPhep]);
  const noiOptions = useMemo(() => Array.from(new Set(giayPhep.map((l) => l.noiCap).filter((v): v is string => !!v))).sort(), [giayPhep]);
  const enriched = useMemo(() => giayPhep.map((l) => ({
    ...l,
    status: l.trangThai,
    ngayLeft: l.soNgayConLai,
    donVi: l.donViReal,
    tenTB: l.tenReal,
  })), [giayPhep]);

  const kpi = useMemo(() => {
    const s = { total: enriched.length, valid: 0, expiring: 0, expired: 0, none: 0, d30: 0, d60: 0, d90: 0 };
    for (const l of enriched) {
      s[l.status]++;
      // Chỉ đếm ngưỡng cảnh báo cho GP còn hiệu lực; GP đã hết hạn được lưu trữ nhưng không thống kê.
      if (l.ngayLeft != null && l.ngayLeft >= 0) {
        if (l.ngayLeft <= 30) s.d30++;
        else if (l.ngayLeft <= 60) s.d60++;
        else if (l.ngayLeft <= 90) s.d90++;
      }
    }
    return s;
  }, [enriched]);

  // Hệ thống chỉ còn GP hết hạn (chưa có GP mới thay thế) → cần cảnh báo cập nhật.
  const heThongThieuGpMoi = useMemo(() => {
    const byHt = new Map<string, { ten: string; donVi: string | null; expired: number; active: number; latestExpired: string | null }>();
    for (const l of enriched) {
      if (!l.heThongId) continue;
      const cur = byHt.get(l.heThongId) ?? { ten: l.tenReal ?? l.heThongId, donVi: l.donVi ?? null, expired: 0, active: 0, latestExpired: null };
      if (l.status === "expired") {
        cur.expired++;
        if (!cur.latestExpired || (l.ngayHetHan && l.ngayHetHan > cur.latestExpired)) cur.latestExpired = l.ngayHetHan ?? cur.latestExpired;
      } else if (l.status === "valid" || l.status === "expiring") {
        cur.active++;
      }
      if (l.tenReal) cur.ten = l.tenReal;
      byHt.set(l.heThongId, cur);
    }
    return Array.from(byHt.entries())
      .filter(([, v]) => v.expired > 0 && v.active === 0)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => (b.latestExpired ?? "").localeCompare(a.latestExpired ?? ""));
  }, [enriched]);

  const byMonth = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of enriched) {
      if (l.ngayLeft == null || l.ngayLeft < 0 || l.ngayLeft > 365) continue;
      const key = (l.ngayHetHan ?? "").slice(0, 7);
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort().map(([k, v]) => ({ thang: k, so_gp: v }));
  }, [enriched]);

  // Phân bổ theo đơn vị: chỉ đếm GP còn hiệu lực (không thống kê GP đã hết hạn).
  const byDonVi = useMemo(() => {
    const m = new Map<string, { valid: number; expiring: number; none: number }>();
    for (const l of enriched) {
      if (l.status === "expired") continue;
      const k = l.donVi ?? "—";
      const c = m.get(k) ?? { valid: 0, expiring: 0, none: 0 };
      c[l.status as "valid" | "expiring" | "none"]++;
      m.set(k, c);
    }
    return Array.from(m.entries())
      .map(([k, v]) => ({ dv: k, ...v, total: v.valid + v.expiring + v.none }))
      .sort((a, b) => b.total - a.total);
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter((l) => {
      // Mặc định "current" = hiện hành (loại bỏ đã hết hạn khỏi danh sách chính)
      if (tab === "current" && l.status === "expired") return false;
      if (tab === "expiring" && l.status !== "expiring") return false;
      if (tab === "expired" && l.status !== "expired") return false;
      if (loaiFilter !== "all" && l.loai !== loaiFilter) return false;
      if (noiFilter !== "all" && l.noiCap !== noiFilter) return false;
      if (dvFilter !== "all" && l.donVi !== dvFilter) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (l.id ?? "").toLowerCase().includes(q) ||
        (l.thietBi ?? "").toLowerCase().includes(q) ||
        (l.tenTB ?? "").toLowerCase().includes(q) ||
        (l.soGP ?? "").toLowerCase().includes(q) ||
        (l.noiCap ?? "").toLowerCase().includes(q)
      );
    }).sort((a, b) => {
      const ax = a.ngayLeft ?? 999999;
      const bx = b.ngayLeft ?? 999999;
      return ax - bx;
    });
  }, [enriched, query, loaiFilter, noiFilter, dvFilter, statusFilter, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  function reset<T>(setter: (v: T) => void, v: T) { setter(v); setPage(1); }

  return (
    <div className="space-y-4">
      <PageHeader
        icon={ShieldCheck}
        title="Giấy phép & Tuân thủ"
        help="Quản lý giấy phép khai thác/kỹ thuật tài sản, theo dõi hạn cấp phép và cảnh báo trước ngày hết hạn (ngưỡng 90 ngày)."
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setGpktOpen(true)}>
                <Plus className="mr-1 h-4 w-4" /> Nhập GPKT từ PDF (AI)
              </Button>
              <Button size="sm" variant="outline" onClick={() => setGpktBulkOpen(true)}>
                <Plus className="mr-1 h-4 w-4" /> Nhập hàng loạt
              </Button>
              <Button size="sm" onClick={() => { setEditingRow(null); setDialogOpen(true); }}>
                <Plus className="mr-1 h-4 w-4" /> Thêm giấy phép
              </Button>
            </div>
          ) : null
        }
      />


      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={ShieldCheck} label="Tổng GP đang lưu trữ" value={kpi.total} tone="text-foreground/70" />
        <Kpi icon={CheckCircle2} label="Còn hiệu lực" value={kpi.valid} tone="text-emerald-600" />
        <Kpi icon={Clock} label={`Sắp hết hạn (≤ ${DEFAULT_NGAY_SAP_HET_HAN} ngày)`} value={kpi.expiring} tone="text-amber-600" />
        <Kpi icon={AlertTriangle} label="Hệ thống thiếu GP mới" value={heThongThieuGpMoi.length} tone="text-red-600" />
      </div>

      <GiayPhepFormDialog open={dialogOpen} onOpenChange={setDialogOpen} row={editingRow} />
      <GpktImportDialog open={gpktOpen} onOpenChange={setGpktOpen} />
      <GpktBulkImportDialog open={gpktBulkOpen} onOpenChange={setGpktBulkOpen} />
      <DocViewerDialog
        open={!!viewerRow}
        onOpenChange={(v) => { if (!v) setViewerRow(null); }}
        url={viewerRow?.file ?? null}
        fileName={viewerRow?.soGP ?? (viewerRow?.file ?? "").split("/").pop() ?? "tai-lieu"}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><CalendarClock className="h-4 w-4" />Lịch hết hạn 12 tháng tới</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMonth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="thang" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar dataKey="so_gp" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cảnh báo gia hạn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Nhac label="≤ 30 ngày" value={kpi.d30} tone="text-red-600" />
            <Nhac label="31–60 ngày" value={kpi.d60} tone="text-amber-600" />
            <Nhac label="61–90 ngày" value={kpi.d90} tone="text-sky-600" />
            <div className="pt-2 text-xs text-muted-foreground">Ưu tiên gia hạn để tránh gián đoạn khai thác.</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phân bổ giấy phép theo đơn vị</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead className="text-right">Tổng</TableHead>
                  <TableHead className="text-right">Còn hiệu lực</TableHead>
                  <TableHead className="text-right">Sắp hết hạn</TableHead>
                  <TableHead className="text-right">Chưa có ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byDonVi.map((row) => (
                  <TableRow key={row.dv}>
                    <TableCell className="font-medium">{donViMap.get(row.dv)?.ten ?? row.dv} <span className="text-xs font-mono text-muted-foreground">{row.dv}</span></TableCell>
                    <TableCell className="text-right tabular-nums">{row.total}</TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-600">{row.valid}</TableCell>
                    <TableCell className="text-right tabular-nums text-amber-600">{row.expiring}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{row.none}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {heThongThieuGpMoi.length > 0 && (
        <Card className="border-red-200 dark:border-red-900/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-4 w-4" />
              Hệ thống chưa nhập giấy phép mới nhất ({heThongThieuGpMoi.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">Các hệ thống dưới đây chỉ còn giấy phép đã hết hạn lưu trong lý lịch, chưa có GP còn hiệu lực nào — cần cập nhật GP thay thế.</p>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hệ thống</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead className="text-right">GP hết hạn</TableHead>
                    <TableHead>Hết hạn gần nhất</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {heThongThieuGpMoi.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.ten}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.donVi ? (donViMap.get(r.donVi)?.ten ?? r.donVi) : "—"}</TableCell>
                      <TableCell className="text-right tabular-nums text-red-600">{r.expired}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.latestExpired ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="current">Hiện hành ({giayPhep.length - kpi.expired})</TabsTrigger>
          <TabsTrigger value="expiring">Sắp hết hạn ({kpi.expiring})</TabsTrigger>
          <TabsTrigger value="expired">Lưu trữ hết hạn ({kpi.expired})</TabsTrigger>
          <TabsTrigger value="all">Tất cả ({giayPhep.length})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-3">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <CardTitle>Danh sách giấy phép</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={query} onChange={(e) => reset(setQuery, e.target.value)} placeholder="Mã GP, số GP, tài sản..." className="pl-9 lg:w-64" />
                  </div>
                  <Combobox
                    className="w-[180px]"
                    value={dvFilter}
                    onChange={(v) => reset(setDvFilter, v)}
                    placeholder="Đơn vị"
                    searchPlaceholder="Tìm đơn vị…"
                    options={[{ value: "all", label: "Tất cả đơn vị" }, ...donVi.filter((d) => d.ma !== "CTY").map((d) => ({ value: d.ma, label: `${d.ma} — ${d.ten}` }))]}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <StandardTable<typeof enriched[number]>
                tableKey="giay_phep_list"
                rows={filtered}
                getRowId={(l) => l.rowId}
                requireFilterToShow={false}
                emptyContent={<div className="py-10 text-center text-muted-foreground">Không có giấy phép phù hợp</div>}
                columns={[
                  { key: "id", label: "Mã GP", filter: "text", value: (l) => l.id ?? "", cell: (l) => <span className="font-mono text-xs">{l.id}</span> },
                  {
                    key: "thiet_bi", label: "Tài sản", filter: "text",
                    value: (l) => l.tenReal ?? "",
                    cell: (l) => l.tenReal ? (
                      <div>
                        <div className="font-medium truncate max-w-[260px]">{l.tenReal}</div>
                        {l.kieuThietBi && <div className="text-xs text-muted-foreground truncate max-w-[260px]">{l.kieuThietBi}</div>}
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>,
                  },
                  {
                    key: "loai", label: "Loại", filter: "cat",
                    value: (l) => (l.loai ? (loaiLabel[l.loai] ?? l.loai) : ""),
                    cell: (l) => l.loai ? <Badge variant="secondary" className={loaiColor[l.loai] ?? ""}>{loaiLabel[l.loai] ?? l.loai}</Badge> : <span className="text-xs text-muted-foreground">—</span>,
                  },
                  { key: "so_gp", label: "Số GP", filter: "text", value: (l) => l.soGP ?? "", cell: (l) => <span className="text-sm">{l.soGP ?? "—"}</span> },
                  { key: "ngay_cap", label: "Ngày cấp", sortable: true, value: (l) => l.ngayCap ?? "", cell: (l) => <span className="text-sm text-muted-foreground">{l.ngayCap ?? "—"}</span> },
                  { key: "ngay_het_han", label: "Hết hạn", sortable: true, value: (l) => l.ngayHetHan ?? "", cell: (l) => <span className="text-sm text-muted-foreground">{l.ngayHetHan ?? "—"}</span> },
                  {
                    key: "con_lai", label: "Còn lại", align: "right", sortable: true,
                    value: (l) => l.ngayLeft ?? "",
                    sortValue: (l) => l.ngayLeft ?? Number.POSITIVE_INFINITY,
                    cell: (l) => <ExpiringBadge soNgay={l.ngayLeft} />,
                  },
                  {
                    key: "noi_cap", label: "Nơi cấp", filter: "cat",
                    value: (l) => l.noiCap ?? "",
                    cell: (l) => l.noiCap ? <span className="inline-flex items-center gap-1 text-sm"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{l.noiCap}</span> : <span className="text-xs text-muted-foreground">—</span>,
                  },
                  {
                    key: "trang_thai", label: "Trạng thái", filter: "cat",
                    value: (l) => statusMeta[l.status].label,
                    cell: (l) => {
                      const s = statusMeta[l.status];
                      const SIcon = s.icon;
                      return <Badge variant="secondary" className={s.className}><SIcon className="mr-1 h-3 w-3" />{s.label}</Badge>;
                    },
                  },
                  {
                    key: "file", label: "File", align: "right",
                    value: (l) => l.file ?? "",
                    cell: (l) => l.file ? (
                      <div className="inline-flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2" onClick={(e) => { e.stopPropagation(); setViewerRow(l); }}>
                          <Eye className="h-3.5 w-3.5" /> Xem
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0" title="Mở tab mới">
                          <a href={l.file} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}><ExternalLink className="h-3.5 w-3.5" /></a>
                        </Button>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>,
                  },
                  ...(canManage ? [{
                    key: "actions", label: "Thao tác", align: "right",
                    cell: (l: LicenseRow) => (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={l.nguon !== "giay_phep"}
                        title={l.nguon === "giay_phep" ? "Sửa giấy phép" : "GPKT không sửa trực tiếp"}
                        onClick={(e) => { e.stopPropagation(); setEditingRow(l); setDialogOpen(true); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    ),
                  } as StdColumn<LicenseRow>] : []),
                ]}
              />
            </CardContent>

          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}






function Kpi({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; tone?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted"><Icon className={`h-5 w-5 ${tone ?? "text-foreground/70"}`} /></div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground truncate">{label}</div>
          <div className={`text-xl font-semibold tabular-nums ${tone ?? ""}`}>{typeof value === "number" ? value.toLocaleString("vi-VN") : value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Nhac({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-2xl font-semibold tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}
