import { useMemo, useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import * as LucideIcons from "lucide-react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { navGroups, isActive, type NavItem } from "@/lib/mirats/nav/nav-config";
import { useSession } from "@/hooks/use-session";
import { useNavBadges } from "@/hooks/use-nav-badges";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
    const filterItems = (items: NavItem[]): NavItem[] => {
      return items
        .filter(item => !item.roles || item.roles.some(r => hasRole(r)))
        .map(item => ({
          ...item,
          children: item.children ? filterItems(item.children) : undefined
        }));
    };

    return groups.map(group => ({
      ...group,
      items: filterItems(group.items)
    })).filter(group => group.items.length > 0);
  }, [groups, hasRole]);

  // State quản lý việc mở các mục cha (children)
  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("mirats-sidebar-open-items");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("mirats-sidebar-open-items", JSON.stringify(openItems));
  }, [openItems]);

  // Tự động mở mục cha nếu đang ở route con
  useEffect(() => {
    const nextOpen = { ...openItems };
    let changed = false;

    filteredGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.children) {
          const isAnyChildActive = item.children.some(c => isActive(pathname, c));
          if (isAnyChildActive && !nextOpen[item.key]) {
            nextOpen[item.key] = true;
            changed = true;
          }
        }
      });
    });

    if (changed) setOpenItems(nextOpen);
  }, [pathname, filteredGroups]);

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderItem = (item: NavItem, isChild = false) => {
    const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Circle;
    const active = isActive(pathname, item);
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openItems[item.key];

    const content = (
      <div className="relative group">
        <Link
          to={item.route}
          onClick={hasChildren ? (e) => { e.preventDefault(); toggleItem(item.key); } : onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active 
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            collapsed && "justify-center px-0 py-2.5",
            isChild && "pl-9"
          )}
        >
          <div className="relative">
            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
            {collapsed && item.badgeKey && badges[item.badgeKey] > 0 && (
              <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-sidebar bg-primary" />
            )}
          </div>
          {!collapsed && <span className="truncate">{item.nhan}</span>}
          {!collapsed && hasChildren && (
            <div className="ml-auto">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          )}
          {!collapsed && !hasChildren && item.badgeKey && badges[item.badgeKey] > 0 && (
            <div 
              className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-bold text-primary"
              aria-label={`${badges[item.badgeKey]} việc cần xử lý`}
            >
              {badges[item.badgeKey] > 99 ? "99+" : badges[item.badgeKey]}
            </div>
          )}
        </Link>
      </div>
    );

    if (hasChildren) {
      return (
        <Collapsible key={item.key} open={isOpen} onOpenChange={() => toggleItem(item.key)}>
          <CollapsibleTrigger asChild>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="right">{item.nhan}</TooltipContent>
              </Tooltip>
            ) : content}
          </CollapsibleTrigger>
          {!collapsed && (
            <CollapsibleContent className="space-y-1 mt-1">
              {item.children!.map(child => renderItem(child, true))}
            </CollapsibleContent>
          )}
        </Collapsible>
      );
    }

    if (collapsed) {
      return (
        <Tooltip key={item.key}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{item.nhan}</TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.key}>{content}</div>;
  };

  return (
    <div className="flex flex-col gap-8 py-4 overflow-x-hidden">
      {filteredGroups.map((group) => (
        <div key={group.key} className={cn("px-3", collapsed && "px-2")}>
          {!collapsed && (
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.nhan}
            </h3>
          )}
          <nav className="space-y-1">
            {group.items.map(item => renderItem(item))}
          </nav>
        </div>
      ))}
    </div>
  );
}