import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ProductTourProvider, useProductTour,
} from "@/components/mirats/ProductTour";
import { cn } from "@/lib/utils";
import { AiChatButton } from "@/components/mirats/AiChatButton";
import { useRouteTracker } from "@/hooks/use-route-tracker";
import { CommandPalette } from "@/components/mirats/CommandPalette";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { useQueryClient } from "@tanstack/react-query";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";

import {
  type Workspace,
  workspaces,
  routeTitles,
  resolveActiveWorkspace,
  firstItemOf,
} from "@/lib/mirats/nav-contract";

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
        <div className="flex min-h-dvh w-full bg-gradient-to-br from-background via-background to-primary/[0.045] text-foreground">
          {/* Rail (Desktop) */}
          <aside className="hidden w-16 shrink-0 flex-col items-center border-r border-sidebar-border bg-gradient-to-b from-sidebar via-sidebar to-sidebar/92 py-4 md:flex">
            <SidebarLogoRail />
            <nav data-tour="rail" className="flex flex-1 flex-col items-center gap-1.5">
              {railWorkspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => gotoWorkspace(ws)}
                  className={cn(
                    "group relative flex w-[54px] flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9.5px] font-medium transition-colors",
                    ws.id === activeWs.id ? "bg-accent text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <ws.icon className="h-5 w-5" />
                  <span className="w-full truncate text-center leading-tight">{ws.short}</span>
                  {ws.id === activeWs.id && (
                    <motion.div 
                      layoutId="active-ws"
                      className="absolute -right-[1px] top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-l-full bg-primary"
                    />
                  )}
                </button>
              ))}
            </nav>
            {adminWs && (
              <div className="mt-auto pt-2 border-t border-sidebar-border">
                <button
                  onClick={() => gotoWorkspace(adminWs)}
                  className={cn(
                    "flex w-[54px] flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9.5px] font-medium transition-colors",
                    adminWs.id === activeWs.id ? "bg-accent text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <adminWs.icon className="h-5 w-5" />
                  <span className="w-full truncate text-center leading-tight">{adminWs.short}</span>
                </button>
              </div>
            )}
          </aside>

          {/* Sub-sidebar (Desktop) */}
          <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar/30 md:flex">
            <div className="flex h-14 items-center border-b px-6 font-bold tracking-tight">
              {activeWs.label}
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar />
            </div>
          </aside>

          {/* Main content area */}
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md md:px-6">
               <div className="flex items-center gap-4">
                  <Link to="/" className="md:hidden"><SidebarLogoRail /></Link>
                  <div className="hidden md:block"><TourButton /></div>
                  <TopBar />
               </div>
               <div className="flex items-center gap-3">
                  <UserMenu />
               </div>
            </header>
            <main className="flex-1 min-w-0 overflow-y-auto pb-16 md:pb-0">{children}</main>
          </div>
          
          <MobileNav activeWsId={activeWs.id} wsLastRoute={wsLastRoute} />
          <AiChatButton />

          <CommandPalette />
        </div>
      </TooltipProvider>
    </ProductTourProvider>
  );
}
