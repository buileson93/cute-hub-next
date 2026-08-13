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

/**
 * Task 29 — AppTooltip: wrapper chuẩn cho tooltip ngắn toàn hệ thống.
 * Tự động thêm aria-label nếu children là button hoặc có role="button".
 */
export function AppTooltip({
  noiDung, children, ben = "top", canhLe = "center", treMo = 200, className,
}: AppTooltipProps) {
  if (noiDung == null || noiDung === "") return children;

  // Tự động bổ sung aria-label cho các phần tử tương tác nếu chưa có
  const interactiveTypes = ['button', 'a'];
  const childType = children.type as any;
  const isInteractive = interactiveTypes.includes(childType) || (children.props as any)?.role === 'button';
  
  const clonedElement = isInteractive && !(children.props as any)?.['aria-label'] && typeof noiDung === 'string'
    ? React.cloneElement(children, { 'aria-label': noiDung } as any)
    : children;

  return (
    <TooltipProvider delayDuration={treMo} skipDelayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>{clonedElement}</TooltipTrigger>
        <TooltipContent side={ben} align={canhLe} className={className}>
          {noiDung}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
