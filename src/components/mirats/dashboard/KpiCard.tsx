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
  
  // Status colors mapped to semantic tokens or standardized opacity-based classes
  const statusColors = {
    normal: "astryx-status-normal",
    attention: "astryx-status-attention",
    warning: "astryx-status-warning",
    danger: "astryx-status-danger",
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
      className={cn("astryx-card", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-1.5">
            <span className="astryx-text-label">
              {label}
            </span>
            {tooltip && (
              <AppTooltip noiDung={tooltip}>
                <div className="cursor-help">
                  <Icon name="entity.info" size="tiny" className="text-muted-foreground/30" />
                </div>
              </AppTooltip>
            )}
          </div>
          {icon && (
            <div className={cn("p-1.5 rounded-lg opacity-80", iconBg[status])}>
              <Icon name={icon as any} size="small" />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1">
          <div className={cn("text-2xl font-black astryx-number tracking-tighter", isLoading ? "animate-pulse text-muted" : textColors[status])}>
            {isLoading ? "..." : value}
          </div>

          {unit && !isLoading && (
            <div className="astryx-text-label opacity-70">
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
