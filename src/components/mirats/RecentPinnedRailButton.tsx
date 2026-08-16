import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RecentPinnedPanel } from "./RecentPinnedFlyout";

/**
 * Nút trên thanh rail — mở popover danh sách Ghim + Gần đây.
 */
export function RecentPinnedRailButton() {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Ghim và trang gần đây"
              className="flex w-[54px] flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-meta font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Bookmark className="h-5 w-5" strokeWidth={1.8} />
              <span className="w-full truncate text-center leading-tight">Ghim</span>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">Ghim & Gần đây</TooltipContent>
      </Tooltip>
      <PopoverContent side="right" align="end" className="w-80 p-3">
        <RecentPinnedPanel onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
