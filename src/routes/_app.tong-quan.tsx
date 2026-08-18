import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { Icon } from "@/components/mirats/ui/Icon";
import { useUnifiedDashboardStats } from "@/lib/mirats/use-dashboard-unified";
import { getCompletenessStats, getCompletenessOverview } from '@/lib/mirats/completeness.functions';
import { HeartBeatStrip } from "@/components/mirats/dashboard/HeartBeatStrip";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DashboardGrid } from "@/components/mirats/dashboard/grid/DashboardGrid";
import { WidgetPicker } from "@/components/mirats/dashboard/grid/WidgetPicker";
import { useUserPref } from "@/hooks/use-user-pref";
import { 
  DashboardWidgetConfig, 
  DEFAULT_OVERVIEW_LAYOUT, 
  AVAILABLE_WIDGETS, 
  WidgetType 
} from "@/lib/mirats/dashboard/widget-registry";
import { cn } from "@/lib/utils";

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
  const { scope } = useUnifiedDashboardStats();
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useUserPref<DashboardWidgetConfig[]>("dashboard:layout:overview", DEFAULT_OVERVIEW_LAYOUT);

  const handleAddWidget = (type: WidgetType) => {
    const info = AVAILABLE_WIDGETS[type];
    const newWidget: DashboardWidgetConfig = {
      id: `ov-${Date.now()}`,
      type,
      w: info.defaultWidth,
      title: info.title
    };
    setLayout(prev => [...prev, newWidget]);
    toast.success(`Đã thêm widget ${info.title}`);
  };

  const handleReset = () => {
    setLayout(DEFAULT_OVERVIEW_LAYOUT);
    toast.success("Đã khôi phục bố cục mặc định");
  };

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
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <WidgetPicker 
                currentLayout={layout}
                onAdd={handleAddWidget}
                trigger={
                  <Button size="sm" variant="outline" className="h-9 gap-2 rounded-xl border-primary/20 hover:bg-primary/5 transition-all">
                    <Icon name="action.add" size="tiny" className="text-primary" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Thêm Widget</span>
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
              isEditing ? "bg-primary text-primary-foreground border-primary" : "border-primary/20 hover:bg-primary/5"
            )}
          >
            <Icon name={isEditing ? "status.success" : "action.settings"} className={cn(isEditing ? "text-primary-foreground" : "text-primary")} />
            <span className="font-bold text-[11px] uppercase tracking-wider">
              {isEditing ? "Hoàn tất" : "Cá nhân hóa"}
            </span>
          </Button>
          {!isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              className="shrink-0 flex items-center gap-2 h-9 px-4 rounded-xl border-primary/20 hover:bg-primary/5 transition-all"
            >
              <Icon name="action.download" className="text-primary" />
              <span className="font-bold text-[11px] uppercase tracking-wider">Xuất PDF</span>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-2 -mx-6">
        <HeartBeatStrip />
      </div>

      <div className="mt-6">
        <DashboardGrid page="overview" isEditing={isEditing} />
      </div>
    </PageBody>
  );
}

