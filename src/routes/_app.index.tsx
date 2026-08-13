import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageBody } from "@/components/mirats/PageBody";
import { 
  Flame, Wrench, Clock, ShieldCheck, TrendingUp, ChevronDown, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { 
  useDashboardBrief, useUserAuditLog 
} from "@/lib/mirats/dashboard.functions";
import { Card } from "@/components/ui/card";
import { getCompletenessStats, getCompletenessOverview } from '@/lib/mirats/completeness.functions';
import { useQuery } from "@tanstack/react-query";
import { useUserPref } from "@/hooks/use-user-pref";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from "recharts";
import { supabase } from "@/integrations/backend/client";
import { useScope } from "@/lib/mirats/scope";
import { availability, mttr, mtbf, formatKpiValue } from "@/lib/mirats/reliability";
import { healthDetail } from "@/lib/mirats/metrics";
import { usePmOnTimeKpi } from "@/lib/mirats/bao-tri-kpi";

// Types
interface SuCoByMonth { thang: string; muc_do: string; so_luong: number }

const MUC_DO_LABEL: Record<string, string> = {
  nghiem_trong: "Nghiêm trọng", cao: "Cao", trung_binh: "Trung bình", thap: "Thấp", khac: "Khác",
};

export const Route = (createFileRoute("/_app/") as any)({
  loader: async ({ context }: any) => {
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

  const brief = useDashboardBrief(scope.donViCode ? [scope.donViCode] : undefined);
  const audit = useUserAuditLog(5);
  
  const [activeTab] = useUserPref("dashboard:main-chart-tab", "reliability");

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

  const trendQ = useQuery({
    queryKey: ["dashboard_su_co_by_month_dashboard", scope.donViCode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_su_co_by_month", {
        p_months: 12,
        p_don_vi_ids: scope.donViCode ? [scope.donViCode] : null
      } as any);
      if (error) throw error;
      return (data ?? []) as SuCoByMonth[];
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
          { label: "Availability", value: formatKpiValue(reliability), change: "+2.4%", icon: ShieldCheck },
          { label: "MTTR", value: formatKpiValue(mttrKpi), change: "-12.5%", icon: Clock },
          { label: "MTBF", value: formatKpiValue(mtbfKpi), change: "+5.1%", icon: TrendingUp },
          { label: "PM On-Time", value: pmKpi.isLoading ? "..." : formatKpiValue(pmKpi.result), change: "+1.2%", icon: Wrench },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-none border border-border/50 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="text-sm font-bold text-foreground">Incident Trends</div>
              <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#1D52E0]" /> This year</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#1D52E0]/20" /> Last year</div>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1D52E0" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#1D52E0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F3F5" />
                  <XAxis 
                    dataKey="thangHT" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#adb5bd', fontWeight: 600}}
                    dy={10}
                  />
                  <YAxis 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#adb5bd', fontWeight: 600}}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Cao" 
                    stroke="#1D52E0" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTrend)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-none border border-border/50 rounded-3xl p-6">
              <div className="text-sm font-bold text-foreground mb-6">Device Health Distribution</div>
              <div className="h-[220px] flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Tốt (A)", value: healthStats.A, color: "#1D52E0" },
                        { name: "Khá (B)", value: healthStats.B, color: "#4dabf7" },
                        { name: "Trung bình (C)", value: healthStats.C, color: "#adb5bd" },
                        { name: "Yếu (D)", value: healthStats.D, color: "#212529" },
                      ]}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      stroke="none"
                    >
                      {[
                        { color: "#1D52E0" },
                        { color: "#4dabf7" },
                        { color: "#adb5bd" },
                        { color: "#212529" },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-1/2 pl-6 space-y-3">
                  {[
                    { label: "Tốt (A)", value: "52.1%", color: "bg-[#1D52E0]" },
                    { label: "Khá (B)", value: "22.8%", color: "bg-[#4dabf7]" },
                    { label: "Trung bình (C)", value: "13.9%", color: "bg-[#adb5bd]" },
                    { label: "Yếu (D)", value: "11.2%", color: "bg-[#212529]" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between text-[11px] font-bold">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className={cn("w-2 h-2 rounded-full", item.color)} />
                        {item.label}
                      </div>
                      <div className="text-foreground">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="shadow-none border border-border/50 rounded-3xl p-6">
              <div className="text-sm font-bold text-foreground mb-6">Operations Hub</div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-500" /> Sự cố khẩn cấp
                  </div>
                  <div className="text-xl font-bold">{brief.isLoading ? "..." : (brief.data?.su_co_khan ?? 0)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-orange-500" /> Việc bảo trì
                  </div>
                  <div className="text-xl font-bold">{brief.isLoading ? "..." : (brief.data?.pm_hom_nay ?? 0) + (brief.data?.pm_qua_han ?? 0)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-500" /> Data quality
                  </div>
                  <div className="text-xl font-bold">{completeness.avg_thiet_bi || 0}%</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="shadow-none border border-border/50 rounded-3xl p-6">
            <div className="text-sm font-bold text-foreground mb-6">Notifications</div>
            <div className="space-y-6">
              {audit.data?.slice(0, 4).map((item: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[12px] font-bold text-foreground leading-tight">
                      {item.mo_ta}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="shadow-none border border-border/50 rounded-3xl p-6">
            <div className="text-sm font-bold text-foreground mb-6">Attention Required</div>
            <div className="space-y-4">
              {lowHealthDevices.map(({ device, health }) => (
                <div key={device.ma_thiet_bi} className="flex items-center justify-between p-3 rounded-2xl hover:bg-secondary/50 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <Link 
                      to="/qr/thiet-bi/$id" 
                      params={{ id: device.ma_thiet_bi } as any}
                      className="text-xs font-bold text-foreground hover:text-primary transition-colors"
                    >
                      {device.ten}
                    </Link>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{device.ma_thiet_bi}</span>
                  </div>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2",
                    health.xepLoai === 'D' 
                      ? "bg-red-50 border-red-200 text-red-600" 
                      : "bg-orange-50 border-orange-200 text-orange-600"
                  )}>
                    {health.xepLoai}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageBody>
  );
}
