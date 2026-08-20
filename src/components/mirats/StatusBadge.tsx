import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getToken, type DomainKey } from "@/lib/mirats/ui/status-registry";
import { getStatusToken } from "@/lib/mirats/ui/status-tokens";

import { phaseOf, type Phase } from "@/lib/mirats/trang-thai";
import { Icon } from "@/components/mirats/ui/Icon";

const PHASE_CLS: Record<Phase, string> = {
  open: "bg-info/10 text-info border-info/20",
  in_progress: "bg-warning/10 text-warning border-warning/20",
  closed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const UNKNOWN_CLS = "bg-muted text-muted-foreground border-border";

export function phaseColor(phase: Phase | null): string {
  return phase ? PHASE_CLS[phase] : UNKNOWN_CLS;
}

interface Props {
  domain: DomainKey;
  code: string | null | undefined;
  className?: string;
  label?: string;
  /** Chỉ hiển thị chấm màu, không có nhãn. */
  dotOnly?: boolean;
}

export function StatusBadge({ domain, code, className, label, dotOnly }: Props) {
  // Ưu tiên dùng getStatusToken trực tiếp cho domain thiet_bi để dùng hệ thống token mới
  const token = (['thiet_bi', 'ocr', 'connectivity', 'expiry'].includes(domain))
    ? getStatusToken(domain, code ?? "") 
    : getToken(domain, code ?? "");
    
  const phase = phaseOf(domain as any, code ?? "");
  
  if (!token && !phase) {
    return (
      <Badge variant="outline" className={cn(UNKNOWN_CLS, "font-medium", className)}>
        {label ?? code ?? "—"}
      </Badge>
    );
  }

  // Ưu tiên color (semantic) hoặc class (legacy), fallback sang màu theo phase.
  const colorClass = token?.color || token?.class || phaseColor(phase);

  if (dotOnly) {
    return (
      <div className={cn("flex items-center gap-2", className)} title={label ?? token?.label ?? code ?? ""}>
        <div 
          className={cn(
            "h-2 w-2 rounded-full shrink-0 transition-all",
            colorClass
          )} 
          aria-hidden="true"
        />
        {label && (
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn("font-medium whitespace-nowrap gap-1.5 py-0.5", colorClass, className)}
      aria-label={label ?? token?.label ?? code ?? "Trạng thái"}
    >
      {token?.icon && <Icon name={token.icon} size="tiny" />}
      {!token?.icon && token?.dot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", token.dot)} />}
      <span className="truncate">{label ?? token?.label ?? code}</span>
      {token?.kyHieu && <span className="sr-only">({token.kyHieu})</span>}
    </Badge>
  );
}



