// ============================================================================
// Lý lịch tài sản — dòng thời gian hợp nhất (v_ly_lich_thiet_bi).
// Dùng ở trang chi tiết tài sản (Bước 7, mô hình 3 lớp).
// ============================================================================
import {
  PackagePlus, PackageMinus, RefreshCw, Wrench, AlertTriangle, ArrowLeftRight, Activity, ClipboardCheck, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLyLichThietBi } from "@/lib/mirats/he-thong-thanh-phan";

const META: Record<string, { icon: React.ComponentType<{ className?: string }>; name: string; dot: string }> = {
  lap:        { icon: PackagePlus,   name: "Lắp vị trí",     dot: "bg-success" },
  roi_vi_tri: { icon: PackageMinus,  name: "Rời vị trí",     dot: "bg-muted-foreground" },
  hong_hoc:   { icon: RefreshCw,     name: "Hỏng / thay thế", dot: "bg-warning" },
  bao_tri:    { icon: Wrench,        name: "Bảo dưỡng",      dot: "bg-primary" },
  su_co:      { icon: AlertTriangle, name: "Sự cố",          dot: "bg-destructive" },
  ban_giao:   { icon: ArrowLeftRight,name: "Bàn giao",       dot: "bg-info" },
  vong_doi:   { icon: Activity,      name: "Vòng đời",       dot: "bg-primary" },
  kiem_ke:    { icon: ClipboardCheck,name: "Kiểm kê",        dot: "bg-success" },
};

export function LyLichThietBiPanel({ thietBiId }: { thietBiId: string | null }) {
  const { data = [], isLoading } = useLyLichThietBi(thietBiId);

  if (isLoading) return <p className="text-sm text-muted-foreground">Đang tải lý lịch tài sản…</p>;
  if (data.length === 0) return <p className="text-sm text-muted-foreground">Chưa có sự kiện lý lịch cho tài sản này.</p>;

  return (
    <ol className="relative ml-2 border-l border-border pl-6">
      {data.map((it, i) => {
        const m = META[it.loai_su_kien] ?? { icon: Clock, name: it.loai_su_kien, dot: "bg-muted-foreground" };
        const Icon = m.icon;
        return (
          <li key={`${it.nguon}-${it.nguon_id}-${i}`} className="relative mb-5 last:mb-0">
            <span className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${m.dot}`}>
              <Icon className="h-3.5 w-3.5 text-primary-foreground" />
            </span>
            <div className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {it.thoi_diem ? new Date(it.thoi_diem).toLocaleDateString("vi-VN") : "Chưa rõ ngày"}
                </span>
                <Badge variant="outline">{m.name}</Badge>
              </div>
              <div className="mt-1 font-medium">{it.tieu_de || "—"}</div>
              {it.mo_ta && <div className="mt-0.5 text-muted-foreground">{it.mo_ta}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
