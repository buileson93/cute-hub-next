import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { Icon } from "@/components/mirats/ui/Icon";
import { KpiCard } from "@/components/mirats/dashboard/KpiCard";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { 
  useDashboardBrief, useUserAuditLog 
} from "@/lib/mirats/dashboard.functions";
import { useUnifiedDashboardStats } from "@/lib/mirats/use-dashboard-unified";
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
  const {
    reliabilityAvail: reliability,
    mttrKpi,
    mtbfKpi,
    healthStats,
    lowHealthDevices,
    pmKpi,
    scope
  } = useUnifiedDashboardStats();
  
  const statsQuery = useQuery({
    queryKey: ['completeness-stats'],
    queryFn: () => getCompletenessStats(),
  });
  const overviewQuery = useQuery({
    queryKey: ['completeness-overview', 3],
    queryFn: () => getCompletenessOverview({ data: { limit: 3 } }),
  });

  const completeness = (statsQuery.data as any) || {};
  const lowCompleteness = (overviewQuery.data as any)?.lowCompleteness || [];
  const tasks = (overviewQuery.data as any)?.tasks || [];

  const brief = useDashboardBrief(scope.donViCode ? [scope.donViCode] : undefined);
  const audit = useUserAuditLog(5);
  
  const [activeTab, setActiveTab] = useUserPref("dashboard:main-chart-tab", "reliability");

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
            icon="entity.dashboard"
            description="Chào mừng bạn quay lại MIRATS. Dưới đây là tóm tắt các hoạt động quan trọng trong ngày."
          />
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExport}
          className="shrink-0 flex items-center gap-2 h-9 px-4 rounded-xl border-primary/20 hover:bg-primary/5 transition-all"
        >
          <Icon name="action.download" className="text-primary" />
          <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider">Xuất báo cáo</span>
        </Button>
      </div>

      {/* THÀNH PHẦN 1: DẢI NHỊP TIM */}
      <div className="mt-2 -mx-6">
        <HeartBeatStrip />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        <div className="lg:col-span-3 space-y-6">
          {/* TẦNG 1: CHỈ SỐ THEN CHỐT */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard
              title="Sẵn sàng"
              value={formatKpiValue(reliability).replace('%', '')}
              unit="%"
              icon="entity.security"
              target="Target: 99%"
              description="Tỉ lệ thời gian tài sản sẵn sàng vận hành trong 30 ngày qua."
              sparklineData={trendData.map(d => ({ value: Object.values(d).filter(v => typeof v === 'number').reduce((a, b) => a + (b as number), 0) }))}
            />

            <KpiCard
              title="MTTR"
              value={formatKpiValue(mttrKpi).replace(' phút', '')}
              unit="phút"
              icon="status.power"
              status="info"
              description="Thời gian trung bình để khắc phục một sự cố (Mean Time To Repair)."
            />

            <KpiCard
              title="MTBF"
              value={formatKpiValue(mtbfKpi).replace(' ngày', '')}
              unit="ngày"
              icon="entity.securityAlert"
              status="warning"
              description="Khoảng cách trung bình giữa các lần phát hiện sự cố (Mean Time Between Failures)."
            />

            <KpiCard
              title="Bảo trì"
              value={pmKpi.isLoading ? "..." : formatKpiValue(pmKpi.result).replace('%', '')}
              unit="%"
              icon="status.success"
              isLoading={pmKpi.isLoading}
              description="Tỉ lệ hoàn thành bảo trì ngăn ngừa (PM) đúng hạn."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1 border border-border shadow-sm transition-all hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[2px] h-full bg-red-600 dark:bg-red-400" />
              <CardHeader className="py-3 border-b bg-muted/5">
                <CardTitle className="text-[13px] font-bold uppercase tracking-wide flex items-center gap-2 text-red-600 dark:text-red-400">
                  <Icon name="status.emergency" size="tiny" /> Sự cố khẩn
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-baseline gap-2 mb-4">
                  <div className="text-2xl font-black text-red-600 dark:text-red-400 tabular-nums">
                    {brief.isLoading ? "..." : (brief.data?.su_co_khan ?? 0)}
                  </div>
                  <div className="text-[11px] text-muted-foreground uppercase font-bold">Vụ việc</div>
                </div>
                <div className="min-h-[80px]">
                  {brief.isLoading ? (
                    <div className="space-y-2"><div className="h-4 w-full bg-muted animate-pulse rounded" /><div className="h-4 w-2/3 bg-muted animate-pulse rounded" /></div>
                  ) : (brief.data?.su_co_khan ?? 0) === 0 ? (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[12px] font-medium py-2">
                      <Icon name="status.success" size="tiny" /> Hệ thống ổn định
                    </div>
                  ) : (
                    <div className="text-[12px] text-red-600/80 dark:text-red-400/80 italic">Cần xử lý các sự cố nghiêm trọng ngay.</div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-[11px] font-bold">
                  <Link to="/su-co" className="text-primary hover:underline uppercase tracking-tighter">Chi tiết →</Link>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-1 border border-border shadow-sm transition-all hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[2px] h-full bg-amber-600 dark:bg-amber-400" />
              <CardHeader className="py-3 border-b bg-muted/5">
                <CardTitle className="text-[13px] font-bold uppercase tracking-wide flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Icon name="status.maintenance" size="tiny" /> Lịch bảo trì
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-baseline gap-2 mb-4">
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                    {brief.isLoading ? "..." : (brief.data?.pm_hom_nay ?? 0) + (brief.data?.pm_qua_han ?? 0)}
                  </div>
                  <div className="text-[11px] text-muted-foreground uppercase font-bold">Công việc</div>
                </div>
                <div className="space-y-1 min-h-[80px]">
                  <Link to="/bao-tri/pm" className="flex justify-between items-center text-[12px] p-1 rounded hover:bg-amber-500/5 transition-colors">
                    <span>Đến hạn hôm nay</span>
                    <span className="font-bold tabular-nums">{brief.data?.pm_hom_nay ?? 0}</span>
                  </Link>
                  <Link to="/bao-tri/pm" className="flex justify-between items-center text-[12px] p-1 rounded hover:bg-amber-500/5 transition-colors">
                    <span>Quá hạn chưa xong</span>
                    <span className="font-bold text-red-600 dark:text-red-400 tabular-nums">{brief.data?.pm_qua_han ?? 0}</span>
                  </Link>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-[11px] font-bold">
                  <Link to="/bao-tri" className="text-primary hover:underline uppercase tracking-tighter">Xem tất cả →</Link>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-1 border border-border shadow-sm transition-all hover:shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[2px] h-full bg-blue-600 dark:bg-blue-400" />
              <CardHeader className="py-3 border-b bg-muted/5">
                <CardTitle className="text-[13px] font-bold uppercase tracking-wide flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Icon name="status.sparkle" size="tiny" /> Chất lượng hồ sơ
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-baseline gap-2 mb-4">
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">{completeness.avg_thiet_bi || 0}%</div>
                  <div className="text-[11px] text-muted-foreground uppercase font-bold">Hoàn thiện</div>
                </div>
                <div className="space-y-1 min-h-[80px]">
                  {lowCompleteness.slice(0, 2).map((tb: any) => (
                    <Link key={tb.id} to="/qr/thiet-bi/$id" params={{ id: tb.id } as any} className="flex justify-between items-center text-[11px] p-1 rounded hover:bg-blue-500/5 transition-colors">
                      <span className="truncate flex-1 pr-2">{tb.ten_thiet_bi}</span>
                      <span className="font-bold text-red-500 dark:text-red-400 tabular-nums">{tb.completeness_pct}%</span>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-[11px] font-bold">
                  <Link to="/chat-luong-du-lieu" className="text-primary hover:underline uppercase tracking-tighter">Báo cáo sạch →</Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TẦNG 4: KHỐI PHÂN BỔ SỨC KHOẺ & BIỂU ĐỒ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 shadow-sm">
              <CardHeader className="pb-2 border-b bg-muted/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Icon name="entity.activity" className="text-primary" /> Phân bố sức khoẻ (A/B/C/D)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {[
                    { label: "Sức khoẻ A - Tốt", count: healthStats.A, color: "#10b981", desc: "Vận hành ổn định" },
                    { label: "Sức khoẻ B - Khá", count: healthStats.B, color: "#3b82f6", desc: "Có lỗi nhẹ/hao mòn" },
                    { label: "Sức khoẻ C - TB", count: healthStats.C, color: "#f59e0b", desc: "Cần bảo trì sớm" },
                    { label: "Sức khoẻ D - Yếu", count: healthStats.D, color: "#ef4444", desc: "Nguy cơ dừng máy" },
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
                  <Icon name="entity.chart" className="text-primary" /> Phân tích xu hướng & Trạng thái
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

          {/* TẦNG 4.5: BẢNG CHI TIẾT SỨC KHOẺ THẤP (KHÔI PHỤC) */}
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="pb-2 border-b bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                <Icon name="entity.securityAlert" className="text-red-600 dark:text-red-400" /> Danh sách thiết bị cần chú ý
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-[10px] uppercase font-bold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Thiết bị</th>
                      <th className="px-4 py-3 text-center">Sức khoẻ</th>
                      <th className="px-4 py-3 text-left">Vấn đề chính</th>
                      <th className="px-4 py-3 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {lowHealthDevices.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground italic">
                          Tất cả tài sản hiện đang ở trạng thái tốt.
                        </td>
                      </tr>
                    ) : (
                      lowHealthDevices.map(({ device, health }) => (
                        <tr key={device.ma_thiet_bi} className="hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold">{device.ten}</div>
                            <div className="text-[10px] text-muted-foreground">{device.ma_thiet_bi}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn(
                              "inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-white text-xs",
                              health.xepLoai === 'D' ? "bg-red-500" : "bg-orange-500 shadow-sm"
                            )}>
                              {health.xepLoai}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs">{health.khuyenNghi}</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link 
                              to="/qr/thiet-bi/$id" 
                              params={{ id: device.ma_thiet_bi } as any}
                              className="text-xs font-bold text-primary hover:underline"
                            >
                              Chi tiết →
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* TẦNG 5: KHU VỰC CỦA TÔI */}
          <div className="pb-12">
            <Card className="shadow-sm">
              <CardHeader className="pb-2 border-b bg-muted/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Icon name="entity.user" className="text-primary" /> Khu vực của tôi
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex flex-col items-center justify-center text-center">
                    <Icon name="status.trophy" size="medium" className="text-primary mb-2" />
                    <div className="text-2xl font-black text-primary">120</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Điểm đóng góp</div>
                  </div>
                   <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex flex-col items-center justify-center text-center">
                    <Icon name="status.error" size="medium" className="text-amber-600 dark:text-amber-400 mb-2" />
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{tasks.length}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Nhiệm vụ chờ</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">Nhiệm vụ nhập liệu gần đây</div>
                  {tasks.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic text-center py-4 bg-muted/20 rounded-lg">Không có nhiệm vụ nào đang chờ.</div>
                  ) : tasks.slice(0, 3).map((t: any) => (
                    <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-amber-500/5 transition-colors border border-transparent hover:border-amber-500/20 group">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold shrink-0">
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
              <Icon name="entity.history" className="text-primary" /> Nhật ký vận hành
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
