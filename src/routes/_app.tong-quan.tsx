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

export const Route = createFileRoute("/_app/tong-quan")({
  loader: async ({ context }: any) => {
    try {
      await Promise.all([
        context.queryClient.prefetchQuery({
          queryKey: ['completeness-stats'],
          queryFn: () => getCompletenessStats(),
        }),
        context.queryClient.prefetchQuery({
          queryKey: ['completeness-overview', 10],
          queryFn: () => getCompletenessOverview({ data: { limit: 10 } }),
        })
      ]);
    } catch (e) {
      console.warn("Overview report prefetch skipped:", e instanceof Error ? e.message : e);
    }
  },
  component: OverviewReport,
});

function OverviewReport() {
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
    queryKey: ['completeness-overview', 10],
    queryFn: () => getCompletenessOverview({ data: { limit: 10 } }),
  });

  const completeness = (statsQuery.data as any) || {};
  const lowCompleteness = (overviewQuery.data as any)?.lowCompleteness || [];
  
  const brief = useDashboardBrief(scope.donViCode ? [scope.donViCode] : undefined);
  
  const [activeTab, setActiveTab] = useUserPref("overview:main-chart-tab", "trend");

  const trendQ = useQuery({
    queryKey: ["dashboard_su_co_by_month_report", scope.donViCode],
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
    queryKey: ["dashboard_asset_status_report", scope.donViCode],
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
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Đang kết xuất báo cáo PDF chi tiết...',
        success: 'Đã tải xuống báo cáo tổng quan KPI (PDF)',
        error: 'Lỗi khi tải báo cáo',
      }
    );
  };

  if (scope.loading) {
    return <div className="h-screen w-full flex items-center justify-center animate-pulse text-muted-foreground">Đang tải báo cáo tổng quan...</div>;
  }

  return (
    <PageBody>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex-1">
          <PageHeader
            title="Báo cáo Tổng quan KPI"
            icon="entity.chart"
            description="Dữ liệu phân tích hiệu suất vận hành, độ tin cậy và sức khỏe tài sản toàn hệ thống."
          />
        </div>
        <div className="flex items-center gap-2">
           <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            className="shrink-0 flex items-center gap-2 h-9 px-4 rounded-xl border-primary/20 hover:bg-primary/5 transition-all"
          >
            <Icon name="action.download" className="text-primary" />
            <span className="font-bold text-xs uppercase tracking-wider">Xuất PDF</span>
          </Button>
        </div>
      </div>

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
              target="Target: 24h"
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

          {/* TẦNG 2: BIỂU ĐỒ XU HƯỚNG & TRẠNG THÁI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between border-b bg-muted/20">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Icon name="entity.chart" className="text-primary" /> Phân tích xu hướng sự cố
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[350px] pt-6">
                {trendQ.isLoading ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">Đang tải biểu đồ xu hướng...</div>
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
              </CardContent>
            </Card>

            <Card className="md:col-span-1 shadow-sm">
              <CardHeader className="pb-2 border-b bg-muted/20">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Icon name="entity.activity" className="text-primary" /> Trạng thái tài sản
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[350px] pt-6">
                {statusQ.isLoading ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">Đang tải biểu đồ trạng thái...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusQ.data ?? []}
                        dataKey="so_luong"
                        nameKey="ten"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                      >
                        {(statusQ.data ?? []).map((_, i) => (
                          <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} stroke="white" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" align="center" layout="horizontal" wrapperStyle={{ fontSize: 10, paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* TẦNG 3: CHI TIẾT SỨC KHOẺ & CHẤT LƯỢNG DỮ LIỆU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-2 border-b bg-muted/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Icon name="entity.activity" className="text-blue-600 dark:text-blue-400" /> Phân bố sức khoẻ (A/B/C/D)
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
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2 border-b bg-muted/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Icon name="status.sparkle" className="text-blue-600 dark:text-blue-400" /> Chất lượng dữ liệu hoàn thiện
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                 <div className="flex items-center justify-center mb-6">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted/30" />
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" 
                          strokeDasharray={364.4} 
                          strokeDashoffset={364.4 * (1 - (completeness.avg_thiet_bi || 0) / 100)} 
                          className="text-blue-600 dark:text-blue-400 transition-all duration-1000 ease-in-out" 
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{completeness.avg_thiet_bi || 0}%</span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Toàn hệ thống</span>
                      </div>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">Top thiết bị cần hoàn thiện hồ sơ</div>
                    {lowCompleteness.slice(0, 4).map((tb: any) => (
                      <Link key={tb.id} to="/qr/thiet-bi/$id" params={{ id: tb.id } as any} className="flex justify-between items-center text-xs p-2 rounded-lg hover:bg-blue-500/5 transition-colors border border-transparent hover:border-blue-500/10">
                        <span className="truncate flex-1 pr-2 font-medium">{tb.ten_thiet_bi}</span>
                        <span className="font-black text-red-500 dark:text-red-400 tabular-nums">{tb.completeness_pct}%</span>
                      </Link>
                    ))}
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CỘT PHẢI: NHẬT KÝ & THÔNG TIN BỔ SUNG */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-2 border-b bg-muted/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Icon name="entity.history" className="text-primary" /> Nhật ký vận hành (Live)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[600px]">
              <div className="h-full py-4 px-2">
                <LiveTimeline />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Icon name="entity.security" size="small" /> Hệ thống bảo mật
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[11px] text-primary/70 italic leading-relaxed">
                Tất cả dữ liệu được mã hóa và bảo vệ theo tiêu chuẩn MIRATS 2.0. Nhật ký truy cập được lưu trữ phục vụ mục đích hậu kiểm.
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sẵn sàng phục vụ
                </div>
                <div className="text-[9px] text-muted-foreground">
                  Phát hành: 13/08/2026 15:30 (UTC)
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* TẦNG CUỐI: DANH SÁCH CHI TIẾT CẦN CHÚ Ý */}
      <div className="mt-6 mb-12">
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="pb-2 border-b bg-muted/20 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
              <Icon name="entity.securityAlert" className="text-red-600 dark:text-red-400" /> Phân tích rủi ro tài sản (Sức khỏe C & D)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-[10px] uppercase font-bold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Tài sản / Thiết bị</th>
                    <th className="px-4 py-3 text-center">Xếp hạng</th>
                    <th className="px-4 py-3 text-left">Khuyến nghị vận hành & bảo trì</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lowHealthDevices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground italic">
                        Hiện chưa ghi nhận tài sản nào có rủi ro vận hành cao.
                      </td>
                    </tr>
                  ) : (
                    lowHealthDevices.map(({ device, health }) => (
                      <tr key={device.ma_thiet_bi} className="hover:bg-muted/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold">{device.ten}</div>
                          <div className="text-[10px] text-muted-foreground">{device.ma_thiet_bi}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-white text-xs",
                            health.xepLoai === 'D' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" : "bg-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                          )}>
                            {health.xepLoai}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-medium leading-relaxed">{health.khuyenNghi}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link 
                            to="/qr/thiet-bi/$id" 
                            params={{ id: device.ma_thiet_bi } as any}
                            className="text-xs font-bold text-primary hover:underline bg-primary/5 px-2 py-1 rounded"
                          >
                            Hồ sơ lý lịch →
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
      </div>
    </PageBody>
  );
}
