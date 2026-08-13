import { useMemo } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { navGroups, isActive } from "@/lib/mirats/nav/nav-config";
import { useSession } from "@/hooks/use-session";
import { useNavBadges } from "@/hooks/use-nav-badges";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
    <div className="flex flex-col gap-6 py-3 overflow-x-hidden">
      {filteredGroups.map((group) => {
        return (
          <div key={group.key} className={cn("px-3", collapsed && "px-2")}>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Circle;
                const active = isActive(pathname, item);

                const link = (
                  <Link
                    key={item.key}
                    to={item.route}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                      active 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      collapsed && "justify-center px-0 py-2.5"
                    )}
                  >
                    <div className="relative">
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                      {collapsed && item.badgeKey && badges[item.badgeKey] > 0 && (
                        <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-sidebar bg-primary" />
                      )}
                    </div>
                    {!collapsed && <span className="truncate">{item.nhan}</span>}
                    {!collapsed && item.badgeKey && badges[item.badgeKey] > 0 && (
                      <div 
                        className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-bold text-primary"
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