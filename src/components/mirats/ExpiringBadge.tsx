import { Badge } from "@/components/ui/badge";
import { nguongCho } from "@/lib/mirats/han-canh-bao";
import { cn } from "@/lib/utils";

// Task 25 — Badge cảnh báo hạn dùng chung. Màu theo ngưỡng
// từ `han-canh-bao.ts` (Task 13): 30 đỏ · 60 cam · 90 vàng · khác xám.

const NGUONG_CLS: Record<number, string> = {
  30: "bg-error/10 text-destructive border-error/20",
  60: "bg-warning/10 text-warning border-warning/20",
  90: "bg-warning/5 text-warning/80 border-warning/10",
};

const OVERDUE_CLS = "bg-destructive text-destructive-foreground border-destructive shadow-sm";
const FAR_CLS = "bg-muted text-muted-foreground border-border";

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
