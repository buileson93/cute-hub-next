import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/mirats/ui/Icon";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

export interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  target?: string;
  sparklineData?: any[];
  description?: string;
  status?: "normal" | "warning" | "danger" | "info";
  className?: string;
  isLoading?: boolean;
}

export function KpiCard({
  title,
  value,
  unit,
  icon,
  trend,
  target,
  sparklineData,
  description,
  status = "normal",
  className,
  isLoading,
}: KpiCardProps) {
  const statusColors = {
    normal: "border-border",
    info: "border-blue-500/10 bg-blue-500/5",
    warning: "border-amber-500/10 bg-amber-500/5",
    danger: "border-red-500/10 bg-red-500/5",
  };

  const textColors = {
    normal: "text-foreground",
    info: "text-blue-600 dark:text-blue-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
  };

  const iconBg = {
    normal: "bg-muted text-muted-foreground",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <Card className={cn("shadow-sm border overflow-hidden group transition-all hover:shadow-md", statusColors[status], className)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {title}
              </span>
              {description && (
                <AppTooltip noiDung={description}>
                  <div className="cursor-help">
                    <Icon name="entity.info" size="tiny" className="text-muted-foreground/50" />
                  </div>
                </AppTooltip>
              )}
            </div>
            {target && (
              <div className="text-[10px] font-bold text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded uppercase tracking-tighter w-fit">
                {target}
              </div>
            )}
          </div>
          {icon && (
            <div className={cn("p-2 rounded-lg", iconBg[status])}>
              <Icon name={icon as any} size="medium" />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1.5">
          <div className={cn("text-2xl font-black tabular-nums tracking-tight", isLoading ? "animate-pulse" : textColors[status])}>
            {isLoading ? "..." : value}
          </div>
          {unit && !isLoading && (
            <div className="text-[11px] font-bold text-muted-foreground uppercase">
              {unit}
            </div>
          )}
        </div>

        {trend && !isLoading && (
          <div className={cn(
            "text-[11px] font-bold mt-1 flex items-center gap-1",
            trend.isUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}>
            <Icon name={trend.isUp ? "entity.trendingUp" : "entity.trendingDown" as any} size="tiny" />
            {trend.value}%
          </div>
        )}

        {sparklineData && sparklineData.length > 0 && !isLoading && (
          <div className="h-8 mt-2 -mx-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="currentColor" 
                  fill={`url(#grad-${title.replace(/\s+/g, '')})`} 
                  strokeWidth={1.5}
                  className={textColors[status]}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
