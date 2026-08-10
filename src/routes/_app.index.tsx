import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { LayoutDashboard, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";



import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  CartesianGrid,
} from "recharts";
import {
  HardDrive, ShieldCheck, AlertTriangle, Clock, CheckCircle2, HeartPulse,
  Wrench, Activity, Radio, TrendingUp, Target, Gauge, Download, Package, Search,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  licenseStatus, healthDetail,
  mttrPhut, phanTramVongDoi,
} from "@/lib/mirats/metrics";
import { fmtDowntime } from "@/lib/mirats/format";
import {
  availability as calcAvailability, mttr as calcMttr, mtbf as calcMtbf,
  rangeHours, formatKpiValue, type KpiResult, type ReliabilityIncident,
} from "@/lib/mirats/reliability";
import { isFeatureEnabled } from "@/lib/mirats/feature-flags";
import { usePmOnTimeKpi } from "@/lib/mirats/bao-tri-kpi";
import { useScope } from "@/lib/mirats/scope";
import { useDbTaxonomy } from "@/lib/mirats/db-taxonomy";
import { isOpenState } from "@/lib/mirats/su-co-state";


export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard & KPI — MIRATS 2.0" },
      { name: "description", content: "Trung tâm hành động MIRATS 2.0: việc cần làm, cảnh báo, quá hạn — xử lý nhanh mọi hoạt động trong ngày." },
      { property: "og:title", content: "Hành động hôm nay — MIRATS 2.0" },
      { property: "og:description", content: "Tình hình sự cố, bảo trì và giấy phép cần xử lý ngay." },

    ],
  }),
  component: Dashboard,
});

const STATUS_COLORS: Record<string, string> = {
  valid: "hsl(142 71% 45%)", expiring: "hsl(38 92% 50%)", expired: "hsl(0 84% 60%)", none: "hsl(215 16% 65%)",
};
const HEALTH_HEX: Record<string, string> = { A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#ef4444" };
const SEV_COLORS: Record<string, string> = {
  "Nghiêm trọng": "hsl(0 84% 60%)", "Cao": "hsl(24 94% 52%)", "Trung bình": "hsl(38 92% 50%)", "Thấp": "hsl(215 16% 55%)",
};

function pct(n: number, d: number) { return d > 0 ? Math.round((n / d) * 1000) / 10 : 0; }
/** Trạng thái "đang khai thác/hoạt động" theo nhãn thật trong CSDL. */
function isActive(tt: string) {
  const s = (tt ?? "").toLowerCase();
  return s.includes("hoạt động") || s.includes("khai thác") || s.includes("hoat dong") || s.includes("khai thac");
}

function Dashboard() {
  const { donVi, thietBi, giayPhep, suCo, baoTri } = useScope();
  const { data: tax } = useDbTaxonomy();
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const year = today.getFullYear();

  const donViMap = useMemo(() => new Map(donVi.map((d) => [d.ma, d])), [donVi]);
  // Nhóm hệ thống & hệ thống lấy THẬT từ CSDL (dm_nhom_he_thong / dm_he_thong).
  const nhomHeThongMap = useMemo(
    () => new Map(Array.from(tax?.nhomNameMap ?? []).map(([id, ten]) => [id, { ten }])),
    [tax],
  );
  const heThongMap = useMemo(() => {
    const dvMa = new Map((tax?.donViList ?? []).map((d) => [d.id, d.ma]));
    return new Map(
      (tax?.htList ?? []).map((h) => [h.ma, {
        ma: h.ma, ten: h.ten, nhom: h.nhomId, don_vi: dvMa.get(h.donViId) ?? "",
      }]),
    );
  }, [tax]);

  // Leadership widgets
  const byDonVi = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of thietBi) m.set(t.don_vi, (m.get(t.don_vi) ?? 0) + 1);
    return donVi.filter((d) => d.ma !== "CTY")
      .map((d) => ({ name: d.ma, ten: d.ten, count: m.get(d.ma) ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [thietBi, donVi]);

  const byTrangThai = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of thietBi) m.set(t.trang_thai, (m.get(t.trang_thai) ?? 0) + 1);
    return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [thietBi]);

  const healthDist = useMemo(() => {
    const b: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const t of thietBi) b[healthDetail(t, today).xepLoai]++;
    // Dùng field `name` (default nameKey của Recharts) — tránh legend "Loại undefined".
    return (["A", "B", "C", "D"] as const).map((k) => ({ name: `Loại ${k}`, loai: k, count: b[k], hex: HEALTH_HEX[k] }));
  }, [thietBi, today]);
  const healthDistHasData = useMemo(() => healthDist.some((d) => d.count > 0), [healthDist]);


  const gpStats = useMemo(() => {
    const c: Record<string, number> = { valid: 0, expiring: 0, expired: 0, none: 0 };
    for (const g of giayPhep) c[licenseStatus(g, today)]++;
    return c;
  }, [giayPhep, today]);

  const openIncidents = useMemo(() => suCo.filter((s) => isOpenState(s.trang_thai)), [suCo]);
  const openBySev = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of openIncidents) m.set(s.muc_do, (m.get(s.muc_do) ?? 0) + 1);
    return Array.from(m.entries()).map(([name, value]) => ({ name, value, hex: SEV_COLORS[name] ?? "#666" }));
  }, [openIncidents]);

  // Engineering widgets
  const pmDueSoon = useMemo(() => {
    const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() + 30);
    const cutoffISO = cutoff.toISOString().slice(0, 10);
    return baoTri
      .filter((b) => b.trang_thai !== "Hoàn thành" && b.loai_bao_tri === "Định kỳ" && b.ngay_bat_dau <= cutoffISO)
      .sort((a, b) => a.ngay_bat_dau.localeCompare(b.ngay_bat_dau))
      .slice(0, 8);
  }, [baoTri, today]);

  const incidentByGroup = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of suCo) {
      const nhomMa = heThongMap.get(s.he_thong)?.nhom;
      const ten = nhomMa ? (nhomHeThongMap.get(nhomMa)?.ten ?? nhomMa) : "Khác";
      m.set(ten, (m.get(ten) ?? 0) + 1);
    }
    return Array.from(m.entries()).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count).slice(0, 8);
  }, [suCo, heThongMap, nhomHeThongMap]);


  const topFailures = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of suCo) m.set(s.thiet_bi, (m.get(s.thiet_bi) ?? 0) + 1);
    return Array.from(m.entries())
      .map(([ma, n]) => ({ ma, n, tb: thietBi.find((t) => t.ma_thiet_bi === ma) }))
      .filter((r) => r.tb).sort((a, b) => b.n - a.n).slice(0, 8);
  }, [suCo, thietBi]);

  // KPIs
  const kpis = useMemo(() => {
    // Availability (critical devices)
    const crit = thietBi.filter((t) => t.muc_do_quan_trong === "Rất cao" || t.muc_do_quan_trong === "Cao");
    const totalHoursYear = 8760;
    const dtSum = crit.reduce((sum, t) => {
      const dt = suCo.filter((s) => s.thiet_bi === t.ma_thiet_bi && s.thoi_gian_gian_doan)
        .reduce((a, s) => a + (s.thoi_gian_gian_doan ?? 0), 0);
      return sum + dt / 60;
    }, 0);
    const availability = crit.length > 0 ? Math.max(0, (crit.length * totalHoursYear - dtSum) / (crit.length * totalHoursYear) * 100) : 100;

    // PM on-time — cần mốc "đến hạn" (due date) thực tế để so với ngày hoàn thành.
    // Bản ghi bảo dưỡng hiện chỉ có ngày bắt đầu/hoàn thành, KHÔNG có due date,
    // nên tỷ lệ đúng hạn KHÔNG tính được → trả null để hiển thị "Chưa đủ dữ liệu".
    const pmDone = baoTri.filter((b) => b.loai_bao_tri === "Định kỳ" && b.trang_thai === "Hoàn thành");
    const pmOnTimeRatio: number | null = null;

    // MTTR
    const mttr = mttrPhut(suCo);

    // Incidents affecting ĐHB
    const dhbIncidents = suCo.filter((s) => s.anh_huong_dhb === "Có").length;

    // License validity
    const gpValidPct = pct(gpStats.valid, giayPhep.length);

    // Devices over lifecycle
    const over = thietBi.filter((t) => phanTramVongDoi(t, today) >= 100).length;
    const overPct = pct(over, thietBi.length);

    return { availability, pmOnTimeRatio: pmOnTimeRatio as number | null, pmDone: pmDone.length, mttr, dhbIncidents, gpValidPct, over, overPct };

  }, [today, gpStats, thietBi, suCo, baoTri, giayPhep]);

  // --- Nguồn tính toán độ tin cậy DUY NHẤT (reliability.ts) ---------------
  // Luôn tính (thuần, rẻ) để phục vụ drill-down; cờ reliabilityKpiV2 chỉ quyết
  // định con số HIỂN THỊ lấy từ nguồn mới hay công thức nội tuyến cũ.
  const [useV2, setUseV2] = useState(false);
  useEffect(() => { setUseV2(isFeatureEnabled("reliabilityKpiV2")); }, []);

  // --- Nguồn KPI bảo dưỡng DUY NHẤT (bao-tri-kpi.ts) ----------------------
  // "PM hoàn thành đúng hạn" tính từ phiếu công việc (cong_viec_bao_tri) có
  // ngày đến hạn thực. Luôn tính để phục vụ drill-down; cờ baoTriKpiV2 chỉ
  // quyết định con số HIỂN THỊ lấy từ nguồn mới hay giữ "Chưa đủ dữ liệu" cũ.
  const [useV2Bt, setUseV2Bt] = useState(false);
  useEffect(() => { setUseV2Bt(isFeatureEnabled("baoTriKpiV2")); }, []);
  const { result: pmOnTimeRes } = usePmOnTimeKpi();

  const rel = useMemo(() => {
    const crit = thietBi.filter((t) => t.muc_do_quan_trong === "Rất cao" || t.muc_do_quan_trong === "Cao");
    const critMa = new Set(crit.map((t) => t.ma_thiet_bi));
    const critIncidents = suCo.filter((s) => critMa.has(s.thiet_bi));
    // Khoảng quan sát = trọn năm hiện tại (leap-year aware), KHÔNG hard-code 8760.
    const windowHours = rangeHours(`${year}-01-01T00:00:00Z`, `${year + 1}-01-01T00:00:00Z`);
    const toInc = (s: (typeof suCo)[number]): ReliabilityIncident => ({
      id: s.ma_su_co, ma_su_co: s.ma_su_co, ngay_phat_hien: s.ngay_phat_hien,
      thoi_diem_khac_phuc: s.thoi_diem_khac_phuc, thoi_gian_gian_doan: s.thoi_gian_gian_doan,
    });
    const availabilityRes = calcAvailability({ assetCount: crit.length, windowHours, incidents: critIncidents.map(toInc) });
    const mttrRes = calcMttr(suCo.map(toInc));
    const mtbfRes = calcMtbf(suCo.map(toInc));
    // ĐHB — drill-down danh sách sự cố ảnh hưởng ĐHB
    const dhbSources = suCo.filter((s) => s.anh_huong_dhb === "Có").map((s) => ({
      id: s.ma_su_co, ma: s.ma_su_co, ngay: s.ngay_phat_hien,
      downtimeMinutes: s.thoi_gian_gian_doan ?? null,
    }));
    return { availabilityRes, mttrRes, mtbfRes, dhbSources };
  }, [thietBi, suCo, year]);

  // Bản ghi nguồn đang xem (drill-down). `kind` quyết định cách hiển thị bảng
  // nguồn: "su-co" (mặc định, sự cố) hay "cong-viec" (phiếu bảo dưỡng).
  const [drill, setDrill] = useState<{ title: string; result: KpiResult; kind?: "su-co" | "cong-viec" } | null>(null);

  type KpiRow = { ten: string; giaTri: string; muc: string; ok: boolean; icon: typeof Target; result?: KpiResult; kind?: "su-co" | "cong-viec" };
  const kpiRows: KpiRow[] = [
    {
      ten: "Tỷ lệ sẵn sàng (tài sản trọng yếu)",
      giaTri: useV2 ? formatKpiValue(rel.availabilityRes) : `${kpis.availability.toFixed(2)}%`,
      muc: "≥ 99,5%",
      ok: useV2 ? (rel.availabilityRes.value != null && rel.availabilityRes.value >= 99.5) : kpis.availability >= 99.5,
      icon: Gauge,
      result: rel.availabilityRes,
    },
    {
      ten: "PM hoàn thành đúng hạn",
      giaTri: useV2Bt
        ? formatKpiValue(pmOnTimeRes)
        : (typeof kpis.pmOnTimeRatio === "number" ? `${kpis.pmOnTimeRatio.toFixed(1)}%` : "Chưa đủ dữ liệu"),
      muc: "≥ 95%",
      ok: useV2Bt
        ? (pmOnTimeRes.value != null && pmOnTimeRes.value >= 95)
        : (typeof kpis.pmOnTimeRatio === "number" && kpis.pmOnTimeRatio >= 95),
      icon: CheckCircle2,
      result: useV2Bt ? pmOnTimeRes : undefined,
      kind: "cong-viec",
    },
    {
      ten: "MTTR — thời gian khắc phục TB",
      giaTri: useV2 ? formatKpiValue(rel.mttrRes, fmtDowntime) : fmtDowntime(kpis.mttr),
      muc: "Giảm theo quý",
      ok: useV2 ? (rel.mttrRes.value != null && rel.mttrRes.value <= 240) : kpis.mttr <= 240,
      icon: Clock,
      result: rel.mttrRes,
    },
    {
      ten: "MTBF — thời gian giữa hai lần hỏng",
      giaTri: formatKpiValue(rel.mtbfRes),
      muc: "Tăng theo quý",
      ok: rel.mtbfRes.value != null && rel.mtbfRes.value >= 30,
      icon: Activity,
      result: rel.mtbfRes,
    },
    {
      ten: "Sự cố ảnh hưởng ĐHB",
      giaTri: `${kpis.dhbIncidents} vụ`,
      muc: "Tiệm cận 0",
      ok: kpis.dhbIncidents === 0,
      icon: Radio,
      result: { value: kpis.dhbIncidents, unit: "min", sampleSize: rel.dhbSources.length, sources: rel.dhbSources, insufficient: false, reason: null },
    },
    { ten: "Giấy phép còn hiệu lực", giaTri: `${kpis.gpValidPct}%`, muc: "100%", ok: kpis.gpValidPct >= 95, icon: ShieldCheck },
    { ten: "Tài sản quá tuổi thọ", giaTri: `${kpis.over} (${kpis.overPct}%)`, muc: "Theo dõi giảm", ok: kpis.overPct <= 10, icon: TrendingUp },
  ];


  // Export helpers
  const exportUnitReport = () => {
    const header = "Đơn vị,Mã,Tổng tài sản,Đang khai thác,Sự cố mở,BT hoàn thành\n";
    const rows = donVi.filter((d) => d.ma !== "CTY").map((d) => {
      const tbs = thietBi.filter((t) => t.don_vi === d.ma);
      const active = tbs.filter((t) => isActive(t.trang_thai)).length;
      const sc = suCo.filter((s) => s.don_vi === d.ma && s.trang_thai !== "Đã khắc phục").length;
      const btDone = baoTri.filter((b) => b.don_vi === d.ma && b.trang_thai === "Hoàn thành").length;
      return `"${d.ten}",${d.ma},${tbs.length},${active},${sc},${btDone}`;
    }).join("\n");
    downloadCsv(`bao-cao-don-vi-${year}.csv`, header + rows);
  };
  const exportReplacementPlan = () => {
    const header = "Mã tài sản,Tên,Đơn vị,Health score,Xếp loại,% Vòng đời,Giá trị (VNĐ),Khuyến nghị\n";
    const rows = thietBi.map((t) => ({ t, h: healthDetail(t, today) }))
      .filter((r) => r.h.xepLoai === "C" || r.h.xepLoai === "D")
      .sort((a, b) => a.h.score - b.h.score)
      .map(({ t, h }) => `${t.ma_thiet_bi},"${t.ten}",${t.don_vi},${h.score},${h.xepLoai},${h.ptVongDoi}%,${t.gia_tri_mua ?? 0},"${h.khuyenNghi}"`)
      .join("\n");
    downloadCsv(`de-xuat-thay-the-${year}.csv`, header + rows);
  };
  const exportReliabilityReport = () => {
    const header = "Hệ thống,Nhóm,Đơn vị,Số sự cố,Số sự cố ảnh hưởng ĐHB,Downtime (phút)\n";
    const rows: string[] = [];
    for (const ht of Array.from(heThongMap.values())) {
      const scs = suCo.filter((s) => s.he_thong === ht.ma);
      if (scs.length === 0) continue;
      const dhb = scs.filter((s) => s.anh_huong_dhb === "Có").length;
      const dt = scs.reduce((a, s) => a + (s.thoi_gian_gian_doan ?? 0), 0);
      const nhomTen = nhomHeThongMap.get(ht.nhom)?.ten ?? ht.nhom;
      rows.push(`"${ht.ten}","${nhomTen}",${ht.don_vi},${scs.length},${dhb},${dt}`);
    }
    downloadCsv(`bao-cao-do-tin-cay-${year}.csv`, header + rows.join("\n"));
  };

  // Kho / vật tư chưa có CSDL thật (module T13) → không hiển thị số liệu giả.
  const lowStock: number | null = null;

  return (
    <PageBody>
      <PageHeader
        title="Chào buổi sáng!"
        icon={LayoutDashboard}
        description="Chào mừng bạn quay lại MIRATS. Đây là tóm tắt các hoạt động bạn cần chú ý trong hôm nay."
      />

      {/* 15.3.1: Action Center - Câu chữ trả lời trực tiếp */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          icon={AlertTriangle}
          label="Sự cố đang mở"
          value={openIncidents.length}
          desc={`${openIncidents.filter(s => s.muc_do === 'Nghiêm trọng' || s.muc_do === 'Cao').length} vụ mức độ Cao/Nghiêm trọng`}
          href="/su-co"
          color="text-orange-600"
          bg="bg-orange-500/10"
        />
        <ActionCard
          icon={Wrench}
          label="Bảo trì đến hạn"
          value={pmDueSoon.length}
          desc="Trong vòng 30 ngày tới"
          href="/bao-tri"
          color="text-blue-600"
          bg="bg-blue-500/10"
        />
        <ActionCard
          icon={ShieldCheck}
          label="Giấy phép sắp hết hạn"
          value={gpStats.expiring}
          desc="Cần gia hạn trong 90 ngày"
          href="/giay-phep"
          color="text-amber-600"
          bg="bg-amber-500/10"
        />
        <ActionCard
          icon={TrendingUp}
          label="Tài sản quá tuổi thọ"
          value={kpis.over}
          desc={`${kpis.overPct}% tổng số tài sản`}
          href="/thiet-bi"
          color="text-slate-600"
          bg="bg-slate-500/10"
        />
      </div>

      <Tabs defaultValue="tasks" className="space-y-5 sm:space-y-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-auto">
            <TabsTrigger value="tasks">Việc cần làm</TabsTrigger>
            <TabsTrigger value="kpi">Chỉ số nhanh</TabsTrigger>
          </TabsList>
        </div>



        {/* 15.3.1: Việc cần làm - Tasks */}
        <TabsContent value="tasks" className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <SectionHeader
                title="Bảo trì đến hạn sắp tới"
                action={<Button asChild variant="ghost" size="sm"><Link to="/bao-tri">Xem tất cả <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>}
              />
              <CardContent className="space-y-2 pt-2">
                {pmDueSoon.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Không có phiếu PM đến hạn.</div>
                ) : pmDueSoon.map((b) => (
                  <Link key={b.ma_bao_tri} to="/bao-tri/$maBaoTri" params={{ maBaoTri: b.ma_bao_tri }}
                    className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/40">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">{b.ma_bao_tri}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{b.trang_thai}</Badge>
                      </div>
                      <div className="mt-1 truncate font-medium">{b.mo_ta_cong_viec}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{b.thiet_bi}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-xs tabular-nums">{b.ngay_bat_dau}</div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card>
              <SectionHeader
                title="Sự cố nghiêm trọng / cao đang mở"
                action={<Button asChild variant="ghost" size="sm"><Link to="/su-co">Xem tất cả <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>}
              />
              <CardContent className="space-y-2 pt-2">
                {openIncidents.filter(s => s.muc_do === 'Nghiêm trọng' || s.muc_do === 'Cao').length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Không có sự cố mức độ cao.</div>
                ) : openIncidents.filter(s => s.muc_do === 'Nghiêm trọng' || s.muc_do === 'Cao').slice(0, 5).map((s) => (
                  <Link key={s.ma_su_co} to="/su-co/$maSuCo" params={{ maSuCo: s.ma_su_co }}
                    className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/40">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-[10px]">{s.muc_do}</Badge>
                        <Badge variant="outline" className="font-mono text-[10px]">{s.ma_su_co}</Badge>
                      </div>
                      <div className="mt-1 truncate font-medium">{s.hien_tuong}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{s.thiet_bi}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-xs tabular-nums text-muted-foreground">{s.ngay_phat_hien}</div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 15.3.1: Chỉ số nhanh - Quick KPIs */}
        <TabsContent value="kpi" className="space-y-5">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <MiniKpi title="Tổng tài sản" value={thietBi.length.toLocaleString("vi-VN")} icon={HardDrive} />
            <MiniKpi title="Đang khai thác" value={thietBi.filter((t) => isActive(t.trang_thai)).length.toLocaleString("vi-VN")} icon={CheckCircle2} tone="text-emerald-600" />
            <MiniKpi title="Availability (trọng yếu)" value={useV2 ? formatKpiValue(rel.availabilityRes) : `${kpis.availability.toFixed(2)}%`} icon={Gauge} tone={kpis.availability >= 99.5 ? "text-emerald-600" : "text-orange-600"} />
            <MiniKpi title="MTTR" value={useV2 ? formatKpiValue(rel.mttrRes, fmtDowntime) : fmtDowntime(kpis.mttr)} icon={Clock} />
          </div>

          <Card>
            <SectionHeader title="Bộ KPI theo dõi độ tin cậy" icon={Target} />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>KPI</TableHead>
                      <TableHead>Giá trị hiện tại</TableHead>
                      <TableHead>Mục tiêu</TableHead>
                      <TableHead className="text-right">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kpiRows.slice(0, 4).map((k) => {
                      const Icon = k.icon;
                      return (
                        <TableRow key={k.ten}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <span className="font-medium">{k.ten}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-lg font-semibold tabular-nums">
                            <div>{k.giaTri}</div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{k.muc}</TableCell>
                          <TableCell className="text-right">
                            {k.ok ? (
                              <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">Đạt</Badge>
                            ) : (
                              <Badge variant="outline" className="border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300">Cần cải thiện</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <KpiDrilldownDialog drill={drill} onClose={() => setDrill(null)} />
    </PageBody>
  );
}



/** Drill-down: liệt kê bản ghi nguồn tạo nên một KPI, có liên kết chi tiết. */
function KpiDrilldownDialog({ drill, onClose }: { drill: { title: string; result: KpiResult; kind?: "su-co" | "cong-viec" } | null; onClose: () => void }) {
  const isCongViec = drill?.kind === "cong-viec";
  return (
    <Dialog open={!!drill} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{drill?.title}</DialogTitle>
          <DialogDescription>
            {drill
              ? `${drill.result.sampleSize} ${isCongViec ? "phiếu bảo dưỡng" : "bản ghi sự cố"} nguồn đóng góp vào chỉ số này.`
              : null}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {drill && drill.result.sources.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isCongViec ? "Mã phiếu" : "Mã sự cố"}</TableHead>
                  <TableHead>{isCongViec ? "Ngày đến hạn" : "Ngày phát hiện"}</TableHead>
                  <TableHead className="text-right">{isCongViec ? "Đúng hạn" : "Downtime"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drill.result.sources.map((s, i) => (
                  <TableRow key={`${s.ma ?? s.id ?? i}`}>
                    <TableCell className="font-mono">
                      {isCongViec ? (
                        s.ma ?? s.id ?? "—"
                      ) : s.ma ? (
                        <Link to="/su-co/$maSuCo" params={{ maSuCo: s.ma }} className="text-primary hover:underline" onClick={onClose}>
                          {s.ma}
                        </Link>
                      ) : (s.id ?? "—")}
                    </TableCell>
                    <TableCell>{s.ngay ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {isCongViec ? (
                        s.onTime == null ? "—" : (
                          <Badge variant="outline" className={s.onTime
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300"}>
                            {s.onTime ? "Đúng hạn" : "Trễ"}
                          </Badge>
                        )
                      ) : (
                        s.downtimeMinutes == null ? "—" : fmtDowntime(s.downtimeMinutes)
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Không có bản ghi nguồn.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


function ActionCard({ 
  icon: Icon, label, value, desc, href, color, bg 
}: { 
  icon: any, label: string, value: string | number, desc: string, href: string, color: string, bg: string 
}) {
  return (
    <Card className="overflow-hidden border-none bg-muted/30 shadow-none">
      <Link to={href as any}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", bg)}>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-muted-foreground">{label}</div>
              <div className="text-2xl font-bold tabular-nums">{value}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="truncate">{desc}</span>
            <ArrowRight className="h-3 w-3 shrink-0" />
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

function MiniKpi({ title, value, icon: Icon, tone = "text-primary" }: { title: string; value: string | number; icon: React.ComponentType<{ className?: string }>; tone?: string }) {

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-2 p-2.5 sm:p-4">
        <div className="min-w-0">
          <p className="truncate text-[10.5px] leading-tight text-muted-foreground sm:text-xs">{title}</p>
          <p className="mt-0.5 text-base font-semibold tabular-nums sm:mt-1 sm:text-xl">{value}</p>
        </div>
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted sm:h-9 sm:w-9 ${tone}`}>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function ReportCard({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/40">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
        <Download className="h-4 w-4" />
      </div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
      <div className="mt-1 flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Tải xuống CSV <ArrowRight className="h-3 w-3" />
      </div>
    </button>
  );
}


function SectionHeader({ title, icon: Icon, action }: { title: string; icon?: React.ComponentType<{ className?: string }>; action?: React.ReactNode }) {
  return (
    <CardHeader className="flex flex-row items-center justify-between gap-3 px-6 pb-3 pt-5">
      <CardTitle className="flex min-w-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{title}</span>
      </CardTitle>
      {action}
    </CardHeader>
  );
}

function downloadCsv(name: string, content: string) {
  const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Reference imports to keep them alive (used above)
void HeartPulse;
