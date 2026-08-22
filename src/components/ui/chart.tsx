import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/mirats/ui/Icon";
import { KHONG_CO } from "@/lib/mirats/format";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    unit?: string;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs",
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-axis-tick_text]:font-medium [&_.recharts-cartesian-axis-tick_text]:tabular-nums",
          "[&_.recharts-cartesian-grid_line]:stroke-border/40 [&_.recharts-cartesian-grid-horizontal_line]:stroke-dasharray-0",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-primary/20",
          "[&_.recharts-dot]:stroke-transparent",
          "[&_.recharts-layer]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, config]) => config.theme || config.color);
  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] || itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: "line" | "dot" | "dashed";
      nameKey?: string;
      labelKey?: string;
      unit?: string;
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
      unit,
    },
    ref,
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) return null;
      const [item] = payload;
      const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label;

      if (labelFormatter) {
        return (
          <div className={cn("font-semibold text-muted-foreground/80 mb-1", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        );
      }
      return value ? <div className={cn("font-semibold text-muted-foreground/80 mb-1", labelClassName)}>{value}</div> : null;
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

    if (!active || !payload?.length) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[9rem] items-start gap-2 rounded-xl border border-border/50 bg-background/95 backdrop-blur-md px-3 py-2 text-xs shadow-2xl ring-1 ring-black/5",
          className,
        )}
      >
        {tooltipLabel}
        <div className="grid gap-1.5">
          {payload
            .filter((item) => item.type !== "none")
            .map((item, index) => {
              const key = `${nameKey || item.name || item.dataKey || "value"}`;
              const itemConfig = getPayloadConfigFromPayload(config, item, key);
              const indicatorColor = color || item.payload.fill || item.color;
              const displayUnit = unit || itemConfig?.unit || "";

              return (
                <div key={item.dataKey} className="flex items-center gap-2.5">
                  {!hideIndicator && (
                    <div
                      className={cn("h-1.5 w-1.5 rounded-full shrink-0")}
                      style={{ backgroundColor: indicatorColor }}
                    />
                  )}
                  <div className="flex flex-1 items-center justify-between gap-4">
                    <span className="text-muted-foreground">{itemConfig?.label || item.name}</span>
                    <span className="font-mono font-bold tabular-nums text-foreground">
                      {item.value?.toLocaleString("vi-VN")}
                      {displayUnit && <span className="ml-0.5 text-[10px] font-normal opacity-60">{displayUnit}</span>}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltip";

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean;
      nameKey?: string;
    }
>(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
  const { config } = useChart();
  if (!payload?.length) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-6 gap-y-2",
        verticalAlign === "top" ? "pb-4" : "pt-4",
        className,
      )}
    >
      {payload
        .filter((item) => item.type !== "none")
        .map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div key={item.value} className="flex items-center gap-2 cursor-default group">
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-full transition-transform group-hover:scale-125"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                {itemConfig?.label || item.value}
              </span>
            </div>
          );
        })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegend";

/**
 * ERPChartFrame Component
 * Standard Card wrapper for ERP charts with header and standardized spacing.
 */
export function ERPChartFrame({
  title,
  subtitle,
  unit,
  children,
  className,
  loading,
  error,
  empty,
  icon,
}: {
  title: string;
  subtitle?: string;
  unit?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  error?: string;
  empty?: boolean;
  icon?: string;
}) {
  return (
    <div className={cn("astryx-card flex flex-col p-4 gap-4 bg-card", className)}>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-bold tracking-tight text-foreground flex items-center gap-2">
            {icon && <Icon name={icon as any} size="tiny" className="text-primary" />}
            {title}
          </h3>
          {unit && <span className="text-[10px] font-extrabold uppercase text-muted-foreground/50 tracking-widest">{unit}</span>}
        </div>
        {subtitle && <p className="text-[11px] text-muted-foreground/70">{subtitle}</p>}
      </div>

      <div className="flex-1 relative min-h-[200px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col gap-4">
             <Skeleton className="w-full h-full rounded-lg bg-muted/20" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-6 border border-destructive/20 rounded-lg bg-destructive/5">
            <Icon name="status.danger" className="text-destructive h-6 w-6" />
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        ) : empty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-6 bg-muted/5 rounded-lg border border-dashed border-border/50">
             <Icon name="entity.info" className="text-muted-foreground/30 h-6 w-6" />
             <p className="text-sm text-muted-foreground font-medium">Chưa có dữ liệu</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) return undefined;
  const payloadPayload =
    "payload" in payload && typeof payload.payload === "object" && payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;
  if (key in payload && typeof payload[key as keyof typeof payload] === "string") {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string;
  }
  return configLabelKey in config ? config[configLabelKey] : config[key as keyof typeof config];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
