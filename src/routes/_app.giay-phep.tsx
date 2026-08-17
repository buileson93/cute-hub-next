import { PageHeader } from "@/components/mirats/PageHeader";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CheckCircle2, AlertTriangle, Clock, ShieldCheck, CalendarClock, Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { AssetRegistryBook } from "@/components/mirats/tuan-thu/AssetRegistryBook";
import { ComplianceTimeline } from "@/components/mirats/tuan-thu/ComplianceTimeline";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/giay-phep")({
  head: () => ({
    meta: [
      { title: "Giấy phép & Tuân thủ — MIRATS" },
      { name: "description", content: "M7 — Quản lý giấy phép khai thác/kỹ thuật tài sản, cảnh báo hết hạn và theo dõi tuân thủ." },
      { property: "og:title", content: "Giấy phép & Tuân thủ — MIRATS" },
      { property: "og:description", content: "Cảnh báo hết hạn 30/60/90 ngày, phân bổ theo đơn vị và nơi cấp." },
    ],
  }),
  component: GiayPhepPage,
});

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
      if (l.status === "valid") s.valid++;
      else if (l.status === "expiring") s.expiring++;
      else if (l.status === "expired") s.expired++;
      else s.none++;

      if (l.ngayLeft != null && l.ngayLeft >= 0) {
        if (l.ngayLeft <= 30) s.d30++;
        else if (l.ngayLeft <= 60) s.d60++;
        else if (l.ngayLeft <= 90) s.d90++;
      }
    }
    return s;
  }, [enriched]);

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

  const byDonVi = useMemo(() => {
    const m = new Map<string, { valid: number; expiring: number; none: number }>();
    for (const l of enriched) {
      if (l.status === "expired") continue;
      const k = l.donVi ?? "—";
      const c = m.get(k) ?? { valid: 0, expiring: 0, none: 0 };
      if (l.status === "valid") c.valid++;
      else if (l.status === "expiring") c.expiring++;
      else c.none++;
      m.set(k, c);
    }
    return Array.from(m.entries())
      .map(([k, v]) => ({ dv: k, ...v, total: v.valid + v.expiring + v.none }))
      .sort((a, b) => b.total - a.total);
  }, [enriched]);

  const filtered = useMemo(() => {
    return enriched.filter((l) => {
      if (tab === "current" && l.status === "expired") return false;
      if (tab === "expiring" && l.status !== "expiring") return false;
      if (tab === "expired" && l.status !== "expired") return false;
      return true;
    }).sort((a, b) => {
      const ax = a.ngayLeft ?? 999999;
      const bx = b.ngayLeft ?? 999999;
      return ax - bx;
    });
  }, [enriched, tab]);

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

      <ComplianceTimeline 
        kpi={kpi}
        warningCount={heThongThieuGpMoi.length}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={ShieldCheck} label="Tổng GP lưu trữ" value={kpi.total} />
        <Kpi icon={CheckCircle2} label="Còn hiệu lực" value={kpi.valid} tone="text-emerald-600 dark:text-emerald-400" />
        <Kpi icon={Clock} label={`Sắp hết hạn (≤ ${DEFAULT_NGAY_SAP_HET_HAN} ngày)`} value={kpi.expiring} tone="text-amber-600 dark:text-amber-400" />
        <Kpi icon={AlertTriangle} label="Thiếu GP thay thế" value={heThongThieuGpMoi.length} tone="text-red-600 dark:text-red-400" />
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
            <CardTitle className="text-base">Phân bổ theo đơn vị</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead className="text-right">Tổng</TableHead>
                    <TableHead className="text-right">Ổn định</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byDonVi.slice(0, 5).map((row) => (
                    <TableRow key={row.dv}>
                      <TableCell className="font-medium truncate max-w-[120px]">{row.dv}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.total}</TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600">{row.valid}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); }}>
        <TabsList>
          <TabsTrigger value="current">Hiện hành ({giayPhep.length - kpi.expired})</TabsTrigger>
          <TabsTrigger value="expiring">Sắp hết hạn ({kpi.expiring})</TabsTrigger>
          <TabsTrigger value="expired">Lưu trữ hết hạn ({kpi.expired})</TabsTrigger>
          <TabsTrigger value="all">Tất cả ({giayPhep.length})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-3">
          <Card>
            <CardContent className="p-2">
              <AssetRegistryBook 
                rows={filtered} 
                canManage={canManage}
                onEdit={(r) => { setEditingRow(r); setDialogOpen(true); }}
                onView={(r) => setViewerRow(r)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number | string; tone?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted"><Icon className={cn("h-5 w-5", tone || "text-foreground/70")} /></div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground truncate">{label}</div>
          <div className={cn("text-xl font-semibold tabular-nums", tone)}>{typeof value === "number" ? value.toLocaleString("vi-VN") : value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
