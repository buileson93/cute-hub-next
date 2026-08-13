import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/mirats/ui/Icon";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, Tooltip, BarChart, Bar, LineChart, Line, Cell } from "recharts";

interface VisualKpiChartProps {
  title: string;
  value: string | number;
  unit?: string;
  data: any[];
  type?: 'area' | 'bar' | 'line';
  color?: string;
  icon?: string;
  height?: number;
  status?: 'normal' | 'attention' | 'warning' | 'danger';
  tooltip?: string;
}

export function VisualKpiChart({
  title,
  value,
  unit,
  data,
  type = 'area',
  color = "hsl(var(--primary))",
  icon,
  height = 140,
  status = 'normal',
  tooltip
}: VisualKpiChartProps) {
  
  const statusColors = {
    normal: "text-primary",
    attention: "text-blue-500",
    warning: "text-amber-500",
    danger: "text-red-500",
  };

  const bgGradients = {
    normal: "from-primary/10 to-transparent",
    attention: "from-blue-500/10 to-transparent",
    warning: "from-amber-500/10 to-transparent",
    danger: "from-red-500/10 to-transparent",
  };

  return (
    <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm transition-all hover:shadow-lg">
      <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            {icon && <Icon name={icon as any} size="tiny" className={statusColors[status]} />}
            {title}
            {tooltip && (
              <AppTooltip noiDung={tooltip}>
                <div className="cursor-help">
                  <Icon name="entity.info" size="tiny" className="text-muted-foreground/50" />
                </div>
              </AppTooltip>
            )}
          </CardTitle>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black tabular-nums tracking-tighter">
              {value}
            </span>
            {unit && <span className="text-[10px] font-bold text-muted-foreground uppercase">{unit}</span>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 mt-2">
        <div style={{ height }} className="w-full relative">
          <div className={cn("absolute inset-0 bg-gradient-to-b opacity-50", bgGradients[status])} />
          <ResponsiveContainer width="100%" height="100%">
            {type === 'area' ? (
              <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradient-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    fontSize: '10px',
                    borderRadius: '8px',
                    fontWeight: 'bold'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill={`url(#gradient-${title.replace(/\s+/g, '-')})`}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </AreaChart>
            ) : type === 'bar' ? (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    fontSize: '10px',
                    borderRadius: '8px',
                    fontWeight: 'bold'
                  }} 
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]} 
                  barSize={12}
                  isAnimationActive={true}
                  animationDuration={1000}
                >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Array.isArray(color) ? color[index % color.length] : color} />
                    ))}
                </Bar>
              </BarChart>
            ) : (
                <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            borderColor: 'hsl(var(--border))',
                            fontSize: '10px',
                            borderRadius: '8px',
                            fontWeight: 'bold'
                        }} 
                    />
                    <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={color} 
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={1000}
                    />
                </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
