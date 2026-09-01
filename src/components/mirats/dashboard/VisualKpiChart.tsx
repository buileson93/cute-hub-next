import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/mirats/ui/Icon";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface VisualKpiChartProps {
  title: string;
  value: string | number;
  unit?: string;
  data: any[];
  type?: "area" | "bar" | "line";
  color?: string | string[];
  icon?: string;
  height?: number;
  status?: "normal" | "attention" | "warning" | "danger";
  tooltip?: string;
  onClick?: () => void;
}

export function VisualKpiChart({
  title,
  value,
  unit,
  data,
  type = "area",
  color = "var(--primary)",
  icon,
  height = 140,
  status = "normal",
  tooltip,
  onClick,
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
        onClick &&
          "cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]",
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
            {unit && (
              <span className="text-mini font-extrabold uppercase tracking-widest text-muted-foreground/60">
                {unit}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 mt-2">
        <div style={{ height }} className="w-full relative group bg-muted/5">
          <div
            className={cn("absolute inset-0 bg-gradient-to-b opacity-30", bgGradients[status])}
          />
          <ChartContainer 
            config={{
              value: { 
                label: title, 
                color: Array.isArray(color) ? color[0] : color 
              }
            }}
          >
            {type === "area" ? (
              <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient
                    id={`gradient-${title.replace(/\s+/g, "-")}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-value)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-value)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis dataKey="thangHT" hide />
                <YAxis hide domain={["auto", "auto"]} />
                <ChartTooltip 
                  cursor={{ stroke: "var(--color-value)", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                  content={<ChartTooltipContent hideIndicator unit={unit} />} 
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#gradient-${title.replace(/\s+/g, "-")})`}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "var(--background)",
                    stroke: "var(--color-value)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            ) : type === "bar" ? (
              <BarChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="thangHT" hide />
                <YAxis hide domain={[0, "auto"]} />
                <ChartTooltip 
                  cursor={{ fill: "oklch(from var(--color-value) l c h / 0.05)" }}
                  content={<ChartTooltipContent hideIndicator unit={unit} />} 
                />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={Array.isArray(color) ? color[index % color.length] : "var(--color-value)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="thangHT" hide />
                <YAxis hide domain={["auto", "auto"]} />
                <ChartTooltip 
                  cursor={{ stroke: "var(--color-value)", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                  content={<ChartTooltipContent hideIndicator unit={unit} />} 
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "var(--background)",
                    stroke: "var(--color-value)",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            )}
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
