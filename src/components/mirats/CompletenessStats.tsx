import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, LayoutGrid, AlertTriangle, ClipboardList } from "lucide-react";

interface Props {
  stats: any;
}

export function CompletenessStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Hoàn thiện Tài sản"
        value={`${stats.avg_thiet_bi || 0}%`}
        desc="Trung bình toàn hệ thống"
        icon={TrendingUp}
        color="text-blue-500"
      />
      <StatCard
        title="Hoàn thiện Hệ thống"
        value={`${stats.avg_he_thong || 0}%`}
        desc="Trung bình theo module"
        icon={LayoutGrid}
        color="text-purple-500"
      />
      <StatCard
        title="Cần bổ sung"
        value={stats.low_pct_tb || 0}
        desc="Tài sản dưới 50% dữ liệu"
        icon={AlertTriangle}
        color="text-amber-500"
      />
      <StatCard
        title="Nhiệm vụ mở"
        value={stats.total_tasks || 0}
        desc="Tác vụ 'Góp gạch' đang đợi"
        icon={ClipboardList}
        color="text-green-500"
      />
    </div>
  );
}

function StatCard({ title, value, desc, icon: Icon, color }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`w-4 h-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
      </CardContent>
    </Card>
  );
}
