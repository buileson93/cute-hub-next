import { Link } from "@tanstack/react-router";
import { AlertTriangle, ShieldCheck, Wrench, ClipboardList, Sparkles } from "lucide-react";
import { useDailyBrief } from "@/hooks/use-daily-brief";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * GĐ2-02 — Narrative Overview
 * "Hôm nay có gì thay đổi" — câu văn ngắn thay cho widget rời rạc.
 */
export function DailyBrief() {
  const { data, isLoading } = useDailyBrief();

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="space-y-2 py-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  const sentences: {
    key: string;
    icon: typeof AlertTriangle;
    to: string;
    node: React.ReactNode;
  }[] = [];

  if (data.expiring_gp_7d > 0) {
    sentences.push({
      key: "gp7",
      icon: ShieldCheck,
      to: "/giay-phep?filter=expiring7",
      node: (
        <>
          <b>{data.expiring_gp_7d}</b> giấy phép sắp hết hạn trong 7 ngày.
        </>
      ),
    });
  } else if (data.expiring_gp_30d > 0) {
    sentences.push({
      key: "gp30",
      icon: ShieldCheck,
      to: "/giay-phep?filter=expiring30",
      node: (
        <>
          <b>{data.expiring_gp_30d}</b> giấy phép sắp hết hạn trong 30 ngày.
        </>
      ),
    });
  }

  if (data.open_incidents > 0) {
    sentences.push({
      key: "sc",
      icon: AlertTriangle,
      to: "/su-co",
      node: (
        <>
          <b>{data.open_incidents}</b> sự cố đang mở
          {data.critical_incidents > 0 ? (
            <>
              , trong đó <b>{data.critical_incidents}</b> nghiêm trọng
            </>
          ) : null}
          .
        </>
      ),
    });
  }

  if (data.overdue_pm > 0 || data.due_pm_7d > 0) {
    sentences.push({
      key: "pm",
      icon: Wrench,
      to: "/bao-tri/pm",
      node: (
        <>
          {data.overdue_pm > 0 ? (
            <>
              <b>{data.overdue_pm}</b> phiếu bảo trì quá hạn
            </>
          ) : null}
          {data.overdue_pm > 0 && data.due_pm_7d > 0 ? ", " : null}
          {data.due_pm_7d > 0 ? (
            <>
              <b>{data.due_pm_7d}</b> sắp đến hạn tuần này
            </>
          ) : null}
          .
        </>
      ),
    });
  }

  if (data.my_shift_tasks > 0) {
    sentences.push({
      key: "shift",
      icon: ClipboardList,
      to: "/bao-tri/pm?mine=1",
      node: (
        <>
          Ca của bạn còn <b>{data.my_shift_tasks}</b> đầu việc.
        </>
      ),
    });
  }

  if (sentences.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-emerald-600" />
          Không có việc gấp — chúc ngày làm việc suôn sẻ.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Sparkles className="size-3.5" /> Hôm nay có gì thay đổi
        </div>
        <ul className="space-y-1.5 text-sm">
          {sentences.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.key}>
                <Link
                  to={s.to}
                  className="inline-flex items-start gap-2 rounded px-1 -mx-1 text-foreground transition-colors hover:bg-muted hover:text-primary"
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>{s.node}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
