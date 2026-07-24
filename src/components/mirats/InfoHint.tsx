import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Nút icon "i" nhỏ hiển thị hướng dẫn dạng hover — giúp tinh gọn giao diện,
 * thay cho các dòng mô tả dài đặt dưới tiêu đề trang.
 */
export function InfoHint({
  children,
  side = "right",
  align = "end",
  className,
}: {
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Hướng dẫn"
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              className,
            )}
          >
            <Info className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={12}
          className="max-w-xs text-sm leading-relaxed"
        >
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
