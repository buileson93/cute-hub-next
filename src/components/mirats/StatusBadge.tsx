import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getToken, type DomainKey } from "@/lib/mirats/ui/status-registry";
import { phaseOf, type Phase } from "@/lib/mirats/trang-thai";
import { Icon } from "@/components/mirats/ui/Icon";

const PHASE_CLS: Record<Phase, string> = {
  open: "bg-info/10 text-info border-info/20",
  in_progress: "bg-progress/10 text-progress border-progress/20",
  closed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-neutral/10 text-neutral border-neutral/20",
};

const UNKNOWN_CLS = "bg-neutral/5 text-muted-foreground border-neutral/10";

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


