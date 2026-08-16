import type * as React from "react";
import { cn } from "@/lib/utils";
import { InfoHint } from "./InfoHint";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";
import { Icon as SemanticIcon } from "@/components/mirats/ui/Icon";

export interface PageHeaderProps {
  title: string;
  /** Chú thích ngắn 1 dòng, đứng cạnh tiêu đề (truncate). */
  subtitle?: string;
  /** Mô tả dài, có thể nhiều dòng, hiển thị dưới hàng tiêu đề. */
  description?: React.ReactNode;
  help?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }> | string;
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
    <div data-testid="page-header" className={cn("flex items-center justify-between gap-2 h-auto py-2")}>
      <div className={cn("flex min-w-0 items-center", UI_DENSITY.HEADER_GAP)}>
        {Icon ? (
          typeof Icon === "string" ? (
            <SemanticIcon name={Icon} size="small" className="text-muted-foreground" />
          ) : (
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          )
        ) : null}
        <h1
          data-testid="page-header-title"
          className="truncate text-xs font-bold leading-tight uppercase tracking-tight"
        >
          {typeof title === 'string' ? title : String(title)}
        </h1>
        {hasSubtitle ? (
          <span
            data-testid="page-header-subtitle"
            className="truncate text-xs text-muted-foreground"
          >
            {subtitle}
          </span>
        ) : null}
        
        {help || description ? (
          <InfoHint>
            <div className="space-y-1.5">
              {description && (
                <div className={cn(
                  "text-sm font-normal text-foreground",
                  typeof description === 'string' && description.length > 80 && "text-xs"
                )}>
                  {description}
                </div>
              )}
              {help && <div className="text-xs text-muted-foreground">{help}</div>}
            </div>
          </InfoHint>
        ) : null}
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
  );
}
