// ============================================================================
// Sơ đồ Gantt dự án — dựng bằng React + design tokens sẵn có (không phụ thuộc
// frappe-gantt). Chỉ trình bày; toàn bộ dữ liệu/nghiệp vụ giữ nguyên.
// ============================================================================
import { useCallback, useMemo, useRef, useState } from "react";
import { CheckCircle2, Circle, Clock, AlertTriangle, Flag, CalendarOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  addDays,
  avatarToneIndex,
  buildGanttRows,
  computeBarSpan,
  computeGanttRange,
  diffDays,
  initialsOf,
  toDateKey,
  type GanttMocSource,
  type GanttRow,
  type GanttTaskSource,
} from "@/lib/mirats/projects/gantt-layout";

export type GanttAssignee = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

export type GanttZoom = "Day" | "Week" | "Month";

const ZOOM: Record<GanttZoom, { label: string; dayWidth: number; tickEvery: number }> = {
  Day: { label: "Ngày", dayWidth: 34, tickEvery: 1 },
  Week: { label: "Tuần", dayWidth: 14, tickEvery: 7 },
  Month: { label: "Tháng", dayWidth: 6, tickEvery: 14 },
};

const STATUS_META: Record<string, { label: string; icon: LucideIcon; bar: string; dot: string }> = {
  chua_bat_dau: {
    label: "Chưa bắt đầu",
    icon: Circle,
    bar: "bg-muted-foreground/45",
    dot: "text-muted-foreground",
  },
  dang_lam: { label: "Đang làm", icon: Clock, bar: "bg-primary/75", dot: "text-primary" },
  cho_duyet: {
    label: "Chờ duyệt",
    icon: Clock,
    bar: "bg-[var(--status-warning-solid)]",
    dot: "text-[var(--status-warning-fg)]",
  },
  hoan_thanh: { label: "Hoàn thành", icon: CheckCircle2, bar: "bg-success/80", dot: "text-success" },
  qua_han: {
    label: "Quá hạn",
    icon: AlertTriangle,
    bar: "bg-destructive/80",
    dot: "text-destructive",
  },
};

const AVATAR_TONES = [
  "bg-primary/15 text-primary",
  "bg-success/15 text-success",
  "bg-destructive/15 text-destructive",
  "bg-muted text-foreground",
  "bg-accent text-accent-foreground",
  "bg-secondary text-secondary-foreground",
] as const;

/** Ngày rút gọn dd/MM để hiển thị cạnh thanh hẹp. */
export function shortDate(dateKey: string): string {
  const [, m, d] = dateKey.split("-");
  return `${d}/${m}`;
}

/**
 * Ước lượng bề rộng tối thiểu (px) để tên task đọc được trong thanh:
 * ~6.6px mỗi ký tự ở text-xs + 16px padding, chặn trên để thanh dài vẫn hiện tên.
 */
export function estimateLabelWidth(name: string, maxChars = 18): number {
  const chars = Math.min(name.trim().length || 1, maxChars);
  return Math.round(chars * 6.6) + 16;
}

function formatDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-");
  return `${d}/${m}/${y}`;
}

/** Avatar người phụ trách + tooltip tên đầy đủ, có accessible name. */
export function AssigneeAvatar({
  assignee,
  className,
}: {
  assignee: GanttAssignee;
  className?: string;
}) {
  const tone = AVATAR_TONES[avatarToneIndex(assignee.id, AVATAR_TONES.length)];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          role="img"
          aria-label={`Người phụ trách: ${assignee.name}`}
          title={assignee.name}
          className={cn(
            "inline-flex rounded-full outline-none ring-offset-background transition-shadow",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className,
          )}
        >
          <Avatar className="h-6 w-6 border border-border">
            {assignee.avatarUrl ? (
              <AvatarImage src={assignee.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback className={cn("text-xs font-semibold", tone)}>
              {initialsOf(assignee.name)}
            </AvatarFallback>
          </Avatar>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{assignee.name}</TooltipContent>
    </Tooltip>
  );
}

/** Nhóm avatar chồng lớp; mỗi avatar có tooltip riêng đúng tên. */
export function AssigneeStack({ assignees }: { assignees: readonly GanttAssignee[] }) {
  if (assignees.length === 0) {
    return (
      <span className="text-xs text-muted-foreground" aria-label="Chưa có người phụ trách">
        Chưa giao
      </span>
    );
  }
  return (
    <span className="flex items-center -space-x-1.5">
      {assignees.map((a) => (
        <AssigneeAvatar key={a.id} assignee={a} className="ring-2 ring-background rounded-full" />
      ))}
    </span>
  );
}

export function ProjectGantt({
  mocs,
  tasks,
  projectStart,
  assigneeOf,
  isLoading = false,
  onSelectTask,
}: {
  mocs: readonly GanttMocSource[];
  tasks: readonly GanttTaskSource[];
  projectStart: string | null;
  assigneeOf: (userId: string) => GanttAssignee;
  isLoading?: boolean;
  onSelectTask?: (taskId: string) => void;
}) {
  const [zoom, setZoom] = useState<GanttZoom>("Week");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const rows = useMemo(
    () =>
      buildGanttRows({
        mocs,
        tasks,
        fallbackStart: toDateKey(projectStart) ?? today,
      }),
    [mocs, tasks, projectStart, today],
  );
  const range = useMemo(() => computeGanttRange(rows), [rows]);

  const { dayWidth, tickEvery } = ZOOM[zoom];
  const ticks = useMemo(() => {
    if (!range) return [];
    const out: { key: string; left: number; label: string }[] = [];
    for (let i = 0; i < range.totalDays; i += tickEvery) {
      const key = addDays(range.start, i);
      out.push({
        key,
        left: i * dayWidth,
        label: zoom === "Month" ? key.slice(5).replace("-", "/") : formatDate(key).slice(0, 5),
      });
    }
    return out;
  }, [range, tickEvery, dayWidth, zoom]);

  const todayOffset = useMemo(() => {
    if (!range) return null;
    const d = diffDays(range.start, today);
    return d >= 0 && d < range.totalDays ? d * dayWidth : null;
  }, [range, today, dayWidth]);

  const handleActivate = useCallback(
    (row: GanttRow) => {
      setActiveKey(row.key);
      if (row.kind === "task") onSelectTask?.(row.id);
    },
    [onSelectTask],
  );

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Đang tải sơ đồ Gantt">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-56 shrink-0" />
            <Skeleton className="h-8 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (!range || rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <CalendarOff className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <p className="mt-2 text-sm text-muted-foreground">
          Chưa có mốc hoặc công việc để hiển thị Gantt.
        </p>
      </div>
    );
  }

  const gridWidth = range.totalDays * dayWidth;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {formatDate(range.start)} – {formatDate(range.end)} · {rows.length} dòng
          </p>
          <div className="flex gap-1" role="group" aria-label="Mức phóng dòng thời gian">
            {(Object.keys(ZOOM) as GanttZoom[]).map((z) => (
              <Button
                key={z}
                size="sm"
                variant={zoom === z ? "default" : "outline"}
                aria-pressed={zoom === z}
                onClick={() => setZoom(z)}
              >
                {ZOOM[z].label}
              </Button>
            ))}
          </div>
        </div>

        <div
          ref={scrollRef}
          className={cn(
            "relative max-h-[65vh] overflow-auto rounded-lg border border-border bg-card",
            // Cuộn ngang mượt, có kiểm soát trên màn hình hẹp / cảm ứng.
            "scroll-smooth overscroll-x-contain [-webkit-overflow-scrolling:touch] motion-reduce:scroll-auto",
          )}
        >
          <div className="min-w-max">
            {/* Header dòng thời gian */}
            <div className="sticky top-0 z-30 flex border-b border-border bg-card/95 backdrop-blur">
              <div className="sticky left-0 z-10 w-[10.5rem] shrink-0 border-r border-border bg-card/95 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:w-[15rem] lg:w-[19rem]">
                Công việc
              </div>
              <div className="relative h-9" style={{ width: gridWidth }}>
                {ticks.map((t) => (
                  <span
                    key={t.key}
                    className="absolute top-0 h-full border-l border-border/60 pl-1 pt-2 text-xs text-muted-foreground"
                    style={{ left: t.left }}
                  >
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Các dòng */}
            <div role="list">
              {rows.map((row, index) => {
                const span = computeBarSpan(row, range);
                const meta = row.status ? STATUS_META[row.status] : undefined;
                const Icon = row.kind === "moc" ? Flag : (meta?.icon ?? Circle);
                const isActive = activeKey === row.key;
                const assignee = row.assigneeId ? assigneeOf(row.assigneeId) : null;
                const barLabel = `${row.name} · ${formatDate(row.start)} – ${formatDate(row.end)} · ${row.progress}%${
                  meta ? ` · ${meta.label}` : ""
                }${row.inferredDates ? " · ngày tạm suy ra" : ""}`;
                const barLeft = span.offsetDays * dayWidth;
                const barWidth = Math.max(span.spanDays * dayWidth, 14);
                const fitsName = barWidth >= estimateLabelWidth(row.name);
                const dateRangeShort =
                  row.start === row.end
                    ? shortDate(row.start)
                    : `${shortDate(row.start)}–${shortDate(row.end)}`;
                const labelAfterBar = gridWidth - (barLeft + barWidth) >= 78;


                return (
                  <div
                    key={row.key}
                    role="listitem"
                    className={cn(
                      "flex border-b border-border/60 transition-colors motion-reduce:transition-none",
                      index % 2 === 1 && row.kind === "task" && "bg-muted/30",
                      row.kind === "moc" && "bg-muted/60",
                      isActive && "bg-primary/5",
                      "hover:bg-accent/50",
                    )}
                  >
                    {/* Cột trái */}
                    <div
                      className={cn(
                        "sticky left-0 z-10 flex w-[10.5rem] shrink-0 items-center gap-2 border-r border-border bg-inherit px-2 py-2 sm:w-[15rem] sm:px-3 lg:w-[19rem]",
                        row.kind === "task" && "pl-6",
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          row.kind === "moc" ? "text-foreground" : (meta?.dot ?? "text-muted-foreground"),
                        )}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleActivate(row)}
                            className={cn(
                              "h-auto min-w-0 flex-1 justify-start truncate rounded px-0 py-0 text-left font-normal hover:bg-transparent",
                              row.kind === "moc"
                                ? "text-sm font-semibold text-foreground"
                                : "text-sm text-foreground/90",
                            )}
                          >
                            {row.name || "Chưa đặt tên"}
                          </Button>

                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          {barLabel}
                        </TooltipContent>
                      </Tooltip>
                      {assignee ? <AssigneeStack assignees={[assignee]} /> : null}
                    </div>

                    {/* Lưới thời gian */}
                    <div className="relative py-2.5" style={{ width: gridWidth }}>
                      {ticks.map((t) => (
                        <span
                          key={t.key}
                          aria-hidden="true"
                          className="absolute inset-y-0 border-l border-border/40"
                          style={{ left: t.left }}
                        />
                      ))}
                      {todayOffset !== null ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-0 border-l-2 border-primary/50"
                          style={{ left: todayOffset }}
                        />
                      ) : null}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleActivate(row)}
                            aria-label={barLabel}
                            className={cn(
                              "absolute top-1 flex h-8 min-w-0 items-center justify-start overflow-hidden rounded-lg border p-0 text-left shadow-sm transition-[box-shadow] hover:bg-transparent motion-reduce:transition-none",
                              row.kind === "moc"
                                ? "h-9 border-foreground/30 bg-foreground/10"
                                : "border-border/70",
                              row.inferredDates && "border-dashed",
                              isActive && "shadow-md ring-1 ring-primary/40",
                            )}
                            style={{ left: barLeft, width: barWidth }}
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                "absolute inset-y-0 left-0",
                                row.kind === "moc"
                                  ? "bg-foreground/25"
                                  : (meta?.bar ?? "bg-primary/60"),
                              )}
                              style={{ width: `${row.progress}%` }}
                            />
                            <span className="relative z-10 truncate px-2 text-xs font-medium text-foreground">
                              {fitsName ? row.name : ""}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          {barLabel}
                        </TooltipContent>
                      </Tooltip>
                      {/* Thanh quá hẹp để hiện tên → nêu rõ ngày bắt đầu/kết thúc cạnh thanh. */}
                      {fitsName ? null : (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "pointer-events-none absolute top-1 flex h-8 items-center whitespace-nowrap text-[11px] tabular-nums text-muted-foreground",
                            labelAfterBar ? "pl-1.5" : "-translate-x-full pr-1.5",
                          )}
                          style={{ left: labelAfterBar ? barLeft + barWidth : barLeft }}
                        >
                          {dateRangeShort}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
