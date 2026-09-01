// ============================================================================
// Chuẩn UI phân cấp dùng chung — dùng cho Cây phân cấp hệ thống và Sổ lý lịch.
// Mục tiêu: một ngôn ngữ hiển thị node duy nhất (icon chip, typography, spacing,
// badge, trạng thái hover/selected/focus) cho mọi khu vực có cấu trúc phân cấp.
// Không thêm dependency mới: chỉ Tailwind token + lucide icon sẵn có.
// ============================================================================
import type { ComponentType, KeyboardEvent, ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Sắc thái node — ánh xạ sang design token, không hardcode màu. */
export type NodeTone = "primary" | "accent" | "muted" | "success" | "warning" | "danger";

const TONE_CLASS: Record<NodeTone, string> = {
  primary: "bg-primary/10 text-primary ring-primary/15",
  accent: "bg-accent text-accent-foreground ring-border",
  muted: "bg-muted text-muted-foreground ring-border",
  success: "bg-success/10 text-success ring-success/20",
  warning: "bg-warning/10 text-warning ring-warning/20",
  danger: "bg-destructive/10 text-destructive ring-destructive/20",
};

/**
 * Chip icon nhận diện node — dùng chung cho node cây và mốc sổ lý lịch,
 * nhờ đó hai màn hình có cùng "chữ ký thị giác".
 */
export function NodeIcon({
  icon: Icon,
  tone = "muted",
  size = "sm",
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  tone?: NodeTone;
  /** sm: trong cây · md: mốc thời gian sổ lý lịch */
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md ring-1",
        size === "sm" ? "h-6 w-6" : "h-7 w-7 rounded-full",
        TONE_CLASS[tone],
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </span>
  );
}

/** Nút mở/đóng: vùng bấm đủ lớn trên mobile, có aria-expanded. */
export function HierarchyToggle({
  expanded,
  onToggle,
  label,
  disabled,
}: {
  expanded: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      disabled={disabled}
      aria-expanded={expanded}
      aria-label={`${expanded ? "Thu gọn" : "Mở rộng"} ${label}`}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground",
        "transition-colors hover:bg-muted hover:text-foreground sm:h-6 sm:w-6",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      <ChevronRight
        className={cn("h-4 w-4 transition-transform duration-150", expanded && "rotate-90")}
      />
    </button>
  );
}

/** Ô giữ chỗ khi node lá — giữ thẳng hàng cột toggle giữa các cấp. */
export function HierarchyLeafSpacer({ icon: Icon }: { icon?: ComponentType<{ className?: string }> }) {
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center sm:h-6 sm:w-6" aria-hidden>
      {Icon ? <Icon className="h-3 w-3 opacity-30" /> : null}
    </span>
  );
}

export function HierarchyRow({
  icon,
  tone = "muted",
  title,
  meta,
  badges,
  actions,
  expandable = false,
  expanded = false,
  onToggle,
  onActivate,
  activateHint,
  selected = false,
  disabled = false,
  toggleLabel,
  leafIcon,
  surface = "card",
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  tone?: NodeTone;
  /** Tên node — bắt buộc, đã xử lý fallback "Chưa có tên" ở phía gọi. */
  title: ReactNode;
  /** Dòng phụ: loại/cấp, mã, thông tin nhận diện ngắn. */
  meta?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  onActivate?: () => void;
  activateHint?: string;
  selected?: boolean;
  disabled?: boolean;
  toggleLabel?: string;
  leafIcon?: ComponentType<{ className?: string }>;
  /**
   * Bề mặt node. "card" học theo phong cách thẻ của Sổ lý lịch (viền mảnh,
   * nền card, hover nâng nhẹ) — đây là mặc định để hai màn hình đồng nhất.
   * "plain" dành cho hàng tiêu đề nhóm lớn (không cần viền lồng viền).
   */
  surface?: "card" | "plain";
  className?: string;
}) {
  const interactive = !!onActivate && !disabled;
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onActivate?.();
    }
  };

  return (
    <div
      data-selected={selected || undefined}
      className={cn(
        "group flex items-start gap-1.5 rounded-lg px-1.5 py-1 transition-colors sm:items-center sm:gap-2",
        "data-[selected]:bg-primary/5",
        surface === "card"
          ? "border border-border/60 bg-card/60 px-2 py-1.5 shadow-[0_1px_0_0_hsl(var(--border)/0.4)] hover:border-border hover:bg-muted/40"
          : "hover:bg-muted/60",
        // Trạng thái chọn không chỉ dựa vào màu: có viền trái đậm.
        selected && "border-primary/40 shadow-[inset_2px_0_0_0_hsl(var(--primary))]",
        disabled && "opacity-60",
        className,
      )}
    >
      {expandable && onToggle ? (
        <HierarchyToggle
          expanded={expanded}
          onToggle={onToggle}
          label={toggleLabel ?? "nhánh"}
          disabled={disabled}
        />
      ) : (
        <HierarchyLeafSpacer icon={leafIcon} />
      )}

      <div className="mt-1 sm:mt-0">
        <NodeIcon icon={icon} tone={tone} />
      </div>

      <div
        {...(interactive
          ? {
              role: "button" as const,
              tabIndex: 0,
              onClick: onActivate,
              onKeyDown,
              title: activateHint,
            }
          : {})}
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-0.5 rounded-md py-0.5 sm:flex-row sm:items-center sm:gap-2",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          interactive && "cursor-pointer",
        )}
      >
        {/* Tên: mobile cho xuống tối đa 2 dòng, desktop giữ 1 dòng gọn gàng. */}
        <div className="min-w-0 flex-1 text-sm font-medium leading-snug break-words [overflow-wrap:anywhere] line-clamp-2 sm:line-clamp-none sm:truncate">
          {title}
        </div>
        {meta ? (
          <div className="flex min-w-0 flex-wrap items-center gap-1 text-meta text-muted-foreground">
            {meta}
          </div>
        ) : null}
        {badges ? <div className="flex flex-wrap items-center gap-1">{badges}</div> : null}
      </div>

      {actions ? (
        <div
          className={cn(
            "flex shrink-0 items-center gap-0.5 transition-opacity",
            // Mobile: luôn hiện (không có hover). Desktop: hiện khi hover/focus.
            "sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}

/** Khung con: thụt lề + connector mảnh, thu hẹp trên mobile để không tràn. */
export function HierarchyChildren({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "ml-3 space-y-1 border-l border-border/70 pl-1.5 sm:ml-5 sm:pl-2.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Skeleton đúng hình dạng node, thay cho spinner chung chung. */
export function HierarchySkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1.5" aria-busy role="status" aria-label="Đang tải cấu trúc phân cấp">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-lg px-1.5 py-1"
          style={{ paddingLeft: `${(i % 3) * 12 + 6}px` }}
        >
          <div className="h-6 w-6 shrink-0 animate-pulse rounded-md bg-muted" />
          <div className="h-3.5 flex-1 animate-pulse rounded bg-muted" style={{ maxWidth: `${60 - (i % 3) * 12}%` }} />
          <div className="h-4 w-8 shrink-0 animate-pulse rounded bg-muted/70" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline phân cấp theo thời gian — dùng cho Sổ lý lịch. Chia sẻ NodeIcon,
// spacing và typography với HierarchyRow để hai màn hình cùng ngôn ngữ.
// ---------------------------------------------------------------------------
export function HierarchyTimeline({ children }: { children: ReactNode }) {
  return (
    <ol className="relative ml-3 space-y-2.5 border-l border-border/70 pl-6 sm:pl-8">{children}</ol>
  );
}

export function HierarchyEvent({
  icon,
  tone = "muted",
  header,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  tone?: NodeTone;
  /** Hàng chip: ngày, loại sự kiện, mã tài sản, hành động. */
  header?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <li className="relative">
      <span className="absolute -left-[38px] rounded-full bg-background p-0.5 shadow-sm">
        <NodeIcon icon={icon} tone={tone} size="md" />
      </span>
      <div className="rounded-lg border border-border/60 bg-card/60 p-3 text-sm shadow-[0_1px_0_0_hsl(var(--border)/0.4)] transition-colors hover:border-border hover:bg-muted/40">
        {header ? <div className="flex flex-wrap items-center gap-2">{header}</div> : null}
        <div className="mt-1 text-sm font-medium leading-snug break-words [overflow-wrap:anywhere]">
          {title}
        </div>
        {description ? (
          <div className="mt-0.5 text-note text-muted-foreground">{description}</div>
        ) : null}
      </div>
    </li>
  );
}
