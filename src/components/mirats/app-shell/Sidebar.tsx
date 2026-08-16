import { useMemo } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { navGroups, isActive } from "@/lib/mirats/nav/nav-config";
import { useSession } from "@/hooks/use-session";
import { useNavBadges } from "@/hooks/use-nav-badges";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";


export function Sidebar({ onNavigate, collapsed, activeWsId }: { 
  onNavigate?: () => void; 
  collapsed?: boolean;
  activeWsId: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { hasRole } = useSession();
  const badges = useNavBadges();
  
  const allGroups = useMemo(() => navGroups(), []);
  
  const groups = useMemo(() => {
    return allGroups.filter(g => g.key === activeWsId);
  }, [allGroups, activeWsId]);

  const filteredGroups = useMemo(() => {
    return groups.map(group => ({
      ...group,
      items: group.items.filter(item => !item.roles || item.roles.some(r => hasRole(r)))
    })).filter(group => group.items.length > 0);
  }, [groups, hasRole]);

  return (
    <div className="flex flex-col gap-4 data-[density=compact]:gap-4 data-[density=comfortable]:gap-6 py-3 overflow-x-hidden">
      {filteredGroups.map((group) => {
        return (
          <div key={group.key} className={cn("px-3", collapsed && "px-2")}>
            {!collapsed && (
              <div className="astryx-text-label-bold mb-2 px-2.5 uppercase tracking-wider text-muted-foreground/60">
                {group.nhan}
              </div>
            )}
            <nav className="space-y-0.5 data-[density=comfortable]:space-y-1">
              {group.items.map((item) => {
                const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Circle;
                const active = isActive(pathname, item);

                const link = (
                  <Link
                    key={item.key}
                    to={item.route}
                    onClick={onNavigate}
                    className={cn(
                      "astryx-nav-item group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 font-medium transition-mirats-fast",
                      "h-8 data-[density=comfortable]:h-9 data-[density=comfortable]:rounded-lg data-[density=comfortable]:gap-2.5",
                      UI_DENSITY.TEXT_BODY,
                      active 
                        ? "bg-primary/8 text-primary font-semibold" 
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                      collapsed && "justify-center px-0 py-2.5 h-10"
                    )}
                  >
                    {active && !collapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary" />
                    )}
                    <div className="relative">
                      <Icon className={cn("h-4 w-4 shrink-0 data-[density=compact]:h-4 data-[density=compact]:w-4", active ? "text-primary" : "text-muted-foreground")} />
                      {collapsed && item.badgeKey && badges[item.badgeKey] > 0 && (
                        <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-sidebar bg-primary" />
                      )}
                    </div>
                    {!collapsed && <span className="truncate">{item.nhan}</span>}
                    {!collapsed && item.badgeKey && badges[item.badgeKey] > 0 && (
                      <div 
                        className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-bold text-primary data-[density=compact]:h-4 data-[density=compact]:min-w-4"
                        aria-label={`${badges[item.badgeKey]} việc cần xử lý`}
                      >
                        {badges[item.badgeKey] > 99 ? "99+" : badges[item.badgeKey]}
                      </div>
                    )}
                  </Link>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.key}>
                      <TooltipTrigger asChild>
                        {link}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.nhan}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return link;
              })}
            </nav>
          </div>
        );
      })}
    </div>
  );
}
