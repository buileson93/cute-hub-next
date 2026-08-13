import { ReactNode, useEffect, useState } from "react";
import { Search, Activity, Wifi, WifiOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "../NotificationBell";
import { QrScanButton } from "../QrScanButton";
import { TzClock } from "../TzClock";
import { RecentPinnedRailButton } from "../RecentPinnedRailButton";
import { HeartBeatHeader } from "../dashboard/HeartBeatHeader";
import { DesktopOnly } from "../DesktopOnly";
import { useRealtimeStatus } from "@/hooks/use-realtime-status";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function TopBar({ renderMobileMenu }: { renderMobileMenu?: ReactNode }) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform));
  }, []);

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent("mirats:open-command-palette"));
  };

  return (
    <div className="flex h-full items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {renderMobileMenu}
        <div className="relative w-full max-w-sm" data-tour="search">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm tài sản, sự cố, hồ sơ..."
            className="h-9 w-full cursor-pointer rounded-full bg-muted/50 pl-9 pr-4 text-sm focus-visible:ring-1"
            readOnly
            onClick={handleOpenSearch}
            onFocus={handleOpenSearch}
            aria-label="Mở bảng lệnh tìm kiếm"
          />
          <div className="absolute right-3 top-2 hidden items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">{isMac ? "⌘" : "Ctrl"}</span>K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <RealtimeStatusIndicator />
        <QrScanButton />
        
        <div className="hidden md:block">
          <RecentPinnedRailButton />
        </div>

        <NotificationBell />

        <div className="hidden md:block">
          <TzClock />
        </div>
      </div>
    </div>
  );
}

function RealtimeStatusIndicator() {
  const { status } = useRealtimeStatus();

  const config = {
    connecting: { icon: Loader2, color: "text-muted-foreground animate-spin", label: "Đang kết nối realtime..." },
    connected: { icon: Wifi, color: "text-emerald-500", label: "Realtime trực tuyến" },
    disconnected: { icon: WifiOff, color: "text-orange-500", label: "Realtime ngoại tuyến (đang dùng fallback)" },
    error: { icon: Activity, color: "text-destructive", label: "Lỗi kết nối Realtime" },
  }[status];

  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted/50 cursor-help transition-colors">
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs font-medium">{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


