import { AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type AnomalyBadgeProps = {
  score: number;
  count90d: number;
  className?: string;
};

/**
 * Badge cam nhỏ khi tài sản có tần suất sự cố bất thường
 * (z_score ≥ 2 so với cùng loại thiết bị trong 90 ngày).
 */
export function AnomalyBadge({ score, count90d, className }: AnomalyBadgeProps) {
  if (!Number.isFinite(score) || score < 2) return null;
  const label = `${count90d} sự cố / 90 ngày — cao bất thường vs cùng loại (z=${score.toFixed(1)})`;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-label={label}
            className={
              "inline-flex h-5 items-center gap-1 rounded-full border border-amber-500/40 " +
              "bg-amber-500/15 px-1.5 text-[10px] font-medium text-amber-700 " +
              "dark:text-amber-400 " +
              (className ?? "")
            }
          >
            <AlertTriangle className="h-3 w-3" />
            {count90d}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
