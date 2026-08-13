import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getToken, type DomainKey } from "@/lib/mirats/ui/status-registry";
import { phaseOf, type Phase } from "@/lib/mirats/trang-thai";
import { Icon } from "@/components/mirats/ui/Icon";

const PHASE_CLS: Record<Phase, string> = {
  open: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/25",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25",
  closed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/25",
};

const UNKNOWN_CLS =
  "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/25";

export function phaseColor(phase: Phase | null): string {
  return phase ? PHASE_CLS[phase] : UNKNOWN_CLS;
}

interface Props {
  domain: DomainKey;
  code: string | null | undefined;
  className?: string;
  label?: string;
}

export function StatusBadge({ domain, code, className, label }: Props) {
  const token = getToken(domain, code ?? "");
  const phase = phaseOf(domain as any, code ?? "");
  
  if (!token && !phase) {
    return (
      <Badge variant="outline" className={cn(UNKNOWN_CLS, "font-medium", className)}>
        {label ?? code ?? "—"}
      </Badge>
    );
  }

  // Ưu tiên class từ token (màu cụ thể), fallback sang màu theo phase.
  const colorClass = token?.class || phaseColor(phase);

  return (
    <Badge variant="outline" className={cn("font-medium whitespace-nowrap gap-1.5 py-0.5", colorClass, className)}>
      {token?.icon && <Icon name={token.icon} size="tiny" />}
      {!token?.icon && token?.dot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", token.dot)} />}
      <span className="truncate">{label ?? token?.label ?? code}</span>
    </Badge>
  );
}


