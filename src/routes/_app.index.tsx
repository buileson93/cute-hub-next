import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { LayoutDashboard, Flame, Wrench, ShieldCheck, AlertTriangle, Sparkles, ArrowRight, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { useDashboardBrief, useDashboardKpis } from "@/lib/mirats/dashboard.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getCompletenessStats } from '@/lib/mirats/completeness.functions';
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_app/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ['completeness-stats'],
      queryFn: () => getCompletenessStats(),
    });
  },
  component: Dashboard,
});

function Dashboard() {
  const { profile } = useSession();
  const statsQuery = useSuspenseQuery({
    queryKey: ['completeness-stats'],
    queryFn: () => getCompletenessStats(),
  });
  const completeness = (statsQuery.data as any) || {};

  const brief = useDashboardBrief();
  const kpi = useDashboardKpis();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Chào buổi sáng!";
    if (h < 18) return "Chào buổi chiều!";
    return "Chào buổi tối!";
  }, []);

  return (
    <PageBody>
      <PageHeader
        title={`${greeting} ${profile?.ho_ten ?? ""}`.trim()}
        icon={LayoutDashboard}
        description="Chào mừng bạn quay lại MIRATS. Dưới đây là tóm tắt các hoạt động quan trọng trong ngày."
      />

      {/* TẦNG 2: BA KHỐI CÂU HỎI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* KHỐI A */}
        <Card className="md:col-span-1 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-600">
              <Flame className="w-4 h-4" /> Hôm nay có gì đang cháy?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-600 mb-4 tabular-nums">
              {(brief.data?.su_co_khan ?? 0) + (kpi.data?.su_co_mo ?? 0)}
            </div>
            <div className="space-y-1">
              <Link to="/su-co" className="flex justify-between text-sm hover:underline py-1">
                <span>Sự cố đang mở</span>
                <span className="font-bold">{kpi.data?.su_co_mo ?? 0}</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* KHỐI B */}
        <Card className="md:col-span-1 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
              <Wrench className="w-4 h-4" /> Tuần này phải làm gì?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-orange-600 mb-4 tabular-nums">
              {(brief.data?.pm_hom_nay ?? 0) + (brief.data?.pm_qua_han ?? 0)}
            </div>
            <div className="space-y-1">
               <Link to="/bao-tri/pm" className="flex justify-between text-sm hover:underline py-1">
                <span>PM đến hạn</span>
                <span className="font-bold">{brief.data?.pm_hom_nay ?? 0}</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* KHỐI C */}
        <Card className="md:col-span-1 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-green-600">
              <Sparkles className="w-4 h-4" /> Dữ liệu có sạch không?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-600 mb-4 tabular-nums">{completeness.avg_thiet_bi || 0}%</div>
            <Progress value={completeness.avg_thiet_bi || 0} className="h-2 mb-2" />
            <Link to="/chat-luong-du-lieu" className="text-xs text-muted-foreground hover:underline flex items-center">
              Xem chi tiết tiến độ <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </CardContent>
        </Card>
      </div>

    </PageBody>
  );
}
