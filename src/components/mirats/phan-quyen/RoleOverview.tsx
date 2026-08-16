import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { roleMeta, ROLE_ORDER, type Stats } from "./types";

interface RoleOverviewProps {
  stats: Stats | undefined;
  loading: boolean;
  error: any;
}

export function RoleOverview({ stats, loading, error }: RoleOverviewProps) {
  const roleCards = useMemo(() => {
    if (!stats) return [];
    const known = ROLE_ORDER
      .filter((k) => stats.roles[k])
      .map((k) => ({ 
        key: k, 
        ...roleMeta[k], 
        total: stats.roles[k].total, 
        active: stats.roles[k].active 
      }));
    const extras = Object.keys(stats.roles)
      .filter((k) => !(ROLE_ORDER as string[]).includes(k))
      .map((k) => ({
        key: k,
        name: k, short: k,
        scope: "—", icon: KeyRound,
        tone: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
        desc: "Vai trò bổ sung.", 
        total: stats.roles[k].total, 
        active: stats.roles[k].active,
      }));
    return [...known, ...extras];
  }, [stats]);

  if (loading) {
    return (
      <Card><CardContent className="flex items-center justify-center py-10 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải số liệu…
      </CardContent></Card>
    );
  }

  if (error) {
    return (
      <Card><CardContent className="py-8 text-center text-sm text-destructive">Không tải được số liệu phân quyền.</CardContent></Card>
    );
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {roleCards.map((r) => {
        const Icon = r.icon;
        return (
          <Card key={r.key} className="p-4 transition-all hover:shadow-md group">
            <div className="flex items-center justify-between">
              <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110", r.tone)}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <div className="text-right">
                <span className="font-mono text-2xl font-semibold leading-none tabular-nums">{r.total}</span>
                <div className="text-meta text-muted-foreground mt-1">{r.active} hoạt động</div>
              </div>
            </div>
            <div className="mt-3 text-sm font-semibold leading-tight">{r.name}</div>
            <div className="mt-0.5 text-meta text-muted-foreground">{r.scope}</div>
          </Card>
        );
      })}
    </section>
  );
}
