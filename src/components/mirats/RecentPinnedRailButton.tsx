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
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[#0074e2]/10 hover:text-[#0074e2]"
            >
              <Bookmark className="h-[18px] w-[18px]" strokeWidth={1.8} />
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
