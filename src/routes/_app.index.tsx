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
    <PageBody>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex-1">
          <PageHeader
            title={`${greeting} ${profile?.ho_ten ?? ""}`.trim()}
            icon={LayoutDashboard}
            description="Chào mừng bạn quay lại MIRATS. Dưới đây là tóm tắt các hoạt động quan trọng trong ngày."
          />
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExport}
          className="shrink-0 flex items-center gap-2 h-9 px-4 rounded-xl border-primary/20 hover:bg-primary/5 transition-all"
        >
          <Download className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider">Xuất báo cáo</span>
        </Button>
      </div>

      {/* THÀNH PHẦN 1: DẢI NHỊP TIM */}
      <div className="mt-2 -mx-6">
        <HeartBeatStrip />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        <div className="lg:col-span-3 space-y-6">
          {/* TẦNG 1.5: KHỐI KPI ĐỘ TIN CẬY (KHÔI PHỤC) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-sm border-t-2 border-t-emerald-500 overflow-hidden group">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Target: 99%
                  </div>
                </div>
                <div className="text-2xl font-black tabular-nums tracking-tight">
                  {formatKpiValue(reliability)}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Availability
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-t-2 border-t-blue-500 overflow-hidden group">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Phản hồi
                  </div>
                </div>
                <div className="text-2xl font-black tabular-nums tracking-tight">
                  {formatKpiValue(mttrKpi)}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> MTTR (Bình quân)
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-t-2 border-t-orange-500 overflow-hidden group">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Chu kỳ
                  </div>
                </div>
                <div className="text-2xl font-black tabular-nums tracking-tight">
                  {formatKpiValue(mtbfKpi)}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> MTBF (Trung bình)
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-t-2 border-t-indigo-500 overflow-hidden group">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Bảo trì
                  </div>
                </div>
                <div className="text-2xl font-black tabular-nums tracking-tight">
                  {pmKpi.isLoading ? "..." : formatKpiValue(pmKpi.result)}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1 flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> PM đúng hạn
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1 border-l-4 border-l-red-500 shadow-sm transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-red-600">
                  <Flame className="w-4 h-4" /> Hôm nay có gì đang cháy?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-4">
                  <div className="text-4xl font-black text-red-600 tabular-nums">
                    {brief.isLoading ? "..." : (brief.data?.su_co_khan ?? 0)}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase font-bold">Sự cố khẩn</div>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {brief.isLoading ? (
                    <div className="space-y-2"><div className="h-4 w-full bg-muted animate-pulse rounded" /><div className="h-4 w-2/3 bg-muted animate-pulse rounded" /></div>
                  ) : (brief.data?.su_co_khan ?? 0) === 0 ? (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium py-2">
                      <CheckCircle2 className="w-4 h-4" /> Không có sự cố khẩn cấp
                    </div>
                  ) : (
                    <div className="text-sm text-red-600/80 italic">Cần xử lý ngay các sự cố mức độ cao và nghiêm trọng.</div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-red-100 flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold">
                  <span>Nhấn để xem sự cố</span>
                  <Link to="/su-co" className="text-primary hover:underline">Chi tiết →</Link>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-1 border-l-4 border-l-orange-500 shadow-sm transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-orange-600">
                  <Wrench className="w-4 h-4" /> Tuần này phải làm gì?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-4">
                  <div className="text-4xl font-black text-orange-600 tabular-nums">
                    {brief.isLoading ? "..." : (brief.data?.pm_hom_nay ?? 0) + (brief.data?.pm_qua_han ?? 0)}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase font-bold">Việc bảo trì</div>
                </div>
                <div className="space-y-1 min-h-[100px]">
                  <Link to="/bao-tri/pm" className="flex justify-between items-center text-sm p-1.5 rounded hover:bg-orange-50 transition-colors">
                    <span>PM đến hạn hôm nay</span>
                    <span className="font-bold tabular-nums">{brief.data?.pm_hom_nay ?? 0}</span>
                  </Link>
                  <Link to="/bao-tri/pm" className="flex justify-between items-center text-sm p-1.5 rounded hover:bg-orange-50 transition-colors">
                    <span>PM quá hạn chưa xong</span>
                    <span className="font-bold text-red-600 tabular-nums">{brief.data?.pm_qua_han ?? 0}</span>
                  </Link>
                </div>
                <div className="mt-4 pt-4 border-t border-orange-100 flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold">
                  <span>Lịch bảo trì</span>
                  <Link to="/bao-tri" className="text-primary hover:underline">Xem tất cả →</Link>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-1 border-l-4 border-l-blue-500 shadow-sm transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-blue-600">
                  <Sparkles className="w-4 h-4" /> Dữ liệu có sạch không?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-4">
                  <div className="text-4xl font-black text-blue-600 tabular-nums">{completeness.avg_thiet_bi || 0}%</div>
                  <div className="text-xs text-muted-foreground uppercase font-bold">Chất lượng dữ liệu</div>
                </div>
                <div className="space-y-1 min-h-[100px]">
                  <div className="text-[11px] text-muted-foreground uppercase font-bold mb-1">Thiết bị hoàn thiện thấp</div>
                  {lowCompleteness.map((tb: any) => (
                    <Link key={tb.id} to="/qr/thiet-bi/$id" params={{ id: tb.id } as any} className="flex justify-between items-center text-xs p-1.5 rounded hover:bg-blue-50 transition-colors">
                      <span className="truncate flex-1 pr-2">{tb.ten_thiet_bi}</span>
                      <span className="font-bold text-red-500 tabular-nums">{tb.completeness_pct}%</span>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-blue-100 flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold">
                  <span>Tiến độ tổng</span>
                  <Link to="/chat-luong-du-lieu" className="text-primary hover:underline">Chi tiết →</Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TẦNG 4: KHỐI PHÂN BỔ SỨC KHOẺ & BIỂU ĐỒ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 shadow-sm">
              <CardHeader className="pb-2 border-b bg-muted/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Phân bố sức khoẻ (A/B/C/D)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {[
                    { label: "Sức khoẻ A - Tốt", count: hStats.a, color: "#10b981", desc: "Vận hành ổn định" },
                    { label: "Sức khoẻ B - Khá", count: hStats.b, color: "#3b82f6", desc: "Có lỗi nhẹ/hao mòn" },
                    { label: "Sức khoẻ C - TB", count: hStats.c, color: "#f59e0b", desc: "Cần bảo trì sớm" },
                    { label: "Sức khoẻ D - Yếu", count: hStats.d, color: "#ef4444", desc: "Nguy cơ dừng máy" },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="text-xs font-bold uppercase tracking-tight">{s.label}</span>
                        </div>
                        <span className="text-sm font-black tabular-nums">{s.count}</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-1000" 
                          style={{ 
                            width: `${scope.thietBi.length ? (s.count / scope.thietBi.length) * 100 : 0}%`,
                            backgroundColor: s.color 
                          }} 
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground italic pl-4">{s.desc}</div>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t text-center">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Tổng số tài sản theo dõi</div>
                    <div className="text-lg font-black">{scope.thietBi.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between border-b bg-muted/20">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" /> Phân tích xu hướng & Trạng thái
                </CardTitle>
                <Tabs value={activeTab} onValueChange={setActiveTab as any} className="h-8">
                  <TabsList className="h-8 p-0.5 bg-muted/50 border">
                    <TabsTrigger value="trend" className="h-7 text-[11px] px-3">Xu hướng sự cố</TabsTrigger>
                    <TabsTrigger value="status" className="h-7 text-[11px] px-3">Trạng thái tài sản</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="h-[350px] pt-6">
                <Tabs value={activeTab}>
                  <TabsContent value="trend" className="m-0 h-full">
                    {trendQ.isLoading ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">Đang tải biểu đồ...</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                          <XAxis dataKey="thangHT" fontSize={11} axisLine={false} tickLine={false} />
                          <YAxis fontSize={11} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                          <Legend wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
                          {mucDoKeys.map((k) => (
                            <Bar
                              key={k}
                              dataKey={k}
                              stackId="s"
                              fill={MUC_DO_COLORS[Object.keys(MUC_DO_LABEL).find((c) => MUC_DO_LABEL[c] === k) ?? "khac"]}
                              radius={[2, 2, 0, 0]}
                              barSize={24}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </TabsContent>
                  <TabsContent value="status" className="m-0 h-full">
                    {statusQ.isLoading ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">Đang tải biểu đồ...</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={statusQ.data ?? []}
                            dataKey="so_luong"
                            nameKey="ten"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={4}
                          >
                            {(statusQ.data ?? []).map((_, i) => (
                              <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} stroke="white" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: 12, paddingLeft: '20px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* TẦNG 5: KHU VỰC CỦA TÔI */}
          <div className="pb-12">
            <Card className="shadow-sm">
              <CardHeader className="pb-2 border-b bg-muted/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Khu vực của tôi
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex flex-col items-center justify-center text-center">
                    <Trophy className="w-6 h-6 text-primary mb-2" />
                    <div className="text-2xl font-black text-primary">120</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Điểm đóng góp</div>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="w-6 h-6 text-orange-600 mb-2" />
                    <div className="text-2xl font-black text-orange-600">{tasks.length}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Nhiệm vụ chờ</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">Nhiệm vụ nhập liệu gần đây</div>
                  {tasks.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic text-center py-4 bg-muted/20 rounded-lg">Không có nhiệm vụ nào đang chờ.</div>
                  ) : tasks.slice(0, 3).map((t: any) => (
                    <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border group">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold shrink-0">
                        {t.diem_thuong || 5}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">{t.tieu_de}</div>
                        <div className="text-[10px] text-muted-foreground italic">Thưởng {t.diem_thuong || 5} gạch</div>
                      </div>
                      <Link to="/gop-gach" className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">Làm ngay →</Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
          <div className="h-[calc(100vh-250px)] min-h-[500px]">
            <LiveTimeline />
          </div>
        </div>
      </div>
    </PageBody>
  );
}
