import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ProductTourProvider, useProductTour,
} from "@/components/mirats/ProductTour";
import { cn } from "@/lib/utils";
import { AiChatButton } from "@/components/mirats/AiChatButton";
import { useRouteTracker } from "@/hooks/use-route-tracker";

import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { useUserPref } from "@/hooks/use-user-pref";
import { useQueryClient } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";


import {
  type Workspace,
  workspaces,
  routeTitles,
  resolveActiveWorkspace,
  firstItemOf,
} from "@/lib/mirats/nav-contract";
import { type UiDensityMode, UI_DENSITY } from "@/lib/mirats/ui/ui-density";

import { 
  SidebarLogoRail, 
  UserMenu, 
  TourButton, 
  TOUR_STEPS 
} from "./index";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";



/** Tự động mở tour MỘT LẦN cho mỗi tài khoản ở lần đăng nhập đầu tiên. */
function TourAutoStart({
  userId,
  seen,
  onSeen,
}: {
  userId: string | null;
  seen: boolean;
  onSeen: () => void;
}) {
  const { start } = useProductTour();
  const ran = useRef(false);
  useEffect(() => {
    if (!userId || seen || ran.current) return;
    ran.current = true;
    const t = setTimeout(() => {
      start({ force: true });
      void supabase
        .from("profiles")
        .update({ tour_hoan_thanh: true })
        .eq("id", userId)
        .then(() => onSeen());
    }, 900);
    return () => clearTimeout(t);
  }, [userId, seen, start, onSeen]);
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, hasRole, loading, refresh, session } = useSession();
  const navigate = useNavigate();
  useRouteTracker();

  const [wsLastRoute, setWsLastRoute] = useState<Record<string, string>>({});
  const [flyoutWs, setFlyoutWs] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredWsId, setHoveredWsId] = useState<string | null>(null);

  const [density] = useUserPref<UiDensityMode>("ui-density", "compact");


  useEffect(() => {
    const saved = localStorage.getItem("mirats-sidebar-collapsed");
    // Mặc định là thu gọn (true)
    if (saved === "0") {
      setIsCollapsed(false);
    } else {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mirats-ws-last-route");
      if (raw) setWsLastRoute(JSON.parse(raw) as Record<string, string>);
    } catch { /* ignore */ }
  }, []);

  const visibleWorkspaces = useMemo(
    () => workspaces.filter((ws) => !ws.roles || ws.roles.some((r) => hasRole(r))),
    [hasRole]
  );

  const railWorkspaces = useMemo(
    () => visibleWorkspaces.filter((w) => w.id !== "trao-doi" && w.id !== "he-thong"),
    [visibleWorkspaces]
  );
  
  const adminWs = useMemo(
    () => visibleWorkspaces.find((w) => w.id === "he-thong") ?? null,
    [visibleWorkspaces]
  );

  const activeWsId = resolveActiveWorkspace(pathname);
  const activeWs = visibleWorkspaces.find((w) => w.id === activeWsId) ?? visibleWorkspaces[0] ?? workspaces[0];

  useEffect(() => {
    setWsLastRoute((prev) => {
      if (prev[activeWs.id] === pathname) return prev;
      const next = { ...prev, [activeWs.id]: pathname };
      localStorage.setItem("mirats-ws-last-route", JSON.stringify(next));
      return next;
    });
  }, [activeWs.id, pathname]);

  function gotoWorkspace(ws: Workspace) {
    const remembered = wsLastRoute[ws.id];
    const target = remembered && resolveActiveWorkspace(remembered) === ws.id
        ? remembered
        : firstItemOf(ws, hasRole);
    navigate({ to: target as never });
  }

  return (
    <ProductTourProvider steps={TOUR_STEPS}>
      <TourAutoStart
        userId={!loading && session && profile ? profile.id : null}
        seen={profile?.tour_hoan_thanh ?? true}
        onSeen={refresh}
      />
      <TooltipProvider delayDuration={300}>
        <div 
          data-density={density}
          className="astryx-shell"
          data-astryx-layout="shell"
        >
          {/* Desktop Navigation Container */}
          <div 
            className="astryx-nav-container hidden md:flex"
            data-astryx-region="nav-container"
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => {
              setIsHovered(false);
              setHoveredWsId(null);
            }}
          >
            {/* Rail (Desktop) */}
            <aside 
              className="astryx-rail"
              data-astryx-region="rail"
            >
              <SidebarLogoRail />
              <nav data-tour="rail" className="flex flex-1 flex-col items-center gap-1 data-[density=compact]:gap-1 comfortable:gap-2">
                {railWorkspaces.map((ws) => (
                  <Tooltip key={ws.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => gotoWorkspace(ws)}
                        onPointerEnter={() => setHoveredWsId(ws.id)}
                        className={cn(
                          "group relative flex items-center justify-center transition-mirats-fast rounded-full",
                          "w-9 h-9 data-[density=comfortable]:w-10 data-[density=comfortable]:h-10 data-[density=comfortable]:rounded-xl data-[density=comfortable]:flex-col active:scale-95",
                          ws.id === activeWs.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        )}
                        data-active={ws.id === activeWs.id}
                      >
                        <ws.icon className="h-[18px] w-[18px] data-[density=comfortable]:h-5 data-[density=comfortable]:w-5" />
                        <span className="w-full truncate text-center leading-tight text-[9.5px] font-medium hidden data-[density=comfortable]:block">
                          {ws.short}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{ws.label}</TooltipContent>
                  </Tooltip>
                ))}
              </nav>
              {adminWs && (
                <div className="mt-auto pt-2 border-t border-sidebar-border">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => gotoWorkspace(adminWs)}
                        onPointerEnter={() => setHoveredWsId(adminWs.id)}
                        className={cn(
                          "flex items-center justify-center rounded-full transition-mirats-fast",
                          "w-9 h-9 data-[density=comfortable]:w-10 data-[density=comfortable]:h-10 data-[density=comfortable]:rounded-xl data-[density=comfortable]:flex-col",
                          adminWs.id === activeWs.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 active:scale-95" : "text-muted-foreground hover:bg-primary/10 hover:text-primary active:scale-95 transition-colors"
                        )}
                      >
                        <adminWs.icon className="h-[18px] w-[18px] data-[density=comfortable]:h-5 data-[density=comfortable]:w-5" />
                        <span className="w-full truncate text-center leading-tight text-[9.5px] font-medium hidden data-[density=comfortable]:block">
                          {adminWs.short}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{adminWs.label}</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </aside>

            {/* Sub-sidebar (Desktop) */}
            <aside 
              className="astryx-sidebar"
              data-astryx-region="sidebar"
              data-collapsed={isCollapsed && !isHovered}
            >
              <div className={cn(
                "flex items-center border-b px-3 data-[density=comfortable]:px-4 font-bold tracking-tight overflow-hidden whitespace-nowrap transition-[padding,opacity,width] duration-300",
                UI_DENSITY.APP_HEADER_H,
                (isCollapsed && !isHovered) && "opacity-0"
              )}>
                {(hoveredWsId ? visibleWorkspaces.find(w => w.id === hoveredWsId) : activeWs)?.label}
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <Sidebar 
                  collapsed={isCollapsed && !isHovered} 
                  activeWsId={hoveredWsId || activeWs.id}
                />
              </div>
            </aside>
          </div>

          {/* Main content area */}
          <div className="astryx-main-wrapper" data-astryx-region="main-wrapper">
            <header 
              className="astryx-topbar"
              data-astryx-region="topbar"
            >

               <div className="flex flex-1 items-center gap-4">
                  <div className="md:hidden shrink-0"><SidebarLogoRail /></div>
                  <div className="hidden md:block"><TourButton /></div>
                  <TopBar 
                    renderMobileMenu={
                      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                            <Menu className="h-5 w-5" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[86vw] p-0 focus:outline-none">
                          <SheetHeader className="border-b h-14 px-6 flex flex-row items-center gap-2">
                             <SidebarLogoRail />
                             <SheetTitle className="text-sm font-bold">MIRATS</SheetTitle>
                          </SheetHeader>
                          <div className="overflow-y-auto h-[calc(100dvh-3.5rem)]">
                             <Sidebar 
                               activeWsId={activeWs.id}
                               onNavigate={() => setIsMobileMenuOpen(false)} 
                             />
                          </div>
                        </SheetContent>
                      </Sheet>
                    }
                  />
               </div>
               <div className="flex items-center gap-3">
                  <div className="astryx-user-menu-wrapper"><UserMenu /></div>
               </div>
            </header>
            <main className="astryx-content" data-astryx-region="content">{children}</main>
          </div>
          
          <MobileNav activeWsId={activeWs.id} wsLastRoute={wsLastRoute} />
          <AiChatButton />

          
        </div>
      </TooltipProvider>
    </ProductTourProvider>
  );
}
