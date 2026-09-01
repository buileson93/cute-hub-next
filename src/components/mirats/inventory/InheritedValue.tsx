import { GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppTooltip } from "@/components/mirats/AppTooltip";

/**
 * Ô dữ liệu KẾ THỪA (lấy từ cấp cha: hệ thống, nhóm hệ thống, phân loại…).
 * Highlight nhẹ bằng token theme (primary tint) — không dùng tông cảnh báo.
 * Nội dung dài được truncate và xem đầy đủ qua tooltip (hover + keyboard focus).
 */
export function InheritedValue({
  value,
  nguon,
  className,
}: {
  value?: string | null;
  /** Mô tả nguồn kế thừa, ví dụ: "Kế thừa từ hệ thống: Hệ thống điện". */
  nguon?: string | null;
  className?: string;
}) {
  const text = (value ?? "").trim();
  if (!text) return <span className="text-xs text-muted-foreground">—</span>;

  const moTa = nguon?.trim()
    ? `${text} · ${nguon.trim()}`
    : `${text} · Dữ liệu kế thừa từ cấp cha (không có thông tin nguồn)`;

  return (
    <AppTooltip noiDung={moTa}>
      <span
        tabIndex={0}
        className={cn(
          "inline-flex max-w-full items-center gap-1 rounded-md bg-primary/5 px-1.5 py-0.5 text-[12px] leading-snug text-foreground/90",
          "ring-1 ring-inset ring-primary/15 transition-colors hover:bg-primary/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          className,
        )}
      >
        <GitBranch className="h-3 w-3 shrink-0 text-primary/70" aria-hidden="true" />
        <span className="truncate">{text}</span>
        <span className="sr-only"> (dữ liệu kế thừa)</span>
      </span>
    </AppTooltip>
  );
}

/** Ô văn bản thường: truncate 1–2 dòng + tooltip khi nội dung dài. */
export function TextCell({
  value,
  className,
  dong = 2,
}: {
  value?: string | null;
  className?: string;
  dong?: 1 | 2;
}) {
  const text = (value ?? "").trim();
  if (!text) return <span className="text-xs text-muted-foreground">—</span>;
  const node = (
    <span
      tabIndex={0}
      className={cn(
        dong === 1 ? "block truncate" : "line-clamp-2 break-words",
        "text-[12px] leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm",
        className,
      )}
    >
      {text}
    </span>
  );
  return text.length > 24 ? <AppTooltip noiDung={text}>{node}</AppTooltip> : node;
}
