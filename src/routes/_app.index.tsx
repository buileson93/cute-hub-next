import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { 
  LayoutDashboard, Flame, Wrench, Sparkles, 
  ArrowRight, Activity, User, Trophy, History,
  CheckCircle2, AlertCircle, Clock, Download,
  ShieldCheck, Zap, ShieldAlert, BarChart3, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { 
  useDashboardBrief, useDashboardKpis, useUserAuditLog 
} from "@/lib/mirats/dashboard.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getCompletenessStats, getCompletenessOverview } from '@/lib/mirats/completeness.functions';
import { useQuery } from "@tanstack/react-query";
import { useUserPref } from "@/hooks/use-user-pref";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  CartesianGrid, AreaChart, Area
} from "recharts";
import { supabase } from "@/integrations/backend/client";
import { HeartBeatStrip } from "@/components/mirats/dashboard/HeartBeatStrip";
import { LiveTimeline } from "@/components/mirats/dashboard/LiveTimeline";
import { useScope } from "@/lib/mirats/scope";
import { availability, mttr, mtbf, formatKpiValue } from "@/lib/mirats/reliability";
import { healthDetail } from "@/lib/mirats/metrics";
import { usePmOnTimeKpi } from "@/lib/mirats/bao-tri-kpi";
import { isFeatureEnabled } from "@/lib/mirats/feature-flags";
import { fmtDowntime } from "@/lib/mirats/format";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Types
interface SuCoByMonth { thang: string; muc_do: string; so_luong: number }
interface AssetStatus { trang_thai_ma: string; ten: string; so_luong: number }

const MUC_DO_LABEL: Record<string, string> = {
  nghiem_trong: "Nghiêm trọng", cao: "Cao", trung_binh: "Trung bình", thap: "Thấp", khac: "Khác",
};
const MUC_DO_COLORS: Record<string, string> = {
  nghiem_trong: "hsl(0 84% 60%)",
  cao: "hsl(24 94% 52%)",
  trung_binh: "hsl(38 92% 50%)",
  thap: "hsl(215 16% 55%)",
  khac: "hsl(215 16% 70%)",
};
const STATUS_COLORS = [
  "hsl(217 91% 50%)", "hsl(142 71% 45%)", "hsl(38 92% 50%)",
  "hsl(0 84% 60%)", "hsl(280 60% 55%)", "hsl(215 16% 55%)",
];

export const Route = (createFileRoute("/_app/") as any)({
  loader: async ({ context }: any) => {
    // SSR safe loader: do not block if server calls fail (usually do not have session in SSR)
    try {
      await Promise.all([
        context.queryClient.prefetchQuery({
          queryKey: ['completeness-stats'],
          queryFn: () => getCompletenessStats(),
        }),
        context.queryClient.prefetchQuery({
          queryKey: ['completeness-overview', 3],
          queryFn: () => getCompletenessOverview({ data: { limit: 3 } }),
        })
      ]);
    } catch (e) {
      console.warn("Dashboard SSR prefetch skipped:", e instanceof Error ? e.message : e);
    }
  },
  component: Dashboard,
});

function Dashboard() {
  const { profile } = useSession();
  const scope = useScope();
  
  const statsQuery = useQuery({
    queryKey: ['completeness-stats'],
    queryFn: () => getCompletenessStats(),
  });
  const overviewQuery = useQuery({
    queryKey: ['completeness-overview', 3],
    queryFn: () => getCompletenessOverview({ data: { limit: 3 } }),
  });

  const pmKpi = usePmOnTimeKpi();
  
  const completeness = (statsQuery.data as any) || {};
  const lowCompleteness = (overviewQuery.data as any)?.lowCompleteness || [];
  const tasks = (overviewQuery.data as any)?.tasks || [];

  const brief = useDashboardBrief(scope.donViCode ? [scope.donViCode] : undefined);
  const audit = useUserAuditLog(5);
  
  const [activeTab, setActiveTab] = useUserPref("dashboard:main-chart-tab", "reliability");

  const devices = scope.thietBi;
  const incidents = scope.suCo;
  
  const reliability = useMemo(() => {
    return availability({ 
      assetCount: devices.length, 
      windowHours: 720, // 30 days
      incidents 
    });
  }, [devices.length, incidents]);

  const mttrKpi = useMemo(() => mttr(incidents), [incidents]);
  const mtbfKpi = useMemo(() => mtbf(incidents), [incidents]);

  const healthStats = useMemo(() => {
    const stats = { A: 0, B: 0, C: 0, D: 0, total: 0 };
    devices.forEach(d => {
      const h = healthDetail(d);
      stats[h.xepLoai]++;
      stats.total++;
    });
    return stats;
  }, [devices]);

  const lowHealthDevices = useMemo(() => {
    return devices
      .map(d => ({ device: d, health: healthDetail(d) }))
      .filter(item => item.health.xepLoai === 'C' || item.health.xepLoai === 'D')
      .sort((a, b) => a.health.score - b.health.score)
      .slice(0, 5);
  }, [devices]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Chào buổi sáng!";
    if (h < 18) return "Chào buổi chiều!";
    return "Chào buổi tối!";
  }, []);

  const trendQ = useQuery({
    queryKey: ["dashboard_su_co_by_month_dashboard", scope.donViCode],
    enabled: activeTab === "trend",
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_su_co_by_month", {
        p_months: 12,
        p_don_vi_ids: scope.donViCode ? [scope.donViCode] : null
      } as any);
      if (error) throw error;
      return (data ?? []) as SuCoByMonth[];
    },
  });

  const statusQ = useQuery({
    queryKey: ["dashboard_asset_status_dashboard", scope.donViCode],
    enabled: activeTab === "status",
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_asset_status", {
         p_don_vi_ids: scope.donViCode ? [scope.donViCode] : null
      } as any);
      if (error) throw error;
      return (data ?? []) as AssetStatus[];
    },
  });

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

  const handleExport = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Đang chuẩn bị báo cáo...',
        success: 'Đã tải xuống báo cáo tổng quan KPI',
        error: 'Lỗi khi tải báo cáo',
      }
    );
  };

  if (scope.loading) {
    return <div className="h-screen w-full flex items-center justify-center animate-pulse text-muted-foreground">Đang tải MIRATS 2.0...</div>;
  }

  return (
    <PageBody className="bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[13px] text-muted-foreground font-medium">Today <ChevronDown className="inline w-3 h-3 ml-1" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Availability", value: formatKpiValue(reliability), change: "+2.4%", icon: ShieldCheck, color: "bg-[#E3F2FD] text-[#1D52E0]" },
          { label: "MTTR", value: formatKpiValue(mttrKpi), change: "-12.5%", icon: Clock, color: "bg-[#F3E5F5] text-[#9C27B0]" },
          { label: "MTBF", value: formatKpiValue(mtbfKpi), change: "+5.1%", icon: TrendingUp, color: "bg-[#FFF3E0] text-[#E65100]" },
          { label: "PM On-Time", value: pmKpi.isLoading ? "..." : formatKpiValue(pmKpi.result), change: "+1.2%", icon: Wrench, color: "bg-[#E8F5E9] text-[#2E7D32]" },
        ].map((k) => (
          <div key={k.label} className={cn("p-6 rounded-3xl border border-border/50 bg-white hover:shadow-md transition-shadow")}>
            <div className="text-sm font-medium text-foreground mb-4">{k.label}</div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold tracking-tight">{k.value}</div>
              <div className="flex items-center text-[11px] font-bold text-muted-foreground">
                {k.change} <TrendingUp className="w-3 h-3 ml-1" />
              </div>
            </div>
          </div>
        ))}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        <div className="lg:col-span-3 space-y-6">
          {/* TẦNG 1.5: KHỐI KPI ĐỘ TIN CẬY (KHÔI PHỤC) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Availability", value: formatKpiValue(reliability), icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50/50" },
              { label: "MTTR", value: formatKpiValue(mttrKpi), icon: Clock, color: "text-blue-600", bg: "bg-blue-50/50" },
              { label: "MTBF", value: formatKpiValue(mtbfKpi), icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50/50" },
              { label: "PM Đúng Hạn", value: pmKpi.isLoading ? "..." : formatKpiValue(pmKpi.result), icon: Wrench, color: "text-indigo-600", bg: "bg-indigo-50/50" },
            ].map((k) => (
              <div key={k.label} className={cn("flex flex-col gap-2 p-5 rounded-3xl border border-border/40 transition-all hover:shadow-lg hover:shadow-primary/5", k.bg)}>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  <k.icon className="w-3.5 h-3.5" /> {k.label}
                </div>
                <div className={cn("text-3xl font-black font-mono tracking-tighter", k.color)}>
                  {k.value}
                </div>
              </div>
            ))}
          </div>

          {/* OPERATIONS HUB */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-muted/10 rounded-2xl p-6 border border-border/40">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" /> Sự cố khẩn cấp
              </div>
              <div className="text-5xl font-black tabular-nums tracking-tighter text-red-600 mb-2">
                {brief.isLoading ? "..." : (brief.data?.su_co_khan ?? 0)}
              </div>
              <Link to="/su-co" className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">Xem chi tiết sự cố →</Link>
            </div>
            <div className="bg-muted/10 rounded-2xl p-6 border border-border/40">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-500" /> Việc bảo trì
              </div>
              <div className="text-5xl font-black tabular-nums tracking-tighter text-orange-600 mb-2">
                {brief.isLoading ? "..." : (brief.data?.pm_hom_nay ?? 0) + (brief.data?.pm_qua_han ?? 0)}
              </div>
              <Link to="/bao-tri" className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">Xem lịch bảo trì →</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50/30 rounded-2xl p-6 border border-blue-100/50">
              <div className="flex items-baseline gap-2 mb-4">
                <div className="text-4xl font-black text-blue-600 tabular-nums font-mono tracking-tighter">{completeness.avg_thiet_bi || 0}%</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Data quality</div>
              </div>
              <div className="space-y-1">
                {lowCompleteness.slice(0, 2).map((tb: any) => (
                  <Link key={tb.id} to="/qr/thiet-bi/$id" params={{ id: tb.id } as any} className="flex justify-between items-center text-xs p-1.5 rounded-lg hover:bg-white transition-colors">
                    <span className="truncate flex-1 pr-2 font-medium">{tb.ten_thiet_bi}</span>
                    <span className="font-bold text-red-500 tabular-nums font-mono">{tb.completeness_pct}%</span>
                  </Link>
                ))}
              </div>
              <Link to="/chat-luong-du-lieu" className="block mt-4 text-[10px] font-bold uppercase text-primary hover:underline">Chi tiết chất lượng →</Link>
            </div>
          </div>

          {/* TẦNG 4: KHỐI PHÂN BỔ SỨC KHOẺ & BIỂU ĐỒ */}
          {/* ANALYTICS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-none border border-border/50 rounded-2xl">
              <CardHeader className="pb-0 pt-6 px-6">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5" /> Fleet Reliability & Health
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] pt-4 px-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Tốt (A)", value: healthStats.A, color: "oklch(0.65 0.15 160)" },
                        { name: "Khá (B)", value: healthStats.B, color: "oklch(0.55 0.20 264)" },
                        { name: "Trung bình (C)", value: healthStats.C, color: "oklch(0.75 0.12 90)" },
                        { name: "Yếu (D)", value: healthStats.D, color: "oklch(0.65 0.15 25)" },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      stroke="none"
                    >
                      {[
                        { color: "oklch(0.65 0.15 160)" },
                        { color: "oklch(0.55 0.20 264)" },
                        { color: "oklch(0.75 0.12 90)" },
                        { color: "oklch(0.65 0.15 25)" },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', fontSize: '11px', fontWeight: 'bold' }} 
                    />
                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-none border border-border/50 rounded-2xl overflow-hidden">
              <CardHeader className="pb-0 pt-6 px-6 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" /> Incident Trends
                </CardTitle>
                <Link to="/su-co" className="text-[10px] font-bold text-primary/70 uppercase hover:text-primary transition-colors">Sổ sự cố →</Link>
              </CardHeader>
              <CardContent className="h-[300px] pt-4 px-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="thangHT" fontSize={9} axisLine={false} tickLine={false} fontWeight="bold" />
                    <YAxis fontSize={9} axisLine={false} tickLine={false} allowDecimals={false} fontWeight="bold" />
                    <Bar
                      dataKey="Cao"
                      stackId="a"
                      fill="oklch(0.65 0.15 25)"
                      radius={[2, 2, 0, 0]}
                      barSize={16}
                    />
                    <Bar
                      dataKey="Trung bình"
                      stackId="a"
                      fill="oklch(0.75 0.12 90)"
                      radius={[0, 0, 0, 0]}
                      barSize={16}
                    />
                    <Bar
                      dataKey="Thấp"
                      stackId="a"
                      fill="oklch(0.55 0.20 264)"
                      radius={[0, 0, 2, 2]}
                      barSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* TẦNG 4.5: BẢNG CHI TIẾT SỨC KHOẺ THẤP (KHÔI PHỤC) */}
          {/* FLEET MONITORING */}
          <div className="bg-white/50 dark:bg-card/50 backdrop-blur-sm rounded-3xl border border-border/40 overflow-hidden">
            <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between bg-muted/5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" /> Fleet Attention List
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <tbody className="divide-y divide-border/20">
                  {lowHealthDevices.length === 0 ? (
                    <tr>
                      <td className="px-6 py-8 text-center text-muted-foreground italic text-xs">
                        Fleet operations stable. No attention required.
                      </td>
                    </tr>
                  ) : (
                    lowHealthDevices.map(({ device, health }) => (
                      <tr key={device.ma_thiet_bi} className="group hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <Link 
                              to="/qr/thiet-bi/$id" 
                              params={{ id: device.ma_thiet_bi } as any}
                              className="font-bold text-foreground hover:text-primary transition-colors"
                            >
                              {device.ten}
                            </Link>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{device.ma_thiet_bi}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="flex flex-col items-end">
                              <span className={cn(
                                "text-sm font-black font-mono tracking-tighter",
                                health.xepLoai === 'D' ? "text-red-500" : "text-orange-500"
                              )}>
                                {health.score}%
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Health</span>
                            </div>
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2",
                              health.xepLoai === 'D' 
                                ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-900/50" 
                                : "bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-950/30 dark:border-orange-900/50"
                            )}>
                              {health.xepLoai}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))

                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TẦNG 5: KHU VỰC CỦA TÔI */}
          {/* COMPACT PERSONAL AREA */}
          <div className="flex items-center justify-between py-6 border-t border-border/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 text-primary border border-primary/10">
                <Trophy className="w-3.5 h-3.5" />
                <span className="text-xl font-black font-mono leading-none tracking-tighter">120</span>
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">Gạch</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/5 text-orange-600 border border-orange-500/10">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="text-xl font-black font-mono leading-none tracking-tighter">{tasks.length}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">Tasks</span>
              </div>
            </div>
            <Link to="/gop-gach" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80 hover:text-primary transition-colors border-b border-muted-foreground/30 hover:border-primary pb-0.5">
              Personal Dashboard →
            </Link>
          </div>
        </div>

        {/* THÀNH PHẦN 2: DÒNG THỜI GIAN SỐNG (Bên phải, Desktop only) */}
        <div className="hidden lg:block lg:col-span-1 border-l border-border pl-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Nhật ký vận hành
            </h3>
            <span className="text-[10px] text-muted-foreground uppercase font-medium bg-muted px-1.5 py-0.5 rounded">Live</span>
          </div>
          <div className="h-[calc(100vh-200px)] min-h-[500px]">
            <LiveTimeline />
          </div>
        </div>
      </div>
    </PageBody>
  );
}
