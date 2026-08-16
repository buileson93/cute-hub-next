import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/mirats/ui/Icon";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

export interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
  status?: 'normal' | 'attention' | 'warning' | 'danger';
  trend?: {
    value: number;
    isUp: boolean;
  };
  sparklineData?: { value: number }[];
  tooltip?: string;
  isLoading?: boolean;
  onClick?: () => void;
}

export function KpiCard({
  label,
  value,
  unit,
  icon,
  status = 'normal',
  trend,
  sparklineData,
  tooltip,
  isLoading,
  onClick,
}: KpiCardProps) {
  
  const statusColors = {
    normal: "border-border",
    attention: "border-blue-500/20 bg-blue-500/5",
    warning: "border-amber-500/20 bg-amber-500/5",
    danger: "border-red-500/20 bg-red-500/5",
  };

  const textColors = {
    normal: "text-foreground",
    attention: "text-blue-600 dark:text-blue-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
  };

  const iconBg = {
    normal: "bg-muted text-muted-foreground",
    attention: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <Card 
      className={cn("shadow-sm border overflow-hidden transition-all hover:shadow-md", statusColors[status], onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-meta font-bold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
            {tooltip && (
              <AppTooltip noiDung={tooltip}>
                <div className="cursor-help">
                  <Icon name="entity.info" size="tiny" className="text-muted-foreground/50" />
                </div>
              </AppTooltip>
            )}
          </div>
          {icon && (
            <div className={cn("p-1.5 rounded-lg", iconBg[status])}>
              <Icon name={icon as any} size="small" />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1">
          <div className={cn("text-2xl font-black tabular-nums tracking-tight", isLoading ? "animate-pulse text-muted" : textColors[status])}>
            {isLoading ? "..." : value}
          </div>
          {unit && !isLoading && (
            <div className="text-bodySm font-bold text-muted-foreground uppercase">
              {unit}
            </div>
          )}
        </div>

        {trend && !isLoading && (
          <div className={cn(
            "text-meta font-bold mt-1 flex items-center gap-1",
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
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="currentColor" 
                  fill="currentColor" 
                  fillOpacity={0.1}
                  strokeWidth={1.5}
                  className={textColors[status]}
                  dot={false}
                  activeDot={{ r: 3, fill: 'currentColor', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
