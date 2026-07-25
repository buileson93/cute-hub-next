import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Network, HardDrive, Wrench, AlertTriangle, RefreshCw, ArrowLeftRight,
  Clock, Loader2, ShieldCheck, Building2, ChevronRight, FileText, Link2, Puzzle,
  MapPin, Tag, Info, ExternalLink, HeartPulse, Activity, Gauge, TrendingUp,
  Printer, Settings2, Plus, QrCode, Waypoints, Bug, ClipboardList, FolderKanban,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocViewerDialog } from "@/components/mirats/DocViewerDialog";
import { useDbTaxonomy, useSystemNameOverrides, useDeviceNameOverrides, type DbDevice } from "@/lib/mirats/db-taxonomy";
import { useOperationsData } from "@/lib/mirats/db-operations";
import { useScope } from "@/lib/mirats/scope";
import { AccessDenied } from "@/components/mirats/AccessDenied";
import { ChangeLogPanel } from "@/components/mirats/ChangeLogPanel";
import { HeThongLienKetTab } from "@/components/mirats/HeThongLienKetTab";
import { useSession } from "@/hooks/use-session";
import { useViTriChucNang, useThietBiDangLap } from "@/lib/mirats/he-thong-thanh-phan";
import { LyLichThanhPhanPanel } from "@/components/mirats/LyLichLayerPanel";

export const Route = createFileRoute("/_app/he-thong/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Sổ lý lịch hệ thống — MIRATS 2.0` },
      { name: "description", content: `Sổ lý lịch hệ thống ${params.id}: tổng hợp bảo dưỡng, sự cố, hỏng hóc & thay thế của toàn bộ tài sản con.` },
    ],
  }),
  component: HeThongDetail,
});

function HeThongDetail() {
  const { id } = Route.useParams();
  const { inScope, scopeAll } = useScope();
  const { data: taxo, isLoading, error } = useDbTaxonomy();
  const { data: nameOv } = useSystemNameOverrides();

  const sys = useMemo(() => taxo?.htList.find((h) => h.id === id), [taxo, id]);
  const devices = useMemo<DbDevice[]>(
    () => (taxo?.devices ?? []).filter((d) => d._htId === id),
    [taxo, id],
  );
  const sysDonVi = useMemo(() => {
    const dv = taxo?.donViList.find((v) => v.id === sys?.donViId);
    return { ma: dv?.ma ?? "", ten: dv?.ten ?? "" };
  }, [taxo, sys?.donViId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 p-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Đang tải sổ lý lịch hệ thống…
      </div>
    );
  }
  if (error) {
    return <div className="p-8 text-sm text-destructive">Không tải được dữ liệu: {error instanceof Error ? error.message : "Lỗi"}</div>;
  }
  if (!sys && devices.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <h2 className="text-lg font-semibold">Không tìm thấy hệ thống</h2>
        <Button asChild variant="outline" className="mt-4"><Link to="/thiet-bi">Về sổ lý lịch</Link></Button>
      </div>
    );
  }

  const donVi = sysDonVi.ma || devices[0]?.don_vi || "";
  if (!scopeAll && donVi && !inScope(donVi)) return <AccessDenied backTo="/thiet-bi" backLabel="Về sổ lý lịch tài sản" />;

  return <HeThongInner id={id} tenHt={nameOv?.get(id) ?? sys?.ten ?? devices[0]?._htTen ?? id} maBravo={sys?.maBravo ?? ""} gpSo={sys?.gpSo ?? ""} gpHan={sys?.gpHan ?? ""} devices={devices} donViMa={sysDonVi.ma} donViTen={sysDonVi.ten} />;
}

function HeThongInner({
  id, tenHt, maBravo, gpSo, gpHan, devices, donViMa, donViTen,
}: { id: string; tenHt: string; maBravo: string; gpSo: string; gpHan: string; devices: DbDevice[]; donViMa: string; donViTen: string }) {
  const { ops } = useOperationsData();
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");
  const { data: devNameOv } = useDeviceNameOverrides();
  const maSet = useMemo(() => new Set(devices.map((d) => d.ma_thiet_bi)), [devices]);
  const idSet = useMemo(() => new Set(devices.map((d) => d.id)), [devices]);
  const tenMap = useMemo(
    () => new Map(devices.map((d) => [d.ma_thiet_bi, devNameOv?.get(d.ma_thiet_bi) || d.ten])),
    [devices, devNameOv],
  );
  const [tab, setTab] = useState<string>("tl");
  const [chartMonths, setChartMonths] = useState<3 | 6 | 12>(6);
  const [thrOpen, setThrOpen] = useState(false);
  const thrKey = `hp-thresholds:${donViMa || "default"}`;
  const [thr, setThr] = useState<{ good: number; ok: number; warn: number }>({ good: 85, ok: 60, warn: 40 });
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(thrKey) : null;
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p?.good === "number" && typeof p?.ok === "number" && typeof p?.warn === "number") setThr(p);
      } else {
        setThr({ good: 85, ok: 60, warn: 40 });
      }
    } catch { /* ignore */ }
  }, [thrKey]);

  // Khớp lý lịch hệ thống: bản ghi gắn trực tiếp hệ thống (he_thong_id === id),
  // hoặc gắn với tài sản con (ưu tiên UUID, fallback mã text cho dữ liệu cũ).
  const inSys = useCallback((e: { he_thong_id?: string | null }) => e.he_thong_id === id, [id]);
  const byDev = useCallback(
    (e: { thiet_bi_id?: string | null; thiet_bi: string }) =>
      e.thiet_bi_id ? idSet.has(e.thiet_bi_id) : maSet.has(e.thiet_bi),
    [idSet, maSet],
  );
  const baoTri = useMemo(() => ops.baoTri.filter((e) => inSys(e) || byDev(e)), [ops.baoTri, inSys, byDev]);
  const suCo = useMemo(() => ops.suCo.filter((e) => inSys(e) || byDev(e)), [ops.suCo, inSys, byDev]);
  const hongHoc = useMemo(() => ops.hongHoc.filter((e) => (e.thiet_bi_hong_id ? idSet.has(e.thiet_bi_hong_id) : maSet.has(e.thiet_bi_hong))), [ops.hongHoc, idSet, maSet]);
  const banGiao = useMemo(() => ops.banGiao.filter((e) => maSet.has(e.thiet_bi)), [ops.banGiao, maSet]);

  
  const donVi = donViMa || devices[0]?.don_vi || "";
  const donViTenR = donViTen || devices[0]?._donViTen || "";

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    for (const e of baoTri) items.push({ kind: "bt", date: e.ngay_bat_dau || "", title: e.mo_ta_cong_viec || e.loai_bao_tri || "Bảo dưỡng", label: e.loai_bao_tri || "Bảo dưỡng", desc: e.ket_qua ?? "", tag: e.trang_thai, tb: e.thiet_bi });
    for (const e of suCo) items.push({ kind: "sc", date: e.ngay_phat_hien || "", title: e.hien_tuong || "Sự cố", label: e.muc_do || "Sự cố", desc: e.bien_phap_xu_ly ?? e.nguyen_nhan ?? "", tag: e.trang_thai, tb: e.thiet_bi });
    for (const e of hongHoc) items.push({ kind: "hh", date: e.ngay_hong || "", title: e.mo_ta_hong_hoc || e.bo_phan_hong || "Hỏng hóc / thay thế", label: e.bo_phan_hong || "Hỏng hóc", desc: e.phuong_an ?? "", tag: e.trang_thai, tb: e.thiet_bi_hong });
    for (const e of banGiao) items.push({ kind: "bg", date: e.ngay_nhan || "", title: `${e.nguoi_giao || "—"} → ${e.nguoi_nhan || "—"}`, label: e.loai_ban_giao || "Bàn giao", desc: e.don_vi_nhan ?? "", tag: e.trang_thai, tb: e.thiet_bi });
    const toKey = (d: string) => { const t = Date.parse(d); return Number.isNaN(t) ? -Infinity : t; };
    return items.sort((a, b) => toKey(b.date) - toKey(a.date));
  }, [baoTri, suCo, hongHoc, banGiao]);

  const hasGp = Boolean(gpSo);

  const parseD = (d: string) => { const t = Date.parse(d); return Number.isNaN(t) ? null : t; };
  const firstEventTs = timeline.reduce<number | null>((a, it) => { const t = parseD(it.date); if (t == null) return a; return a == null ? t : Math.min(a, t); }, null);
  const lastEventTs = timeline.reduce<number | null>((a, it) => { const t = parseD(it.date); if (t == null) return a; return a == null ? t : Math.max(a, t); }, null);
  const suCoDates = suCo.map((e) => parseD(e.ngay_phat_hien || "")).filter((t): t is number => t != null).sort((a, b) => a - b);
  const lastSuCoTs = suCoDates.length ? suCoDates[suCoDates.length - 1] : null;
  const daysSinceIncident = lastSuCoTs != null ? Math.max(0, Math.round((Date.now() - lastSuCoTs) / 86_400_000)) : null;
  const mtbfDays = suCoDates.length >= 2 ? Math.round((suCoDates[suCoDates.length - 1] - suCoDates[0]) / 86_400_000 / (suCoDates.length - 1)) : null;
  const replacedDevices = new Set(hongHoc.map((e) => e.thiet_bi_hong).filter(Boolean));
  const fmtVN = (t: number | null) => (t == null ? "—" : new Date(t).toLocaleDateString("vi-VN"));
  const bookNo = id.slice(0, 8).toUpperCase();
  const openYear = firstEventTs ? new Date(firstEventTs).getFullYear() : new Date().getFullYear();

  // ==== HP + charts data =====================================================
  const now = Date.now();
  const D = 86_400_000;
  const gpHanTs = gpHan ? Date.parse(gpHan) : NaN;
  const gpDaysLeft = Number.isNaN(gpHanTs) ? null : Math.round((gpHanTs - now) / D);
  const gpScore = !hasGp
    ? 0
    : gpDaysLeft == null
      ? 20
      : gpDaysLeft < 0
        ? 0
        : gpDaysLeft <= 90
          ? 20
          : 40;

  const suCo30dOpen = suCo.filter((e) => {
    const t = Date.parse(e.ngay_phat_hien || "");
    return !Number.isNaN(t) && now - t <= 30 * D;
  }).length;
  const suCoScore = Math.max(0, 25 - suCo30dOpen * 5);

  const devActive = devices.filter((d) => /hoat|khai thac|dang/i.test(d.trang_thai || "")).length;
  const activeRatio = devices.length ? devActive / devices.length : 1;
  const devScore = Math.round(activeRatio * 20);

  const bt90d = baoTri.filter((e) => {
    const t = Date.parse(e.ngay_bat_dau || "");
    return !Number.isNaN(t) && now - t <= 90 * D;
  }).length;
  const btScore = bt90d > 0 ? 15 : baoTri.length ? 5 : 0;

  const hp = Math.min(100, gpScore + suCoScore + devScore + btScore);
  const hpLabel = hp >= thr.good ? "Tốt" : hp >= thr.ok ? "Ổn" : hp >= thr.warn ? "Cảnh báo" : "Yếu";
  const hpTone =
    hp >= thr.good ? "text-emerald-600"
    : hp >= thr.ok ? "text-sky-600"
    : hp >= thr.warn ? "text-amber-600"
    : "text-red-600";

  const monthKey = (t: number) => {
    if (Number.isNaN(t)) return "";
    const d = new Date(t);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };
  const monthsBack = (n: number) => {
    const out: string[] = [];
    const today = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const c = new Date(today.getFullYear(), today.getMonth() - i, 1);
      out.push(`${c.getFullYear()}-${String(c.getMonth() + 1).padStart(2, "0")}`);
    }
    return out;
  };
  const suCoByMonth = monthsBack(chartMonths).map((m) => ({
    m: m.slice(5),
    v: suCo.filter((e) => monthKey(Date.parse(e.ngay_phat_hien || "")) === m).length,
  }));
  const trend6 = monthsBack(chartMonths).map((m) => ({
    m: m.slice(5),
    bt: baoTri.filter((e) => monthKey(Date.parse(e.ngay_bat_dau || "")) === m).length,
    sc: suCo.filter((e) => monthKey(Date.parse(e.ngay_phat_hien || "")) === m).length,
  }));
  const statusGroups = Array.from(
    devices.reduce((m, d) => {
      const k = d.trang_thai || "Chưa rõ";
      m.set(k, (m.get(k) || 0) + 1);
      return m;
    }, new Map<string, number>()),
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 print:space-y-3">
      <style>{`@media print{
        .no-print,[data-slot="tabs-list"]{display:none !important;}
        .sticky{position:static !important;}
        [role="tabpanel"]{display:block !important;}
        body{background:white !important;}
      }`}</style>
      <div className="flex items-center gap-3 no-print">
        <Button asChild variant="ghost" size="sm"><Link to="/thiet-bi"><ArrowLeft className="mr-1 h-4 w-4" /> Sổ lý lịch</Link></Button>
        <div className="text-xs text-muted-foreground truncate">
          <Link to="/thiet-bi" className="hover:underline">Sổ lý lịch</Link>
          <ChevronRight className="inline h-3 w-3 mx-1 opacity-60" />
          <span className="text-foreground/80">{tenHt}</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          Mã sổ <span className="font-mono text-foreground/80">{bookNo}</span> · Mở {openYear}
          <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> In / PDF
          </Button>
        </div>
      </div>

      {/* Header + HP bar (sticky) */}
      <Card className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <CardContent className="space-y-4 p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <Network className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold sm:text-2xl">{tenHt}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {maBravo && <span>Mã Bravo: <span className="font-mono text-foreground/80">{maBravo}</span></span>}
                  {donVi ? (
                    <Link to="/danh-muc/don-vi" search={{ q: donVi } as never} className="inline-flex items-center gap-1 hover:text-primary hover:underline">
                      <Building2 className="h-3 w-3" /> {donVi}{donViTenR ? ` — ${donViTenR}` : ""}
                    </Link>
                  ) : (
                    <Link to="/danh-muc/don-vi" className="inline-flex items-center gap-1 text-amber-600 hover:underline">
                      <Building2 className="h-3 w-3" /> Chưa phân công đơn vị
                    </Link>
                  )}
                  <span>· {timeline.length} sự kiện</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {hasGp ? (
                <GpktBadge heThongId={id} gpSo={gpSo} gpHan={gpHan} />
              ) : (
                <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40">Chưa có GPKT</Badge>
              )}
              <HealthBar
                hp={hp}
                label={hpLabel}
                tone={hpTone}
                onConfigure={() => setThrOpen(true)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thanh hành động nhanh — mở nhanh biểu mẫu tạo mới đã pre-fill hệ thống */}
      {canManage && (
        <QuickActionsBar heThongId={id} />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card className="lg:sticky lg:top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Định danh &amp; chỉ số vận hành</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow icon={Network} label="Hệ thống" value={tenHt} />
              <InfoRow icon={FileText} label="Mã tài sản Bravo" value={maBravo || "—"} />
              <div className="flex items-start gap-2 text-sm">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Đơn vị quản lý</div>
                  {donVi ? (
                    <Link
                      to="/danh-muc/don-vi"
                      search={{ q: donVi } as never}
                      className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {donVi}{donViTenR ? ` — ${donViTenR}` : ""}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </Link>
                  ) : (
                    <Link to="/danh-muc/don-vi" className="inline-flex items-center gap-1 font-medium text-amber-600 hover:underline">
                      Chưa phân công đơn vị
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </Link>
                  )}
                </div>
              </div>
              <InfoRow icon={ShieldCheck} label="Giấy phép khai thác" value={hasGp ? `${gpSo}${gpHan ? " · Hạn " + gpHan : ""}` : "Chưa có"} />
              <GpktSidebarItem heThongId={id} hasGp={hasGp} gpSo={gpSo} />
              <div className="border-t pt-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <MicroStat label="Ngày mở sổ" value={fmtVN(firstEventTs)} />
                  <MicroStat label="Ghi nhận gần nhất" value={fmtVN(lastEventTs)} />
                  <MicroStat label="Ngày không sự cố" value={daysSinceIncident == null ? "—" : `${daysSinceIncident} ngày`} tone={daysSinceIncident != null && daysSinceIncident < 7 ? "text-red-600" : "text-emerald-600"} />
                  <MicroStat label="Nhịp sự cố TB (MTBF)" value={mtbfDays == null ? "—" : `${mtbfDays} ngày`} />
                  <MicroStat label="Tài sản đã thay" value={String(replacedDevices.size)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <MiniCharts
            suCoByMonth={suCoByMonth}
            statusGroups={statusGroups}
            trend6={trend6}
            onPickStatus={() => {
              if (typeof document !== "undefined") {
                document.getElementById("thanh-phan-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            months={chartMonths}
            onChangeMonths={setChartMonths}
          />

          {/* Nhật ký khai thác — cuộn nội bộ để không phá layout khi dữ liệu dài */}
          <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between gap-2">
              <span>Nhật ký khai thác</span>
              <span className="text-xs font-normal text-muted-foreground">
                {timeline.length + baoTri.length + suCo.length + hongHoc.length + banGiao.length} bản ghi
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="sticky top-0 z-10 flex h-auto flex-wrap gap-1 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
                <TabsTrigger value="tl"><Clock className="mr-1 h-3.5 w-3.5" />Dòng thời gian ({timeline.length})</TabsTrigger>
                <TabsTrigger value="bt">Bảo dưỡng ({baoTri.length})</TabsTrigger>
                <TabsTrigger value="sc">Sự cố ({suCo.length})</TabsTrigger>
                <TabsTrigger value="hh">Thay thế ({hongHoc.length})</TabsTrigger>
                <TabsTrigger value="bg">Bàn giao ({banGiao.length})</TabsTrigger>
                <TabsTrigger value="lk"><Link2 className="mr-1 h-3.5 w-3.5" />Liên kết</TabsTrigger>
                {canManage && <TabsTrigger value="cd">Chỉnh sửa dữ liệu</TabsTrigger>}
              </TabsList>

              <div className="mt-4 max-h-[70vh] overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
              <TabsContent value="tl">
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có sự kiện lịch sử nào cho hệ thống này.</p>
                ) : (
                  <Timeline items={timeline} tenMap={tenMap} />
                )}
              </TabsContent>

              <TabsContent value="bt" className="space-y-2">
                {baoTri.length === 0 && <p className="text-sm text-muted-foreground">Chưa có phiếu bảo dưỡng.</p>}
                {baoTri.map((e) => (
                  <EventRow key={e.ma_bao_tri} tb={e.thiet_bi} tenMap={tenMap} title={e.mo_ta_cong_viec || e.loai_bao_tri} date={e.ngay_bat_dau} label={e.loai_bao_tri} desc={e.ket_qua ?? ""} tag={e.trang_thai} />
                ))}
              </TabsContent>

              <TabsContent value="sc" className="space-y-2">
                {suCo.length === 0 && <p className="text-sm text-muted-foreground">Không có sự cố ghi nhận.</p>}
                {suCo.map((e) => (
                  <EventRow key={e.ma_su_co} tb={e.thiet_bi} tenMap={tenMap} title={e.hien_tuong} date={e.ngay_phat_hien} label={e.muc_do || "Sự cố"} desc={e.bien_phap_xu_ly ?? e.nguyen_nhan ?? ""} tag={e.trang_thai} tone="bg-red-50 text-red-700" />
                ))}
              </TabsContent>

              <TabsContent value="hh" className="space-y-2">
                {hongHoc.length === 0 && <p className="text-sm text-muted-foreground">Chưa có ghi nhận hỏng hóc / thay thế.</p>}
                {hongHoc.map((e) => (
                  <EventRow key={e.ma_hong_hoc} tb={e.thiet_bi_hong} tenMap={tenMap} title={e.mo_ta_hong_hoc || e.bo_phan_hong} date={e.ngay_hong} label={e.bo_phan_hong || "Hỏng hóc"} desc={e.phuong_an ?? ""} tag={e.trang_thai} tone="bg-orange-50 text-orange-700" />
                ))}
              </TabsContent>

              <TabsContent value="bg" className="space-y-2">
                {banGiao.length === 0 && <p className="text-sm text-muted-foreground">Chưa có bản ghi bàn giao.</p>}
                {banGiao.map((e) => (
                  <EventRow key={e.ma_ban_giao} tb={e.thiet_bi} tenMap={tenMap} title={`${e.nguoi_giao || "—"} → ${e.nguoi_nhan || "—"}`} date={e.ngay_nhan} label={e.loai_ban_giao || "Bàn giao"} desc={e.don_vi_nhan ?? ""} tag={e.trang_thai} tone="bg-sky-50 text-sky-700" />
                ))}
              </TabsContent>

              <TabsContent value="lk">
                <HeThongLienKetTab heThongId={id} />
              </TabsContent>



              {canManage && (
                <TabsContent value="cd">
                  <ChangeLogPanel entity="dm_he_thong" entityId={id} />
                </TabsContent>
              )}
              </div>
            </Tabs>
          </CardContent>
          </Card>

          {/* Thành phần hệ thống — nằm trong cột phải để lấp khoảng trống cạnh cột định danh sticky */}
          <ThanhPhanCard heThongId={id} />
        </div>
      </div>

      <ThresholdDialog
        open={thrOpen}
        onOpenChange={setThrOpen}
        value={thr}
        donViMa={donViMa}
        onSave={(v) => {
          setThr(v);
          try { window.localStorage.setItem(thrKey, JSON.stringify(v)); } catch { /* ignore */ }
          setThrOpen(false);
        }}
        onReset={() => {
          const def = { good: 85, ok: 60, warn: 40 };
          setThr(def);
          try { window.localStorage.removeItem(thrKey); } catch { /* ignore */ }
        }}
      />
    </div>
  );
}

function ThanhPhanCard({ heThongId }: { heThongId: string }) {
  const { data: tps } = useViTriChucNang(heThongId);
  const { data: dangLap } = useThietBiDangLap(heThongId);
  const list = tps ?? [];
  const [openTpId, setOpenTpId] = useState<string | null>(null);
  const openTp = openTpId ? list.find((t) => t.id === openTpId) ?? null : null;
  const openDev = openTpId ? dangLap?.get(openTpId) ?? null : null;
  return (
    <Card id="thanh-phan-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span>Thành phần thuộc hệ thống ({list.length})</span>
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <Link to="/he-thong/cay">Quản lý</Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {list.length === 0 && <p className="text-sm text-muted-foreground">Chưa có thành phần.</p>}
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {list.map((tp) => {
          const dev = dangLap?.get(tp.id);
          return (
            <HoverCard key={tp.id} openDelay={120} closeDelay={80}>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  onClick={() => setOpenTpId(tp.id)}
                  className="flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm hover:bg-primary/5"
                >
              <Puzzle className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="min-w-0 flex-1 truncate">{tp.ten}</span>
                  {dev ? (
                    <Badge variant="secondary" className="font-mono text-[10px]">{dev.ma_thiet_bi}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">trống</Badge>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </HoverCardTrigger>
              <HoverCardContent side="right" align="start" className="w-80 text-sm">
                <div className="space-y-2">
                  <div className="font-medium">{tp.ten}</div>
                  <div className="grid grid-cols-[110px_1fr] gap-y-1 text-xs">
                    <span className="text-muted-foreground">Loại yêu cầu</span>
                    <span>{tp.loai_thiet_bi_yeu_cau || "—"}</span>
                    <span className="text-muted-foreground">Bắt buộc</span>
                    <span>{tp.bat_buoc ? "Có" : "Không"}</span>
                    <span className="text-muted-foreground">Trạng thái</span>
                    <span>{tp.trang_thai === "ngung" ? "Ngừng" : "Đang khai thác"}</span>
                    <span className="text-muted-foreground">Tài sản lắp</span>
                    <span>
                      {dev ? (
                        <>
                          <span className="font-mono">{dev.ma_thiet_bi}</span>
                          {dev.ten_thiet_bi ? ` — ${dev.ten_thiet_bi}` : ""}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Chưa lắp</span>
                      )}
                    </span>
                    {dev?.ma_serial && (
                      <>
                        <span className="text-muted-foreground">Serial</span>
                        <span className="font-mono">{dev.ma_serial}</span>
                      </>
                    )}
                    {(tp.hieu_luc_tu || tp.hieu_luc_den) && (
                      <>
                        <span className="text-muted-foreground">Hiệu lực</span>
                        <span>{tp.hieu_luc_tu || "—"} → {tp.hieu_luc_den || "hiện tại"}</span>
                      </>
                    )}
                  </div>
                  {tp.mo_ta && (
                    <p className="border-t pt-2 text-xs text-muted-foreground whitespace-pre-wrap">{tp.mo_ta}</p>
                  )}
                  <p className="border-t pt-2 text-[11px] text-muted-foreground">Bấm để xem sổ lý lịch thành phần.</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          );
        })}
        </div>
      </CardContent>

      <Sheet open={!!openTpId} onOpenChange={(v) => { if (!v) setOpenTpId(null); }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          {openTp && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-base">
                  <Puzzle className="h-4 w-4 text-emerald-600" />
                  <span className="truncate">{openTp.ten}</span>
                </SheetTitle>
                <SheetDescription>Chi tiết thành phần hệ thống & sổ lý lịch.</SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-2 rounded-md border p-3 text-sm">
                  <InfoLine icon={Tag} label="Loại yêu cầu" value={openTp.loai_thiet_bi_yeu_cau || "—"} />
                  <InfoLine icon={Info} label="Bắt buộc" value={openTp.bat_buoc ? "Có" : "Không"} />
                  <InfoLine icon={Info} label="Trạng thái" value={
                    <Badge variant={openTp.trang_thai === "ngung" ? "secondary" : "default"}>
                      {openTp.trang_thai === "ngung" ? "Ngừng" : "Đang khai thác"}
                    </Badge>
                  } />
                  {openTp.mo_ta && <InfoLine icon={FileText} label="Mô tả" value={<span className="whitespace-pre-wrap">{openTp.mo_ta}</span>} />}
                  {(openTp.hieu_luc_tu || openTp.hieu_luc_den) && (
                    <InfoLine icon={Clock} label="Hiệu lực" value={`${openTp.hieu_luc_tu || "—"} → ${openTp.hieu_luc_den || "hiện tại"}`} />
                  )}
                </div>

                <div className="rounded-md border p-3 text-sm">
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <HardDrive className="h-4 w-4" /> Tài sản đang lắp
                  </div>
                  {openDev ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono">{openDev.ma_thiet_bi}</Badge>
                        <span className="font-medium">{openDev.ten_thiet_bi || "—"}</span>
                      </div>
                      {openDev.ma_serial && (
                        <div className="text-xs text-muted-foreground">Serial: <span className="font-mono">{openDev.ma_serial}</span></div>
                      )}
                      <div className="text-xs text-muted-foreground">Lắp từ: {openDev.tu_ngay || "—"}</div>
                      <div className="pt-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: openDev.ma_thiet_bi }}>
                            <ExternalLink className="mr-1 h-3.5 w-3.5" /> Mở sổ lý lịch tài sản
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa có tài sản lắp vào vị trí này (đang chờ thay thế).</p>
                  )}
                </div>

                <div className="rounded-md border p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Clock className="h-4 w-4" /> Sổ lý lịch thành phần
                  </div>
                  <LyLichThanhPhanPanel thanhPhanId={openTp.id} empty="Chưa có sự kiện nào cho thành phần này." />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function InfoLine({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}

function useGpktFile(heThongId: string) {
  const q = useQuery({
    queryKey: ["gpkt-file", heThongId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("giay_phep_khai_thac")
        .select("file_gpkt, gp_so")
        .eq("he_thong_id", heThongId)
        .order("gp_ngay", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  return {
    url: (q.data?.file_gpkt as string | null) ?? null,
    gpSoDb: (q.data?.gp_so as string | null) ?? null,
    isLoading: q.isLoading,
    error: q.error ? (q.error as Error).message : null,
    refetch: q.refetch,
  };
}

function GpktBadge({ heThongId, gpSo, gpHan }: { heThongId: string; gpSo: string; gpHan: string }) {
  const [open, setOpen] = useState(false);
  const { url, gpSoDb, isLoading, error, refetch } = useGpktFile(heThongId);
  const fileName = `GPKT-${gpSo || gpSoDb || heThongId.slice(0, 8)}.pdf`;
  const label = (
    <>
      <ShieldCheck className="h-3.5 w-3.5" /> GPKT {gpSo}{gpHan ? ` · Hạn ${gpHan}` : ""}
    </>
  );
  if (!url && !error) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
        title={isLoading ? "Đang tải file GPKT…" : "Chưa đính kèm file PDF của GPKT"}
      >
        {label}
      </Badge>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="no-print inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-100 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:bg-emerald-950/40"
        title={error ? `Lỗi tải file: ${error}` : "Mở file PDF giấy phép khai thác"}
      >
        {label}
        <ExternalLink className="h-3 w-3 opacity-70" />
      </button>
      <DocViewerDialog
        open={open}
        onOpenChange={setOpen}
        url={url}
        fileName={fileName}
        mimeType="application/pdf"
        isLoading={isLoading}
        error={error}
        onRetry={() => { void refetch(); }}
      />
    </>
  );
}

function GpktSidebarItem({ heThongId, hasGp, gpSo }: { heThongId: string; hasGp: boolean; gpSo: string }) {
  const [open, setOpen] = useState(false);
  const { url, gpSoDb, isLoading, error, refetch } = useGpktFile(heThongId);
  const fileName = `GPKT-${gpSo || gpSoDb || heThongId.slice(0, 8)}.pdf`;

  if (!hasGp) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed px-2.5 py-2 text-xs text-muted-foreground">
        <FileText className="h-4 w-4 shrink-0" />
        <span>Hệ thống chưa có giấy phép khai thác</span>
      </div>
    );
  }

  const disabled = !url && !error;
  const stateLabel = error
    ? "Lỗi tải file — bấm để thử lại"
    : isLoading
      ? "Đang tải file giấy phép…"
      : url
        ? "Mở file PDF giấy phép"
        : "Chưa có file giấy phép PDF đính kèm";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={stateLabel}
        className={`no-print group flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition ${
          disabled
            ? "cursor-not-allowed border-dashed text-muted-foreground opacity-70"
            : error
              ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/30"
              : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30"
        }`}
      >
        {error ? (
          <AlertTriangle className="h-4 w-4 shrink-0" />
        ) : isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-medium">Giấy phép PDF</div>
          <div className="truncate text-[11px] opacity-80">{stateLabel}</div>
        </div>
        {url && !error && <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70 transition group-hover:opacity-100" />}
      </button>
      <DocViewerDialog
        open={open}
        onOpenChange={setOpen}
        url={url}
        fileName={fileName}
        mimeType="application/pdf"
        isLoading={isLoading}
        error={error}
        onRetry={() => { void refetch(); }}
      />
    </>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="break-words">{value}</div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone?: string; onClick?: () => void }) {
  const inner = (
    <CardContent className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted"><Icon className={`h-5 w-5 ${tone ?? "text-foreground/70"}`} /></div>
      <div className="min-w-0 text-left">
        <div className="text-xs uppercase tracking-wide text-muted-foreground truncate">{label}</div>
        <div className={`font-semibold ${tone ?? ""}`}>{value}</div>
      </div>
    </CardContent>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="rounded-xl border bg-card text-left text-card-foreground shadow-sm transition hover:bg-primary/5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        {inner}
      </button>
    );
  }
  return <Card>{inner}</Card>;
}

function HealthBar({
  hp, label, tone, onConfigure,
}: { hp: number; label: string; tone: string; onConfigure?: () => void }) {
  const pct = Math.max(0, Math.min(100, hp));
  return (
    <div className="w-full max-w-xs">
      <div className="flex items-center gap-1.5 text-xs">
        <HeartPulse className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium">HP</span>
        <HoverCard openDelay={120} closeDelay={80}>
          <HoverCardTrigger asChild>
            <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="Cách tính HP">
              <Info className="h-3.5 w-3.5" />
            </button>
          </HoverCardTrigger>
          <HoverCardContent className="w-72 space-y-1 text-xs">
            <div className="font-medium">Cách tính điểm HP (0–100)</div>
            <div>+40 GPKT còn hiệu lực (+20 nếu sắp hết ≤90 ngày)</div>
            <div>+25 không sự cố trong 30 ngày (−5 mỗi sự cố mở)</div>
            <div>+20 theo tỷ lệ tài sản đang hoạt động</div>
            <div>+15 có bảo dưỡng trong 90 ngày</div>
          </HoverCardContent>
        </HoverCard>
        <div className={`ml-auto font-semibold ${tone}`}>{pct} · {label}</div>
        {onConfigure && (
          <button
            type="button"
            onClick={onConfigure}
            className="no-print inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
            aria-label="Cấu hình ngưỡng HP"
            title="Cấu hình ngưỡng HP theo đơn vị"
          >
            <Settings2 className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function HpChip({ icon: Icon, label, value, tone, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone?: string; onClick?: () => void }) {
  const body = (
    <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-xs">
      <Icon className={`h-3.5 w-3.5 ${tone ?? "text-muted-foreground"}`} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`text-sm font-semibold ${tone ?? ""}`}>{value}</div>
      </div>
    </div>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="text-left transition hover:bg-primary/5">
        {body}
      </button>
    );
  }
  return body;
}

const CHART_COLORS = ["hsl(217 91% 50%)", "hsl(142 71% 45%)", "hsl(38 92% 50%)", "hsl(0 84% 60%)", "hsl(280 60% 55%)", "hsl(215 16% 55%)"];

function MiniCharts({
  suCoByMonth, statusGroups, trend6, onPickStatus, months, onChangeMonths,
}: {
  suCoByMonth: Array<{ m: string; v: number }>;
  statusGroups: Array<{ name: string; value: number }>;
  trend6: Array<{ m: string; bt: number; sc: number }>;
  onPickStatus: () => void;
  months: 3 | 6 | 12;
  onChangeMonths: (m: 3 | 6 | 12) => void;
}) {
  const avgSc = suCoByMonth.length ? suCoByMonth.reduce((a, x) => a + x.v, 0) / suCoByMonth.length : 0;
  const totalDev = statusGroups.reduce((a, x) => a + x.value, 0);
  return (
    <div className="space-y-2">
      <div className="no-print flex items-center justify-end gap-1 text-xs">
        <span className="mr-1 text-muted-foreground">Khoảng thời gian:</span>
        {[3, 6, 12].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChangeMonths(n as 3 | 6 | 12)}
            className={`rounded border px-2 py-0.5 transition ${months === n ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
          >
            {n} tháng
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-1"><CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5" /> Sự cố {months} tháng</CardTitle></CardHeader>
        <CardContent className="pb-3">
          <div className="h-[120px] w-full">
            <ResponsiveContainer>
              <BarChart data={suCoByMonth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="m" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.5)" }} contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="v" radius={[3, 3, 0, 0]}>
                  {suCoByMonth.map((d, i) => (
                    <Cell key={i} fill={d.v > avgSc && avgSc > 0 ? "hsl(0 84% 60%)" : "hsl(217 91% 55%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-1"><CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><HardDrive className="h-3.5 w-3.5" /> Trạng thái tài sản</CardTitle></CardHeader>
        <CardContent className="pb-3">
          <div className="flex h-[120px] items-center gap-2">
            <div className="h-full w-1/2">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusGroups.length ? statusGroups : [{ name: "—", value: 1 }]} dataKey="value" innerRadius={26} outerRadius={44} paddingAngle={2} onClick={onPickStatus} className="cursor-pointer">
                    {(statusGroups.length ? statusGroups : [{ name: "—", value: 1 }]).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="min-w-0 flex-1 space-y-0.5 text-[11px]">
              {statusGroups.slice(0, 5).map((s, i) => (
                <li key={s.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="min-w-0 flex-1 truncate">{s.name}</span>
                  <span className="tabular-nums text-muted-foreground">{s.value}</span>
                </li>
              ))}
              {totalDev === 0 && <li className="text-muted-foreground">Chưa có tài sản</li>}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-1"><CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" /> Bảo dưỡng vs Sự cố ({months} tháng)</CardTitle></CardHeader>
        <CardContent className="pb-3">
          <div className="h-[120px] w-full">
            <ResponsiveContainer>
              <LineChart data={trend6} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="m" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="bt" name="Bảo dưỡng" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="sc" name="Sự cố" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function ThresholdDialog({
  open, onOpenChange, value, donViMa, onSave, onReset,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: { good: number; ok: number; warn: number };
  donViMa: string;
  onSave: (v: { good: number; ok: number; warn: number }) => void;
  onReset: () => void;
}) {
  const [good, setGood] = useState(value.good);
  const [ok, setOk] = useState(value.ok);
  const [warn, setWarn] = useState(value.warn);
  useEffect(() => { setGood(value.good); setOk(value.ok); setWarn(value.warn); }, [value, open]);
  const valid = good > ok && ok > warn && warn >= 0 && good <= 100;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ngưỡng chấm điểm HP</DialogTitle>
          <DialogDescription>
            Cấu hình ngưỡng màu cho đơn vị <span className="font-mono">{donViMa || "mặc định"}</span>. Lưu cục bộ theo tài khoản/thiết bị.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2 text-sm">
          <div className="grid grid-cols-[1fr_100px] items-center gap-3">
            <Label htmlFor="hp-good" className="text-emerald-700">Xanh — Tốt ≥</Label>
            <Input id="hp-good" type="number" min={1} max={100} value={good} onChange={(e) => setGood(Number(e.target.value))} />
            <Label htmlFor="hp-ok" className="text-sky-700">Xanh dương — Ổn ≥</Label>
            <Input id="hp-ok" type="number" min={1} max={100} value={ok} onChange={(e) => setOk(Number(e.target.value))} />
            <Label htmlFor="hp-warn" className="text-amber-700">Vàng — Cảnh báo ≥</Label>
            <Input id="hp-warn" type="number" min={0} max={100} value={warn} onChange={(e) => setWarn(Number(e.target.value))} />
            <div className="col-span-2 text-xs text-muted-foreground">Dưới ngưỡng cảnh báo sẽ hiển thị Đỏ — Yếu.</div>
          </div>
          {!valid && <div className="text-xs text-red-600">Cần: Tốt &gt; Ổn &gt; Cảnh báo, trong 0–100.</div>}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onReset}>Mặc định</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button disabled={!valid} onClick={() => onSave({ good, ok, warn })}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BookStamp({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone?: "red" | "emerald" | "amber" | "sky" }) {
  const toneCls =
    tone === "red" ? "text-red-700 border-red-800/30" :
    tone === "emerald" ? "text-emerald-700 border-emerald-800/30" :
    tone === "amber" ? "text-amber-800 border-amber-900/30" :
    tone === "sky" ? "text-sky-700 border-sky-800/30" :
    "text-amber-950 dark:text-amber-100 border-amber-900/30";
  return (
    <div className={`relative flex items-center gap-2 rounded-md border bg-amber-50/80 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),0_1px_0_rgba(120,80,20,0.15)] dark:bg-amber-950/30 ${toneCls}`}>
      <Icon className="h-4 w-4 opacity-80" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
        <div className="font-serif text-lg leading-none">{value}</div>
      </div>
    </div>
  );
}

function StatLine({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-amber-900/70 dark:text-amber-100/60">{label}</div>
      <div className={`font-serif text-sm ${tone ?? "text-amber-950 dark:text-amber-100"}`}>{value}</div>
    </div>
  );
}

function MicroStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded border bg-muted/40 px-2 py-1">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium ${tone ?? ""}`}>{value}</div>
    </div>
  );
}

function DeviceChip({ tb, tenMap }: { tb: string; tenMap: Map<string, string> }) {
  if (!tb) return null;
  return (
    <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: tb }} className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs text-primary hover:underline">
      <HardDrive className="h-3 w-3" />
      <span className="font-mono">{tb}</span>
      {tenMap.get(tb) && <span className="text-muted-foreground">· {tenMap.get(tb)}</span>}
    </Link>
  );
}

function EventRow({ title, date, label, desc, tag, tone, tb, tenMap }: { title: string; date: string; label: string; desc: string; tag?: string; tone?: string; tb: string; tenMap: Map<string, string> }) {
  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={tone}>{label}</Badge>
        {date && <span className="text-xs text-muted-foreground">{date}</span>}
        <DeviceChip tb={tb} tenMap={tenMap} />
        {tag && <Badge variant="secondary" className="ml-auto">{tag}</Badge>}
      </div>
      <div className="mt-1 font-medium">{title || "—"}</div>
      {desc && <div className="text-muted-foreground">{desc}</div>}
    </div>
  );
}

type TimelineKind = "bt" | "sc" | "hh" | "bg";
type TimelineItem = { kind: TimelineKind; date: string; title: string; label: string; desc: string; tag?: string; tb: string };

const timelineMeta: Record<TimelineKind, { icon: React.ComponentType<{ className?: string }>; name: string; dot: string; chip: string }> = {
  bt: { icon: Wrench, name: "Bảo dưỡng", dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" },
  sc: { icon: AlertTriangle, name: "Sự cố", dot: "bg-red-500", chip: "bg-red-50 text-red-700" },
  hh: { icon: RefreshCw, name: "Hỏng hóc / thay thế", dot: "bg-orange-500", chip: "bg-orange-50 text-orange-700" },
  bg: { icon: ArrowLeftRight, name: "Bàn giao", dot: "bg-sky-500", chip: "bg-sky-50 text-sky-700" },
};

function Timeline({ items, tenMap }: { items: TimelineItem[]; tenMap: Map<string, string> }) {
  return (
    <ol className="relative ml-2 border-l border-border pl-6">
      {items.map((it, i) => {
        const m = timelineMeta[it.kind];
        const Icon = m.icon;
        return (
          <li key={`${it.kind}-${i}`} className="relative mb-5 last:mb-0">
            <span className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${m.dot}`}>
              <Icon className="h-3.5 w-3.5 text-white" />
            </span>
            <div className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {it.date ? new Date(it.date).toLocaleDateString("vi-VN") : "Chưa rõ ngày"}
                </span>
                <Badge variant="outline" className={m.chip}>{m.name}</Badge>
                {it.label && it.label !== m.name && <Badge variant="outline">{it.label}</Badge>}
                <DeviceChip tb={it.tb} tenMap={tenMap} />
                {it.tag && <Badge variant="secondary" className="ml-auto">{it.tag}</Badge>}
              </div>
              <div className="mt-1 font-medium">{it.title || "—"}</div>
              {it.desc && <div className="mt-0.5 text-muted-foreground">{it.desc}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
