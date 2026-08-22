import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/mirats/ui/Icon";
import {
  AVAILABLE_WIDGETS,
  WidgetType,
  DashboardWidgetConfig,
} from "@/lib/mirats/dashboard/widget-registry";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface WidgetPickerProps {
  currentLayout: DashboardWidgetConfig[];
  onAdd: (type: WidgetType) => void;
  trigger?: React.ReactNode;
}

export function WidgetPicker({ currentLayout, onAdd, trigger }: WidgetPickerProps) {
  const [open, setOpen] = useState(false);
  const currentTypes = new Set(currentLayout.map((w) => w.type));

  const available = Object.entries(AVAILABLE_WIDGETS).map(([type, info]) => ({
    type: type as WidgetType,
    ...info,
    isAdded: currentTypes.has(type as WidgetType),
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Icon name="action.add" size="tiny" />
            Thêm Widget
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm Widget vào Dashboard</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            {available.map((widget) => (
              <div
                key={widget.type}
                className={cn(
                  "p-4 rounded-xl border flex flex-col items-start gap-3 transition-all",
                  widget.isAdded
                    ? "bg-muted/50 opacity-60"
                    : "hover:bg-primary/5 hover:border-primary/30 cursor-pointer",
                )}
                onClick={() => {
                  if (!widget.isAdded) {
                    onAdd(widget.type);
                    setOpen(false);
                  }
                }}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon name={widget.icon as any} size="small" className="text-primary" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold truncate">{widget.title}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                      {widget.defaultWidth} Cột
                    </p>
                  </div>
                </div>
                {!widget.isAdded && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full h-8 text-[11px] font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Thêm ngay
                  </Button>
                )}
                {widget.isAdded && (
                  <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                    <Icon name="status.success" size="tiny" /> Đã có
                  </span>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
