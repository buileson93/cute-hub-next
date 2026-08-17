import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  type Workspace,
  workspaces,
  firstItemOf,
} from "@/lib/mirats/nav-contract";
import { useSession } from "@/hooks/use-session";

interface MobileNavProps {
  activeWsId: string;
  wsLastRoute: Record<string, string>;
}

export function MobileNav({ activeWsId, wsLastRoute }: MobileNavProps) {
  const { hasRole } = useSession();
  const navigate = useNavigate();

  const visibleWorkspaces = workspaces.filter(
    (ws) => !ws.roles || ws.roles.some((r) => hasRole(r))
  );

  // Lọc ra các workspace chính cho thanh đáy (giống Sidebar Rail)
  const navWorkspaces = visibleWorkspaces.filter(
    (w) => w.id !== "trao-doi" && w.id !== "he-thong"
  );

  function gotoWorkspace(ws: Workspace) {
    const remembered = wsLastRoute[ws.id];
    const target =
      remembered && remembered.startsWith("/")
        ? remembered
        : firstItemOf(ws, hasRole);
    navigate({ to: target as never });
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch gap-1 border-t border-border bg-background/95 px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md md:hidden">
      {navWorkspaces.map((ws) => {
        const isActive = ws.id === activeWsId;
        return (
          <button
            key={ws.id}
            onClick={() => gotoWorkspace(ws)}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-1 text-[10px] font-medium transition-colors",
              isActive
                ? "text-[#0074e2]"
                : "text-muted-foreground hover:bg-[#0074e2]/5 hover:text-foreground"
            )}
          >
            <ws.icon className={cn("h-5 w-5", isActive ? "text-[#0074e2]" : "text-muted-foreground")} />
            <span className="truncate text-center leading-none">{ws.short}</span>
            {isActive && (
              <motion.div
                layoutId="active-nav-indicator"
                className="absolute -top-1 h-0.5 w-8 rounded-full bg-[#0074e2]"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
