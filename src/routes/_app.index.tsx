import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { Icon } from "@/components/mirats/ui/Icon";
import { useSession } from "@/hooks/use-session";
import { useUnifiedDashboardStats } from "@/lib/mirats/use-dashboard-unified";
import { getCompletenessStats, getCompletenessOverview } from '@/lib/mirats/completeness.functions';
import { HeartBeatStrip } from "@/components/mirats/dashboard/HeartBeatStrip";
import { Button } from "@/components/ui/button";
import { DashboardGrid } from "@/components/mirats/dashboard/grid/DashboardGrid";
import { WidgetPicker } from "@/components/mirats/dashboard/grid/WidgetPicker";
import { useUserPref } from "@/hooks/use-user-pref";
import { 
  DashboardWidgetConfig, 
  DEFAULT_HOME_LAYOUT, 
  AVAILABLE_WIDGETS, 
  WidgetType 
} from "@/lib/mirats/dashboard/widget-registry";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


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
  const { scope } = useUnifiedDashboardStats();
  const [isEditing, setIsEditing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [layout, setLayout] = useUserPref<DashboardWidgetConfig[]>("dashboard:layout:home", DEFAULT_HOME_LAYOUT);

  const handleAddWidget = (type: WidgetType) => {
    const info = AVAILABLE_WIDGETS[type];
    const newWidget: DashboardWidgetConfig = {
      id: `w-${Date.now()}`,
      type,
      w: info.defaultWidth,
      title: info.title
    };
    setLayout(prev => [...prev, newWidget]);
    toast.success(`Đã thêm widget ${info.title}`);
  };

  const handleReset = async () => {
    setIsResetting(true);
    const t = toast.loading("Đang khôi phục bố cục mặc định...");
    try {
      setLayout(DEFAULT_HOME_LAYOUT);
      toast.success("Đã khôi phục bố cục mặc định", { id: t });
    } finally {
      setIsResetting(false);
    }
  };

  if (scope.loading) {
    return <div className="h-screen w-full flex items-center justify-center animate-pulse text-muted-foreground">Đang tải MIRATS...</div>;
  }

  return (
    <PageBody className="bg-background min-h-screen">
      <PageHeader
        title={`Chào mừng, ${typeof profile?.ho_ten === 'string' ? profile.ho_ten : profile?.email?.split('@')[0] ?? "Bui Le Son"}`.trim()}
        subtitle={`MIRATS — Hệ thống quản lý tài sản kỹ thuật.`}
        actions={
          <div className="flex items-center justify-end gap-2 md:gap-3 flex-nowrap">
            {isEditing && (
              <div className="flex items-center gap-2 flex-nowrap shrink-0">
                <WidgetPicker
                  currentLayout={layout}
                  onAdd={handleAddWidget}
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 hover:bg-primary/5 hover:border-primary/40 shadow-none border-primary/20 bg-background shrink-0 px-3 min-w-[120px]"
                      aria-label="Thêm Widget mới"
                    >
                      <Icon name="action.add" size="tiny" className="text-primary shrink-0" />
                      <span className="text-[11px] font-bold uppercase tracking-wide text-primary whitespace-nowrap">Thêm Widget</span>
                    </Button>
                  }
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReset}
                  loading={isResetting}
                  className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0 px-3 min-w-[100px]"
                  aria-label="Khôi phục bố cục mặc định"
                >
                  <Icon name="action.undo" size="tiny" className="shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wide whitespace-nowrap">Khôi phục</span>
                </Button>
              </div>
            )}
            <Button
              size="sm"
              variant={isEditing ? "default" : "outline"}
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                "px-4 transition-all gap-2 shadow-sm border-primary/20 shrink-0 min-w-[120px]",
                isEditing ? "bg-primary text-primary-foreground" : "bg-background text-primary"
              )}
              aria-label={isEditing ? "Hoàn tất chỉnh sửa" : "Cá nhân hóa bảng điều khiển"}
            >
              <Icon
                name={isEditing ? "status.success" : "action.settings"}
                size="tiny"
                className="shrink-0"
              />
              <span className="text-[11px] font-bold uppercase tracking-wide whitespace-nowrap">
                {isEditing ? "Hoàn tất" : "Cá nhân hóa"}
              </span>
            </Button>
          </div>
        }
      />

      <div className="mb-8 p-1 astryx-surface overflow-hidden">
        <HeartBeatStrip />
      </div>

      <div className="mt-6">
        <DashboardGrid page="home" isEditing={isEditing} />
      </div>
    </PageBody>

  );
}

