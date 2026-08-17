import { ReactNode, useEffect, useState, Suspense, lazy } from "react";
import { Search, Activity, Wifi, WifiOff, Loader2, Command as CommandIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouterState } from "@tanstack/react-router";
import { NotificationBell } from "../NotificationBell";
import { CommandPaletteButton } from "../CommandPaletteButton";
import { QrScanButton } from "../QrScanButton";
import { TzClock } from "../TzClock";
import { RecentPinnedRailButton } from "../RecentPinnedRailButton";
import { useRealtimeStatus } from "@/hooks/use-realtime-status";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { cn } from "@/lib/utils";

const PowerSearch = lazy(() => import("../search/PowerSearch").then(m => ({ default: m.PowerSearch })));

export function TopBar({ renderMobileMenu }: { renderMobileMenu?: ReactNode }) {
  const [isMac, setIsMac] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform));
  }, []);

  const handleOpenSearch = () => {
    setOpen(true);
  };

  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-full items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {renderMobileMenu}
        
        <div className="relative w-full max-w-sm" data-tour="search">
          <Input
            type="search"
            placeholder="Tìm tài sản, sự cố..."
            className="h-8 w-full cursor-pointer rounded-full bg-muted/40 pl-10 pr-4 text-[13px] focus-visible:ring-1 focus-visible:ring-[#0074e2] border-transparent hover:border-border transition-mirats-fast astryx-input"
            readOnly
            onClick={handleOpenSearch}
            onFocus={handleOpenSearch}
            aria-label="Mở bảng lệnh tìm kiếm"
          />
          <Search className="absolute left-3.5 top-2 h-4 w-4 text-[#0074e2] pointer-events-none z-10" />
          <div className="absolute right-3 top-1.5 hidden items-center gap-1 rounded border bg-background px-1.5 font-mono text-[9px] font-medium opacity-100 sm:flex">
            <span className="text-[10px]">{isMac ? "⌘" : "Ctrl"}</span>K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <RealtimeStatusIndicator />
        <CommandPaletteButton />
        <QrScanButton />
        
        <div className="hidden md:block">
          <RecentPinnedRailButton />
        </div>

        <NotificationBell />

        <div className="hidden md:block">
          <TzClock />
        </div>
      </div>

      <Suspense fallback={null}>
        <PowerSearch open={open} onOpenChange={setOpen} />
      </Suspense>
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
    <AppTooltip noiDung={<p className="text-xs font-medium">{config.label}</p>} ben="bottom">
      <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#0074e2]/10 cursor-help transition-mirats-fast active:scale-[var(--scale-active)]">
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
    </AppTooltip>
  );
}
