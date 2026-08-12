import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { collections, ROLE_ORDER, roleMeta, tierMeta, permToTier, type Stats } from "./types";

interface PermissionMatrixProps {
  stats: Stats | undefined;
}

export function PermissionMatrix({ stats }: PermissionMatrixProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-base">Ma trận quyền theo dữ liệu</CardTitle>
          <CardDescription>Số dưới mỗi vai trò là số tài khoản thật đang giữ.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
          {(Object.keys(tierMeta) as (keyof typeof tierMeta)[]).map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className={cn("h-2.5 w-2.5 rounded-full", tierMeta[t].dot)} />
              {tierMeta[t].label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <span className="rounded bg-muted px-1 font-mono text-[9px] font-semibold">ĐV</span>
            giới hạn đơn vị
          </span>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[200px] sticky left-0 bg-background z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">Dữ liệu</TableHead>
              {ROLE_ORDER.map((k) => (
                <TableHead key={k} className="text-center min-w-[80px]">
                  <div className="text-xs font-medium">{roleMeta[k].short}</div>
                  <div className="font-mono text-[10px] font-normal text-muted-foreground">
                    {stats?.roles[k]?.total ?? 0}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.map((c) => {
              const Icon = c.icon;
              return (
                <TableRow key={c.key} className="group/row">
                  <TableCell className="font-medium sticky left-0 bg-background z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {c.label}
                    </div>
                  </TableCell>
                  {ROLE_ORDER.map((k) => {
                    const { tier, dv } = permToTier(c.perms[k]);
                    const m = tierMeta[tier];
                    return (
                      <TableCell key={k} className="text-center transition-colors group-hover/row:bg-muted/30">
                        <span
                          title={m.label + (dv ? " · giới hạn đơn vị" : "")}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium cursor-default transition-all hover:scale-105",
                            m.cell,
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
                          {tier === "none" ? "—" : m.label}
                          {dv && <span className="rounded bg-background/60 px-1 font-mono text-[8.5px] font-semibold">ĐV</span>}
                        </span>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
