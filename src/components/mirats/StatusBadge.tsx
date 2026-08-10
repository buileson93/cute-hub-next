import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getToken, type DomainKey } from "@/lib/mirats/ui/status-registry";

interface Props {
  domain: DomainKey;
  code: string | null | undefined;
  className?: string;
  label?: string;
}

export function StatusBadge({ domain, code, className, label }: Props) {
  const token = getToken(domain, code ?? "");
  if (!token) return null;

  return (
    <Badge variant="outline" className={cn("font-medium", token.class, className)}>
      {label ?? code}
    </Badge>
  );
}

