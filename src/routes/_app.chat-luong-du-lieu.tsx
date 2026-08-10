import { createFileRoute } from '@tanstack/react-router';
import { PageBody } from '@/components/mirats/PageBody';
import { PageHeader } from '@/components/mirats/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getCompletenessStats, getCompletenessOverview } from '@/lib/mirats/completeness.functions';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Database, AlertTriangle, ClipboardList, TrendingUp, LayoutGrid } from 'lucide-react';

export const Route = createFileRoute('/_app/chat-luong-du-lieu')({
  component: ChatLuongDuLieu,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ['completeness-stats'],
      queryFn: () => getCompletenessStats(),
    });
    await context.queryClient.ensureQueryData({
      queryKey: ['completeness-overview'],
      queryFn: () => getCompletenessOverview({ data: { limit: 5 } }),
    });
  },
  head: () => ({
    title: 'Chất lượng dữ liệu | MIRATS 2.0',
    meta: [
      { name: 'description', content: 'Dashboard theo dõi độ hoàn thiện và chất lượng dữ liệu hệ thống' }
    ]
  })
});

function ChatLuongDuLieu() {
  const statsQuery = useSuspenseQuery({
    queryKey: ['completeness-stats'],
    queryFn: () => getCompletenessStats(),
  });

  const overviewQuery = useSuspenseQuery({
    queryKey: ['completeness-overview'],
    queryFn: () => getCompletenessOverview({ data: { limit: 5 } }),
  });

  const stats = (statsQuery.data as any) || {};
  const { lowCompleteness = [], tasks = [] } = (overviewQuery.data as any) || {};

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-6 py-4 border-b">
        <PageHeader 
          title="Chất lượng dữ liệu" 
          icon={Database} 
          subtitle="Thống kê độ hoàn thiện thông tin hệ thống"
        />
      </div>
      <PageBody>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Tài sản cần hoàn thiện gấp
              </CardTitle>
              <CardDescription>Danh sách tài sản có độ phủ thông tin thấp nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowCompleteness.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{item.ten_thiet_bi}</p>
                      <p className="text-xs text-muted-foreground">{item.dm_he_thong?.ten || 'Hệ thống chưa xác định'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24">
                        <Progress value={item.completeness_pct} className="h-2" />
                      </div>
                      <span className="text-xs font-mono w-8 text-right">{item.completeness_pct}%</span>
                    </div>
                  </div>
                ))}
                {lowCompleteness.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">Tất cả tài sản đã đạt mức hoàn thiện tốt!</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Tác vụ còn lại
              </CardTitle>
              <CardDescription>Cùng chung tay làm sạch dữ liệu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map((task: any) => (
                  <div key={task.id} className="p-3 border rounded-lg border-l-4 border-l-primary bg-background shadow-sm">
                    <p className="text-sm font-medium leading-none mb-2">{task.tieu_de}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.mo_ta}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px]">+{task.diem_thuong} điểm</Badge>
                      <span className="text-[10px] text-muted-foreground italic">Loại: {task.loai}</span>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">Hiện không có nhiệm vụ nào.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
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
