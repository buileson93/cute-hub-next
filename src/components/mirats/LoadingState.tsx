import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Task 25 — Trạng thái đang tải dùng chung.
interface Props {
  label?: string;
  className?: string;
}

export function LoadingState({ label = "Đang tải…", className }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-sm text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
