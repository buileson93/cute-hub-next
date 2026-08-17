import * as React from "react";
import { cn } from "@/lib/utils";
import { InfoHint } from "./InfoHint";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";
import { Icon as SemanticIcon } from "@/components/mirats/ui/Icon";
import { ChevronRight } from "lucide-react";

export interface PageHeaderProps {
  title: React.ReactNode;
  /** Breadcrumbs or parent context info */
  supporting?: React.ReactNode;
  /** Chú thích ngắn 1 dòng, đứng cạnh tiêu đề (truncate). */
  subtitle?: string;
  /** Mô tả dài, có thể nhiều dòng, hiển thị dưới hàng tiêu đề. */
  description?: React.ReactNode;
  /** Metadata, status badges or secondary info line */
  metadata?: React.ReactNode;
  help?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }> | string;
  /** Standard breadcrumb array */
  breadcrumbs?: Array<{ label: string; to?: string }>;
  className?: string;
}

/**
 * Tiêu đề trang chuẩn MIRATS: Anatomy-based redesign following Astryx Stone.
 * Breadcrumbs -> Title Row (Icon + Title + Subtitle + Help) -> Description -> Metadata -> Actions
 */
export function PageHeader({
  title,
  supporting,
  subtitle,
  description,
  metadata,
  help,
  actions,
  icon: Icon,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  const hasSubtitle = typeof subtitle === "string" && subtitle.trim().length > 0;

  return (
    <div 
      data-testid="page-header" 
      className={cn(
        "flex flex-col gap-1 w-full shrink-0 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10",
        UI_DENSITY.CARD_HEADER,
        className
      )}
    >
      {/* 1. Breadcrumbs / Supporting */}
      {(breadcrumbs || supporting) && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
          {breadcrumbs ? (
            <div className="flex items-center gap-1">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span className={cn(idx === breadcrumbs.length - 1 && "text-foreground font-semibold")}>
                    {crumb.label}
                  </span>
                  {idx < breadcrumbs.length - 1 && <ChevronRight className="h-2.5 w-2.5 opacity-50" />}
                </React.Fragment>
              ))}
            </div>
          ) : supporting}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col min-w-0 flex-1 gap-1">
          {/* 2. Title Row */}
          <div className={cn("flex min-w-0 items-center", UI_DENSITY.HEADER_GAP)}>
            {Icon && (
              <div className="flex shrink-0 items-center justify-center">
                {typeof Icon === "string" ? (
                  <SemanticIcon name={Icon} className="h-4 w-4 text-primary" />
                ) : (
                  <Icon className="h-4 w-4 text-primary" />
                )}
              </div>
            )}
            
            <h1
              data-testid="page-header-title"
              className={cn(
                "truncate font-bold leading-tight tracking-tight text-foreground",
                "text-sm data-[density=comfortable]:text-base data-[density=spacious]:text-lg uppercase"
              )}
            >
              {title}
            </h1>

            {hasSubtitle && (
              <span
                data-testid="page-header-subtitle"
                className="truncate text-xs text-muted-foreground font-normal normal-case"
              >
                {subtitle}
              </span>
            )}
            
            {(help || description) && (
              <InfoHint>
                <div className="space-y-1.5 p-1 max-w-xs">
                  {description && (
                    <div className="text-sm font-normal text-foreground leading-snug">
                      {description}
                    </div>
                  )}
                  {help && <div className="text-xs text-muted-foreground">{help}</div>}
                </div>
              </InfoHint>
            )}
          </div>

          {/* 3. Description (Static view if needed outside tooltip) */}
          {/* Usually hidden in tooltip to keep header compact, but enabled for spacious */}
          <div className="hidden data-[density=spacious]:block text-sm text-muted-foreground max-w-2xl">
            {typeof description === 'string' ? description : null}
          </div>

          {/* 4. Metadata / Status */}
          {metadata && (
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              {metadata}
            </div>
          )}
        </div>

        {/* 5. Actions */}
        {actions && (
          <div
            data-testid="page-header-actions"
            className="flex shrink-0 items-center gap-2 self-center"
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

