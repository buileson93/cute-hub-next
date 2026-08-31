import React, { useState } from "react";
import { DashboardWidgetConfig } from "@/lib/mirats/dashboard/widget-registry";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/mirats/ui/Icon";
import { cn } from "@/lib/utils";

interface WidgetContainerProps {
  config: DashboardWidgetConfig;
  isEditing?: boolean;
  onRemove?: () => void;
  /** Kéo widget `fromId` tới vị trí của widget hiện tại */
  onDropWidget?: (fromId: string) => void;
  /** Di chuyển bằng bàn phím: -1 lên trước, +1 xuống sau */
  onMoveBy?: (delta: number) => void;
  children: React.ReactNode;
}

// Map column width (1-12) sang class tĩnh để Tailwind giữ được trong bundle.
const COL_SPAN: Record<number, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  10: "md:col-span-10",
  11: "md:col-span-11",
  12: "md:col-span-12",
};

export function WidgetContainer({
  config,
  isEditing,
  onRemove,
  onDropWidget,
  onMoveBy,
  children,
}: WidgetContainerProps) {
  const [dragging, setDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      data-widget-id={config.id}
      onDragOver={(e) => {
        if (!isEditing) return;
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        if (!isEditing) return;
        e.preventDefault();
        setIsOver(false);
        const fromId = e.dataTransfer.getData("text/widget-id");
        if (fromId) onDropWidget?.(fromId);
      }}
      className={cn(
        "group relative col-span-1 rounded-[var(--radius-container)] motion-safe:transition-[box-shadow,opacity] motion-safe:duration-200",
        COL_SPAN[config.w] || "md:col-span-12",
        isEditing && "ring-1 ring-primary/20 ring-offset-2 ring-offset-background",
        isOver && "ring-2 ring-primary/60",
        dragging && "opacity-60",
      )}
    >
      {isEditing && (
        <div className="absolute -top-2 right-2 z-20 flex items-center gap-1">
          <button
            type="button"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/widget-id", config.id);
              e.dataTransfer.effectAllowed = "move";
              setDragging(true);
            }}
            onDragEnd={() => setDragging(false)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                onMoveBy?.(-1);
              }
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                onMoveBy?.(1);
              }
            }}
            aria-label={`Kéo để sắp xếp widget ${config.title}. Dùng phím mũi tên để di chuyển.`}
            className="flex h-6 items-center gap-1 rounded-full border border-border bg-card px-2 text-muted-foreground shadow-sm cursor-grab active:cursor-grabbing touch-none hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Icon name="action.drag" size="tiny" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Kéo</span>
          </button>
          <Button
            variant="destructive"
            size="icon"
            className="h-6 w-6 rounded-full shadow-sm"
            onClick={onRemove}
            aria-label={`Gỡ widget ${config.title}`}
          >
            <Icon name="action.remove" size="tiny" />
          </Button>
        </div>
      )}
      <div className="h-full">{children}</div>
    </div>
  );
}
