import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { Icon } from "@/components/mirats/ui/Icon";
import { KpiCard } from "@/components/mirats/dashboard/KpiCard";
import { useSession } from "@/hooks/use-session";
import { useDashboardBrief } from "@/lib/mirats/dashboard.functions";
import { useUnifiedDashboardStats } from "@/lib/mirats/use-dashboard-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompletenessStats, getCompletenessOverview } from '@/lib/mirats/completeness.functions';
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { supabase } from "@/integrations/backend/client";
import { HeartBeatStrip } from "@/components/mirats/dashboard/HeartBeatStrip";
import { LiveTimeline } from "@/components/mirats/dashboard/LiveTimeline";
import { formatKpiValue } from "@/lib/mirats/reliability";
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
  const {
    reliabilityAvail: reliability,
    mttrKpi,
    mtbfKpi,
    healthStats,
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
        value: Object.values(r).filter(v => typeof v === 'number').reduce((a, b) => a + (b as number), 0)
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <PageHeader
          title="Báo cáo Tổng quan KPI"
          icon="entity.chart"
        />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExport}
          className="shrink-0 flex items-center gap-2 h-9 px-4 rounded-xl border-primary/20 hover:bg-primary/5 transition-all"
        >
          <Icon name="action.download" className="text-primary" />
          <span className="font-bold text-[11px] uppercase tracking-wider">Xuất PDF</span>
        </Button>
      </div>

      <div className="mt-2 -mx-6">
        <HeartBeatStrip />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        <div className="lg:col-span-3 space-y-6">
          {/* TẦNG 1: CHỈ SỐ THEN CHỐT */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard
              label="Sẵn sàng"
              value={formatKpiValue(reliability).replace('%', '')}
              unit="%"
              icon="entity.security"
              tooltip="Tỉ lệ thời gian tài sản sẵn sàng vận hành trong 30 ngày qua. Target: 99%"
              sparklineData={trendData}
            />

            <KpiCard
              label="MTTR"
              value={formatKpiValue(mttrKpi).replace(' phút', '')}
              unit="phút"
              icon="status.power"
              status="attention"
              tooltip="Thời gian trung bình để khắc phục một sự cố (Mean Time To Repair). Target: 24h"
            />

            <KpiCard
              label="MTBF"
              value={formatKpiValue(mtbfKpi).replace(' ngày', '')}
              unit="ngày"
              icon="entity.securityAlert"
              status="warning"
              tooltip="Khoảng cách trung bình giữa các lần phát hiện sự cố (Mean Time Between Failures)."
            />

            <KpiCard
              label="Bảo trì"
              value={pmKpi.isLoading ? "..." : formatKpiValue(pmKpi.result).replace('%', '')}
              unit="%"
              icon="status.success"
              isLoading={pmKpi.isLoading}
              tooltip="Tỉ lệ hoàn thành bảo trì ngăn ngừa (PM) đúng hạn."
            />
          </div>

          {/* TẦNG 2: BIỂU ĐỒ XU HƯỚNG & TRẠNG THÁI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 shadow-sm">
              <CardHeader className="py-3 border-b bg-muted/5">
                <CardTitle className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                  <Icon name="entity.chart" size="tiny" className="text-primary" /> Phân tích xu hướng sự cố
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] pt-6">
                {trendQ.isLoading ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">Đang tải...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <XAxis dataKey="thangHT" fontSize={11} axisLine={false} tickLine={false} />
                      <YAxis fontSize={11} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      {mucDoKeys.map((k) => (
                        <Bar
                          key={k}
                          dataKey={k}
                          stackId="s"
                          fill={MUC_DO_COLORS[Object.keys(MUC_DO_LABEL).find((c) => MUC_DO_LABEL[c] === k) ?? "khac"]}
                          radius={[2, 2, 0, 0]}
                          barSize={20}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-1 shadow-sm">
              <CardHeader className="py-3 border-b bg-muted/5">
                <CardTitle className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                  <Icon name="entity.activity" size="tiny" className="text-primary" /> Trạng thái tài sản
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] pt-6">
                {statusQ.isLoading ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">Đang tải...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusQ.data ?? []}
                        dataKey="so_luong"
                        nameKey="ten"
                        innerRadius={60}
                        outerRadius={85}
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
              <CardHeader className="py-3 border-b bg-muted/5">
                <CardTitle className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                  <Icon name="entity.activity" size="tiny" className="text-primary" /> Phân bố sức khoẻ (A/B/C/D)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {[
                  { label: "A - Tốt", count: healthStats.A, color: "#10b981", desc: "Vận hành ổn định" },
                  { label: "B - Khá", count: healthStats.B, color: "#3b82f6", desc: "Có lỗi nhẹ/hao mòn" },
                  { label: "C - TB", count: healthStats.C, color: "#f59e0b", desc: "Cần bảo trì sớm" },
                  { label: "D - Yếu", count: healthStats.D, color: "#ef4444", desc: "Nguy cơ dừng máy" },
                ].map((s) => (
                  <div key={s.label} className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-bold uppercase text-muted-foreground">{s.label}</span>
                      <span className="text-[13px] font-black tabular-nums">{s.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-1000" 
                        style={{ 
                          width: `${scope.thietBi.length ? (s.count / scope.thietBi.length) * 100 : 0}%`,
                          backgroundColor: s.color 
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="py-3 border-b bg-muted/5">
                <CardTitle className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                  <Icon name="status.sparkle" size="tiny" className="text-primary" /> Chất lượng hồ sơ hoàn thiện
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                 <div className="flex items-center justify-center mb-6">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-muted/30" />
                        <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="10" fill="transparent" 
                          strokeDasharray={314} 
                          strokeDashoffset={314 * (1 - (completeness.avg_thiet_bi || 0) / 100)} 
                          className="text-primary transition-all duration-1000 ease-in-out" 
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-black text-primary">{completeness.avg_thiet_bi || 0}%</span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Toàn hệ</span>
                      </div>
                    </div>
                 </div>
                 <div className="space-y-2">
                    {lowCompleteness.slice(0, 4).map((tb: any) => (
                      <Link key={tb.id} to="/qr/thiet-bi/$id" params={{ id: tb.id } as any} className="flex justify-between items-center text-[11px] p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <span className="truncate flex-1 pr-2 font-medium">{tb.ten_thiet_bi}</span>
                        <span className="font-black text-red-500 tabular-nums">{tb.completeness_pct}%</span>
                      </Link>
                    ))}
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CỘT PHẢI: NHẬT KÝ */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm h-full flex flex-col">
            <CardHeader className="py-3 border-b bg-muted/5">
              <CardTitle className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                <Icon name="entity.history" size="tiny" className="text-primary" /> Nhật ký vận hành
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <LiveTimeline />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageBody>
  );
}
