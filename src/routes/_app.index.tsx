import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { Icon } from "@/components/mirats/ui/Icon";
import { KpiCard } from "@/components/mirats/dashboard/KpiCard";
import { useSession } from "@/hooks/use-session";
import { 
  useDashboardBrief, useUserAuditLog 
} from "@/lib/mirats/dashboard.functions";
import { useUnifiedDashboardStats } from "@/lib/mirats/use-dashboard-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompletenessStats, getCompletenessOverview } from '@/lib/mirats/completeness.functions';
import { useQuery } from "@tanstack/react-query";
import { useUserPref } from "@/hooks/use-user-pref";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { supabase } from "@/integrations/backend/client";
import { HeartBeatStrip } from "@/components/mirats/dashboard/HeartBeatStrip";
import { LiveTimeline } from "@/components/mirats/dashboard/LiveTimeline";
import { formatKpiValue } from "@/lib/mirats/reliability";

// Types
interface SuCoByMonth { thang: string; muc_do: string; so_luong: number }

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
  const navigate = useNavigate();
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
    queryKey: ['completeness-overview', 3],
    queryFn: () => getCompletenessOverview({ data: { limit: 3 } }),
  });

  const completeness = (statsQuery.data as any) || {};
  const lowCompleteness = (overviewQuery.data as any)?.lowCompleteness || [];

  const brief = useDashboardBrief(scope.donViCode ? [scope.donViCode] : undefined);
  
  const [activeTab] = useUserPref("dashboard:main-chart-tab", "reliability");

  const trendQ = useQuery({
    queryKey: ["dashboard_su_co_by_month_dashboard", scope.donViCode],
    enabled: activeTab === "trend" || true, // Force enable for sparklines
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
        value: Object.values(r).filter(v => typeof v === 'number').reduce((a, b) => a + (b as number), 0)
      }));
  }, [trendQ.data]);

  const mucDoKeys = useMemo(() => {
    const s = new Set<string>();
    (trendQ.data ?? []).forEach((r) => s.add(MUC_DO_LABEL[r.muc_do] ?? r.muc_do));
    return Array.from(s);
  }, [trendQ.data]);

  if (scope.loading) {
    return <div className="h-screen w-full flex items-center justify-center animate-pulse text-muted-foreground">Đang tải MIRATS 2.0...</div>;
  }

  return (
    <PageBody>
      <div className="mb-2">
        <PageHeader
          title={`Chào mừng, ${profile?.ho_ten ?? ""}`.trim()}
          icon="entity.dashboard"
        />
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
              tooltip="Thời gian trung bình để khắc phục một sự cố (Mean Time To Repair)."
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

          {/* TẦNG 2: BẢN TIN VÀ TÌNH TRẠNG KHẨN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              label="Sự cố khẩn"
              value={brief.isLoading ? "..." : (brief.data?.su_co_khan ?? 0)}
              unit="Vụ việc"
              icon="status.emergency"
              status={(brief.data?.su_co_khan ?? 0) > 0 ? "danger" : "normal"}
              tooltip="Các sự cố nghiêm trọng cần xử lý ngay lập tức."
              onClick={() => navigate({ to: "/su-co" })}
            />
            
            <KpiCard
              label="Đến hạn PM"
              value={brief.isLoading ? "..." : (brief.data?.pm_hom_nay ?? 0)}
              unit="Công việc"
              icon="status.maintenance"
              status="attention"
              tooltip="Số lượng bảo trì ngăn ngừa đến hạn trong hôm nay."
              onClick={() => navigate({ to: "/bao-tri/pm" })}
            />

            <KpiCard
              label="PM Quá hạn"
              value={brief.isLoading ? "..." : (brief.data?.pm_qua_han ?? 0)}
              unit="Công việc"
              icon="status.danger"
              status={(brief.data?.pm_qua_han ?? 0) > 0 ? "danger" : "normal"}
              tooltip="Các phiếu bảo trì đã quá thời hạn hoàn thành."
              onClick={() => navigate({ to: "/bao-tri/pm" })}
            />
          </div>

          {/* TẦNG 2.5: BIỂU ĐỒ XU HƯỚNG */}
          <Card className="shadow-sm">
            <CardHeader className="py-3 border-b bg-muted/5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                <Icon name="entity.chart" size="tiny" className="text-primary" /> Xu hướng sự cố (12 tháng)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 h-[300px]">
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
            </CardContent>
          </Card>

          {/* TẦNG 3: SỨC KHOẺ VÀ CHẤT LƯỢNG */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="py-3 border-b bg-muted/5">
                <CardTitle className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                  <Icon name="entity.activity" size="tiny" className="text-primary" /> Phân bố sức khoẻ (A/B/C/D)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {[
                  { label: "A - Tốt", count: healthStats.A, color: "#10b981", status: "normal" },
                  { label: "B - Khá", count: healthStats.B, color: "#3b82f6", status: "attention" },
                  { label: "C - TB", count: healthStats.C, color: "#f59e0b", status: "warning" },
                  { label: "D - Yếu", count: healthStats.D, color: "#ef4444", status: "danger" },
                ].map((s) => (
                  <div key={s.label} className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-bold uppercase text-muted-foreground">{s.label}</span>
                      <span className="text-sm font-black tabular-nums">{s.count}</span>
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
                  <Icon name="status.sparkle" size="tiny" className="text-primary" /> Chất lượng hồ sơ
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-black text-primary tabular-nums">{completeness.avg_thiet_bi || 0}%</div>
                    <div className="text-[11px] font-bold text-muted-foreground uppercase">Trung bình</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {lowCompleteness.slice(0, 3).map((tb: any) => (
                      <Link key={tb.id} to="/qr/thiet-bi/$id" params={{ id: tb.id } as any} className="flex justify-between items-center text-[11px] hover:text-primary transition-colors">
                        <span className="truncate pr-2">{tb.ten_thiet_bi}</span>
                        <span className="font-bold text-red-500 tabular-nums">{tb.completeness_pct}%</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CỘT PHẢI: LIVE TIMELINE */}
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
