import { ReactNode, useEffect, useState, Suspense, lazy } from "react";
import { Search, Activity, Wifi, WifiOff, Loader2, Command as CommandIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleToggle = () => setOpen((prev) => !prev);

    window.addEventListener("mirats:open-command-palette", handleOpen);
    window.addEventListener("mirats:toggle-command-palette", handleToggle);
    
    return () => {
      window.removeEventListener("mirats:open-command-palette", handleOpen);
      window.removeEventListener("mirats:toggle-command-palette", handleToggle);
    };
  }, []);

  return (
    <div className="flex h-full items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {renderMobileMenu}
        
        <div className="relative w-full sm:max-w-sm group" data-tour="search">
          <Button
            variant="ghost"
            className="h-9 w-full flex justify-between items-center rounded-xl bg-muted/40 px-0 text-[13px] font-normal text-muted-foreground border border-transparent hover:border-primary/20 hover:bg-muted/60 transition-all shadow-sm relative overflow-hidden active:scale-[0.98]"
            onClick={handleOpenSearch}
            aria-label="Mở tìm kiếm PowerSearch"
          >
            <div className="flex items-center gap-2 pl-3 min-w-0 flex-1 overflow-hidden pointer-events-none">
              <Search className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate text-left flex-1 min-w-0">Tìm tài sản, hệ thống, biên bản...</span>
            </div>
            
            <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-border/40 bg-background/50 backdrop-blur-sm px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted-foreground/60 mr-2 shrink-0 self-center">
              <CommandIcon className="h-2.5 w-2.5" />
              <span>K</span>
            </div>
          </Button>
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
