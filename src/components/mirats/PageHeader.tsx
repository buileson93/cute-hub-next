import * as React from "react";
import { cn } from "@/lib/utils";
import { InfoHint } from "./InfoHint";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";
import { TYPO } from "@/lib/mirats/ui/typography";
import { Icon as SemanticIcon } from "@/components/mirats/ui/Icon";
import { ChevronRight, MoreVertical } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";


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
  const isMobile = useIsMobile();
  const hasSubtitle = typeof subtitle === "string" && subtitle.trim().length > 0;

  // Xử lý gom nhóm action cho Mobile
  const renderActions = () => {
    if (!actions) return null;

    if (!isMobile) {
      return (
        <div
          data-testid="page-header-actions"
          className="flex shrink-0 items-center gap-2 self-stretch min-h-[32px] md:max-w-none"
        >
          {actions}
        </div>
      );
    }

    // Trên Mobile: Chỉ hiển thị 1 action chính, còn lại cho vào menu
    const actionArray = React.Children.toArray(actions);
    if (actionArray.length <= 1) {
      return <div className="flex shrink-0 items-center gap-2">{actions}</div>;
    }

    const primaryAction = actionArray[0];
    const secondaryActions = actionArray.slice(1);

    return (
      <div className="flex shrink-0 items-center gap-1">
        {primaryAction}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {secondaryActions.map((action, idx) => (
              <DropdownMenuItem key={idx} asChild>
                <div className="w-full cursor-pointer">{action}</div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };


  return (
    <div 
      data-testid="page-header" 
      className={cn(
        "flex flex-col gap-1 w-full shrink-0 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-20",
        UI_DENSITY.CARD_HEADER,
        className
      )}
    >
      {/* 1. Breadcrumbs / Supporting - Ẩn trên Mobile để tiết kiệm chỗ */}
      {(breadcrumbs || supporting) && (
        <div className={cn("hidden md:flex items-center gap-1.5 text-muted-foreground mb-0.5", TYPO.LABEL)}>
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

      <div className="flex items-center justify-between gap-3 md:gap-4 w-full min-h-[40px]">
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
                "truncate text-foreground uppercase flex-1 min-w-0",
                TYPO.H1
              )}
            >
              {title}
            </h1>

            {hasSubtitle && (
              <span
                data-testid="page-header-subtitle"
                className={cn("truncate text-muted-foreground font-normal normal-case hidden sm:inline-block", TYPO.LABEL)}
              >
                {subtitle}
              </span>
            )}
            
            {(help || description) && (
              <InfoHint>
                <div className="space-y-1.5 p-1 max-w-xs">
                  {description && (
                    <div className={cn("font-normal text-foreground leading-snug", TYPO.BODY)}>
                      {description}
                    </div>
                  )}
                  {help && <div className={cn("text-muted-foreground", TYPO.BODY)}>{help}</div>}
                </div>
              </InfoHint>
            )}
          </div>

          {/* 3. Description (Static view if needed outside tooltip) */}
          <div className={cn("hidden data-[density=spacious]:block text-muted-foreground max-w-2xl", TYPO.BODY)}>
            {typeof description === 'string' ? description : null}
          </div>

          {/* 4. Metadata / Status / Chips (Sticky area on Mobile) */}
          {metadata && (
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 overflow-x-auto pb-1 no-scrollbar">
              {metadata}
            </div>
          )}
        </div>

        {/* 5. Actions */}
        {renderActions()}
      </div>
    </div>

  );
}

