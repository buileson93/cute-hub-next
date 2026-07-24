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
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 px-4 text-center",
        className,
      )}
    >
      <Icon className="h-12 w-12 text-muted-foreground opacity-60" aria-hidden />
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description && (
        <div id={descId} className="text-xs text-muted-foreground max-w-md">
          {description}
        </div>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
