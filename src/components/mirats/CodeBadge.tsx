import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TYPO } from "@/lib/mirats/ui/typography";

/**
 * Nhãn "mã định danh" dùng chung — hiển thị mã tài sản / mã thành phần một cách
 * DỄ NHẬN BIẾT.
 * Hợp nhất (Task 63): Chuẩn hóa typo và màu sắc.
 */
export function CodeBadge({
  code,
  className,
  title,
  showIcon = true,
}: {
  code?: string | null;
  className?: string;
  title?: string;
  showIcon?: boolean;
}) {
  const c = (code ?? "").trim();
  if (!c) return null;
  return (
    <Badge
      variant="outline"
      title={title ?? `Mã: ${c}`}
      className={cn(
        TYPO.MONO,
        "text-[10px] gap-0.5 border-border bg-muted/30 font-medium",
        className,
      )}
    >
      {showIcon && <Hash className="h-2.5 w-2.5 shrink-0 opacity-60" />}
      {c}
    </Badge>
  );
}
