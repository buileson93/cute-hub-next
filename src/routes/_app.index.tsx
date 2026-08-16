import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MiratsPageHeader as PageHeader, MiratsPageBody as PageBody } from "@/components/astryx/MiratsPageLayout";
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

  const handleReset = () => {
    setLayout(DEFAULT_HOME_LAYOUT);
    toast.success("Đã khôi phục bố cục mặc định");
  };

  if (scope.loading) {
    return <div className="h-screen w-full flex items-center justify-center animate-pulse text-muted-foreground">Đang tải MIRATS 2.0...</div>;
  }

  return (
    <PageBody>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <PageHeader
          title={`Chào mừng, ${typeof profile?.ho_ten === 'string' ? profile.ho_ten : profile?.email?.split('@')[0] ?? ""}`.trim()}
          icon="entity.dashboard"
        />
        <div className="flex items-center gap-2">
          {isEditing && (
             <>
               <WidgetPicker 
                 currentLayout={layout}
                 onAdd={handleAddWidget}
                 trigger={
                   <Button size="default" variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 transition-all">
                     <Icon name="action.add" size="tiny" className="text-primary" />
                     <span className="text-[10px] font-bold uppercase tracking-wider">Thêm Widget</span>
                   </Button>
                 }
               />
               <Button 
                 size="default" 

                variant="ghost" 
                onClick={handleReset}
                className="gap-2 text-muted-foreground hover:text-destructive transition-all"
              >
                <Icon name="action.undo" size="tiny" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Khôi phục</span>
              </Button>
             </>
          )}
          <Button 
            size="sm" 
            variant={isEditing ? "default" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "h-8 px-4 transition-all gap-2",
              !isEditing && "border-primary/20 hover:bg-primary/5"
            )}
          >
            <Icon name={isEditing ? "status.success" : "action.settings"} size="tiny" className={cn(!isEditing && "text-primary")} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {isEditing ? "Hoàn tất" : "Cá nhân hóa"}
            </span>
          </Button>
        </div>
      </div>

      <div className="mt-2 -mx-2 md:-mx-3 data-[density=comfortable]:-mx-4 md:data-[density=comfortable]:-mx-6 data-[density=spacious]:-mx-6 md:data-[density=spacious]:-mx-8">
        <HeartBeatStrip />
      </div>

      <div className="mt-6">
        <DashboardGrid page="home" isEditing={isEditing} />
      </div>
    </PageBody>
  );
}

