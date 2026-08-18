import React from "react";
import { PackageCheck, ArrowLeftRight, User, Building2, Clock } from "lucide-react";
import { useAllocationHistory } from "@/lib/mirats/db-smart";
import { Badge } from "@/components/ui/badge";

export function AllocationPanel({ thietBiId, donViTenMap }: { thietBiId: string; donViTenMap?: Map<string, string> }) {
  const { data = [], isLoading } = useAllocationHistory(thietBiId);

  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Đang tải lịch sử cấp phát...</div>;

  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground italic">Chưa có lịch sử cấp phát cho tài sản này.</p>
      ) : (
        <ol className="relative ml-3 border-l border-border pl-6 space-y-6">
          {data.map((row) => {
            const isCapPhat = row.hanh_dong === "cap_phat";
            const donViTen = row.don_vi_giu_id ? donViTenMap?.get(row.don_vi_giu_id) : null;
            
            return (
              <li key={row.id} className="relative">
                <span className={`absolute -left-[35px] flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-background shadow-sm ${isCapPhat ? "bg-primary" : "bg-muted"}`}>
                  {isCapPhat ? <PackageCheck className="h-4 w-4 text-primary-foreground" /> : <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />}
                </span>
                <div className="rounded-lg border p-4 bg-card shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={isCapPhat ? "default" : "secondary"} className={isCapPhat ? "bg-primary text-primary-foreground" : ""}>
                        {isCapPhat ? "Cấp phát" : "Thu hồi"}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(row.thoi_diem).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground w-20">Người giữ:</span>
                      <span className="font-medium">{row.nguoi_giu || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground w-20">Đơn vị:</span>
                      <span className="font-medium">{donViTen || row.don_vi_giu_id || "—"}</span>
                    </div>
                  </div>

                  {row.ghi_chu && (
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground italic">
                      "{row.ghi_chu}"
                    </div>
                  )}
                  
                  {row.thuc_hien_boi && (
                    <div className="mt-2 text-[10px] text-muted-foreground text-right">
                      Người thực hiện: {row.thuc_hien_boi}
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
