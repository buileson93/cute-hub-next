import { useMemo, useState } from "react";
import { ShieldCheck, CalendarClock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { locSapHetHan, type ExpiringRow } from "@/lib/mirats/db-expiring";
import { NGUONG_CANH_BAO, type NguongCanhBao } from "@/lib/mirats/han-canh-bao";
import { cn } from "@/lib/utils";

const THRESHOLDS = NGUONG_CANH_BAO;
type Threshold = NguongCanhBao;

const LOAI_META: Record<ExpiringRow["loai"], { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  bao_hanh: {
    label: "Bảo hành",
    cls: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    icon: ShieldCheck,
  },
  giay_phep: {
    label: "Giấy phép",
    cls: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    icon: CalendarClock,
  },
};

function ngayBadge(days: number) {
  if (days <= 7) return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
  if (days <= 30) return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  return "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300";
}

export function ExpiringWidget({
  rows,
  defaultThreshold = 30,
  className,
}: {
  rows: ExpiringRow[];
  defaultThreshold?: Threshold;
  className?: string;
}) {
  const [threshold, setThreshold] = useState<Threshold>(defaultThreshold);

  const filtered = useMemo(() => locSapHetHan(rows, threshold), [rows, threshold]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div role="tablist" aria-label="Ngưỡng số ngày" className="inline-flex h-9 items-center gap-1 rounded-lg bg-muted p-1">
        {THRESHOLDS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={threshold === t}
            onClick={() => setThreshold(t)}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors",
              threshold === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t} ngày
          </button>
        ))}
      </div>


      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          <AlertTriangle className="h-5 w-5 opacity-50" />
          Không có mục nào sắp hết hạn trong {threshold} ngày.
        </div>
      ) : (
        <ul aria-label={`Danh sách sắp hết hạn trong ${threshold} ngày`} className="divide-y divide-border rounded-lg border border-border">
          {filtered.map((r) => {
            const meta = LOAI_META[r.loai];
            const Icon = meta.icon;
            const content = (
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{r.ten ?? "—"}</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Badge variant="outline" className={cn("border-0 text-[10.5px]", meta.cls)}>
                      {meta.label}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">Hết hạn {r.ngay_het_han}</span>
                  </div>
                </div>
                <Badge variant="outline" className={cn("border-0 shrink-0 text-[11px] font-semibold", ngayBadge(r.so_ngay_con_lai))}>
                  còn {r.so_ngay_con_lai} ngày
                </Badge>
              </div>
            );
            return (
              <li key={`${r.loai}-${r.thiet_bi_id ?? r.ten}-${r.ngay_het_han}`}>
                {content}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
