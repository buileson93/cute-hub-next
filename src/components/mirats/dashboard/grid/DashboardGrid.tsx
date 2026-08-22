import React, { useState } from "react";
import {
  DashboardWidgetConfig,
  WidgetType,
  AVAILABLE_WIDGETS,
  DEFAULT_HOME_LAYOUT,
  DEFAULT_OVERVIEW_LAYOUT,
} from "@/lib/mirats/dashboard/widget-registry";
import { useUserPref } from "@/hooks/use-user-pref";
import { WidgetContainer } from "./WidgetContainer";
import { VisualKpiChart } from "@/components/mirats/dashboard/VisualKpiChart";
import { KpiCard } from "@/components/mirats/dashboard/KpiCard";
import { StatusDonutChart } from "@/components/mirats/dashboard/StatusDonutChart";
import { HeartBeatStrip } from "@/components/mirats/dashboard/HeartBeatStrip";
import { LiveTimeline } from "@/components/mirats/dashboard/LiveTimeline";
import { CompletenessRing } from "@/components/mirats/CompletenessRing";
import { useUnifiedDashboardStats } from "@/lib/mirats/use-dashboard-unified";
import { useDashboardBrief } from "@/lib/mirats/dashboard.functions";
import { getCompletenessStats, getCompletenessOverview } from "@/lib/mirats/completeness.functions";
import { useQuery } from "@tanstack/react-query";
import { formatKpiValue } from "@/lib/mirats/reliability";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/mirats/ui/Icon";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { supabase } from "@/integrations/backend/client";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { vi } from "date-fns/locale";

const MUC_DO_LABEL: Record<string, string> = {
  nghiem_trong: "Nghiêm trọng",
  cao: "Cao",
  trung_binh: "Trung bình",
  thap: "Thấp",
  khac: "Khác",
};
const MUC_DO_COLORS: Record<string, string> = {
  nghiem_trong: "hsl(0 84% 60%)",
  cao: "hsl(24 94% 52%)",
  trung_binh: "hsl(38 92% 50%)",
  thap: "hsl(215 16% 55%)",
  khac: "hsl(215 16% 70%)",
};
const STATUS_COLORS = [
  "hsl(217 91% 50%)",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
  "hsl(0 84% 60%)",
  "hsl(280 60% 55%)",
  "hsl(215 16% 55%)",
];

interface DashboardGridProps {
  page: "home" | "overview";
  isEditing?: boolean;
}

export function DashboardGrid({ page, isEditing }: DashboardGridProps) {
  const navigate = useNavigate();
  const prefKey = `dashboard:layout:${page}`;
  const defaultLayout = page === "home" ? DEFAULT_HOME_LAYOUT : DEFAULT_OVERVIEW_LAYOUT;
  const [layout, setLayout] = useUserPref<DashboardWidgetConfig[]>(prefKey, defaultLayout);

  const {
    reliabilityAvail: reliability,
    mttrKpi,
    mtbfKpi,
    healthStats,
    assetTypeStats,
    pmKpi,
    scope,
  } = useUnifiedDashboardStats();

  const brief = useDashboardBrief(scope.donViCode ? [scope.donViCode] : undefined);

  const statsQuery = useQuery({
    queryKey: ["completeness-stats"],
    queryFn: () => getCompletenessStats(),
  });
  const completeness = (statsQuery.data as any) || {};

  const overviewQuery = useQuery({
    queryKey: ["completeness-overview", 3],
    queryFn: () => getCompletenessOverview({ data: { limit: 3 } }),
  });
  const lowCompleteness = (overviewQuery.data as any)?.lowCompleteness || [];

  const trendQ = useQuery({
    queryKey: ["dashboard_su_co_by_month", scope.donViCode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_su_co_by_month", {
        p_months: 12,
        p_don_vi_ids: scope.donViCode ? [scope.donViCode] : null,
      } as any);
      if (error) throw error;
      return data ?? [];
    },
  });

  const statusQ = useQuery({
    queryKey: ["dashboard_asset_status", scope.donViCode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_asset_status", {
        p_don_vi_ids: scope.donViCode ? [scope.donViCode] : null,
      } as any);
      if (error) throw error;
      return data ?? [];
    },
  });

  const heatmapQ = useQuery({
    queryKey: ["dashboard_su_co_heatmap", scope.donViCode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "dashboard_su_co_heatmap" as any,
        {
          p_don_vi_ids: scope.donViCode ? [scope.donViCode] : null,
        } as any,
      );
      if (error) throw error;
      return data ?? [];
    },
  });

  const topHtQ = useQuery({
    queryKey: ["dashboard_top_he_thong_su_co", scope.donViCode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "dashboard_top_he_thong_su_co" as any,
        {
          p_don_vi_ids: scope.donViCode ? [scope.donViCode] : null,
          p_limit: 5,
        } as any,
      );
      if (error) throw error;
      return data ?? [];
    },
  });

  const topTbQ = useQuery({
    queryKey: ["dashboard_top_thiet_bi_hong_lap", scope.donViCode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "dashboard_top_thiet_bi_hong_lap" as any,
        {
          p_don_vi_ids: scope.donViCode ? [scope.donViCode] : null,
          p_limit: 5,
        } as any,
      );
      if (error) throw error;
      return data ?? [];
    },
  });

  const expiryQ = useQuery({
    queryKey: ["dashboard_expiry_timeline", scope.donViCode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "dashboard_expiry_timeline" as any,
        {
          p_don_vi_ids: scope.donViCode ? [scope.donViCode] : null,
          p_days: 180,
        } as any,
      );
      if (error) throw error;
      return data ?? [];
    },
  });

  const trendData = React.useMemo(() => {
    const rows = (trendQ.data as any[]) ?? [];
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
        thangHT: new Date(String(r.thang)).toLocaleDateString("vi-VN", { month: "short" }),
        value: Object.values(r)
          .filter((v) => typeof v === "number")
          .reduce((a, b) => a + (b as number), 0),
      }));
  }, [trendQ.data]);

  const mucDoKeys = React.useMemo(() => {
    const s = new Set<string>();
    ((trendQ.data as any[]) ?? []).forEach((r) => s.add(MUC_DO_LABEL[r.muc_do] ?? r.muc_do));
    return Array.from(s);
  }, [trendQ.data]);

  const renderWidget = (widget: DashboardWidgetConfig) => {
    switch (widget.type) {
      case "reliability-kpi":
        return (
          <VisualKpiChart
            title="Độ sẵn sàng vận hành"
            value={reliability.insufficient ? "—" : `${formatKpiValue(reliability)}`}
            icon="entity.security"
            data={trendData.map((d) => ({ ...d, value: d.value }))}
            type="area"
            color={["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"]}
            status={
              reliability.insufficient
                ? "normal"
                : Number(reliability.value) >= 95
                  ? "normal"
                  : "warning"
            }
            tooltip="Tỉ lệ thời gian tài sản sẵn sàng vận hành trong 30 ngày qua. Target: 99%"
            onClick={() => navigate({ to: "/su-co" })}
          />
        );
      case "mttr-kpi":
        return (
          <VisualKpiChart
            title="Thời gian khắc phục (MTTR)"
            value={mttrKpi.insufficient ? "—" : `${formatKpiValue(mttrKpi)}`}
            icon="status.power"
            data={trendData.map((d) => ({ ...d, value: d.value }))}
            type="bar"
            color={["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"]}
            status={
              mttrKpi.insufficient ? "normal" : (mttrKpi.value || 0) > 240 ? "attention" : "normal"
            }
            tooltip="Thời gian trung bình để khắc phục một sự cố (Mean Time To Repair)."
            onClick={() => navigate({ to: "/su-co" })}
          />
        );
      case "mtbf-kpi":
        return (
          <VisualKpiChart
            title="Khoảng cách sự cố (MTBF)"
            value={mtbfKpi.insufficient ? "—" : `${formatKpiValue(mtbfKpi)}`}
            icon="entity.securityAlert"
            data={trendData.map((d) => ({ ...d, value: d.value }))}
            type="line"
            color="#f59e0b"
            status={
              mtbfKpi.insufficient ? "normal" : (mtbfKpi.value || 0) < 15 ? "warning" : "normal"
            }
            tooltip="Khoảng cách trung bình giữa các lần phát hiện sự cố (Mean Time Between Failures)."
            onClick={() => navigate({ to: "/su-co" })}
          />
        );
      case "pm-kpi":
        return (
          <VisualKpiChart
            title="Hoàn thành bảo trì (PM)"
            value={
              pmKpi.isLoading
                ? "..."
                : pmKpi.result.insufficient
                  ? "—"
                  : `${formatKpiValue(pmKpi.result)}`
            }
            icon="status.success"
            data={trendData.map((d) => ({ ...d, value: d.value }))}
            type="bar"
            color={["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"]}
            status={
              pmKpi.result.insufficient
                ? "normal"
                : (pmKpi.result.value || 0) < 90
                  ? "attention"
                  : "normal"
            }
            tooltip="Tỉ lệ hoàn thành bảo trì ngăn ngừa (PM) đúng hạn."
            onClick={() => navigate({ to: "/bao-tri/pm" })}
          />
        );

      case "emergency-kpi":
        return (
          <KpiCard
            label="Sự cố khẩn"
            value={brief.isLoading ? "..." : (brief.data?.su_co_khan ?? 0)}
            unit="Vụ việc"
            icon="status.emergency"
            status={(brief.data?.su_co_khan ?? 0) > 0 ? "danger" : "normal"}
            tooltip="Các sự cố nghiêm trọng cần xử lý ngay lập tức."
            onClick={() => navigate({ to: "/su-co" })}
          />
        );
      case "pm-due-kpi":
        return (
          <KpiCard
            label="Đến hạn PM"
            value={brief.isLoading ? "..." : (brief.data?.pm_hom_nay ?? 0)}
            unit="Công việc"
            icon="status.maintenance"
            status="attention"
            tooltip="Số lượng bảo trì ngăn ngừa đến hạn trong hôm nay."
            onClick={() => navigate({ to: "/bao-tri/pm" })}
          />
        );
      case "pm-overdue-kpi":
        return (
          <KpiCard
            label="PM Quá hạn"
            value={brief.isLoading ? "..." : (brief.data?.pm_qua_han ?? 0)}
            unit="Công việc"
            icon="status.danger"
            status={(brief.data?.pm_qua_han ?? 0) > 0 ? "danger" : "normal"}
            tooltip="Các phiếu bảo trì đã quá thời hạn hoàn thành."
            onClick={() => navigate({ to: "/bao-tri/pm" })}
          />
        );
      case "su-co-trend":
        return (
          <Card className="astryx-card h-full flex flex-col">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="astryx-text-label flex items-center gap-2">
                <Icon name="entity.chart" size="tiny" className="text-primary" /> Xu hướng sự cố (12
                tháng)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <XAxis dataKey="thangHT" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      fontSize: "11px",
                      borderRadius: "10px",
                    }}
                  />
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
                      radius={[2, 2, 0, 0]}
                      barSize={20}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      case "health-donut":
        return (
          <StatusDonutChart
            title="Phân bố sức khỏe tài sản"
            icon="entity.activity"
            totalLabel="Tài sản"
            data={[
              { name: "A - Tốt", value: healthStats.A, color: "#10b981" },
              { name: "B - Khá", value: healthStats.B, color: "#3b82f6" },
              { name: "C - TB", value: healthStats.C, color: "#f59e0b" },
              { name: "D - Yếu", value: healthStats.D, color: "#ef4444" },
            ]}
          />
        );
      case "asset-type-bar":
        return (
          <Card className="astryx-card h-full flex flex-col">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="astryx-text-label flex items-center gap-2">
                <Icon name="entity.system" size="tiny" className="text-primary" /> Phân loại hệ
                thống
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 overflow-hidden">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={Object.entries(assetTypeStats)
                      .map(([name, value]) => ({ name, value }))
                      .sort((a, b) => (b.value as number) - (a.value as number))
                      .slice(0, 5)}
                    margin={{ left: 10, right: 20 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      fontSize={10}
                      width={120}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "currentColor" }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        borderColor: "hsl(var(--border))",
                        fontSize: "11px",
                        borderRadius: "10px",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                      barSize={12}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );
      case "completeness-gauge":
        return (
          <Card className="astryx-card h-full flex flex-col border-none shadow-sm bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="astryx-text-label flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="status.sparkle" size="tiny" className="text-primary" />
                  Chất lượng hồ sơ
                </div>
                <CompletenessRing
                  value={completeness.avg_thiet_bi || 0}
                  size={32}
                  strokeWidth={3}
                  showText
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-6">
              <div className="flex flex-col gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1">
                    <span>Tài sản cần cập nhật</span>
                    <span>% Xong</span>
                  </div>
                  {lowCompleteness.slice(0, 3).map((tb: any) => (
                    <Link
                      key={tb.id}
                      to="/qr/thiet-bi/$id"
                      params={{ id: tb.id } as any}
                      className="group flex justify-between items-center text-[12px] hover:bg-primary/5 p-2 rounded-xl border border-transparent hover:border-primary/10 transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                        <span className="truncate font-medium group-hover:text-primary transition-colors">
                          {tb.ten_thiet_bi}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-red-500 tabular-nums bg-red-50 px-1.5 py-0.5 rounded-md">
                        {tb.completeness_pct}%
                      </span>
                    </Link>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-[10px] font-bold uppercase text-primary hover:bg-primary/5 mt-2"
                  onClick={() => navigate({ to: "/thiet-bi", search: (prev: any) => prev } as any)}
                >
                  Xem tất cả
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case "live-timeline":
        return (
          <Card className="astryx-card h-full flex flex-col">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="astryx-text-label flex items-center gap-2">
                <Icon name="entity.history" size="tiny" className="text-primary" /> Nhật ký vận hành
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 overflow-hidden">
              <LiveTimeline />
            </CardContent>
          </Card>
        );
      case "asset-status-pie":
        return (
          <Card className="astryx-card h-full flex flex-col">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="astryx-text-label flex items-center gap-2">
                <Icon name="entity.activity" size="tiny" className="text-primary" /> Trạng thái tài
                sản
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={(statusQ.data as any[]) ?? []}
                    dataKey="so_luong"
                    nameKey="ten"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {((statusQ.data as any[]) ?? []).map((_, i) => (
                      <Cell
                        key={i}
                        fill={STATUS_COLORS[i % STATUS_COLORS.length]}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      fontSize: "11px",
                      borderRadius: "10px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    layout="horizontal"
                    wrapperStyle={{ fontSize: 10, paddingTop: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  const handleRemove = (id: string) => {
    setLayout((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full overflow-x-hidden">
      {layout.map((widget) => (
        <WidgetContainer
          key={widget.id}
          config={widget}
          isEditing={isEditing}
          onRemove={() => handleRemove(widget.id)}
        >
          {renderWidget(widget)}
        </WidgetContainer>
      ))}
    </div>
  );
}
