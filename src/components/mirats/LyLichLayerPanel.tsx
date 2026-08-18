// ============================================================================
// Sổ lý lịch theo lớp — Thành phần & Hệ thống (mô hình 3 lớp).
// - LyLichThanhPhanPanel: sổ của một Thành phần hệ thống (v_ly_lich_thanh_phan)
// - LyLichHeThongPanel:   sổ của một Hệ thống (v_ly_lich_he_thong)
// Tài sản cụ thể chỉ hiển thị dạng tham chiếu (snapshot "đã thay tài sản nào").
//
// Chế độ chỉnh sửa (canEdit): admin / phòng KT có thể sửa lại NGÀY LẮP của
// sự kiện "Lắp tài sản" về đúng ngày thực tế (thay vì thời điểm nhập liệu).
// ============================================================================
import { useState, useMemo } from "react";
import {
  PackagePlus, PackageMinus, Wrench, AlertTriangle, RefreshCw, Clock, Cpu, Pencil, Loader2, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useLyLichThanhPhan,
  useLyLichHeThong,
  useSuaNgayLap,
  type LyLichEventRow,
} from "@/lib/mirats/he-thong-thanh-phan";
import { useLicensesData } from "@/lib/mirats/db-licenses";
import { ChangeLogPanel } from "@/components/mirats/ChangeLogPanel";

const META: Record<string, { icon: React.ComponentType<{ className?: string }>; name: string; dot: string; chip: string }> = {
  lap:       { icon: PackagePlus,   name: "Lắp tài sản",   dot: "bg-success",     chip: "bg-success/10 text-success border-success/20" },
  thao:      { icon: PackageMinus,  name: "Tháo tài sản",  dot: "bg-muted",       chip: "bg-muted text-muted-foreground border-border" },
  hong_hoc:  { icon: RefreshCw,     name: "Hỏng / thay thế", dot: "bg-warning",     chip: "bg-warning/10 text-warning border-warning/20" },
  bao_tri:   { icon: Wrench,        name: "Bảo dưỡng",      dot: "bg-primary",     chip: "bg-primary/10 text-primary border-primary/20" },
  su_co:     { icon: AlertTriangle, name: "Sự cố",          dot: "bg-destructive", chip: "bg-destructive/10 text-destructive border-destructive/20" },
};

/** Yyyy-mm-dd cho <input type="date"> từ một timestamptz. */
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Popover sửa ngày lắp cho một dòng gan_chuc_nang. */
function SuaNgayLapButton({ ganId, thoiDiem }: { ganId: string; thoiDiem: string | null }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(() => toDateInput(thoiDiem));
  const suaNgayLap = useSuaNgayLap();
  const today = toDateInput(new Date().toISOString());

  async function luu() {
    if (!value) {
      toast.error("Vui lòng chọn ngày lắp");
      return;
    }
    // Ghi vào 12:00 trưa để tránh lệch múi giờ khi lưu về UTC.
    const iso = new Date(`${value}T12:00:00`).toISOString();
    try {
      await suaNgayLap.mutateAsync({ ganId, tuNgay: iso });
      toast.success("Đã cập nhật ngày lắp");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể cập nhật ngày lắp");
    }
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setValue(toDateInput(thoiDiem)); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:text-primary/90 hover:bg-primary/5" title="Sửa ngày lắp" aria-label="Sửa">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="end">
        <div className="space-y-1">
          <p className="text-sm font-medium">Sửa ngày lắp thực tế</p>
          <p className="text-xs text-muted-foreground">
            Chỉnh về đúng ngày tài sản được lắp, thay cho thời điểm nhập liệu.
          </p>
        </div>
        <Input
          type="date"
          max={today}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pointer-events-auto"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Hủy</Button>
          <Button size="sm" onClick={luu} disabled={suaNgayLap.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
            {suaNgayLap.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Lưu
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Timeline({
  data, isLoading, empty, canEdit = false,
}: { data: LyLichEventRow[]; isLoading: boolean; empty: string; canEdit?: boolean }) {
  if (isLoading) return <p className="text-sm text-muted-foreground">Đang tải sổ lý lịch…</p>;
  if (data.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;

  return (
    <ol className="relative ml-2 border-l border-border pl-6">
      {data.map((it, i) => {
        const m = META[it.loai_su_kien] ?? { icon: Clock, name: it.loai_su_kien, dot: "bg-muted", chip: "bg-muted text-muted-foreground border-border" };
        const Icon = m.icon;
        const editableLap = canEdit && it.loai_su_kien === "lap" && it.nguon === "gan_chuc_nang";
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
                <Badge variant="outline" className={m.chip}>{m.name}</Badge>
                {it.ma_thiet_bi && (
                  <Badge variant="secondary" className="gap-1 font-mono text-[10px]">
                    <Cpu className="h-3 w-3" />{it.ma_thiet_bi}
                  </Badge>
                )}
                {editableLap && (
                  <span className="ml-auto">
                    <SuaNgayLapButton ganId={it.nguon_id} thoiDiem={it.thoi_diem} />
                  </span>
                )}
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

/** Sổ lý lịch của một Thành phần hệ thống (vị trí chức năng). */
export function LyLichThanhPhanPanel({
  thanhPhanId, canEdit, filterKinds, empty,
}: {
  thanhPhanId: string | null;
  canEdit?: boolean;
  /** Nếu truyền → chỉ hiện các loại_su_kien trong danh sách này. */
  filterKinds?: string[];
  empty?: string;
}) {
  const { data = [], isLoading } = useLyLichThanhPhan(thanhPhanId);
  const rows = filterKinds && filterKinds.length > 0
    ? data.filter((r) => filterKinds.includes(r.loai_su_kien))
    : data;
  return (
    <div className="space-y-6">
      <Timeline data={rows} isLoading={isLoading} canEdit={canEdit} empty={empty ?? "Chưa có sự kiện lý lịch cho thành phần này."} />
      {/* P9 — cây edit (rename/saveCell/saveNode) ghi audit_log ở bảng
          he_thong_thanh_phan; sổ lý lịch tường thuật lại, KHÔNG mở đường sửa. */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Nhật ký chỉnh sửa dữ liệu</h3>
        <ChangeLogPanel entity="he_thong_thanh_phan" entityId={thanhPhanId} />
      </section>
    </div>
  );
}

/** Sổ lý lịch của một Hệ thống (gộp cả các thành phần con). */
export function LyLichHeThongPanel({ heThongId, canEdit }: { heThongId: string | null; canEdit?: boolean }) {
  const { data = [], isLoading } = useLyLichHeThong(heThongId);
  return (
    <div className="space-y-6">
      <Timeline data={data} isLoading={isLoading} canEdit={canEdit} empty="Chưa có sự kiện lý lịch cho hệ thống này." />
      <LicenseHistory heThongId={heThongId} />
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Nhật ký chỉnh sửa dữ liệu</h3>
        <ChangeLogPanel entity="dm_he_thong" entityId={heThongId} />
      </section>
    </div>
  );
}

/** Lịch sử giấy phép khai thác của một hệ thống (bao gồm cả GP đã hết hạn). */
function LicenseHistory({ heThongId }: { heThongId: string | null }) {
  const { licenses, isLoading } = useLicensesData();
  const rows = useMemo(() => {
    if (!heThongId) return [];
    return licenses
      .filter((l) => l.heThongId === heThongId)
      .sort((a, b) => (b.ngayCap ?? "").localeCompare(a.ngayCap ?? ""));
  }, [licenses, heThongId]);

  if (!heThongId) return null;
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <FileText className="h-4 w-4" /> Lịch sử giấy phép khai thác
        <Badge variant="outline" className="ml-1 font-normal">{rows.length}</Badge>
      </h3>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải giấy phép…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có giấy phép nào gắn với hệ thống này.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((l) => {
            const expired = l.trangThai === "expired";
            const expiring = l.trangThai === "expiring";
            return (
              <li key={l.id} className={`rounded-md border p-3 text-sm ${expired ? "opacity-70" : ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={expired ? "secondary" : expiring ? "outline" : "default"}>
                    {expired ? "Đã hết hạn" : expiring ? "Sắp hết hạn" : "Hiện hành"}
                  </Badge>
                  <span className="font-mono text-xs">{l.soGP ?? l.id}</span>
                  {l.donViTen && <span className="text-xs text-muted-foreground">· {l.donViTen}</span>}
                </div>
                <div className="mt-1 font-medium">{l.tenReal ?? "—"}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Cấp: {l.ngayCap ? new Date(l.ngayCap).toLocaleDateString("vi-VN") : "—"}
                  {" · "}
                  Hết hạn: {l.ngayHetHan ? new Date(l.ngayHetHan).toLocaleDateString("vi-VN") : "—"}
                  {l.soNgayConLai != null && !expired && (
                    <> · Còn {l.soNgayConLai} ngày</>
                  )}
                </div>
                {l.kieuThietBi && (
                  <div className="mt-0.5 text-xs text-muted-foreground">Model: {l.kieuThietBi}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
