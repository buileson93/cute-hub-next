// ============================================================================
// Quản lý quan hệ "Tài sản thuộc Hệ thống".
// Gán / gỡ tài sản đi qua RPC cay_submit_change (move_device) để tôn trọng
// phân quyền + ghi vết thay đổi, không update thẳng bảng thiet_bi.
// ============================================================================

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Boxes, Loader2, Plus, RefreshCw, Search, Unlink } from "lucide-react";
import { toast } from "sonner";

import { ResponsiveDialog } from "@/components/mirats/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCayRpc } from "@/lib/mirats/cay-reorg";
import { thongDiepLoi } from "@/lib/mirats/errors";
import {
  taiSanCuaHeThong,
  ungVienGanVaoHeThong,
  useHeThongTaiSan,
  type TaiSanRef,
} from "@/lib/mirats/he-thong-tai-san";

interface Props {
  heThongId: string;
  heThongTen: string;
  canManage: boolean;
  onClose: () => void;
}

export function HeThongTaiSanDialog({ heThongId, heThongTen, canManage, onClose }: Props) {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch, isFetching } = useHeThongTaiSan();
  const { submit } = useCayRpc();
  const [qLinked, setQLinked] = useState("");
  const [qAdd, setQAdd] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmGo, setConfirmGo] = useState<TaiSanRef | null>(null);

  const rows = data ?? [];
  const linked = useMemo(() => taiSanCuaHeThong(rows, heThongId, qLinked), [rows, heThongId, qLinked]);
  const candidates = useMemo(
    () => (qAdd.trim() ? ungVienGanVaoHeThong(rows, heThongId, qAdd, 30) : []),
    [rows, heThongId, qAdd],
  );

  async function apply(ts: TaiSanRef, detach: boolean) {
    if (busyId) return; // chống bấm trùng
    setBusyId(ts.id);
    try {
      await submit.mutateAsync({
        loai: "move_device",
        he_thong_id: detach ? "" : heThongId,
        mo_ta: detach
          ? `Gỡ tài sản "${ts.ten}" khỏi hệ thống ${heThongTen}`
          : `Gán tài sản "${ts.ten}" vào hệ thống ${heThongTen}`,
        payload: detach ? { device_ma: ts.ma, detach: true } : { device_ma: ts.ma, to_ht_id: heThongId },
        _silent: true,
      });
      await qc.invalidateQueries({ queryKey: ["he_thong_tai_san_index"] });
      toast.success(detach ? "Đã gỡ tài sản khỏi hệ thống" : "Đã gán tài sản vào hệ thống");
      setConfirmGo(null);
    } catch (e) {
      toast.error(thongDiepLoi(e, "Không lưu được thay đổi: "));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Tài sản thuộc hệ thống · ${heThongTen}`}
      description="Gán hoặc gỡ tài sản. Gỡ chỉ tách khỏi hệ thống, không xoá tài sản."
      className="max-w-2xl"
    >
      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <p className="text-destructive">{thongDiepLoi(error, "Không tải được danh sách tài sản.")}</p>
          <Button size="sm" variant="outline" onClick={() => void refetch()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Thử lại
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {canManage && (
            <section className="space-y-2 rounded-md border p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Plus className="h-4 w-4 text-primary" /> Gán tài sản vào hệ thống
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={qAdd}
                  onChange={(e) => setQAdd(e.target.value)}
                  placeholder="Tìm theo mã hoặc tên tài sản…"
                  className="pl-8"
                  aria-label="Tìm tài sản để gán"
                />
              </div>
              {qAdd.trim() && candidates.length === 0 && (
                <p className="text-xs text-muted-foreground">Không tìm thấy tài sản phù hợp.</p>
              )}
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {candidates.map((ts) => (
                  <li
                    key={ts.id}
                    className="flex items-center justify-between gap-2 rounded-md border bg-card px-2.5 py-1.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{ts.ten}</div>
                      <code className="text-xs text-muted-foreground">{ts.ma}</code>
                    </div>
                    {ts.heThongId ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1"
                        disabled={!!busyId}
                        onClick={() => setConfirmGo(ts)}
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Điều chuyển
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="h-7 gap-1"
                        disabled={!!busyId}
                        onClick={() => void apply(ts, false)}
                      >
                        {busyId === ts.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        Gán
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
              {confirmGo && (
                <div className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs">
                  <p>
                    Tài sản <b>{confirmGo.ten}</b> đang thuộc hệ thống khác. Điều chuyển sang{" "}
                    <b>{heThongTen}</b>?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-7"
                      disabled={!!busyId}
                      onClick={() => void apply(confirmGo, false)}
                    >
                      {busyId === confirmGo.id && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                      Đồng ý
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      disabled={!!busyId}
                      onClick={() => setConfirmGo(null)}
                    >
                      Huỷ
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Boxes className="h-4 w-4 text-muted-foreground" /> Đang thuộc hệ thống
                <Badge variant="secondary">{linked.length}</Badge>
                {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              </div>
              <Input
                value={qLinked}
                onChange={(e) => setQLinked(e.target.value)}
                placeholder="Lọc…"
                className="h-8 w-40"
                aria-label="Lọc tài sản trong hệ thống"
              />
            </div>
            {linked.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                Hệ thống chưa có tài sản nào.
              </p>
            ) : (
              <ul className="max-h-72 space-y-1 overflow-y-auto">
                {linked.map((ts) => (
                  <li
                    key={ts.id}
                    className="flex items-center justify-between gap-2 rounded-md border bg-card px-2.5 py-1.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{ts.ten}</div>
                      <code className="text-xs text-muted-foreground">{ts.ma}</code>
                    </div>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-destructive"
                        disabled={!!busyId}
                        onClick={() => void apply(ts, true)}
                      >
                        {busyId === ts.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Unlink className="h-3.5 w-3.5" />
                        )}
                        Gỡ
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </ResponsiveDialog>
  );
}
