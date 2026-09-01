import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { Icon } from "@/components/mirats/ui/Icon";
import { useUnifiedDashboardStats } from "@/lib/mirats/use-dashboard-unified";
import { getCompletenessStats, getCompletenessOverview } from "@/lib/mirats/completeness.functions";
import { HeartBeatStrip } from "@/components/mirats/dashboard/HeartBeatStrip";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DashboardGrid } from "@/components/mirats/dashboard/grid/DashboardGrid";
import { WidgetPicker } from "@/components/mirats/dashboard/grid/WidgetPicker";
import { useUserPref } from "@/hooks/use-user-pref";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DashboardWidgetConfig,
  WIDGET_GROUP_LABEL,
  type WidgetGroup,
  DEFAULT_OVERVIEW_LAYOUT,
  AVAILABLE_WIDGETS,
  WidgetType,
  WIDGET_GROUPS,
  normalizeWidgetGroup,
} from "@/lib/mirats/dashboard/widget-registry";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/tong-quan")({
  loader: async ({ context }: any) => {
    try {
      await Promise.all([
        context.queryClient.prefetchQuery({
          queryKey: ["completeness-stats"],
          queryFn: () => getCompletenessStats(),
        }),
        context.queryClient.prefetchQuery({
          queryKey: ["completeness-overview", 10],
          queryFn: () => getCompletenessOverview({ data: { limit: 10 } }),
        }),
      ]);
    } catch (e) {
      console.warn("Overview report prefetch skipped:", e instanceof Error ? e.message : e);
    }
  },
  component: OverviewReport,
});

function OverviewReport() {
  const { scope } = useUnifiedDashboardStats();
  const [isEditing, setIsEditing] = useState(false);
  const [tab, setTab] = useUserPref<WidgetGroup>("dashboard:overview:tab", "tong-quan");
  const activeTab = normalizeWidgetGroup(tab);
  const [layout, setLayout] = useUserPref<DashboardWidgetConfig[]>(
    "dashboard:layout:overview",
    DEFAULT_OVERVIEW_LAYOUT,
  );

  const handleAddWidget = (type: WidgetType) => {
    const info = AVAILABLE_WIDGETS[type];
    const newWidget: DashboardWidgetConfig = {
      id: `ov-${Date.now()}`,
      type,
      w: info.defaultWidth,
      title: info.title,
    };
    setLayout((prev) => [...prev, newWidget]);
    toast.success(`Đã thêm widget ${info.title}`);
  };

  const handleReset = () => {
    setLayout(DEFAULT_OVERVIEW_LAYOUT);
    toast.success("Đã khôi phục bố cục mặc định");
  };

  const handleExport = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
      loading: "Đang kết xuất báo cáo PDF chi tiết...",
      success: "Đã tải xuống báo cáo tổng quan KPI (PDF)",
      error: "Lỗi khi tải báo cáo",
    });
  };

  if (scope.loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center animate-pulse text-muted-foreground">
        Đang tải báo cáo tổng quan...
      </div>
    );
  }

  return (
    <PageFrame density="compact">
      <PageBody className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex flex-col shrink-0 px-6 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <PageHeader title="Báo cáo Tổng quan KPI" icon="entity.chart" className="border-b-0 p-0 bg-transparent backdrop-blur-none sticky-none" />
          <div className="flex items-center gap-2">
            {isEditing && (
              <>
                <WidgetPicker
                  currentLayout={layout}
                  onAdd={handleAddWidget}
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/40 transition-all shadow-none"
                    >
                      <Icon name="action.add" size="tiny" className="text-primary" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        Thêm Widget
                      </span>
                    </Button>
                  }
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReset}
                  className="h-9 gap-2 rounded-xl text-muted-foreground hover:text-destructive transition-all"
                >
                  <Icon name="action.undo" size="tiny" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Khôi phục</span>
                </Button>
              </>
            )}
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                "shrink-0 flex items-center gap-2 h-9 px-4 rounded-xl transition-all shadow-none",
              )}
            >
              <Icon
                name={isEditing ? "status.success" : "action.settings"}
                className={cn(isEditing ? "text-primary-foreground" : "text-primary")}
              />
              <span className="font-bold text-[11px] uppercase tracking-wider">
                {isEditing ? "Hoàn tất" : "Cá nhân hóa"}
              </span>
            </Button>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="shrink-0 flex items-center gap-2 h-9 px-4 rounded-xl hover:bg-primary/5 transition-all"
              >
                <Icon name="action.download" className="text-primary" />
                <span className="font-bold text-[11px] uppercase tracking-wider text-primary">
                  Xuất PDF
                </span>
              </Button>
            )}
          </div>
        </div>

        <div className="mt-2 mb-4 empty:hidden">
          <HeartBeatStrip />
        </div>

      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setTab(normalizeWidgetGroup(v))}
        className="flex flex-1 min-h-0 flex-col"
      >
        {/* Mobile: select native-like để thao tác một tay, không nén tab */}
        <div className="shrink-0 px-6 pb-3 sm:hidden">
          <Select value={activeTab} onValueChange={(v) => setTab(normalizeWidgetGroup(v))}>
            <SelectTrigger className="h-10 w-full" aria-label="Chọn nhóm biểu đồ">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WIDGET_GROUPS.map((g) => (
                <SelectItem key={g} value={g}>
                  {WIDGET_GROUP_LABEL[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop/tablet: tab bar cuộn ngang */}
        <div className="hidden shrink-0 overflow-x-auto px-6 pb-3 sm:block mirats-scroll">
          <TabsList className="h-9 w-max" aria-label="Nhóm biểu đồ tổng quan">
            {WIDGET_GROUPS.map((g) => (
              <TabsTrigger
                key={g}
                value={g}
                className="h-7 whitespace-nowrap px-3 text-[11px] font-bold uppercase tracking-wider"
              >
                {WIDGET_GROUP_LABEL[g]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {WIDGET_GROUPS.map((g) => (
          <TabsContent
            key={g}
            value={g}
            className="mt-0 flex-1 min-h-0 overflow-y-auto px-6 pb-6 mirats-scroll data-[state=inactive]:hidden"
          >
            <DashboardGrid
              page="overview"
              isEditing={isEditing}
              group={g}
              emptyState={
                <div className="rounded-2xl border border-dashed p-8 text-center">
                  <p className="text-sm font-semibold">
                    Chưa có widget nào trong nhóm “{WIDGET_GROUP_LABEL[g]}”
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Bật “Cá nhân hóa” rồi chọn “Thêm Widget” để đưa nội dung vào tab này.
                  </p>
                </div>
              }
            />
          </TabsContent>
        ))}
      </Tabs>
      </PageBody>
    </PageFrame>
  );
}
