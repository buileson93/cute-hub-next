import { useMemo } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { navGroups, isActive } from "@/lib/mirats/nav/nav-config";
import { useSession } from "@/hooks/use-session";
import { useNavBadges } from "@/hooks/use-nav-badges";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";
import { Badge } from "@/components/ui/badge";


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
    <div className="flex flex-col gap-4 data-[density=compact]:gap-4 data-[density=comfortable]:gap-6 py-3 overflow-x-hidden min-w-[220px]">
      {filteredGroups.map((group) => {
        return (
          <div key={group.key} className={cn("px-3", collapsed && "px-2")}>
            {!collapsed && (
              <div className="mb-2 px-2.5 astryx-nav-group-label">
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
                      "group relative flex items-center gap-2.5 px-2.5 py-1.5 transition-mirats-fast astryx-nav-item astryx-control",
                      "h-8 data-[density=comfortable]:h-10 rounded-xl data-[density=comfortable]:rounded-2xl data-[density=comfortable]:gap-3",
                      UI_DENSITY.TEXT_BODY,
                      active 
                        ? "bg-[#0074e2]/10 text-[#0074e2] astryx-nav-item-active ring-1 ring-[#0074e2]/20 shadow-sm" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      collapsed && "justify-center px-0 py-2.5 h-10"
                    )}
                    data-active={active}
                  >
                    {active && !collapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-[#0074e2]" />
                    )}
                    <div className="relative">
                      <Icon className={cn("h-4 w-4 shrink-0 data-[density=compact]:h-4 data-[density=compact]:w-4", active ? "text-[#0074e2]" : "text-muted-foreground")} />
                      {collapsed && item.badgeKey && badges[item.badgeKey] > 0 && (
                        <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-sidebar bg-[#0074e2]" />
                      )}
                    </div>
                    {!collapsed && <span className="truncate">{item.nhan}</span>}
                    {!collapsed && item.badgeKey && badges[item.badgeKey] > 0 && (
                      <Badge
                        variant="info"
                        size="sm"
                        className="ml-auto h-4 px-1 min-w-4 justify-center border-none bg-[#0074e2]/15 text-[#0074e2] font-bold"
                        aria-label={`${badges[item.badgeKey]} việc cần xử lý`}
                      >
                        {badges[item.badgeKey] > 99 ? "99+" : badges[item.badgeKey]}
                      </Badge>
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
