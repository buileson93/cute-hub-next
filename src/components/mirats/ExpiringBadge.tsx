import { Badge } from "@/components/ui/badge";
import { nguongCho } from "@/lib/mirats/han-canh-bao";
import { cn } from "@/lib/utils";

// Task 25 — Badge cảnh báo hạn dùng chung. Màu theo ngưỡng
// từ `han-canh-bao.ts` (Task 13): 30 đỏ · 60 cam · 90 vàng · khác xám.

const NGUONG_CLS: Record<number, string> = {
  30: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/25",
  60: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/25",
  90: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25",
};

const OVERDUE_CLS =
  "bg-red-600 text-white border-red-700 dark:bg-red-500 dark:text-white dark:border-red-500";
const FAR_CLS =
  "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/25";

export function expiringColor(soNgay: number | null | undefined): string {
  if (soNgay == null || !Number.isFinite(soNgay)) return FAR_CLS;
  if (soNgay < 0) return OVERDUE_CLS;
  const n = nguongCho(soNgay);
  return n ? NGUONG_CLS[n] : FAR_CLS;
}

interface Props {
  soNgay: number | null | undefined;
  className?: string;
  /** Ẩn phần "còn " để dùng làm badge chip nhỏ. */
  compact?: boolean;
}

export function ExpiringBadge({ soNgay, className, compact }: Props) {
  const cls = expiringColor(soNgay);
  let label: string;
  if (soNgay == null || !Number.isFinite(soNgay)) label = "—";
  else if (soNgay < 0) label = compact ? `${Math.abs(soNgay)}` : `quá hạn ${Math.abs(soNgay)} ngày`;
  else label = compact ? `${soNgay}` : `còn ${soNgay} ngày`;
  return (
    <Badge variant="outline" className={cn(cls, "font-medium", className)}>
      {label}
    </Badge>
  );
}
