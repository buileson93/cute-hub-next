import { Badge } from "@/components/ui/badge";
import { labelOf, phaseOf, normalizeLegacy, type Domain, type Phase } from "@/lib/mirats/trang-thai";
import { cn } from "@/lib/utils";

// Task 25 — Badge trạng thái dùng chung cho 5 domain (Task 1).
// Màu cố định theo `phase`; nhãn lấy từ `labelOf`. Chấp nhận cả code chuẩn
// lẫn giá trị stored cũ (auto normalize).

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
  domain: Domain;
  /** Giá trị lưu trong DB (code chuẩn hoặc alias cũ). */
  code: string | null | undefined;
  className?: string;
}

export function StatusBadge({ domain, code, className }: Props) {
  const raw = (code ?? "").trim();
  if (!raw) {
    return (
      <Badge variant="outline" className={cn(UNKNOWN_CLS, "font-medium", className)}>
        —
      </Badge>
    );
  }
  const norm = normalizeLegacy(domain, raw);
  const phase = phaseOf(domain, norm);
  const label = labelOf(domain, norm);
  return (
    <Badge variant="outline" className={cn(phaseColor(phase), "font-medium", className)}>
      {label}
    </Badge>
  );
}
