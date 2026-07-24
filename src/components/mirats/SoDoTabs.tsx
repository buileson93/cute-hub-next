import { Link, useRouterState } from "@tanstack/react-router";
import { Waypoints, Cable } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/so-do", label: "Bản vẽ sơ đồ", icon: Waypoints },
  { to: "/topology", label: "Đấu nối (kết nối tài sản)", icon: Cable },
] as const;

export function SoDoTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex gap-1 border-b">
      {TABS.map((t) => {
        const active = pathname === t.to || pathname.startsWith(t.to + "/");
        const Icon = t.icon;
        return (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
