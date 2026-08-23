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

const PowerSearch = lazy(() =>
  import("../search/PowerSearch").then((m) => ({ default: m.PowerSearch })),
);

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
                For the code present, I get the error below.
                {"\n\n"}
                Please think step-by-step in order to resolve it.
                {"\n"}
                ```
                {"\n"}
                build failed with exit status 1: Build failed with 1 error:
                {"\n\n"}
                [plugin @tailwindcss/vite:generate:build] /dev-server/src/styles.css?transform-only
                {"\n"}
                CssSyntaxError: Missing opening {"{"}
                {"\n"}
                at Te (file:///dev-server/node_modules/tailwindcss/dist/chunk-3IR7ZFJX.mjs:1:3079)
                {"\n"}
                at Rf (file:///dev-server/node_modules/tailwindcss/dist/chunk-3IR7ZFJX.mjs:38:1384)
                {"\n"}
                at hu (file:///dev-server/node_modules/@tailwindcss/node/dist/index.mjs:10:…
                {"\n\n"}
                stderr:
                {"\n"}
                ject.buildApp (file:///dev-server/node_modules/@tanstack/start-plugin-core/dist/esm/vite/plugin.js:113:8)
                {"\n"}
                at async Object.buildApp (file:///dev-server/node_modules/vite/dist/node/chunks/node.js:33667:6)
                {"\n"}
                at async CAC.{"<anonymous>"} (file:///dev-server/node_modules/vite/dist/node/cli.js:777:3) {"{"}
                {"\n"}
                errors: [Getter/Setter]
                {"\n"}
                {"}"}
                {"\n"}
                error: script "build:dev" exited with code 1
                {"\n\n"}
                stdout:
                {"\n"}
                vite v8.0.16 building client environment for development...
                {"\n\r"}
                transforming...✓ 6963 modules transformed.
                {"\n\n"}
                If these errors do not contain enough detail to identify the fix, run lovable build diagnostics br_e766382a-5547-4d60-bf25-36bdc93479f4 --json with code--exec.
                {"\n"}
                ```
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
