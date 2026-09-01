// ============================================================================
// Dải số liệu quy mô hệ thống trên Dashboard: đếm trực tiếp từ CSDL (head count),
// không suy diễn dữ liệu. Có đủ loading / error / empty.
// ============================================================================
import { useQuery } from "@tanstack/react-query";
import { Boxes, Cpu, HardDrive, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ScopeSummary = {
  heThong: number;
  thanhPhan: number;
  taiSan: number;
  sapHetBaoHanh: number;
};

async function demScopeSummary(): Promise<ScopeSummary> {
  const homNay = new Date();
  const moc = new Date(homNay.getTime() + 60 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const [ht, tp, ts, bh] = await Promise.all([
    supabase.from("dm_he_thong").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("he_thong_thanh_phan").select("id", { count: "exact", head: true }),
    supabase.from("thiet_bi").select("id", { count: "exact", head: true }),
    supabase
      .from("thiet_bi")
      .select("id", { count: "exact", head: true })
      .gte("han_bao_hanh", iso(homNay))
      .lte("han_bao_hanh", iso(moc)),
  ]);

  const loi = ht.error || tp.error || ts.error || bh.error;
  if (loi) throw loi;

  return {
    heThong: ht.count ?? 0,
    thanhPhan: tp.count ?? 0,
    taiSan: ts.count ?? 0,
    sapHetBaoHanh: bh.count ?? 0,
  };
}

const THE: ReadonlyArray<{ key: keyof ScopeSummary; nhan: string; icon: LucideIcon; nhanManh?: boolean }> = [
  { key: "heThong", nhan: "Hệ thống", icon: Boxes },
  { key: "thanhPhan", nhan: "Thành phần", icon: Cpu },
  { key: "taiSan", nhan: "Tài sản", icon: HardDrive },
  { key: "sapHetBaoHanh", nhan: "Sắp hết bảo hành (60 ngày)", icon: ShieldAlert, nhanManh: true },
];

export function ScopeSummaryStrip() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-scope-summary"],
    queryFn: demScopeSummary,
    staleTime: 5 * 60_000,
  });

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
        Không tải được số liệu quy mô hệ thống. Vui lòng thử tải lại trang.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      {THE.map(({ key, nhan, icon: Icon, nhanManh }) => {
        const giaTri = data?.[key];
        return (
          <div
            key={key}
            className={cn(
              "rounded-xl border bg-card p-3 transition-colors hover:border-primary/40",
              nhanManh && (giaTri ?? 0) > 0 && "border-amber-500/40 bg-amber-500/5",
            )}
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate text-[11px] font-bold uppercase tracking-wider">{nhan}</span>
            </div>
            {isLoading ? (
              <div className="mt-2 h-7 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {(giaTri ?? 0).toLocaleString("vi-VN")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
