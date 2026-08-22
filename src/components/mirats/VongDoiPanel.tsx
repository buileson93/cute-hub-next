// ============================================================================
// N6 — Panel "Vòng đời" cho trang chi tiết Sự cố / Hỏng hóc.
// Hiện timeline 6 bước + nút hành động chỉ cho trạng thái đích hợp lệ +
// chỉ số thời gian (response / repair / downtime / chờ vật tư / wrench-time).
// ============================================================================
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Check, Clock, PlayCircle, PauseCircle, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  SU_CO_WORKFLOW_STATES,
  SU_CO_TRANG_THAI_LABEL,
  nextStates,
  normalizeWorkflowState,
  computeMetrics,
  type SuCoTrangThai,
} from "@/lib/mirats/su-co-workflow";
import {
  useSuCoLichSu,
  useSuCoTransition,
  toLichSuBuoc,
  type DoiTuongBang,
} from "@/lib/mirats/su-co-workflow-client";
import { useSession } from "@/hooks/use-session";

const ICON: Record<SuCoTrangThai, typeof Check> = {
  bao_cao: Clock,
  tiep_nhan: Check,
  dang_xu_ly: PlayCircle,
  cho_vat_tu: PauseCircle,
  hoan_thanh: Check,
  nghiem_thu: ShieldCheck,
  huy: XCircle,
};

/** Chuỗi 6 trạng thái chính (loại trừ `huy` — hiển thị riêng nếu đang ở đó). */
const MAIN_FLOW: SuCoTrangThai[] = [
  "bao_cao",
  "tiep_nhan",
  "dang_xu_ly",
  "cho_vat_tu",
  "hoan_thanh",
  "nghiem_thu",
];

function fmtPhut(v: number | null): string {
  if (v === null || v === undefined) return "—";
  if (v < 60) return `${v} phút`;
  const h = Math.floor(v / 60);
  const m = v % 60;
  return m ? `${h}h ${m}p` : `${h}h`;
}

interface Props {
  bang: DoiTuongBang;
  id: string;
  /** Trạng thái mới nhất (từ trang_thai_moi hoặc chuẩn hoá trang_thai cũ). */
  trangThaiHienTai?: string | null;
}

export function VongDoiPanel({ bang, id, trangThaiHienTai }: Props) {
  const { roles } = useSession();
  const { data: lichSu = [], isLoading } = useSuCoLichSu(bang, id);
  const transition = useSuCoTransition();
  const [confirmDen, setConfirmDen] = useState<SuCoTrangThai | null>(null);
  const [ghiChu, setGhiChu] = useState("");

  const current = useMemo<SuCoTrangThai>(() => {
    const last = lichSu.at(-1);
    if (last) return last.den_trang_thai as SuCoTrangThai;
    return normalizeWorkflowState(trangThaiHienTai);
  }, [lichSu, trangThaiHienTai]);

  const metrics = useMemo(() => computeMetrics(toLichSuBuoc(lichSu)), [lichSu]);
  const cans = useMemo(() => nextStates(current), [current]);

  const isManager = !!roles && (roles.includes("admin") || roles.includes("phong_kt"));
  const isTruong = !!roles && (roles.includes("admin") || roles.includes("phu_trach_dv"));

  // Vai trò UI-side (RPC vẫn kiểm tra lại)
  function allowByRole(to: SuCoTrangThai): boolean {
    if (to === "nghiem_thu") return isTruong;
    if (to === "huy") return true; // RPC tự kiểm tra người báo cáo trong 24h / admin
    return isManager;
  }

  async function submit(to: SuCoTrangThai) {
    try {
      await transition.mutateAsync({ bang, id, den: to, ghi_chu: ghiChu || undefined });
      toast.success(`Đã chuyển sang "${SU_CO_TRANG_THAI_LABEL[to]}"`);
      setConfirmDen(null);
      setGhiChu("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Chuyển trạng thái thất bại: ${msg}`);
    }
  }

  const flowIndex = MAIN_FLOW.indexOf(current);
  const showHuy = current === "huy";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" /> Vòng đời sự cố (N6)
          {showHuy && (
            <Badge variant="destructive" className="ml-auto">
              Đã huỷ
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeline 6 bước */}
        <div className="flex items-center overflow-x-auto pb-1">
          {MAIN_FLOW.map((s, i) => {
            const Icon = ICON[s];
            const done = flowIndex >= 0 && i < flowIndex;
            const isCur = s === current;
            return (
              <div key={s} className="flex items-center shrink-0">
                <div
                  className={`flex flex-col items-center gap-1 min-w-[92px] ${isCur ? "text-primary" : done ? "text-emerald-600" : "text-muted-foreground"}`}
                >
                  <div
                    className={`rounded-full border-2 h-8 w-8 flex items-center justify-center ${isCur ? "border-primary bg-primary/10" : done ? "border-emerald-600 bg-emerald-50" : "border-slate-300 bg-slate-50"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-[10px] text-center leading-tight px-1">
                    {SU_CO_TRANG_THAI_LABEL[s]}
                  </div>
                </div>
                {i < MAIN_FLOW.length - 1 && (
                  <div className={`h-[2px] w-8 ${done ? "bg-emerald-600" : "bg-slate-300"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Nút hành động */}
        <div className="flex flex-wrap gap-2">
          {cans.length === 0 && (
            <div className="text-xs text-muted-foreground">
              {current === "huy"
                ? "Đã huỷ — không có hành động tiếp theo."
                : "Đã kết thúc — chỉ admin mới có thể mở lại."}
            </div>
          )}
          {cans.map((to) => {
            const enabled = allowByRole(to);
            const variant =
              to === "huy" ? "destructive" : to === "nghiem_thu" ? "default" : "secondary";
            return (
              <Button
                key={to}
                size="sm"
                variant={variant}
                disabled={!enabled || transition.isPending}
                onClick={() => setConfirmDen(to)}
                title={enabled ? "" : "Bạn không có quyền chuyển trạng thái này"}
              >
                → {SU_CO_TRANG_THAI_LABEL[to]}
              </Button>
            );
          })}
        </div>

        {/* Chỉ số thời gian */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <Stat label="Phản hồi" value={fmtPhut(metrics.response_time_phut)} />
          <Stat label="Sửa chữa" value={fmtPhut(metrics.repair_time_phut)} />
          <Stat label="Downtime" value={fmtPhut(metrics.downtime_phut)} tone="text-amber-600" />
          <Stat label="Chờ vật tư" value={fmtPhut(metrics.wait_parts_phut)} />
          <Stat label="Wrench-time" value={fmtPhut(metrics.wrench_time_phut)} />
        </div>

        {/* Lịch sử ngắn gọn */}
        {!isLoading && lichSu.length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">
              Lịch sử ({lichSu.length} bước)
            </summary>
            <ul className="mt-2 space-y-1">
              {lichSu.map((r) => (
                <li key={r.id} className="tabular-nums">
                  <span className="text-muted-foreground">
                    {new Date(r.at).toLocaleString("vi-VN")}
                  </span>{" "}
                  <span className="font-medium">
                    {r.tu_trang_thai
                      ? (SU_CO_TRANG_THAI_LABEL[r.tu_trang_thai as SuCoTrangThai] ??
                        r.tu_trang_thai)
                      : "—"}
                    {" → "}
                    {SU_CO_TRANG_THAI_LABEL[r.den_trang_thai as SuCoTrangThai] ?? r.den_trang_thai}
                  </span>
                  {r.ghi_chu && <span className="text-muted-foreground"> · {r.ghi_chu}</span>}
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>

      {/* Dialog xác nhận */}
      <Dialog open={!!confirmDen} onOpenChange={(o) => !o && setConfirmDen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Chuyển sang: {confirmDen ? SU_CO_TRANG_THAI_LABEL[confirmDen] : ""}
            </DialogTitle>
            <DialogDescription>
              Từ trạng thái <b>{SU_CO_TRANG_THAI_LABEL[current]}</b>. Ghi chú (không bắt buộc):
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={ghiChu}
            onChange={(e) => setGhiChu(e.target.value)}
            placeholder="Ghi chú lịch sử vòng đời…"
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDen(null)}>
              Huỷ
            </Button>
            <Button
              onClick={() => confirmDen && submit(confirmDen)}
              disabled={transition.isPending}
            >
              {transition.isPending ? "Đang gửi…" : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md border bg-card px-2 py-1">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className={`font-semibold tabular-nums ${tone ?? ""}`}>{value}</div>
    </div>
  );
}

// Export để dùng debug/test
export { SU_CO_WORKFLOW_STATES };
