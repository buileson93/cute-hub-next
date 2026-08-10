import { type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DetailLayoutProps {
  title: string;
  subtitle?: string;
  badges?: { label: string; className?: string }[];
  actions?: ReactNode;
  headerIcon?: ReactNode;
  kpiCards?: ReactNode;
  tabs: {
    id: string;
    label: string;
    content: ReactNode;
    icon?: ReactNode;
  }[];
  defaultTab?: string;
}

export function DetailLayout({
  title,
  subtitle,
  badges,
  actions,
  headerIcon,
  kpiCards,
  tabs,
  defaultTab,
}: DetailLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {headerIcon && <div className="mt-1">{headerIcon}</div>}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {badges?.map((b, i) => (
                <Badge key={i} variant="secondary" className={cn("text-[10px] font-mono", b.className)}>
                  {b.label}
                </Badge>
              ))}
            </div>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      </div>

      {/* KPI Section */}
      {kpiCards && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {kpiCards}
        </div>
      ) }

      {/* Main Content Tabs */}
      <Tabs defaultValue={defaultTab || tabs[0]?.id} className="space-y-4">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-auto">
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="gap-2">
                {t.icon}
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map((t) => (
          <TabsContent key={t.id} value={t.id} className="space-y-4 outline-none">
            {t.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export function DetailInfoGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

export function DetailCard({ title, icon: Icon, children, className }: { title: string; icon?: any; children: ReactNode; className?: string }) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {children}
      </CardContent>
    </Card>
  );
}

export function KpiCard({ icon: Icon, label, value, tone, className }: { icon: any; label: string; value: string; tone?: string; className?: string }) {
  return (
    <Card className={cn("border-none bg-muted/30 shadow-none", className)}>
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-sm">
          <Icon className={cn("h-4 w-4", tone || "text-foreground/70")} />
        </div>
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">{label}</div>
          <div className={cn("text-sm font-bold", tone)}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
