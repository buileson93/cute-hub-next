import { ReactNode, useEffect, useState } from "react";
import { Search, Activity, Wifi, WifiOff, Loader2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link, useRouterState } from "@tanstack/react-router";
import { NotificationBell } from "../NotificationBell";
import { QrScanButton } from "../QrScanButton";
import { TzClock } from "../TzClock";
import { RecentPinnedRailButton } from "../RecentPinnedRailButton";
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform));
  }, []);

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent("mirats:open-command-palette"));
  };

  // Simple breadcrumb logic based on pathname
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    // Convert kebab-case to Title Case (simple version)
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    return { href, label };
  });

  return (
    <div className="flex h-full items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {renderMobileMenu}
        
        <DesktopOnly>
          <Breadcrumb className="hidden xl:block mr-2">
            <BreadcrumbList className="flex-nowrap">
              {breadcrumbs.map((bc, i) => (
                <div key={bc.href} className="flex items-center">
                  <BreadcrumbItem>
                    {i === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage className="max-w-[100px] truncate text-[11px]">{bc.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={bc.href as any} className="max-w-[80px] truncate text-[11px]">{bc.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {i < breadcrumbs.length - 1 && <BreadcrumbSeparator className="mx-0.5" />}
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </DesktopOnly>

        <div className="relative w-full max-w-sm" data-tour="search">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm tài sản, sự cố..."
            className="h-8 w-full cursor-pointer rounded-full bg-muted/40 pl-9 pr-4 text-[13px] focus-visible:ring-1 border-transparent hover:border-border transition-mirats-fast"
            readOnly
            onClick={handleOpenSearch}
            onFocus={handleOpenSearch}
            aria-label="Mở bảng lệnh tìm kiếm"
          />
          <div className="absolute right-3 top-1.5 hidden items-center gap-1 rounded border bg-background px-1.5 font-mono text-[9px] font-medium opacity-100 sm:flex">
            <span className="text-[10px]">{isMac ? "⌘" : "Ctrl"}</span>K
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
          <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted cursor-help transition-mirats-fast active:scale-[var(--scale-active)]">
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


