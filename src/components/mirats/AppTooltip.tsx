// ============================================================================
// Task 29 — AppTooltip: wrapper chuẩn cho tooltip ngắn toàn hệ thống.
// Dựa trên Radix Tooltip (shadcn) nhưng bọc lại để mọi nơi có:
//  - delay mở nhất quán (200ms)
//  - side/align hợp lý
//  - a11y sẵn (focusable trigger)
// ============================================================================
import * as React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface AppTooltipProps {
  noiDung: React.ReactNode;
  children: React.ReactElement;
  ben?: "top" | "right" | "bottom" | "left";
  canhLe?: "start" | "center" | "end";
  /** Trễ mở, ms — mặc định 200. */
  treMo?: number;
  className?: string;
}

export function AppTooltip({
  noiDung, children, ben = "top", canhLe = "center", treMo = 200, className,
}: AppTooltipProps) {
  if (noiDung == null || noiDung === "") return children;
  return (
    <TooltipProvider delayDuration={treMo} skipDelayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={ben} align={canhLe} className={className}>
          {noiDung}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
