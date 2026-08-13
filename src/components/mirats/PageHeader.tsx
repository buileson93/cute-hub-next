import type * as React from "react";
import { cn } from "@/lib/utils";
import { InfoHint } from "./InfoHint";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";

export interface PageHeaderProps {
  title: string;
  /** Chú thích ngắn 1 dòng, đứng cạnh tiêu đề (truncate). */
  subtitle?: string;
  /** Mô tả dài, có thể nhiều dòng, hiển thị dưới hàng tiêu đề. */
  description?: React.ReactNode;
  help?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Tiêu đề trang chuẩn: icon? + title + subtitle 1 dòng (truncate) + InfoHint (help)
 * ở bên trái; slot `actions` (thường là <ActionBar/>) căn phải. Khi có `description`
 * (nhiều dòng), hiển thị bên dưới hàng tiêu đề — không cắt bớt nội dung.
 * Chỉ trình bày — không tự fetch dữ liệu.
 */
export function PageHeader({
  title,
  subtitle,
  description,
  help,
  actions,
  icon: Icon,
}: PageHeaderProps) {

  const hasSubtitle = typeof subtitle === "string" && subtitle.trim().length > 0;
  return (
    <div data-testid="page-header" className="space-y-0.5">
      <div
        className={cn(
          "flex items-center justify-between",
          "gap-2 data-[density=compact]:gap-1.5",
        )}
      >
        <div className={cn("flex min-w-0 items-center", "gap-2 data-[density=compact]:gap-1.5")}>
          {Icon ? (
            <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
          ) : null}
          <h1
            data-testid="page-header-title"
            className="truncate text-lg font-semibold leading-tight"
          >
            {title}
          </h1>
          {hasSubtitle ? (
            <span
              data-testid="page-header-subtitle"
              className="truncate text-sm text-muted-foreground"
            >
              {subtitle}
            </span>
          ) : null}
          {help ? <InfoHint>{help}</InfoHint> : null}
        </div>
        {actions ? (
          <div
            data-testid="page-header-actions"
            className="flex shrink-0 items-center"
          >
            {actions}
          </div>
        ) : null}
      </div>
      {description ? (
        <div
          data-testid="page-header-description"
          className="text-sm text-muted-foreground max-w-4xl"
        >
          {description}
        </div>
      ) : null}
    </div>
  );
}
