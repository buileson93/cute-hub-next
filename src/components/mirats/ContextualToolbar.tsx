// Floating micro-toolbar hiện khi user chọn 1+ row trong bảng lớn.
// - Auto-hide khi ESC hoặc click ngoài.
// - Bulk (>1 row) → chỉ hiện action supportsBulk.
// - Không có anchor → hiển thị fixed ở bottom-center (fallback an toàn).
import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useContextualPosition,
  type AnchorRect,
} from "@/hooks/use-contextual-position";

export interface ContextualAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  supportsBulk?: boolean;
  variant?: "default" | "outline" | "ghost" | "destructive";
}

export interface ContextualToolbarProps {
  selectionCount: number;
  actions: ContextualAction[];
  anchor?: AnchorRect | null;
  onDismiss: () => void;
  className?: string;
  /** Truncate to N actions (default 3). */
  maxActions?: number;
}

export function ContextualToolbar({
  selectionCount,
  actions,
  anchor = null,
  onDismiss,
  className,
  maxActions = 3,
}: ContextualToolbarProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isBulk = selectionCount > 1;

  const visible = useMemo(() => {
    const filtered = isBulk ? actions.filter((a) => a.supportsBulk) : actions;
    return filtered.slice(0, maxActions);
  }, [actions, isBulk, maxActions]);

  const pos = useContextualPosition(anchor, ref);

  useEffect(() => {
    if (selectionCount === 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    function onDown(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onDismiss();
    }
    window.addEventListener("keydown", onKey);
    // Delay để tránh dismiss ngay khi vừa hiện.
    const id = window.setTimeout(
      () => window.addEventListener("mousedown", onDown),
      0,
    );
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [selectionCount, onDismiss]);

  if (selectionCount === 0 || visible.length === 0) return null;
  if (typeof document === "undefined") return null;

  const style: React.CSSProperties = pos
    ? { position: "fixed", top: pos.top, left: pos.left, zIndex: 60 }
    : {
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 60,
      };

  return createPortal(
    <div
      ref={ref}
      role="toolbar"
      aria-label={`Hành động cho ${selectionCount} mục đã chọn`}
      style={style}
      className={cn(
        "flex items-center gap-1 rounded-full border bg-background/95 px-2 py-1 shadow-lg backdrop-blur",
        "animate-in fade-in slide-in-from-bottom-2 duration-[var(--duration-base,180ms)]",
        className,
      )}
    >
      <span className="px-2 text-xs font-medium text-muted-foreground">
        {selectionCount} đã chọn
      </span>
      <div className="mx-1 h-4 w-px bg-border" />
      {visible.map((a) => {
        const Icon = a.icon;
        return (
          <Button
            key={a.id}
            size="icon"
            variant={a.variant ?? "ghost"}
            className="rounded-full px-2"
            onClick={a.onSelect}
          >
            {Icon ? <Icon className="mr-1 h-3.5 w-3.5" /> : null}
            {a.label}
          </Button>
        );
      })}
      <div className="mx-1 h-4 w-px bg-border" />
      <Button
        size="sm"
        variant="ghost"
        className="rounded-full p-0"
        onClick={onDismiss}
        aria-label="Đóng thanh hành động"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>,
    document.body,
  );
}
