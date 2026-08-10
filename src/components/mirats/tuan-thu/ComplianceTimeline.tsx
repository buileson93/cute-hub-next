import { ShieldCheck, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DEFAULT_NGAY_SAP_HET_HAN } from "@/lib/mirats/han-canh-bao";

interface ComplianceTimelineProps {
  kpi: {
    total: number;
    valid: number;
    expiring: number;
    expired: number;
    d30: number;
    d60: number;
    d90: number;
  };
  warningCount: number;
}

export function ComplianceTimeline({ kpi, warningCount }: ComplianceTimelineProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard icon={ShieldCheck} label="Tổng GP đang lưu trữ" value={kpi.total} tone="text-foreground/70" />
        <KpiCard icon={CheckCircle2} label="Còn hiệu lực" value={kpi.valid} tone="text-emerald-600 dark:text-emerald-400" />
        <KpiCard icon={Clock} label={`Sắp hết hạn (≤ ${DEFAULT_NGAY_SAP_HET_HAN} ngày)`} value={kpi.expiring} tone="text-amber-600 dark:text-amber-400" />
        <KpiCard icon={AlertTriangle} label="Hệ thống thiếu GP mới" value={warningCount} tone="text-red-600 dark:text-red-400" />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Lộ trình gia hạn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Khẩn cấp (≤ 30 ngày)
            </span>
            <Badge variant="outline" className="text-red-600">{kpi.d30}</Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Cần lưu ý (31–60 ngày)
            </span>
            <Badge variant="outline" className="text-amber-600">{kpi.d60}</Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Theo dõi (61–90 ngày)
            </span>
            <Badge variant="outline" className="text-sky-600">{kpi.d90}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone }: { icon: any, label: string, value: number, tone: string }) {
  return (
    <Card className="transition-all hover:shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-muted/50", tone)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className={cn("text-xl font-bold leading-none", tone)}>{value}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
