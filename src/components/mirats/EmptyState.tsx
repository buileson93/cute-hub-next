import { Inbox } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";

// Task 25 — Trạng thái rỗng dùng chung.
interface Props {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  action?: React.ReactNode;
  className?: string;
  /**
   * `polite` khi vùng này được render động sau tương tác của user (search, filter…).
   * Bỏ trống với empty state tĩnh để screen reader không đọc lặp.
   */
  live?: "polite" | "off";
}

export function EmptyState({
  title = "Không có dữ liệu",
  description,
  icon: Icon = Inbox,
  action,
  className,
  live = "off",
}: Props) {
  const descId = useId();
  return (
    <div
      role="status"
      aria-live={live}
      aria-describedby={description ? descId : undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-muted/30 py-16 px-6 text-center bg-muted/5",
        className,
      )}
    >
      <div className="p-4 rounded-full bg-muted/20 ring-1 ring-border/20">
        <Icon className="h-8 w-8 text-muted-foreground/40" aria-hidden />
      </div>
      <div className="text-[15px] font-bold text-foreground/80">{title}</div>
      {description && (
        <div id={descId} className="text-xs text-muted-foreground max-w-md">
          {description}
        </div>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
