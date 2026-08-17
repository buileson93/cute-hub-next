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
  color?: string | string[];
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
    <Card className="astryx-card overflow-hidden">
      <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="astryx-text-label flex items-center gap-2">
            {icon && <Icon name={icon as any} size="tiny" className={statusColors[status]} />}
            {title}
            {tooltip && (
              <AppTooltip noiDung={tooltip}>
                <div className="cursor-help">
                  <Icon name="entity.info" size="tiny" className="text-muted-foreground/30" />
                </div>
              </AppTooltip>
            )}
          </CardTitle>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold astryx-number tracking-tight">
              {value}
            </span>

            {unit && <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">{unit}</span>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 mt-2">
        <div style={{ height }} className="w-full relative bg-muted/5">
          <div className={cn("absolute inset-0 bg-gradient-to-b opacity-30", bgGradients[status])} />
          <ResponsiveContainer width="100%" height="100%">
            {type === 'area' ? (
              <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradient-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={Array.isArray(color) ? color[0] : color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={Array.isArray(color) ? color[0] : color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    backdropFilter: 'blur(8px)',
                    borderColor: 'hsl(var(--primary) / 0.1)',
                    fontSize: '12px',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(0, 116, 226, 0.1)',
                  }}
                  itemStyle={{ 
                    color: '#0074e2',
                    padding: '2px 0',
                    fontWeight: '700'
                  }}
                  cursor={{ stroke: '#0074e2', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  formatter={(val: any) => [`${val}${unit ? ` ${unit}` : ''}`, title]}
                  labelStyle={{ fontWeight: '800', marginBottom: '6px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={Array.isArray(color) ? color[0] : color} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill={`url(#gradient-${title.replace(/\s+/g, '-')})`}
                  isAnimationActive={true}
                  animationDuration={1000}
                  dot={false}
                  activeDot={{ r: 4, fill: Array.isArray(color) ? color[0] : color, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : type === 'bar' ? (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--primary))', fillOpacity: 0.05 }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    borderColor: 'hsl(var(--border))',
                    fontSize: '12px',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid hsl(var(--border))',
                  }}
                  itemStyle={{ 
                    color: 'hsl(var(--popover-foreground))',
                    padding: '2px 0',
                    fontWeight: '600'
                  }}
                  formatter={(val: any) => [`${val}${unit ? ` ${unit}` : ''}`, '']}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: 'hsl(var(--muted-foreground))' }}
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
                            backgroundColor: 'hsl(var(--popover))', 
                            borderColor: 'hsl(var(--border))',
                            fontSize: '12px',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            boxShadow: 'var(--shadow-lg)',
                            border: '1px solid hsl(var(--border))',
                        }} 
                        itemStyle={{ 
                            color: 'hsl(var(--popover-foreground))',
                            padding: '2px 0',
                            fontWeight: '600'
                        }}
                        cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                        formatter={(val: any) => [`${val}${unit ? ` ${unit}` : ''}`, '']}
                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={Array.isArray(color) ? color[0] : color} 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: Array.isArray(color) ? color[0] : color, stroke: '#fff', strokeWidth: 2 }}
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
