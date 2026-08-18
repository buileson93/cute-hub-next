import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/mirats/ui/Icon";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, Tooltip, BarChart, Bar, LineChart, Line, Cell, XAxis, YAxis } from "recharts";

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
  onClick?: () => void;
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
  tooltip,
  onClick
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
    <Card 
      className={cn(
        "astryx-card overflow-hidden transition-all duration-300",
        onClick && "cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
      )}
      onClick={onClick}
    >
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
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black astryx-number tracking-tighter text-primary">
              {value}
            </span>
            {unit && <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60">{unit}</span>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 mt-2">
        <div style={{ height }} className="w-full relative group bg-muted/5">
          <div className={cn("absolute inset-0 bg-gradient-to-b opacity-30", bgGradients[status])} />
          <ResponsiveContainer width="100%" height="100%">
            {type === 'area' ? (
              <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis dataKey="thangHT" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <defs>
                  <linearGradient id={`gradient-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={Array.isArray(color) ? color[0] : color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={Array.isArray(color) ? color[0] : color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    backdropFilter: 'blur(12px)',
                    borderColor: 'var(--primary-opacity-20)',
                    fontSize: '11px',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--primary-opacity-10)',
                  }}
                  itemStyle={{ 
                    color: 'var(--primary)',
                    padding: '2px 0',
                    fontWeight: '800'
                  }}
                  cursor={{ stroke: 'var(--primary)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  formatter={(val: any) => [`${val}${unit ? ` ${unit}` : ''}`, title]}
                  labelStyle={{ fontWeight: '800', marginBottom: '6px', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '9px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={Array.isArray(color) ? color[0] : color} 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill={`url(#gradient-${title.replace(/\s+/g, '-')})`}
                  isAnimationActive={true}
                  animationDuration={1000}
                  dot={false}
                  activeDot={{ r: 5, fill: '#fff', stroke: Array.isArray(color) ? color[0] : color, strokeWidth: 2 }}
                />
              </AreaChart>
            ) : type === 'bar' ? (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <XAxis dataKey="thangHT" hide />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip 
                  cursor={{ fill: 'var(--primary-opacity-5)' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    backdropFilter: 'blur(12px)',
                    borderColor: 'var(--primary-opacity-20)',
                    fontSize: '11px',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--primary-opacity-10)',
                  }}
                  itemStyle={{ 
                    color: 'var(--primary)',
                    padding: '2px 0',
                    fontWeight: '800'
                  }}
                  formatter={(val: any) => [`${val}${unit ? ` ${unit}` : ''}`, title]}
                  labelStyle={{ fontWeight: '800', marginBottom: '6px', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '9px' }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[6, 6, 0, 0]} 
                  barSize={14}
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
                    <XAxis dataKey="thangHT" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'var(--card)', 
                            backdropFilter: 'blur(12px)',
                            borderColor: 'var(--primary-opacity-20)',
                            fontSize: '11px',
                            borderRadius: '12px',
                            padding: '8px 12px',
                            boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.2)',
                            border: '1px solid var(--primary-opacity-10)',
                        }} 
                        itemStyle={{ 
                            color: 'var(--primary)',
                            padding: '2px 0',
                            fontWeight: '800'
                        }}
                        cursor={{ stroke: 'var(--primary)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                        formatter={(val: any) => [`${val}${unit ? ` ${unit}` : ''}`, title]}
                        labelStyle={{ fontWeight: '800', marginBottom: '6px', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '9px' }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={Array.isArray(color) ? color[0] : color} 
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: '#fff', stroke: Array.isArray(color) ? color[0] : color, strokeWidth: 2 }}
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
