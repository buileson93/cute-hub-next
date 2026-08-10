import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Building2, Database, Lock } from "lucide-react";
import { type Stats } from "./types";

interface DistributionStatsProps {
  stats: Stats | undefined;
}

const DON_VI_LABEL: Record<string, string> = {
  CRA: "Cảng HK Cam Ranh", CLA: "Cảng HK Chu Lai", PBA: "Cảng HK Phú Bài",
  PLK: "Cảng HK Pleiku", THO: "Cảng HK Thọ Xuân", PCA: "Cảng HK Phù Cát",
};

const dvLabel = (ma: string) => DON_VI_LABEL[ma] ?? ma;

export function DistributionStats({ stats }: DistributionStatsProps) {
  const maxUnit = useMemo(() => stats ? Math.max(1, ...stats.units.map((u) => u.accounts)) : 1, [stats]);

  const entityCards = useMemo(() => {
    if (!stats) return [];
    const { entities } = stats;
    return [
      { label: "Tài sản", value: entities.thiet_bi, icon: Database },
      { label: "Giấy phép", value: entities.giay_phep, icon: Database },
      { label: "Yêu cầu", value: entities.tickets, icon: Database },
      { label: "Dự án", value: entities.du_an, icon: Database },
      { label: "Sơ đồ", value: entities.so_do, icon: Database },
      { label: "Biểu mẫu", value: entities.forms, icon: Database },
      { label: "Nhật ký", value: entities.audit, icon: Database },
    ];
  }, [stats]);

  return (
    <TabsContent value="phanbo" className="space-y-3 m-0">
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Tài khoản theo đơn vị
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!stats || stats.units.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Chưa có tài khoản nào gắn đơn vị.</p>
            ) : (
              stats.units.map((u) => (
                <div key={u.don_vi} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">
                      <span className="font-mono">{u.don_vi}</span>
                      <span className="ml-1.5 text-muted-foreground">· {dvLabel(u.don_vi)}</span>
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {u.accounts} <span className="opacity-70">({u.active} hoạt động)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${Math.round((u.accounts / maxUnit) * 100)}%` }} 
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" /> Khối lượng dữ liệu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {entityCards.map((e) => {
                const Icon = e.icon;
                return (
                  <div key={e.label} className="rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wide text-muted-foreground">
                      <Icon className="h-3 w-3" /> {e.label}
                    </div>
                    <div className="mt-1 font-mono text-xl font-semibold tabular-nums">
                      {e.value.toLocaleString("vi-VN")}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Ràng buộc theo hàng: <span className="font-mono">don_vi = user.don_vi</span> cho dữ liệu nghiệp vụ; vai trò cấp công ty được bỏ qua.
        </span>
      </div>
    </TabsContent>
  );
}

import { TabsContent } from "@/components/ui/tabs";
