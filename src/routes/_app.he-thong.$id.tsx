import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

import {
  ArrowLeft, Network, HardDrive, Wrench, AlertTriangle, RefreshCw, ArrowLeftRight,
  Clock, Loader2, ShieldCheck, Building2, ChevronRight, FileText, Link2, Puzzle,
  MapPin, Tag, Info, ExternalLink, HeartPulse, Activity, Gauge, TrendingUp,
  Printer, Settings2, Plus, QrCode, Waypoints, Bug, ClipboardList, FolderKanban,
  Search, X, Filter, ChevronDown, ChevronUp, Minimize2, Maximize2, CheckCircle2,
  History as HistoryIcon,
  ChevronLeft
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { DocViewerDialog } from "@/components/mirats/DocViewerDialog";
import { useCanDownloadAttachments } from "@/hooks/use-can-download";
import { useDbTaxonomy, useSystemNameOverrides, useDeviceNameOverrides, type DbDevice } from "@/lib/mirats/db-taxonomy";
import { useOperationsData } from "@/lib/mirats/db-operations";
import { useScope } from "@/lib/mirats/scope";
import { AccessDenied } from "@/components/mirats/AccessDenied";
import { ChangeLogPanel } from "@/components/mirats/ChangeLogPanel";
import { HeThongLienKetTab } from "@/components/mirats/HeThongLienKetTab";
import { useSession } from "@/hooks/use-session";
import { useViTriChucNang, useThietBiDangLap } from "@/lib/mirats/he-thong-thanh-phan";
import { LyLichThanhPhanPanel, LyLichHeThongPanel } from "@/components/mirats/LyLichLayerPanel";
import { SuCoMoiForm } from "@/components/mirats/quick/SuCoMoiForm";
import { BaoTriMoiForm } from "@/components/mirats/quick/BaoTriMoiForm";
import { HongHocMoiForm } from "@/components/mirats/quick/HongHocMoiForm";
import { ThanhPhanChiTietDialog } from "@/components/mirats/ThanhPhanChiTietDialog";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { PageSection } from "@/components/mirats/layout/PageSection";
import { ContentGrid } from "@/components/mirats/layout/PageLayouts";
import { InfoGrid } from "@/components/mirats/InfoGrid";

export const Route = createFileRoute("/_app/he-thong/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Sổ lý lịch hệ thống — MIRATS` },
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
        <Button asChild variant="outline" className="mt-4"><Link to="/thiet-bi" search={{ q: "" }}>Về sổ lý lịch</Link></Button>
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
  // Bộ lọc & phân trang cho Nhật ký (Dòng thời gian)
  const [nkQuery, setNkQuery] = useState("");
  const [nkKind, setNkKind] = useState<"all" | TimelineKind>("all");
  const [nkPerson, setNkPerson] = useState<string>("all");
  const [nkRange, setNkRange] = useState<"all" | "3m" | "6m" | "12m">("all");
  const [nkLimit, setNkLimit] = useState(20);
  // Chế độ xem gọn & thu gọn / mở rộng các card lớn
  const [compact, setCompact] = useState(false);
  const [nkOpen, setNkOpen] = useState(true);
  const [tpOpen, setTpOpen] = useState(true);
  const [chartMonths, setChartMonths] = useState<3 | 6 | 12>(6);
  const [openTpId, setOpenTpId] = useState<string | null>(null);
  const [thrOpen, setThrOpen] = useState(false);
  const { data: tuongThich } = useQuery({
    queryKey: ["he-thong-tuong-thich", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thiet_bi_he_thong_tuong_thich")
        .select(`
          phan_loai,
          danh_gia,
          thiet_bi:thiet_bi_id (
            id,
            ma_thiet_bi,
            ten_thiet_bi,
            ma_serial,
            trang_thai:trang_thai_id (ten),
            model:model_id (ten)
          )
        `)
        .eq("he_thong_id", id);
      if (error) throw error;
      return data;
    }
  });

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

  // Biên bản (form_submission) liên kết trực tiếp với hệ thống này.
  const { data: bienBanRows } = useQuery({
    queryKey: ["he-thong-submissions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_submission")
        .select("id, tieu_de, template_code, status, submitted_at, created_at, ky_bao_cao, created_by")
        .eq("he_thong_id", id)
        .order("submitted_at", { ascending: false, nullsFirst: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  const bienBan = useMemo(() => bienBanRows ?? [], [bienBanRows]);

  // Realtime: đồng bộ ngay khi có biên bản mới/cập nhật cho hệ thống này.
  const qcHt = useQueryClient();
  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`he-thong-submissions-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "form_submission", filter: `he_thong_id=eq.${id}` },
        () => qcHt.invalidateQueries({ queryKey: ["he-thong-submissions", id] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qcHt]);

  
  const donVi = donViMa || devices[0]?.don_vi || "";
  const donViTenR = donViTen || devices[0]?._donViTen || "";

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    for (const e of baoTri) items.push({ kind: "bt", date: e.ngay_bat_dau || "", title: e.mo_ta_cong_viec || e.loai_bao_tri || "Bảo dưỡng", label: e.loai_bao_tri || "Bảo dưỡng", desc: e.ket_qua ?? "", tag: e.trang_thai, tb: e.thiet_bi, person: (e.nguoi_thuc_hien || [])[0] || "", code: e.ma_bao_tri });
    for (const e of suCo) items.push({ kind: "sc", date: e.ngay_phat_hien || "", title: e.hien_tuong || "Sự cố", label: e.muc_do || "Sự cố", desc: e.bien_phap_xu_ly ?? e.nguyen_nhan ?? "", tag: e.trang_thai, tb: e.thiet_bi, person: e.nguoi_bao_cao || (e.nguoi_xu_ly || [])[0] || "", code: e.ma_su_co });
    for (const e of hongHoc) items.push({ kind: "hh", date: e.ngay_hong || "", title: e.mo_ta_hong_hoc || e.bo_phan_hong || "Hỏng hóc / thay thế", label: e.bo_phan_hong || "Hỏng hóc", desc: e.phuong_an ?? "", tag: e.trang_thai, tb: e.thiet_bi_hong, person: (e.nguoi_thuc_hien || [])[0] || "", code: e.ma_hong_hoc });
    for (const e of banGiao) items.push({ kind: "bg", date: e.ngay_nhan || "", title: `${e.nguoi_giao || "—"} → ${e.nguoi_nhan || "—"}`, label: e.loai_ban_giao || "Bàn giao", desc: e.don_vi_nhan ?? "", tag: e.trang_thai, tb: e.thiet_bi, person: e.nguoi_giao || "", code: e.ma_ban_giao });
    for (const e of bienBan) items.push({
      kind: "bb",
      date: (e.submitted_at as string | null) || (e.created_at as string | null) || "",
      title: e.tieu_de || e.template_code || "Biên bản",
      label: e.template_code || "Biên bản",
      desc: e.ky_bao_cao ? `Kỳ ${e.ky_bao_cao}` : "",
      tag: e.status,
      tb: "",
      person: "",
      code: e.id,
    });
    const toKey = (d: string) => { const t = Date.parse(d); return Number.isNaN(t) ? -Infinity : t; };
    return items.sort((a, b) => toKey(b.date) - toKey(a.date));
  }, [baoTri, suCo, hongHoc, banGiao, bienBan]);

  // Dữ liệu suy diễn cho bộ lọc / tóm tắt Nhật ký khai thác
  const personOptions = useMemo(() => {
    const s = new Set<string>();
    for (const it of timeline) if (it.person) s.add(it.person);
    return Array.from(s).sort((a, b) => a.localeCompare(b, "vi"));
  }, [timeline]);
  const kindCounts = useMemo(() => {
    const c: Record<TimelineKind, number> = { bt: 0, sc: 0, hh: 0, bg: 0, bb: 0 };
    for (const it of timeline) c[it.kind]++;
    return c;
  }, [timeline]);
  const nkRangeMs = nkRange === "3m" ? 90 * 86_400_000 : nkRange === "6m" ? 180 * 86_400_000 : nkRange === "12m" ? 365 * 86_400_000 : null;
  const filteredTimeline = useMemo(() => {
    const q = nkQuery.trim().toLowerCase();
    const cutoff = nkRangeMs ? Date.now() - nkRangeMs : null;
    return timeline.filter((it) => {
      if (nkKind !== "all" && it.kind !== nkKind) return false;
      if (nkPerson !== "all" && (it.person || "") !== nkPerson) return false;
      if (cutoff != null) {
        const t = Date.parse(it.date);
        if (Number.isNaN(t) || t < cutoff) return false;
      }
      if (q) {
        const hay = `${it.title} ${it.desc} ${it.label} ${it.tag ?? ""} ${it.person ?? ""} ${it.code ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [timeline, nkQuery, nkKind, nkPerson, nkRangeMs]);
  useEffect(() => { setNkLimit(20); }, [nkQuery, nkKind, nkPerson, nkRange]);
  const nkFirstTs = filteredTimeline.reduce<number | null>((a, it) => { const t = Date.parse(it.date); if (Number.isNaN(t)) return a; return a == null ? t : Math.min(a, t); }, null);
  const nkLastTs = filteredTimeline.reduce<number | null>((a, it) => { const t = Date.parse(it.date); if (Number.isNaN(t)) return a; return a == null ? t : Math.max(a, t); }, null);

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
    <PageFrame density={compact ? "compact" : "comfortable"}>
      <style>{`@media print{
        .no-print,[data-slot="tabs-list"]{display:none !important;}
        .sticky{position:static !important;}
        [role="tabpanel"]{display:block !important;}
        body{background:white !important;}
      }`}</style>
      
      <PageHeader
        title={tenHt}
        subtitle={bookNo}
        breadcrumbs={[
          { label: "Hệ thống", to: "/he-thong/cay" },
          { label: tenHt }
        ]}
        icon={Network}
        metadata={
          <>
            {donVi ? (
              <Link to="/danh-muc/don-vi" search={{ q: donVi } as never} className="inline-flex items-center gap-1 hover:text-primary hover:underline">
                <Building2 className="h-3 w-3" /> {donVi}{donViTenR ? ` — ${donViTenR}` : ""}
              </Link>
            ) : (
              <Link to="/danh-muc/don-vi" className="inline-flex items-center gap-1 text-amber-600 hover:underline">
                <Building2 className="h-3 w-3" /> Chưa phân công đơn vị
              </Link>
            )}
            <span className="text-muted-foreground">· {timeline.length} sự kiện</span>
            <div className="flex items-center gap-2 ml-2">
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
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { if (typeof window !== 'undefined') window.print(); }} className="h-8 gap-2 border-primary/20 hover:bg-primary/5">
              <Printer className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider">In / PDF</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCompact(!compact)} 
              className={cn("h-8 gap-2", compact && "bg-accent text-accent-foreground")}
              aria-label={compact ? "Chuyển sang xem đầy đủ" : "Chuyển sang xem gọn"}
            >
              {compact ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              <span className="text-[10px] font-bold uppercase tracking-wider">{compact ? "Đầy đủ" : "Gọn"}</span>
            </Button>
            {canManage && <QuickActionsBar heThongId={id} />}
          </div>
        }
      />

      <PageBody>
        <PageSection>
          <ContentGrid minChildWidth={compact ? "300px" : "400px"}>
            <Card className="astryx-surface lg:sticky lg:top-24 h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="astryx-heading-3">Định danh & chỉ số vận hành</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoGrid 
                  cot={1}
                  fields={[
                    { nhan: "Hệ thống", giaTri: tenHt, highlight: true },
                    { nhan: "Mã BraVO", giaTri: maBravo || "—", highlight: false },
                    { 
                      nhan: "Đơn vị quản lý", 
                      highlight: false,
                      giaTri: (
                        <Link to="/danh-muc/don-vi" search={{ q: donVi } as never} className="hover:text-primary hover:underline inline-flex items-center gap-1">
                          {donVi}{donViTenR ? ` — ${donViTenR}` : ""}
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </Link>
                      )
                    },
                    { nhan: "GPKT", giaTri: hasGp ? `${gpSo}${gpHan ? " · Hạn " + gpHan : ""}` : "Chưa có", highlight: false }
                  ]} 
                />
                
                <div className="pt-2">
                  <GpktSidebarItem heThongId={id} hasGp={hasGp} gpSo={gpSo} />
                </div>
                
                <div className="pt-2 border-t">
                  <FunctionLinksMenu heThongId={id} hasGp={hasGp} gpSo={gpSo} />
                </div>

                <div className="pt-3 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <MicroStat label="Ngày mở sổ" value={fmtVN(firstEventTs)} />
                    <MicroStat label="Ghi nhận gần nhất" value={fmtVN(lastEventTs)} />
                    <MicroStat 
                      label="Ngày không sự cố" 
                      value={daysSinceIncident == null ? "—" : `${daysSinceIncident} ngày`} 
                      tone={daysSinceIncident != null && daysSinceIncident < 7 ? "text-red-600 font-mono" : "text-emerald-600 font-mono"} 
                    />
                    <MicroStat 
                      label="MTBF (TB)" 
                      value={mtbfDays == null ? "—" : `${mtbfDays} ngày`} 
                      tone="font-mono"
                    />
                    <MicroStat label="Tài sản đã thay" value={String(replacedDevices.size)} tone="font-mono" />
                  </div>
                </div>
              </CardContent>
            </Card>

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
          <Card className={nkOpen ? "flex min-h-[420px] flex-col" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between gap-2">
              <span>Nhật ký khai thác</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-normal text-muted-foreground">
                  {timeline.length + baoTri.length + suCo.length + hongHoc.length + banGiao.length} bản ghi
                </span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setNkOpen((v) => !v)} aria-label={nkOpen ? "Thu gọn nhật ký" : "Mở rộng nhật ký"} title={nkOpen ? "Thu gọn" : "Mở rộng"}>
                  {nkOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="outline" className="h-7 w-7 text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100" onClick={() => setOpenTpId("sys-history")} title="Xem lý lịch hệ thống đầy đủ">
                  <HistoryIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          {nkOpen && (
          <CardContent className="flex-1">
            {/* Bộ lọc nhanh luôn hiển thị */}
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border bg-background p-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={nkQuery} onChange={(e) => { setNkQuery(e.target.value); if (e.target.value) setTab("tl"); }} placeholder="Lọc nhanh nhật ký theo từ khoá, mã, người tạo…" className="h-8 pl-7 pr-7 text-xs" />
                {nkQuery && (
                  <button type="button" onClick={() => setNkQuery("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted" aria-label="Xoá tìm kiếm">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Select value={nkRange} onValueChange={(v) => { setNkRange(v as typeof nkRange); if (v !== "all") setTab("tl"); }}>
                <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Thời gian" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Mọi thời gian</SelectItem>
                  <SelectItem value="3m">3 tháng gần đây</SelectItem>
                  <SelectItem value="6m">6 tháng gần đây</SelectItem>
                  <SelectItem value="12m">12 tháng gần đây</SelectItem>
                </SelectContent>
              </Select>
              <Select value={nkKind} onValueChange={(v) => { setNkKind(v as typeof nkKind); if (v !== "all") setTab("tl"); }}>
                <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Loại" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="bt">Bảo dưỡng</SelectItem>
                  <SelectItem value="sc">Sự cố kỹ thuật</SelectItem>
                  <SelectItem value="hh">Hỏng hóc</SelectItem>
                  <SelectItem value="bg">Bàn giao</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Tóm tắt nhanh toàn bộ nhật ký */}
            {!compact && (
            <div className="mb-3 grid grid-cols-2 gap-2 rounded-md border bg-muted/30 p-2 text-xs sm:grid-cols-6">
              <SummaryStat label="Tổng sự kiện" value={timeline.length} />
              <SummaryStat label="Khoảng thời gian" value={firstEventTs && lastEventTs ? `${fmtVN(firstEventTs)} → ${fmtVN(lastEventTs)}` : "—"} wide />
              <SummaryStat label="Bảo dưỡng" value={kindCounts.bt} tone="text-emerald-700" />
              <SummaryStat label="Sự cố" value={kindCounts.sc} tone="text-red-700" />
              <SummaryStat label="Hỏng hóc" value={kindCounts.hh} tone="text-orange-700" />
              <SummaryStat label="Bàn giao" value={kindCounts.bg} tone="text-sky-700" />
            </div>
            )}
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b">
                <TabsList className="h-10 w-full justify-start rounded-none bg-transparent p-0 overflow-x-auto overflow-y-hidden no-scrollbar">
                  <TabsTrigger value="tl" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"><Clock className="mr-2 h-3.5 w-3.5" />Dòng thời gian</TabsTrigger>
                  <TabsTrigger value="bt" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"><Wrench className="mr-2 h-3.5 w-3.5" />Bảo dưỡng</TabsTrigger>
                  <TabsTrigger value="sc" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"><AlertTriangle className="mr-2 h-3.5 w-3.5" />Sự cố</TabsTrigger>
                  <TabsTrigger value="hh" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"><RefreshCw className="mr-2 h-3.5 w-3.5" />Hỏng hóc</TabsTrigger>
                  <TabsTrigger value="bg" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"><ArrowLeftRight className="mr-2 h-3.5 w-3.5" />Bàn giao</TabsTrigger>
                  <TabsTrigger value="ll" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"><HistoryIcon className="mr-2 h-3.5 w-3.5" />Lý lịch gộp</TabsTrigger>
                  <TabsTrigger value="lk" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"><Link2 className="mr-2 h-3.5 w-3.5" />Liên kết</TabsTrigger>
                  <TabsTrigger value="vt" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"><ShieldCheck className="mr-2 h-3.5 w-3.5" />Vật tư</TabsTrigger>
                  {canManage && <TabsTrigger value="cd" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"><FileText className="mr-2 h-3.5 w-3.5" />Audit</TabsTrigger>}
                </TabsList>
              </div>

              <div className="mt-4 max-h-[70vh] overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
              <TabsContent value="tl">
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có sự kiện lịch sử nào cho hệ thống này.</p>
                ) : (
                  <>
                    {/* Lọc bổ sung theo người tạo */}
                    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border bg-background p-2">
                      <Select value={nkPerson} onValueChange={setNkPerson}>
                        <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue placeholder="Người tạo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Mọi người tạo</SelectItem>
                          {personOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {(nkQuery || nkKind !== "all" || nkPerson !== "all" || nkRange !== "all") && (
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => { setNkQuery(""); setNkKind("all"); setNkPerson("all"); setNkRange("all"); }}>
                          <Filter className="h-3.5 w-3.5" /> Xoá lọc
                        </Button>
                      )}
                    </div>
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Hiển thị {Math.min(nkLimit, filteredTimeline.length)} / {filteredTimeline.length} sự kiện
                        {nkFirstTs && nkLastTs ? ` · ${fmtVN(nkFirstTs)} → ${fmtVN(nkLastTs)}` : ""}
                      </span>
                    </div>
                    {filteredTimeline.length === 0 ? (
                      <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">Không tìm thấy sự kiện phù hợp với bộ lọc.</p>
                    ) : (
                      <>
                        <Timeline items={filteredTimeline.slice(0, nkLimit)} tenMap={tenMap} compact={compact} />
                        {filteredTimeline.length > nkLimit && (
                          <div className="mt-3 flex justify-center print:hidden">
                            <Button variant="outline" size="sm" onClick={() => setNkLimit((n) => n + 20)}>
                              Tải thêm ({filteredTimeline.length - nkLimit})
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="bt" className="space-y-2">
                <TabHeaderLink label="Bảo dưỡng" to="/bao-tri" heThongId={id} />
                {baoTri.length === 0 && <p className="text-sm text-muted-foreground">Chưa có phiếu bảo dưỡng.</p>}
                {baoTri.map((e) => (
                  <EventRow key={e.ma_bao_tri} code={e.ma_bao_tri} detailKind="bt" tb={e.thiet_bi} tenMap={tenMap} title={e.mo_ta_cong_viec || e.loai_bao_tri} date={e.ngay_bat_dau} label={e.loai_bao_tri} desc={e.ket_qua ?? ""} tag={e.trang_thai} />
                ))}
              </TabsContent>

              <TabsContent value="sc" className="space-y-2">
                <TabHeaderLink label="Sự cố kỹ thuật" to="/su-co" heThongId={id} />
                {suCo.length === 0 && <p className="text-sm text-muted-foreground">Không có sự cố ghi nhận.</p>}
                {suCo.map((e) => (
                  <EventRow key={e.ma_su_co} code={e.ma_su_co} detailKind="sc" tb={e.thiet_bi} tenMap={tenMap} title={e.hien_tuong} date={e.ngay_phat_hien} label={e.muc_do || "Sự cố"} desc={e.bien_phap_xu_ly ?? e.nguyen_nhan ?? ""} tag={e.trang_thai} tone="bg-red-50 text-red-700" />
                ))}
              </TabsContent>

              <TabsContent value="hh" className="space-y-2">
                <TabHeaderLink label="Hỏng hóc" to="/hong-hoc" heThongId={id} />
                {hongHoc.length === 0 && <p className="text-sm text-muted-foreground">Chưa có ghi nhận hỏng hóc.</p>}
                {hongHoc.map((e) => (
                  <EventRow key={e.ma_hong_hoc} code={e.ma_hong_hoc} detailKind="hh" tb={e.thiet_bi_hong} tenMap={tenMap} title={e.mo_ta_hong_hoc || e.bo_phan_hong} date={e.ngay_hong} label={e.bo_phan_hong || "Hỏng hóc"} desc={e.phuong_an ?? ""} tag={e.trang_thai} tone="bg-orange-50 text-orange-700" />
                ))}
              </TabsContent>

              <TabsContent value="bg" className="space-y-2">
                <TabHeaderLink label="Bàn giao" to="/ban-giao" heThongId={id} />
                {banGiao.length === 0 && <p className="text-sm text-muted-foreground">Chưa có bản ghi bàn giao.</p>}
                {banGiao.map((e) => (
                  <EventRow key={e.ma_ban_giao} code={e.ma_ban_giao} tb={e.thiet_bi} tenMap={tenMap} title={`${e.nguoi_giao || "—"} → ${e.nguoi_nhan || "—"}`} date={e.ngay_nhan} label={e.loai_ban_giao || "Bàn giao"} desc={e.don_vi_nhan ?? ""} tag={e.trang_thai} tone="bg-sky-50 text-sky-700" />
                ))}
              </TabsContent>

              <TabsContent value="ll">
                <div className="rounded-md border bg-muted/20 p-4">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold">Sổ lý lịch gộp (System Life History)</h3>
                    <p className="text-sm text-muted-foreground">Tổng hợp mọi biến động kỹ thuật từ tất cả thành phần thuộc hệ thống này.</p>
                  </div>
                  <LyLichHeThongPanel heThongId={id} canEdit={canManage} />
                </div>
              </TabsContent>

              <TabsContent value="lk">
                <HeThongLienKetTab heThongId={id} />
              </TabsContent>

              <TabsContent value="vt" className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">Danh sách vật tư dự phòng tương thích</h3>
                    <p className="text-sm text-muted-foreground">Các thiết bị/vật tư có thể dùng để thay thế cho hệ thống này theo đánh giá kỹ thuật.</p>
                  </div>
                </div>

                {!tuongThich || tuongThich.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                    <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Chưa ghi nhận vật tư dự phòng tương thích cho hệ thống này.</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Cập nhật thông tin này trong phần chỉnh sửa tài sản/vật tư.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {tuongThich.map((item: any, idx: number) => {
                      const tb = item.thiet_bi;
                      if (!tb) return null;
                      return (
                        <Card key={`${tb.id}-${idx}`} className="overflow-hidden hover:border-emerald-500/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <Link 
                                  to="/danh-muc/thiet-bi"
                                  search={{ q: tb.ma_thiet_bi } as any}
                                  className="font-bold text-primary hover:underline block"
                                >

                                  {tb.ten_thiet_bi}
                                </Link>
                                <span className="text-xs font-mono text-muted-foreground">
                                  {tb.ma_thiet_bi} {tb.ma_serial ? `· S/N: ${tb.ma_serial}` : ""}
                                </span>
                              </div>
                              <Badge variant="secondary" className="text-[10px]">
                                {item.phan_loai}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mt-3 mb-3 text-xs">
                              <div className="bg-muted/40 p-1.5 rounded">
                                <span className="text-muted-foreground block mb-0.5">Model</span>
                                <span className="font-medium truncate block">{tb.model?.ten || "—"}</span>
                              </div>
                              <div className="bg-muted/40 p-1.5 rounded">
                                <span className="text-muted-foreground block mb-0.5">Trạng thái</span>
                                <span className="font-medium truncate block">{tb.trang_thai?.ten || "—"}</span>
                              </div>
                            </div>

                            {item.danh_gia && (
                              <div className="mt-2 pt-2 border-t border-dashed text-xs italic text-muted-foreground">
                                “{item.danh_gia}”
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>




              {canManage && (
                <TabsContent value="cd">
                  <ChangeLogPanel entity="dm_he_thong" entityId={id} />
                </TabsContent>
              )}
              </div>
            </Tabs>
          </CardContent>
          )}
          </Card>

          {/* Thành phần hệ thống */}
          <div id="thanh-phan-card">
            <ThanhPhanCard 
              heThongId={id} 
              open={tpOpen} 
              onToggle={() => setTpOpen((v) => !v)} 
              compact={compact} 
              onOpenHistory={(tpId) => setOpenTpId(tpId)} 
            />
          </div>
        </div>
      </ContentGrid>
    </PageSection>
  </PageBody>

      {/* Sử dụng ThanhPhanChiTietDialog từ component thay vì inline Sheet cũ */}
      <ThanhPhanChiTietWrapper 
        openTpId={openTpId} 
        heThongId={id} 
        canManage={canManage} 
        onClose={() => setOpenTpId(null)} 
        tenHt={tenHt}
      />

      <ThresholdDialog
        open={thrOpen}
        onOpenChange={setThrOpen}
        value={thr}
        donViMa={donViMa}
        onSave={(v) => {
          setThr(v);
        if (typeof window !== 'undefined') {
          try { window.localStorage.setItem(thrKey, JSON.stringify(v)); } catch { /* ignore */ }
        }
          setThrOpen(false);
        }}
        onReset={() => {
          const def = { good: 85, ok: 60, warn: 40 };
          setThr(def);
        if (typeof window !== 'undefined') {
          try { window.localStorage.removeItem(thrKey); } catch { /* ignore */ }
        }
        }}
      />
    </PageFrame>
  );
}

function ThanhPhanCard({ heThongId, open = true, onToggle, compact = false, onOpenHistory }: { heThongId: string; open?: boolean; onToggle?: () => void; compact?: boolean; onOpenHistory?: (id: string) => void }) {
  const { data: tps } = useViTriChucNang(heThongId);
  const { data: dangLap } = useThietBiDangLap(heThongId);
  const list = tps ?? [];
  const [openTpId, setOpenTpId] = useState<string | null>(null);
  const openTp = openTpId ? list.find((t) => t.id === openTpId) ?? null : null;
  const openDev = openTpId ? dangLap?.get(openTpId) ?? null : null;
  const [tpQuery, setTpQuery] = useState("");
  const filtered = useMemo(() => {
    const q = tpQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((tp) => {
      const dev = dangLap?.get(tp.id);
      return (
        tp.ten?.toLowerCase().includes(q) ||
        tp.loai_thiet_bi_yeu_cau?.toLowerCase().includes(q) ||
        dev?.ma_thiet_bi?.toLowerCase().includes(q) ||
        dev?.ten_thiet_bi?.toLowerCase().includes(q) ||
        dev?.ma_serial?.toLowerCase().includes(q)
      );
    });
  }, [list, dangLap, tpQuery]);
  return (
    <Card id="thanh-phan-card" className={open ? "min-h-[220px]" : ""}>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Puzzle className="h-4 w-4 text-primary" />
            <span>Thành phần hệ thống</span>
            <Badge variant="secondary" className="font-mono text-[10px]">{list.length}</Badge>
          </div>
          <div className="flex items-center gap-1 no-print">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold uppercase tracking-wider">
              <Link to="/he-thong/thanh-phan" search={{ he_thong: heThongId } as never}>
                Dạng bảng
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold uppercase tracking-wider">
              <Link to="/he-thong/cay">Cây hệ thống</Link>
            </Button>
            {onToggle && (
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onToggle} aria-label={open ? "Thu gọn" : "Mở rộng"}>
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      {open && (
      <CardContent>
        {list.length === 0 && <p className="text-sm text-muted-foreground">Chưa có thành phần.</p>}
        {list.length > 0 && (
          <div className="mb-2 relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={tpQuery}
              onChange={(e) => setTpQuery(e.target.value)}
              placeholder="Tìm theo tên thành phần, mã/serial tài sản, loại yêu cầu…"
              className="h-8 pl-7 pr-7 text-xs"
            />
            {tpQuery && (
              <button type="button" onClick={() => setTpQuery("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted" aria-label="Xoá tìm kiếm">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        <div className={`flex flex-col ${compact ? "gap-1" : "gap-1.5"}`}>
        {filtered.length === 0 && list.length > 0 && (
          <p className="text-xs text-muted-foreground">Không có thành phần khớp tìm kiếm.</p>
        )}
        {filtered.map((tp) => {
          const dev = dangLap?.get(tp.id);
          return (
            <HoverCard key={tp.id} openDelay={120} closeDelay={80}>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  onClick={() => onOpenHistory?.(tp.id)}
                  className="flex w-full items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-left text-sm hover:bg-primary/5 hover:border-primary/30 transition-all group"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20">
                    <Puzzle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{tp.ten}</div>
                    {tp.loai_thiet_bi_yeu_cau && (
                      <div className="truncate text-[10px] text-muted-foreground uppercase tracking-tight">
                        {tp.loai_thiet_bi_yeu_cau}
                      </div>
                    )}
                  </div>
                  {dev ? (
                    <div className="text-right">
                      <Badge variant="secondary" className="font-mono text-[10px] bg-background">{dev.ma_thiet_bi}</Badge>
                      <div className="hidden text-[10px] text-muted-foreground md:block truncate max-w-[120px]">
                        {dev.ten_thiet_bi}
                      </div>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">Chờ lắp</Badge>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
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
      )}

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
                          <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: openDev.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }}>
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
                    <Button asChild size="sm" variant="outline" className="ml-auto gap-1">
                      <Link to="/he-thong/$id/thanh-phan/$tpId" params={{ id: heThongId, tpId: openTp.id }}>
                        <ExternalLink className="h-3.5 w-3.5" /> Mở sổ chi tiết
                      </Link>
                    </Button>
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
        .select("id, file_gpkt, gp_so, gp_ngay, gp_han, gp_cu, ten_he_thong_theo_gp, nam_sx_gp, kieu_thiet_bi, so_san_xuat, noi_san_xuat, muc_dich, pham_vi, ma_dia_chi, dia_diem, thoi_gian, thanh_phan_theo_gp, don_vi, tram")
        .eq("he_thong_id", heThongId)
        .order("gp_ngay", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  return {
    record: q.data as Record<string, unknown> | null,
    url: (q.data?.file_gpkt as string | null) ?? null,
    gpSoDb: (q.data?.gp_so as string | null) ?? null,
    isLoading: q.isLoading,
    error: q.error ? (q.error as Error).message : null,
    refetch: q.refetch,
  };
}

function ThanhPhanChiTietWrapper({
  openTpId, heThongId, canManage, onClose, tenHt
}: {
  openTpId: string | null;
  heThongId: string;
  canManage: boolean;
  onClose: () => void;
  tenHt: string;
}) {
  const { data: tps } = useViTriChucNang(heThongId);
  const { data: dangLap } = useThietBiDangLap(heThongId);

  return (
    <>
      {openTpId && openTpId !== "sys-history" && (
        <ThanhPhanChiTietDialog 
          viTri={(() => {
            const tp = (tps || []).find(t => t.id === openTpId);
            return {
              ...(tp || {}),
              device: dangLap?.get(openTpId) || null
            } as any;
          })()}
          heThongId={heThongId}
          canManage={canManage}
          onClose={onClose}
          onOpenDevice={(ma) => { if (typeof window !== 'undefined') window.location.href = `/thiet-bi/${ma}`; }}
        />
      )}

      <Dialog open={openTpId === "sys-history"} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <HistoryIcon className="h-4 w-4" />
              Sổ lý lịch hệ thống
              <span className="text-sm font-normal">· {tenHt}</span>
            </DialogTitle>
            <DialogDescription>
              Gộp toàn bộ sự kiện của hệ thống và các thành phần con.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <LyLichHeThongPanel heThongId={heThongId} canEdit={canManage} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


function GpktDetailSheet({
  open, onOpenChange, record, url, fileName, isLoading, error, onRetry,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  record: Record<string, unknown> | null;
  url: string | null;
  fileName: string;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const canDownload = useCanDownloadAttachments();
  const val = (k: string): string => {
    const v = record?.[k];
    if (v === null || v === undefined || v === "") return "—";
    return String(v);
  };
  const rows: Array<{ label: string; key: string; mono?: boolean }> = [
    { label: "Số GP", key: "gp_so", mono: true },
    { label: "Ngày cấp", key: "gp_ngay" },
    { label: "Hết hạn", key: "gp_han" },
    { label: "GP cũ (thay thế)", key: "gp_cu", mono: true },
    { label: "Tên hệ thống theo GP", key: "ten_he_thong_theo_gp" },
    { label: "Kiểu thiết bị", key: "kieu_thiet_bi" },
    { label: "Số sản xuất", key: "so_san_xuat", mono: true },
    { label: "Nơi sản xuất", key: "noi_san_xuat" },
    { label: "Năm SX", key: "nam_sx_gp" },
    { label: "Mục đích", key: "muc_dich" },
    { label: "Phạm vi", key: "pham_vi" },
    { label: "Mã địa chỉ", key: "ma_dia_chi", mono: true },
    { label: "Địa điểm", key: "dia_diem" },
    { label: "Thời gian khai thác", key: "thoi_gian" },
    { label: "Đơn vị", key: "don_vi" },
    { label: "Trạm", key: "tram" },
    { label: "Thành phần theo GP", key: "thanh_phan_theo_gp" },
  ];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-2xl md:max-w-4xl lg:max-w-6xl">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Giấy phép khai thác {record ? String(record.gp_so ?? "") : ""}
          </SheetTitle>
          <SheetDescription className="text-xs">
            Thông tin chi tiết & bản PDF gốc.{" "}
            {url && canDownload && (
              <a href={url} download={fileName} className="text-primary hover:underline">Tải xuống PDF</a>
            )}
            {url && !canDownload && <span className="text-muted-foreground">Vai trò của bạn chỉ được xem, không tải.</span>}
          </SheetDescription>
        </SheetHeader>
        <div className="grid h-[calc(100dvh-64px)] grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr]">
          <div className="overflow-y-auto border-r p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chi tiết giấy phép</div>
            {!record && !isLoading && <div className="text-sm text-muted-foreground">Không có dữ liệu.</div>}
            {isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải…</div>}
            {record && (
              <dl className="space-y-2 text-sm">
                {rows.map((r) => (
                  <div key={r.key} className="grid grid-cols-[128px_1fr] gap-2 border-b py-1.5 last:border-0">
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">{r.label}</dt>
                    <dd className={`break-words ${r.mono ? "font-mono" : ""}`}>{val(r.key)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <div className="relative bg-muted/40">
            {error && (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div className="text-sm text-red-700">Lỗi tải file: {error}</div>
                <Button size="sm" variant="outline" onClick={onRetry}><RefreshCw className="mr-1 h-3 w-3" /> Thử lại</Button>
              </div>
            )}
            {!error && !url && !isLoading && (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                Chưa đính kèm file PDF của giấy phép này.
              </div>
            )}
            {!error && isLoading && (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải PDF…
              </div>
            )}
            {!error && url && (
              <>
                <iframe src={`${url}#toolbar=1&view=FitH`} title={fileName} className="h-full w-full border-0 bg-white" />
                {canDownload && (
                  <a
                    href={url}
                    download={fileName}
                    className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md border bg-background/95 px-2.5 py-1 text-xs font-medium shadow hover:bg-background"
                  >
                    <FileText className="h-3.5 w-3.5" /> Tải PDF
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function GpktBadge({ heThongId, gpSo, gpHan }: { heThongId: string; gpSo: string; gpHan: string }) {
  const [open, setOpen] = useState(false);
  const { record, url, gpSoDb, isLoading, error, refetch } = useGpktFile(heThongId);
  const fileName = `GPKT-${gpSo || gpSoDb || heThongId.slice(0, 8)}.pdf`;
  const label = (
    <>
      <ShieldCheck className="h-3.5 w-3.5" /> GPKT {gpSo}{gpHan ? ` · Hạn ${gpHan}` : ""}
    </>
  );
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="no-print inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-100 hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:bg-emerald-950/40"
        title={error ? `Lỗi tải file: ${error}` : "Mở chi tiết & PDF giấy phép khai thác"}
      >
        {label}
        <ExternalLink className="h-3 w-3 opacity-70" />
      </button>
      <GpktDetailSheet
        open={open}
        onOpenChange={setOpen}
        record={record}
        url={url}
        fileName={fileName}
        isLoading={isLoading}
        error={error}
        onRetry={() => { void refetch(); }}
      />
    </>
  );
}

function GpktSidebarItem({ heThongId, hasGp, gpSo }: { heThongId: string; hasGp: boolean; gpSo: string }) {
  const [open, setOpen] = useState(false);
  const { record, url, gpSoDb, isLoading, error, refetch } = useGpktFile(heThongId);
  const fileName = `GPKT-${gpSo || gpSoDb || heThongId.slice(0, 8)}.pdf`;

  if (!hasGp) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed px-2.5 py-2 text-xs text-muted-foreground">
        <FileText className="h-4 w-4 shrink-0" />
        <span>Hệ thống chưa có giấy phép khai thác</span>
      </div>
    );
  }

  const disabled = false;
  const stateLabel = error
    ? "Lỗi tải file — bấm để thử lại"
    : isLoading
      ? "Đang tải giấy phép…"
      : url
        ? "Xem chi tiết & PDF giấy phép"
        : "Xem chi tiết giấy phép (chưa có PDF)";

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
      <GpktDetailSheet
        open={open}
        onOpenChange={setOpen}
        record={record}
        url={url}
        fileName={fileName}
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
    <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: tb }} search={{ tab: "tong-quan", doc: undefined, q: undefined }} className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs text-primary hover:underline">
      <HardDrive className="h-3 w-3" />
      <span className="font-mono">{tb}</span>
      {tenMap.get(tb) && <span className="text-muted-foreground">· {tenMap.get(tb)}</span>}
    </Link>
  );
}

function EventRow({ title, date, label, desc, tag, tone, tb, tenMap, code, detailKind }: { title: string; date: string; label: string; desc: string; tag?: string; tone?: string; tb: string; tenMap: Map<string, string>; code?: string; detailKind?: "bt" | "sc" | "hh" }) {
  const detailLink = code && detailKind ? (
    detailKind === "bt" ? (
      <Link to="/bao-tri/$maBaoTri" params={{ maBaoTri: code }} className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline">
        <span className="font-mono">{code}</span> <ExternalLink className="h-3 w-3" />
      </Link>
    ) : detailKind === "sc" ? (
      <Link to="/su-co/$maSuCo" params={{ maSuCo: code }} className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline">
        <span className="font-mono">{code}</span> <ExternalLink className="h-3 w-3" />
      </Link>
    ) : (
      <Link to="/hong-hoc/$maHongHoc" params={{ maHongHoc: code }} className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline">
        <span className="font-mono">{code}</span> <ExternalLink className="h-3 w-3" />
      </Link>
    )
  ) : null;
  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={tone}>{label}</Badge>
        {date && <span className="text-xs text-muted-foreground">{date}</span>}
        <DeviceChip tb={tb} tenMap={tenMap} />
        {tag && <Badge variant="secondary">{tag}</Badge>}
        {detailLink}
      </div>
      <div className="mt-1 font-medium">{title || "—"}</div>
      {desc && <div className="text-muted-foreground">{desc}</div>}
    </div>
  );
}

function TabHeaderLink({ label, to, heThongId }: { label: string; to: "/bao-tri" | "/su-co" | "/hong-hoc" | "/ban-giao"; heThongId: string }) {
  return (
    <div className="mb-2 flex items-center justify-between rounded-md border bg-muted/30 px-3 py-1.5 text-xs">
      <span className="text-muted-foreground">Danh sách {label} của hệ thống này</span>
      <Link
        to={to}
        search={{ he_thong: heThongId } as never}
        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
      >
        Xem tất cả trong menu {label}
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}

function QuickActionsBar({ heThongId }: { heThongId: string }) {
  const qc = useQueryClient();
  const actions = useMemo(() => ([
    { key: "su-co", label: "Sự cố kỹ thuật", icon: AlertTriangle, tone: "text-red-600", native: true, path: "/su-co/moi" as const },
    { key: "bao-tri", label: "Phiếu bảo dưỡng", icon: Wrench, tone: "text-emerald-600", native: true, path: "/bao-tri/moi" as const },
    { key: "hong-hoc", label: "Hỏng hóc", icon: RefreshCw, tone: "text-orange-600", native: true, path: "/hong-hoc/moi" as const },
    { key: "ban-giao", label: "Bàn giao", icon: ArrowLeftRight, tone: "text-sky-600", native: false, path: "/ban-giao/moi" as const },
    { key: "forms", label: "Biên bản", icon: FileText, tone: "text-violet-600", native: false, path: "/forms" as const },
    { key: "van-de", label: "Vấn đề (RCA)", icon: Bug, tone: "text-amber-600", native: false, path: "/van-de" as const },
    { key: "kpi", label: "Phiếu công việc & KPI", icon: ClipboardList, tone: "text-cyan-600", native: false, path: "/bao-tri/cong-viec" as const },
  ]), []);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [warmed, setWarmed] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const urlFor = useCallback((p: string) => `${p}?he_thong=${encodeURIComponent(heThongId)}&embed=1`, [heThongId]);
  const warm = useCallback((k: string) => { setWarmed((prev) => (prev[k] ? prev : { ...prev, [k]: true })); }, []);
  const current = actions.find((a) => a.key === openKey) ?? null;
  const currentLabel = current?.label ?? "Tác nghiệp nhanh";
  const closeSheet = useCallback(() => {
    setOpenKey(null);
    qc.invalidateQueries({ queryKey: ["operations_data"] });
  }, [qc]);
  return (
    <div className="no-print flex items-center justify-end">
      <DropdownMenu onOpenChange={(v) => { if (v) actions.filter((a) => !a.native).forEach((a) => warm(a.key)); }}>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="h-8 gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Tác nghiệp nhanh
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-xs">Tạo nhanh (mở trong ngăn bên — giữ nguyên sổ lý lịch)</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {actions.map((a) => (
            <DropdownMenuItem
              key={a.key}
              onMouseEnter={() => { if (!a.native) warm(a.key); }}
              onFocus={() => { if (!a.native) warm(a.key); }}
              onSelect={(e) => { e.preventDefault(); if (!a.native) warm(a.key); setOpenKey(a.key); }}
              className="flex items-center gap-2"
            >
              <a.icon className={`h-4 w-4 ${a.tone}`} />
              <span className="flex-1">{a.label}</span>
              {a.native ? (
                <Badge variant="outline" className="h-4 gap-0.5 border-emerald-400/60 px-1 text-[9px] text-emerald-700">
                  Nhanh
                </Badge>
              ) : loaded[a.key] ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet open={!!openKey} onOpenChange={(v) => { if (!v) closeSheet(); }}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="text-base">{currentLabel}</SheetTitle>
            <SheetDescription className="text-xs">
              Pre-fill cho hệ thống đang xem — thao tác xong đóng ngăn để về sổ lý lịch.{" "}
              {current && (
                <a href={current.path} target="_blank" rel="noreferrer" className="text-primary hover:underline">Mở tab mới</a>
              )}
            </SheetDescription>
          </SheetHeader>
          <div className="relative h-[calc(100dvh-64px)] w-full overflow-y-auto bg-background">
            {current?.native && current.key === "su-co" && (
              <SuCoMoiForm defaultHeThongId={heThongId} embedded onDone={closeSheet} />
            )}
            {current?.native && current.key === "bao-tri" && (
              <BaoTriMoiForm defaultHeThongId={heThongId} embedded onDone={closeSheet} />
            )}
            {current?.native && current.key === "hong-hoc" && (
              <HongHocMoiForm defaultHeThongId={heThongId} embedded onDone={closeSheet} />
            )}
            {actions.filter((a) => !a.native && warmed[a.key]).map((a) => {
              const active = a.key === openKey;
              return (
                <iframe
                  key={a.key}
                  src={urlFor(a.path)}
                  title={a.label}
                  onLoad={() => setLoaded((prev) => ({ ...prev, [a.key]: true }))}
                  className="absolute inset-0 h-full w-full border-0 bg-background"
                  style={{ visibility: active ? "visible" : "hidden", pointerEvents: active ? "auto" : "none" }}
                />
              );
            })}
            {current && !current.native && !loaded[current.key] && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 bg-background/60 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang mở {currentLabel}…
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FunctionLinksMenu({ heThongId, hasGp, gpSo }: { heThongId: string; hasGp: boolean; gpSo: string }) {
  const search = { he_thong: heThongId } as never;
  const items: { to: "/so-do" | "/he-thong/lien-ket" | "/he-thong/thanh-phan" | "/kiem-dinh" | "/vat-tu" | "/du-an" | "/nhan"; label: string; icon: React.ComponentType<{ className?: string }>; sp?: never }[] = [
    { to: "/so-do", label: "Sơ đồ hệ thống", icon: Waypoints },
    { to: "/he-thong/lien-ket", label: "Liên kết hệ thống", icon: Link2, sp: { src: heThongId } as never },
    { to: "/he-thong/thanh-phan", label: "Thành phần (dạng bảng)", icon: Puzzle },
    { to: "/kiem-dinh", label: "Kiểm định & Hiệu chuẩn", icon: ShieldCheck },
    { to: "/vat-tu", label: "Vật tư & Kho", icon: HardDrive },
    { to: "/du-an", label: "Dự án liên quan", icon: FolderKanban },
    { to: "/nhan", label: "In nhãn QR", icon: QrCode },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-full justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
            Liên kết chức năng
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {items.map((it) => (
          <DropdownMenuItem key={it.to} asChild>
            <Link to={it.to} search={(it.sp ?? search) as never} className="flex items-center gap-2">
              <it.icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{it.label}</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
          </DropdownMenuItem>
        ))}
        {hasGp && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/giay-phep" search={{ q: gpSo } as never} className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">Lịch sử giấy phép</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarLink({
  to,
  search,
  icon: Icon,
  label,
}: {
  to: "/so-do" | "/he-thong/lien-ket" | "/he-thong/thanh-phan" | "/kiem-dinh" | "/vat-tu" | "/du-an" | "/nhan" | "/giay-phep";
  search?: never;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      search={search}
      className="group flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs hover:bg-primary/5 hover:text-primary"
    >
      <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
      <span className="flex-1 truncate">{label}</span>
      <ExternalLink className="h-3 w-3 opacity-0 transition group-hover:opacity-70" />
    </Link>
  );
}

type TimelineKind = "bt" | "sc" | "hh" | "bg" | "bb";

function SummaryStat({ label, value, tone, wide }: { label: string; value: string | number; tone?: string; wide?: boolean }) {
  return (
    <div className={`rounded-md bg-background px-2 py-1.5 ${wide ? "col-span-2 sm:col-span-2" : ""}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`truncate text-sm font-semibold ${tone || ""}`}>{value}</div>
    </div>
  );
}

type TimelineItem = { kind: TimelineKind; date: string; title: string; label: string; desc: string; tag?: string; tb: string; person?: string; code?: string };

const timelineMeta: Record<TimelineKind, { icon: React.ComponentType<{ className?: string }>; name: string; dot: string; chip: string }> = {
  bt: { icon: Wrench, name: "Bảo dưỡng", dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" },
  sc: { icon: AlertTriangle, name: "Sự cố", dot: "bg-red-500", chip: "bg-red-50 text-red-700" },
  hh: { icon: RefreshCw, name: "Hỏng hóc / thay thế", dot: "bg-orange-500", chip: "bg-orange-50 text-orange-700" },
  bg: { icon: ArrowLeftRight, name: "Bàn giao", dot: "bg-sky-500", chip: "bg-sky-50 text-sky-700" },
  bb: { icon: ClipboardList, name: "Biên bản", dot: "bg-violet-500", chip: "bg-violet-50 text-violet-700" },
};

function Timeline({ items, tenMap, compact = false }: { items: TimelineItem[]; tenMap: Map<string, string>; compact?: boolean }) {
  return (
    <ol className={`relative ml-2 border-l border-border pl-6 ${compact ? "space-y-2" : ""}`}>
      {items.map((it, i) => {
        const m = timelineMeta[it.kind];
        const Icon = m.icon;
        return (
          <li
            key={`${it.kind}-${i}`}
            className={`relative ${compact ? "mb-2" : "mb-5"} last:mb-0`}
            style={{ contentVisibility: "auto", containIntrinsicSize: compact ? "60px" : "96px" }}
          >
            <span className={`absolute ${compact ? "-left-[27px] h-5 w-5" : "-left-[31px] h-6 w-6"} flex items-center justify-center rounded-full ring-4 ring-background ${m.dot}`}>
              <Icon className={compact ? "h-3 w-3 text-white" : "h-3.5 w-3.5 text-white"} />
            </span>
            <div className={`rounded-md border ${compact ? "p-2 text-xs" : "p-3 text-sm"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {it.date ? new Date(it.date).toLocaleDateString("vi-VN") : "Chưa rõ ngày"}
                </span>
                <Badge variant="outline" className={m.chip}>{m.name}</Badge>
                {it.label && it.label !== m.name && <Badge variant="outline">{it.label}</Badge>}
                {it.tb && <DeviceChip tb={it.tb} tenMap={tenMap} />}
                {it.tag && <Badge variant="secondary" className="ml-auto">{it.tag}</Badge>}
              </div>
              <div className="mt-1 font-medium">
                {it.kind === "bb" && it.code ? (
                  <Link to="/forms/submissions/$id" params={{ id: it.code }} className="text-primary hover:underline">
                    {it.title || "—"}
                  </Link>
                ) : (
                  it.title || "—"
                )}
              </div>
              {it.desc && !compact && <div className="mt-0.5 text-muted-foreground">{it.desc}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
