import * as React from "react";
import { cn } from "@/lib/utils";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";
import { Card } from "@/components/ui/card";

export interface LayoutPanelProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "ghost" | "error" | "warning" | "success";
  bodyClassName?: string;
}

/**
 * LayoutPanel: A standardized container component for content sections
 * following the Astryx design system patterns.
 */
export function LayoutPanel({
  title,
  icon,
  subtitle,
  actions,
  footer,
  children,
  className,
  variant = "default",
  bodyClassName,
}: LayoutPanelProps) {
  const variantStyles = {
    default: "border-border bg-card",
    ghost: "border-transparent bg-transparent shadow-none",
    error: "border-rose-200 bg-rose-50/30 dark:bg-rose-950/10",
    warning: "border-amber-200 bg-amber-50/30 dark:bg-amber-950/10",
    success: "border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10",
  };

  return (
    <Card className={cn("overflow-hidden flex flex-col", variantStyles[variant], className)}>
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between border-b px-4 py-3 shrink-0",
          variant === "ghost" && "px-0 border-none",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && <div className="text-primary shrink-0">{icon}</div>}
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-semibold leading-none tracking-tight uppercase truncate">
              {title}
            </h3>
            {subtitle && (
              <div className="text-[11px] text-muted-foreground font-normal mt-1 truncate">
                {subtitle}
              </div>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Body */}
      <div className={cn("flex-1 min-h-0", bodyClassName)}>{children}</div>

      {/* Footer */}
      {footer && (
        <div
          className={cn(
            "border-t px-4 py-2 bg-muted/30 shrink-0",
            variant === "ghost" && "px-0 border-none bg-transparent",
          )}
        >
          {footer}
        </div>
      )}
    </Card>
  );
}
