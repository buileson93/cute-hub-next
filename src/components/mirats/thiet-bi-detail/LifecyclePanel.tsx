import React from "react";
import { History, Activity, AlertCircle } from "lucide-react";
import { useLifecycle, useTrangThaiMap } from "@/lib/mirats/db-smart";
import { Badge } from "@/components/ui/badge";

export function LifecyclePanel({ thietBiId }: { thietBiId: string }) {
  const { data = [], isLoading } = useLifecycle(thietBiId);
  const { data: ttMap } = useTrangThaiMap();

  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Đang tải nhật ký vòng đời...</div>;

  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground italic">Chưa có nhật ký vòng đời cho tài sản này.</p>
      ) : (
        <ol className="relative ml-3 border-l border-border pl-6 space-y-4">
          {data.map((row) => {
            const tuTen = row.tu_trang_thai_id ? ttMap?.get(row.tu_trang_thai_id) : "—";
            const denTen = row.den_trang_thai_id ? ttMap?.get(row.den_trang_thai_id) : "—";

            return (
              <li key={row.id} className="relative">
                <span className="absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background bg-amber-500">
                  <Activity className="h-3.5 w-3.5 text-white" />
                </span>
                <div className="rounded-md border p-3 text-sm bg-muted/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {new Date(row.thoi_diem).toLocaleString("vi-VN")}
                    </span>
                    <Badge variant="outline" className="text-meta px-1.5 h-4 bg-amber-50 border-amber-200 text-amber-700">Vòng đời</Badge>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-muted-foreground">{tuTen}</span>
                    <ArrowIcon />
                    <span className="text-indigo-600">{denTen}</span>
                  </div>
                  {row.ly_do && (
                    <div className="mt-1 text-xs text-muted-foreground italic flex items-start gap-1">
                      <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{row.ly_do}</span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}
