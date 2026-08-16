import { Boxes, Warehouse, ScrollText, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

interface InventoryDashboardProps {
  vatTuCount: number;
  khoCount: number;
  giaoDichCount: number;
  canhBaoCount: number;
}

export function InventoryDashboard({
  vatTuCount,
  khoCount,
  giaoDichCount,
  canhBaoCount,
}: InventoryDashboardProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard icon={Boxes} label="Loại vật tư" value={fmt(vatTuCount)} />
      <StatCard icon={Warehouse} label="Kho" value={fmt(khoCount)} />
      <StatCard icon={ScrollText} label="Giao dịch" value={fmt(giaoDichCount)} />
      <StatCard
        icon={AlertTriangle}
        label="Dưới định mức"
        value={fmt(canhBaoCount)}
        alert={canhBaoCount > 0}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  alert,
}: {
  icon: typeof Boxes;
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <Card className={cn("transition-all hover:shadow-md", alert && "border-red-300 bg-red-50/50")}>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            alert ? "bg-red-100 text-red-600" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className={cn("text-lg font-semibold leading-none", alert && "text-red-600")}>
            {value}
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
