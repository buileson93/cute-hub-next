import { ReactNode, useEffect, useState, Suspense, lazy } from "react";
import { Search, Activity, Wifi, WifiOff, Loader2, Command as CommandIcon } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { NotificationBell } from "../NotificationBell";
import { CommandPaletteButton } from "../CommandPaletteButton";
import { QrScanButton } from "../QrScanButton";
import { TzClock } from "../TzClock";
import { RecentPinnedRailButton } from "../RecentPinnedRailButton";
import { useRealtimeStatus } from "@/hooks/use-realtime-status";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { cn } from "@/lib/utils";

const PowerSearch = lazy(() =>
  import("../search/PowerSearch").then((m) => ({ default: m.PowerSearch })),
);

export function TopBar({ renderMobileMenu }: { renderMobileMenu?: ReactNode }) {
  const [isMac, setIsMac] = useState(false);

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
          <button
            id="powersearch-trigger"
            type="button"
            className="h-8 w-full flex items-center justify-between rounded-full bg-[#0074e2]/5 px-3 text-[13px] font-normal text-muted-foreground border border-[#0074e2]/10 hover:bg-[#0074e2]/10 hover:text-[#0074e2] transition-all active:scale-[0.98] cursor-pointer group/search shadow-sm"
            onClick={handleOpenSearch}
            aria-label="Mở tìm kiếm PowerSearch"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden pointer-events-none">
              <Search className="h-4 w-4 text-[#0074e2] shrink-0 transition-transform group-hover/search:scale-110" />
              <span className="truncate text-left min-w-0 font-medium">
                Tìm tài sản, hệ thống, biên bản...
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-[#0074e2]/20 bg-background/50 backdrop-blur-sm px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#0074e2]/60 shrink-0 self-center ml-2">
              <CommandIcon className="h-2.5 w-2.5" />
              <span>K</span>
            </div>
          </button>
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
          <AppTooltip
            ben="bottom"
            noiDung={
              <div className="max-w-xs whitespace-pre-wrap text-[11px] leading-relaxed">
                {"For the code present, I get the error below.\n\nPlease think step-by-step in order to resolve it.\n```\nTypeError: Cannot read properties of null (reading 'rpc')\n\n{\n  \"timestamp\": 1787483161643,\n  \"error_type\": \"RUNTIME_ERROR\",\n  \"filename\": \"http://localhost:8080/_serverFn/eyJmaWxlIjoiL3NyYy9saWIvbWlyYXRzL2RhdGEtcXVhbGl0eS5mdW5jdGlvbnMudHM_dHNzLXNlcnZlcmZuLXNwbGl0IiwiZXhwb3J0IjoiYW5hbHl6ZVJldmlld1F1ZXVlX2NyZWF0ZVNlcnZlckZuX2hhbmRsZXIifQ\",\n  \"lineno\": 0,\n  \"colno\": 0,\n  \"stack\": \"TypeError: Cannot read properties of null (reading 'rpc')\\n    at assertAdmin (/dev-server/src/lib/mirats/data-quality.functions.ts:25:42)\\n    at Object.missingRequired (/dev-server/src/lib/mirats/data-quality.functions.ts:102:11)\\n    at server (/dev-server/node_modules/@tanstack/start-client-core/src/createServerFn.ts:944:38)\\n    at callNextMiddleware (/dev-server/node_modules/@tanstack/start-client-core/src/createServerFn.ts:322:30)\\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\\n    at async userNext (/dev-server/node_modules/@tanstack/start-client-core/src/createServerFn.ts:312:26)\",\n  \"has_blank_screen\": true\n}\n```\n"}
              </div>
            }
          >
            <TzClock />
          </AppTooltip>
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
    connecting: {
      icon: Loader2,
      color: "text-muted-foreground animate-spin",
      label: "Đang kết nối realtime...",
    },
    connected: { icon: Wifi, color: "text-emerald-500", label: "Realtime trực tuyến" },
    disconnected: {
      icon: WifiOff,
      color: "text-orange-500",
      label: "Realtime ngoại tuyến (đang dùng fallback)",
    },
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
