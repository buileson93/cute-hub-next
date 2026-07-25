import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  CartesianGrid,
} from "recharts";
import {
  HardDrive, Activity, PauseCircle, AlertOctagon, CalendarClock, CalendarX,
  BadgeAlert, FileWarning, RefreshCw, Loader2, Flame, HeartPulse, ShieldCheck,
  Gauge, Wrench, TrendingUp, TrendingDown, Repeat2, Radio, ClipboardCheck, ArrowRightLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/mirats/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useScope } from "@/lib/mirats/scope";
import { cn } from "@/lib/utils";

// --------------------------------------------------------------------------
// N8 — Dashboard KPI. RPC tổng hợp phía CSDL (SECURITY INVOKER — theo RLS).
// URL search: ?days=30|90|365&donVi=<uuid,uuid>
// --------------------------------------------------------------------------

type Search = { days: 30 | 90 | 365; donVi: string[] };

export const Route = createFileRoute("/_app/tong-quan")({
  head: () => ({
    meta: [
      { title: "Tổng quan KPI — MIRATS 2.0" },
      { name: "description", content: "KPI vận hành theo đơn vị: tài sản, sự cố mở, PM đến hạn, giấy phép sắp hết hạn — tổng hợp phía CSDL, tôn trọng phạm vi quyền." },
      { property: "og:title", content: "Tổng quan KPI — MIRATS 2.0" },
      { property: "og:description", content: "Xu hướng sự cố 12 tháng, phân bổ trạng thái tài sản, top hệ thống nhiều sự cố." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => {
    const d = Number(s.days);
    const days: Search["days"] = d === 90 ? 90 : d === 365 ? 365 : 30;
    const raw = typeof s.donVi === "string" ? s.donVi : "";
    const donVi = raw ? raw.split(",").map((x) => x.trim()).filter(Boolean) : [];
    return { days, donVi };
  },
  component: TongQuanPage,
});

// Kiểu dữ liệu trả về từ RPC.
interface Kpis {
  tong_tai_san: number;
  dang_hoat_dong: number;
  ngung_khai_thac: number;
  su_co_mo: number;
  su_co_moi: number;
  pm_den_han: number;
  pm_qua_han: number;
  sap_het_han: number;
  qua_han_giay_phep: number;
}
interface SuCoByMonth { thang: string; muc_do: string; so_luong: number }
interface AssetStatus { trang_thai_ma: string; ten: string; so_luong: number }
interface TopHT { he_thong_id: string; ten_he_thong: string; so_su_co_mo: number; mttr_h: number }
interface Brief { su_co_khan: number; pm_hom_nay: number; pm_qua_han: number; han_7_ngay: number; sap_het_han_30: number }
interface Health {
  availability_pct: number | null; mtbf_h: number; mttr_h: number; mttr_prev_h: number;
  compliance_pct: number | null; n_closed: number; n_closed_prev: number;
  downtime_h: number; total_h: number; period_days: number;
}
interface HeatCell { dow: number; hour: number; so_luong: number }
interface ExpiryRow { loai: string; ref_id: string; ten: string; ngay_het: string; days_left: number }
interface TopTbLap { thiet_bi_id: string; ma: string; ten: string; so_lan: number; mttr_h: number }
interface FeedRow { at: string; loai: string; tieu_de: string; ref_route: string; ref_id: string }

const MUC_DO_COLORS: Record<string, string> = {
  nghiem_trong: "hsl(0 84% 60%)",
  cao: "hsl(24 94% 52%)",
  trung_binh: "hsl(38 92% 50%)",
  thap: "hsl(215 16% 55%)",
  khac: "hsl(215 16% 70%)",
};
const MUC_DO_LABEL: Record<string, string> = {
  nghiem_trong: "Nghiêm trọng", cao: "Cao", trung_binh: "Trung bình", thap: "Thấp", khac: "Khác",
};
const STATUS_COLORS = [
  "hsl(217 91% 50%)", "hsl(142 71% 45%)", "hsl(38 92% 50%)",
  "hsl(0 84% 60%)", "hsl(280 60% 55%)", "hsl(215 16% 55%)",
];

function TongQuanPage() {
  const { days, donVi } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { donVi: scopeDonVi, scopeAll, loading: scopeLoading } = useScope();

  const donViIds = donVi.length > 0 ? donVi : undefined;

  const fromDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }, [days]);
  const toDate = new Date().toISOString().slice(0, 10);

  const kpiQ = useQuery({
    queryKey: ["dashboard_kpis", donViIds, fromDate, toDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_kpis", {
        p_don_vi_ids: donViIds, p_from: fromDate, p_to: toDate,
      });
      if (error) throw error;
      return data as unknown as Kpis;
    },
  });

  const trendQ = useQuery({
    queryKey: ["dashboard_su_co_by_month", donViIds],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_su_co_by_month", {
        p_don_vi_ids: donViIds, p_months: 12,
      });
      if (error) throw error;
      return (data ?? []) as SuCoByMonth[];
    },
  });

  const statusQ = useQuery({
    queryKey: ["dashboard_asset_status", donViIds],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_asset_status", {
        p_don_vi_ids: donViIds,
      });
      if (error) throw error;
      return (data ?? []) as AssetStatus[];
    },
  });

  const topQ = useQuery({
    queryKey: ["dashboard_top_he_thong_su_co", donViIds],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_top_he_thong_su_co", {
        p_don_vi_ids: donViIds, p_limit: 5,
      });
      if (error) throw error;
      return (data ?? []) as TopHT[];
    },
  });

  const briefQ = useQuery({
    queryKey: ["dashboard_brief_today", donViIds],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_brief_today" as never, { p_don_vi_ids: donViIds } as never);
      if (error) throw error;
      return data as unknown as Brief;
    },
  });
  const healthQ = useQuery({
    queryKey: ["dashboard_health", donViIds, fromDate, toDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_health" as never, {
        p_don_vi_ids: donViIds, p_from: fromDate, p_to: toDate,
      } as never);
      if (error) throw error;
      return data as unknown as Health;
    },
  });
  const heatQ = useQuery({
    queryKey: ["dashboard_su_co_heatmap", donViIds],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_su_co_heatmap" as never, {
        p_don_vi_ids: donViIds, p_days: 90,
      } as never);
      if (error) throw error;
      return (data ?? []) as HeatCell[];
    },
  });
  const expQ = useQuery({
    queryKey: ["dashboard_expiry_timeline", donViIds],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_expiry_timeline" as never, {
        p_don_vi_ids: donViIds, p_days: 90,
      } as never);
      if (error) throw error;
      return (data ?? []) as ExpiryRow[];
    },
  });
  const tbLapQ = useQuery({
    queryKey: ["dashboard_top_thiet_bi_hong_lap", donViIds],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_top_thiet_bi_hong_lap" as never, {
        p_don_vi_ids: donViIds, p_limit: 5,
      } as never);
      if (error) throw error;
      return (data ?? []) as TopTbLap[];
    },
  });
  const feedQ = useQuery({
    queryKey: ["dashboard_activity_feed", donViIds],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_activity_feed" as never, {
        p_don_vi_ids: donViIds, p_limit: 20,
      } as never);
      if (error) throw error;
      return (data ?? []) as FeedRow[];
    },
  });

  const loading = kpiQ.isLoading || trendQ.isLoading || statusQ.isLoading || topQ.isLoading || briefQ.isLoading || healthQ.isLoading;
  const err = kpiQ.error || trendQ.error || statusQ.error || topQ.error || briefQ.error || healthQ.error;

  // Gom xu hướng sự cố theo tháng × muc_do.
  const trendData = useMemo(() => {
    const rows = trendQ.data ?? [];
    const byMonth = new Map<string, Record<string, number | string>>();
    rows.forEach((r) => {
      const key = r.thang;
      if (!byMonth.has(key)) byMonth.set(key, { thang: key });
      const bucket = byMonth.get(key)!;
      const mk = MUC_DO_LABEL[r.muc_do] ?? r.muc_do;
      bucket[mk] = ((bucket[mk] as number) ?? 0) + Number(r.so_luong);
    });
    return Array.from(byMonth.values())
      .sort((a, b) => String(a.thang).localeCompare(String(b.thang)))
      .map((r) => ({
        ...r,
        thangHT: new Date(String(r.thang)).toLocaleDateString("vi-VN", { month: "2-digit", year: "2-digit" }),
      }));
  }, [trendQ.data]);

  const mucDoKeys = useMemo(() => {
    const s = new Set<string>();
    (trendQ.data ?? []).forEach((r) => s.add(MUC_DO_LABEL[r.muc_do] ?? r.muc_do));
    return Array.from(s);
  }, [trendQ.data]);

  const setDonVi = (value: string) => {
    navigate({
      search: (prev: Search) => ({
        ...prev,
        donVi: value === "__all__" ? [] : [value],
      }),
      replace: true,
    });
  };
  const setDays = (value: string) => {
    navigate({
      search: (prev: Search) => ({ ...prev, days: Number(value) as Search["days"] }),
      replace: true,
    });
  };
  const refetchAll = () => {
    kpiQ.refetch(); trendQ.refetch(); statusQ.refetch(); topQ.refetch();
    briefQ.refetch(); healthQ.refetch(); heatQ.refetch();
    expQ.refetch(); tbLapQ.refetch(); feedQ.refetch();
  };

  return (
    <div className="flex w-full flex-col gap-4 p-4 md:p-6">
      {/* Thanh tiêu đề + bộ lọc */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <PageHeader
            icon={Activity}
            title="Tổng quan KPI"
            help="Số liệu tổng hợp phía CSDL, tôn trọng phạm vi quyền của tài khoản."
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-muted-foreground">Đơn vị</label>
          <Select
            value={donVi[0] ?? "__all__"}
            onValueChange={setDonVi}
            disabled={scopeLoading || (!scopeAll && scopeDonVi.length <= 1)}
          >
            <SelectTrigger className="h-9 w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                {scopeAll ? "Tất cả đơn vị" : "Toàn bộ phạm vi của tôi"}
              </SelectItem>
              {scopeDonVi.map((d) => (
                <SelectItem key={d.ma} value={d.ma}>{d.ten}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-muted-foreground">Khoảng thời gian</label>
          <Select value={String(days)} onValueChange={setDays}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 ngày</SelectItem>
              <SelectItem value="90">90 ngày</SelectItem>
              <SelectItem value="365">1 năm</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" onClick={refetchAll} disabled={loading}>
          <RefreshCw className={cn("mr-1 h-4 w-4", loading && "animate-spin")} />
          Làm mới
        </Button>
      </div>

      {err && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">
            Không tải được dữ liệu: {String((err as Error).message ?? err)}
          </CardContent>
        </Card>
      )}

      {/* ROW 1 — BRIEF HÔM NAY */}
      <div>
        <SectionHeader icon={<Radio className="h-3.5 w-3.5" />} title="Brief hôm nay" to="/su-co" more="Đi tới Sự cố" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <KpiCard icon={<Flame className="h-4 w-4" />} label="Sự cố khẩn (mở)"
            value={briefQ.data?.su_co_khan} loading={briefQ.isLoading} tone="danger"
            link={{ to: "/su-co", label: "Xử lý" }} />
          <KpiCard icon={<Wrench className="h-4 w-4" />} label="PM hôm nay"
            value={briefQ.data?.pm_hom_nay} loading={briefQ.isLoading} tone="warn"
            link={{ to: "/bao-tri/pm", label: "Lịch PM" }} />
          <KpiCard icon={<CalendarX className="h-4 w-4" />} label="PM quá hạn"
            value={briefQ.data?.pm_qua_han} loading={briefQ.isLoading} tone="danger"
            link={{ to: "/bao-tri/pm", label: "Xử lý" }} />
          <KpiCard icon={<CalendarClock className="h-4 w-4" />} label="Hạn 7 ngày tới"
            value={briefQ.data?.han_7_ngay} loading={briefQ.isLoading} tone="warn"
            link={{ to: "/giay-phep", label: "Giấy phép" }} />
          <KpiCard icon={<BadgeAlert className="h-4 w-4" />} label="Sắp hết hạn 30 ngày"
            value={briefQ.data?.sap_het_han_30} loading={briefQ.isLoading} tone="warn"
            link={{ to: "/giay-phep", label: "Xem" }} />
        </div>
      </div>

      {/* ROW 2 — SỨC KHOẺ KHAI THÁC */}
      <div>
        <SectionHeader icon={<HeartPulse className="h-3.5 w-3.5" />} title={`Sức khoẻ khai thác (${days} ngày)`} to="/bao-tri/pm" more="Kế hoạch bảo trì" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <HealthTile
            icon={<Gauge className="h-4 w-4" />}
            label="Availability"
            value={healthQ.data?.availability_pct == null ? "—" : `${healthQ.data.availability_pct}%`}
            hint={healthQ.data ? `Downtime ${healthQ.data.downtime_h}h / ${healthQ.data.total_h}h` : ""}
            tone={healthQ.data?.availability_pct != null && healthQ.data.availability_pct >= 99 ? "ok"
              : healthQ.data?.availability_pct != null && healthQ.data.availability_pct >= 95 ? "warn" : "danger"}
            loading={healthQ.isLoading}
            to="/su-co"
          />
          <HealthTile
            icon={<Repeat2 className="h-4 w-4" />}
            label="MTBF (giờ)"
            value={healthQ.data ? fmtHours(healthQ.data.mtbf_h) : "—"}
            hint="Thời gian trung bình giữa 2 sự cố"
            tone="default"
            loading={healthQ.isLoading}
            to="/su-co"
          />
          <HealthTile
            icon={<Wrench className="h-4 w-4" />}
            label="MTTR (giờ)"
            value={healthQ.data ? fmtHours(healthQ.data.mttr_h) : "—"}
            hint={healthQ.data ? compareLabel(healthQ.data.mttr_h, healthQ.data.mttr_prev_h, true) : ""}
            tone={healthQ.data && healthQ.data.mttr_h > healthQ.data.mttr_prev_h ? "warn" : "ok"}
            loading={healthQ.isLoading}
            to="/bao-tri"
          />
          <HealthTile
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Compliance (giấy phép + chứng chỉ)"
            value={healthQ.data?.compliance_pct == null ? "—" : `${healthQ.data.compliance_pct}%`}
            hint="Tỷ lệ còn hiệu lực"
            tone={healthQ.data?.compliance_pct != null && healthQ.data.compliance_pct >= 90 ? "ok"
              : healthQ.data?.compliance_pct != null && healthQ.data.compliance_pct >= 70 ? "warn" : "danger"}
            loading={healthQ.isLoading}
            to="/giay-phep"
          />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard icon={<HardDrive className="h-4 w-4" />} label="Tổng tài sản"
          value={kpiQ.data?.tong_tai_san} loading={kpiQ.isLoading} tone="default"
          link={{ to: "/tai-san", label: "Danh sách" }} />
        <KpiCard icon={<Activity className="h-4 w-4" />} label="Đang khai thác"
          value={kpiQ.data?.dang_hoat_dong} loading={kpiQ.isLoading} tone="ok"
          link={{ to: "/tai-san", label: "Xem" }} />
        <KpiCard icon={<PauseCircle className="h-4 w-4" />} label="Ngừng / Hỏng / Thanh lý"
          value={kpiQ.data?.ngung_khai_thac} loading={kpiQ.isLoading} tone="warn"
          link={{ to: "/tai-san", label: "Xem" }} />
        <KpiCard icon={<AlertOctagon className="h-4 w-4" />} label="Sự cố đang mở"
          value={kpiQ.data?.su_co_mo} loading={kpiQ.isLoading} tone="danger"
          link={{ to: "/su-co", label: "Xem" }} sub={`+${kpiQ.data?.su_co_moi ?? 0} mới trong ${days} ngày`} />

        <KpiCard icon={<CalendarClock className="h-4 w-4" />} label="PM đến hạn (≤7 ngày)"
          value={kpiQ.data?.pm_den_han} loading={kpiQ.isLoading} tone="warn"
          link={{ to: "/bao-tri/pm", label: "Lịch PM" }} />
        <KpiCard icon={<CalendarX className="h-4 w-4" />} label="PM quá hạn"
          value={kpiQ.data?.pm_qua_han} loading={kpiQ.isLoading} tone="danger"
          link={{ to: "/bao-tri/pm", label: "Lịch PM" }} />
        <KpiCard icon={<BadgeAlert className="h-4 w-4" />} label="Sắp hết hạn (≤30 ngày)"
          value={kpiQ.data?.sap_het_han} loading={kpiQ.isLoading} tone="warn"
          link={{ to: "/giay-phep", label: "Giấy phép" }} />
        <KpiCard icon={<FileWarning className="h-4 w-4" />} label="Giấy phép quá hạn"
          value={kpiQ.data?.qua_han_giay_phep} loading={kpiQ.isLoading} tone="danger"
          link={{ to: "/giay-phep", label: "Giấy phép" }} />
      </div>

      {/* Biểu đồ */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Xu hướng sự cố theo tháng (12 tháng)</CardTitle>
            <Link to="/su-co" className="text-[11px] text-primary hover:underline">Sổ sự cố →</Link>
          </CardHeader>
          <CardContent className="h-[280px]">
            {trendQ.isLoading ? (
              <ChartLoader />
            ) : trendData.length === 0 ? (
              <EmptyChart>Chưa có sự cố trong 12 tháng qua.</EmptyChart>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="thangHT" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {mucDoKeys.map((k) => (
                    <Bar
                      key={k}
                      dataKey={k}
                      stackId="s"
                      fill={
                        MUC_DO_COLORS[
                          Object.keys(MUC_DO_LABEL).find((c) => MUC_DO_LABEL[c] === k) ?? "khac"
                        ]
                      }
                      radius={[3, 3, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Phân bổ trạng thái tài sản</CardTitle>
            <Link to="/tai-san" className="text-[11px] text-primary hover:underline">Tài sản →</Link>
          </CardHeader>
          <CardContent className="h-[280px]">
            {statusQ.isLoading ? (
              <ChartLoader />
            ) : (statusQ.data ?? []).length === 0 ? (
              <EmptyChart>Không có tài sản trong phạm vi.</EmptyChart>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusQ.data ?? []}
                    dataKey="so_luong"
                    nameKey="ten"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {(statusQ.data ?? []).map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top hệ thống */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Top 5 hệ thống có nhiều sự cố đang mở</CardTitle>
          <Link to="/he-thong" className="text-[11px] text-primary hover:underline">Cây hệ thống →</Link>
        </CardHeader>
        <CardContent>
          {topQ.isLoading ? (
            <ChartLoader />
          ) : (topQ.data ?? []).length === 0 ? (
            <EmptyChart>Không có sự cố mở trong phạm vi.</EmptyChart>
          ) : (
            <ul className="divide-y divide-border">
              {(topQ.data ?? []).map((r) => (
                <li key={r.he_thong_id} className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/he-thong/$id"
                      params={{ id: r.he_thong_id }}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {r.ten_he_thong}
                    </Link>
                  </div>
                  <div className="w-40">
                    <div className="h-2 overflow-hidden rounded bg-secondary">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min(
                            100,
                            (r.so_su_co_mo /
                              Math.max(1, (topQ.data ?? [])[0]?.so_su_co_mo ?? 1)) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-16 text-right text-[11px] text-muted-foreground tabular-nums">
                    MTTR {fmtHours(r.mttr_h)}
                  </span>
                  <span className="w-10 text-right font-mono text-sm tabular-nums">
                    {r.so_su_co_mo}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ROW — Heatmap sự cố + Top TB hỏng lặp */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Heatmap sự cố (90 ngày) — thứ × giờ</CardTitle>
            <Link to="/su-co" className="text-[11px] text-primary hover:underline">Sổ sự cố →</Link>
          </CardHeader>
          <CardContent>
            <Heatmap data={heatQ.data ?? []} loading={heatQ.isLoading} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Top thiết bị hỏng lặp (90 ngày)</CardTitle>
            <Link to="/thiet-bi" className="text-[11px] text-primary hover:underline">Thiết bị →</Link>
          </CardHeader>
          <CardContent>
            {tbLapQ.isLoading ? (
              <ChartLoader />
            ) : (tbLapQ.data ?? []).length === 0 ? (
              <EmptyChart>Chưa phát hiện thiết bị hỏng lặp.</EmptyChart>
            ) : (
              <ul className="divide-y divide-border">
                {(tbLapQ.data ?? []).map((r) => (
                  <li key={r.thiet_bi_id} className="flex items-center gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <Link to="/qr/thiet-bi/$id" params={{ id: r.thiet_bi_id }}
                        className="truncate text-sm font-medium hover:underline">
                        {r.ma ?? "—"} · {r.ten ?? ""}
                      </Link>
                      <div className="text-[11px] text-muted-foreground">MTTR {fmtHours(r.mttr_h)}</div>
                    </div>
                    <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs font-mono text-destructive tabular-nums">
                      {r.so_lan} lần
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ROW — Timeline hạn */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Hạn giấy phép & kiểm định (90 ngày tới)</CardTitle>
          <Link to="/giay-phep" className="text-[11px] text-primary hover:underline">Giấy phép →</Link>
        </CardHeader>
        <CardContent>
          {expQ.isLoading ? (
            <ChartLoader />
          ) : (expQ.data ?? []).length === 0 ? (
            <EmptyChart>Không có hạn nào trong khung 90 ngày.</EmptyChart>
          ) : (
            <ExpiryTimeline data={expQ.data ?? []} />
          )}
        </CardContent>
      </Card>

      {/* ROW — Feed hoạt động */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Hoạt động gần đây</CardTitle>
          <Link to="/su-co" className="text-[11px] text-primary hover:underline">Sự cố →</Link>
        </CardHeader>
        <CardContent>
          {feedQ.isLoading ? (
            <ChartLoader />
          ) : (feedQ.data ?? []).length === 0 ? (
            <EmptyChart>Chưa có hoạt động.</EmptyChart>
          ) : (
            <ul className="divide-y divide-border">
              {(feedQ.data ?? []).map((r, i) => (
                <li key={`${r.loai}-${r.ref_id}-${i}`} className="flex items-center gap-3 py-2">
                  <FeedIcon loai={r.loai} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{r.tieu_de}</div>
                    <div className="text-[11px] text-muted-foreground">{fmtRelative(r.at)}</div>
                  </div>
                  <Link to={r.ref_route as never} className="text-[11px] text-primary hover:underline">
                    Mở →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon, label, value, loading, tone, link, sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  loading: boolean;
  tone: "default" | "ok" | "warn" | "danger";
  link?: { to: string; label: string };
  sub?: string;
}) {
  const toneClasses: Record<string, string> = {
    default: "text-foreground",
    ok: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
    danger: "text-destructive",
  };
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={toneClasses[tone]}>{icon}</span>
          <span className="truncate">{label}</span>
        </div>
        <div className={cn("font-semibold tabular-nums", toneClasses[tone], "text-2xl")}>
          {loading ? <span className="inline-block h-6 w-14 animate-pulse rounded bg-muted" /> : (value ?? 0).toLocaleString("vi-VN")}
        </div>
        {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
        {link && (
          <Link to={link.to as never} className="mt-1 text-[11px] text-primary hover:underline">
            {link.label} →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function ChartLoader() {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
    </div>
  );
}
function EmptyChart({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

// --------- Helpers ---------------------------------------------------------
function fmtHours(h: number | null | undefined): string {
  if (h == null || Number.isNaN(Number(h))) return "—";
  const n = Number(h);
  if (n >= 24) return `${(n / 24).toFixed(1)}d`;
  return `${n.toFixed(1)}h`;
}
function compareLabel(cur: number, prev: number, lowerIsBetter = false): string {
  if (!prev) return "Không có kỳ trước";
  const diff = ((cur - prev) / prev) * 100;
  const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "▬";
  const good = lowerIsBetter ? diff < 0 : diff > 0;
  const tone = good ? "tốt hơn" : "kém hơn";
  return `${arrow} ${Math.abs(diff).toFixed(0)}% ${tone} kỳ trước`;
}
function fmtRelative(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.round(diff / 60_000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

function HealthTile({ icon, label, value, hint, tone, loading }: {
  icon: React.ReactNode; label: string; value: string; hint?: string;
  tone: "default" | "ok" | "warn" | "danger"; loading: boolean;
}) {
  const toneClasses: Record<string, string> = {
    default: "text-foreground",
    ok: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
    danger: "text-destructive",
  };
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={toneClasses[tone]}>{icon}</span>
          <span className="truncate">{label}</span>
        </div>
        <div className={cn("text-2xl font-semibold tabular-nums", toneClasses[tone])}>
          {loading ? <span className="inline-block h-6 w-16 animate-pulse rounded bg-muted" /> : value}
        </div>
        {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function Heatmap({ data, loading }: { data: HeatCell[]; loading: boolean }) {
  const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const max = Math.max(1, ...data.map((d) => d.so_luong));
  const grid = useMemo(() => {
    const m = new Map<string, number>();
    data.forEach((d) => m.set(`${d.dow}-${d.hour}`, d.so_luong));
    return m;
  }, [data]);
  if (loading) return <ChartLoader />;
  if (data.length === 0) return <EmptyChart>Chưa có sự cố trong 90 ngày.</EmptyChart>;
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="grid grid-cols-[32px_repeat(24,minmax(0,1fr))] gap-[2px] text-[9px] text-muted-foreground">
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-center">{h % 3 === 0 ? h : ""}</div>
          ))}
          {DOW.map((label, dow) => (
            <>
              <div key={`l-${dow}`} className="pr-1 text-right leading-4">{label}</div>
              {Array.from({ length: 24 }, (_, h) => {
                const n = grid.get(`${dow}-${h}`) ?? 0;
                const alpha = n === 0 ? 0.05 : 0.15 + 0.85 * (n / max);
                return (
                  <div
                    key={`c-${dow}-${h}`}
                    className="aspect-square rounded-sm"
                    style={{ backgroundColor: `hsl(0 84% 60% / ${alpha})` }}
                    title={`${DOW[dow]} ${h}h: ${n} sự cố`}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExpiryTimeline({ data }: { data: ExpiryRow[] }) {
  const rows = data.slice(0, 20);
  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => {
        const overdue = r.days_left < 0;
        const soon = r.days_left >= 0 && r.days_left <= 7;
        const tone = overdue ? "text-destructive" : soon ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground";
        const badge = r.loai === "giay_phep" ? "GP" : r.loai === "KIEM_DINH" ? "KĐ" : "HC";
        return (
          <li key={`${r.loai}-${r.ref_id}`} className="flex items-center gap-3 py-2">
            <span className="w-8 rounded bg-secondary px-1 text-center text-[10px] font-semibold uppercase">{badge}</span>
            <div className="min-w-0 flex-1 truncate text-sm">{r.ten}</div>
            <div className="text-[11px] text-muted-foreground">{new Date(r.ngay_het).toLocaleDateString("vi-VN")}</div>
            <div className={cn("w-24 text-right text-xs font-medium tabular-nums", tone)}>
              {overdue ? `${Math.abs(r.days_left)} ngày quá hạn` : `còn ${r.days_left} ngày`}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function FeedIcon({ loai }: { loai: string }) {
  const map: Record<string, React.ReactNode> = {
    su_co: <AlertOctagon className="h-4 w-4 text-destructive" />,
    bao_tri: <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
    ban_giao: <ArrowRightLeft className="h-4 w-4 text-primary" />,
    kiem_ke: <ClipboardCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  };
  return <>{map[loai] ?? <Activity className="h-4 w-4 text-muted-foreground" />}</>;
}
