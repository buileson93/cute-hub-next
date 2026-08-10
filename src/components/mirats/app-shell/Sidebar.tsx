import { type ReactNode, useMemo } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { navGroups, isActive } from "@/lib/mirats/nav/nav-config";
import { useSession } from "@/hooks/use-session";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Sidebar({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { hasRole } = useSession();
  
  const groups = useMemo(() => navGroups(), []);

  return (
    <div className="flex flex-col gap-8 py-4">
      {groups.map((group) => {
        const visibleItems = group.items.filter(item => {
          // Note: In nav-config.ts, groups are already filtered or items are tagged.
          // For now we assume navGroups() returns what's relevant.
          return true;
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={group.key} className={cn("px-3", collapsed && "px-2")}>
            {!collapsed && (
              <h3 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                {group.nhan}
              </h3>
            )}
            <nav className="space-y-1.5">
              {visibleItems.map((item) => {
                const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Circle;
                const active = isActive(pathname, item);

                return (
                  <Tooltip key={item.key}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.route}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active 
                            ? "bg-primary/10 text-primary" 
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                          collapsed && "justify-center px-0 py-2.5"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                        {!collapsed && <span className="truncate">{item.nhan}</span>}
                        {item.badgeKey && (
                           <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={cn("md:hidden", collapsed && "md:block")}>
                      {item.nhan}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>
          </div>
        );
      })}
    </div>
  );
}
