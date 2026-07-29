// ============================================================================
// Task 32 — Thanh hành động HÀNG LOẠT trên UI.
//
// - Chỉ hiển thị khi có ≥1 dòng chọn (dùng chung với StandardTable — Task 23).
// - Chỉ render các nút hành động khi user có quyền GHI ở domain (Task 26).
// - Bắt buộc PREVIEW trước khi ghi: mở ConfirmDialog liệt kê áp dụng/bỏ qua.
// - Ghi qua RPC theo lô (nguồn = 'ui_bulk' → audit — Task 19).
// ============================================================================

import { useState } from "react";
import { toast } from "sonner";
import { X, CheckCircle2, XCircle, Eye, Undo2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/backend/client";
import { canWrite, type Domain } from "@/lib/mirats/quyen";
import type { AppRole } from "@/hooks/use-session";
import {
  previewBulk, buildBulkPayload, buildUndoPlan,
  type BulkHanhDong, type BulkPreview, type RowLike, type UndoSnapshotItem,
} from "@/lib/mirats/ui/bulk-actions";
import type { Loai } from "@/lib/mirats/ui/inline-edit";


export interface BulkStatusOption { value: string; label: string }
export interface BulkAssignOption { field: string; label: string; options?: { value: string; label: string }[] }

export interface BulkActionBarProps {
  loai: Loai & Domain;
  roles: readonly AppRole[] | null | undefined;
  /** Dòng đã chọn — cần đủ ngữ cảnh để preview (trang_thai, mốc, danh mục hiện tại...). */
  rowsChon: readonly RowLike[];
  onClearSelection: () => void;
  onDone?: () => void;
  /** Danh sách trạng thái đích cho phép (VN label). Bỏ qua để ẩn nút chuyển trạng thái. */
  trangThaiOptions?: BulkStatusOption[];
  /** Cấu hình gán danh mục / gán người. */
  ganOptions?: BulkAssignOption[];
}

type PendingAction = { hanhDong: BulkHanhDong; preview: BulkPreview };

export function BulkActionBar({
  loai, roles, rowsChon, onClearSelection, onDone,
  trangThaiOptions, ganOptions,
}: BulkActionBarProps) {
  const [trangThai, setTrangThai] = useState("");
  const [ganField, setGanField] = useState<string>(ganOptions?.[0]?.field ?? "");
  const [ganGiaTri, setGanGiaTri] = useState<string>("");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const soChon = rowsChon.length;
  if (soChon === 0) return null;
  if (!canWrite(loai as Domain, roles)) return null;

  function openPreview(hanhDong: BulkHanhDong) {
    const p = previewBulk(loai, rowsChon, hanhDong);
    setPending({ hanhDong, preview: p });
  }

  /** Hoàn tác: khôi phục giá trị cũ theo từng nhóm giá trị cũ (mỗi nhóm 1 RPC). */
  async function undoBulk(
    hanhDong: BulkHanhDong,
    snapshot: UndoSnapshotItem[],
  ) {
    if (snapshot.length === 0) return;
    const t = toast.loading(`Đang hoàn tác ${snapshot.length} dòng…`);
    try {
      const plan = buildUndoPlan(loai, hanhDong, snapshot);
      for (const payload of plan) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).rpc(payload.rpc, payload.args);
        if (error) throw error;
      }
      toast.success(`Đã hoàn tác ${snapshot.length} dòng`, { id: t });
      onDone?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi không xác định";
      toast.error(`Hoàn tác thất bại: ${msg}`, { id: t });
    }
  }

  async function confirmRun() {
    if (!pending) return;
    setBusy(true);
    try {
      const applied = pending.preview.chiTiet.filter((x) => x.apDung);
      const ids = applied.map((x) => x.id);
      if (ids.length === 0) {
        toast.error("Không có dòng nào hợp lệ để ghi");
        setPending(null);
        setConfirming(false);
        return;
      }
      // Snapshot giá trị cũ TRƯỚC khi ghi để phục vụ Hoàn tác.
      const rowById = new Map(rowsChon.map((r) => [r.id, r]));
      const oldField =
        pending.hanhDong.kieu === "chuyen_trang_thai"
          ? "trang_thai"
          : pending.hanhDong.field ?? "";
      const snapshot = ids.map((id) => ({
        id,
        oldValue: rowById.get(id)?.[oldField] ?? null,
      }));

      const payload = buildBulkPayload(loai, ids, pending.hanhDong);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc(payload.rpc, payload.args);
      if (error) throw error;

      const hanhDong = pending.hanhDong;
      toast.success(`Đã cập nhật ${ids.length}/${soChon} tài sản`, {
        duration: 10000,
        action: {
          label: "Hoàn tác",
          onClick: () => void undoBulk(hanhDong, snapshot),
        },
      });
      setPending(null);
      setConfirming(false);
      onClearSelection();
      onDone?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi không xác định";
      toast.error(`Ghi lô thất bại: ${msg}`);
    } finally {
      setBusy(false);
    }
  }


  const activeGan = ganOptions?.find((g) => g.field === ganField);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border rounded-md bg-muted/40 px-3 py-2">
        <span className="text-sm font-medium">Đã chọn {soChon}</span>
        <Button variant="ghost" size="sm" onClick={onClearSelection} className="h-7 px-2">
          <X className="h-3.5 w-3.5 mr-1" /> Bỏ chọn
        </Button>

        {trangThaiOptions && trangThaiOptions.length > 0 && (
          <div className="flex items-center gap-1">
            <Select value={trangThai} onValueChange={setTrangThai}>
              <SelectTrigger className="h-8 w-[160px]"><SelectValue placeholder="Đổi trạng thái…" /></SelectTrigger>
              <SelectContent>
                {trangThaiOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={!trangThai}
              onClick={() => openPreview({ kieu: "chuyen_trang_thai", giaTri: trangThai })}
            >
              Áp dụng
            </Button>
          </div>
        )}

        {ganOptions && ganOptions.length > 0 && (
          <div className="flex items-center gap-1">
            <Select value={ganField} onValueChange={(v) => { setGanField(v); setGanGiaTri(""); }}>
              <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ganOptions.map((g) => (
                  <SelectItem key={g.field} value={g.field}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeGan?.options ? (
              <Select value={ganGiaTri} onValueChange={setGanGiaTri}>
                <SelectTrigger className="h-8 w-[180px]"><SelectValue placeholder="Chọn giá trị…" /></SelectTrigger>
                <SelectContent>
                  {activeGan.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                className="h-8 w-[180px]"
                placeholder="Giá trị / ID"
                value={ganGiaTri}
                onChange={(e) => setGanGiaTri(e.target.value)}
              />
            )}
            <Button
              size="sm"
              disabled={!ganField || !ganGiaTri}
              onClick={() =>
                openPreview({
                  kieu: activeGan?.field.startsWith("nguoi_") ? "gan_nguoi" : "gan_danh_muc",
                  field: ganField,
                  giaTri: ganGiaTri,
                })
              }
            >
              Áp dụng
            </Button>
          </div>
        )}
      </div>

      <Sheet open={!!pending} onOpenChange={(o) => !o && !busy && setPending(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col gap-0 p-0">
          <SheetHeader className="px-5 py-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> Xem trước thao tác hàng loạt
            </SheetTitle>
            <SheetDescription>
              Kiểm tra từng dòng sẽ áp dụng hoặc bị bỏ qua trước khi lưu. Chưa có gì được ghi vào CSDL.
            </SheetDescription>
          </SheetHeader>

          <div className="px-5 py-3 border-b flex flex-wrap items-center gap-2 text-sm">
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 gap-1">
              <CheckCircle2 className="h-3 w-3" /> Áp dụng {pending?.preview.apDung ?? 0}
            </Badge>
            <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 gap-1">
              <XCircle className="h-3 w-3" /> Bỏ qua {pending?.preview.boQua ?? 0}
            </Badge>
            <Badge variant="outline">Tổng {soChon}</Badge>
            <span className="ml-auto text-xs text-muted-foreground">
              Hành động: <b>{describeHanhDong(pending?.hanhDong)}</b>
            </span>
          </div>

          <ScrollArea className="flex-1 px-5 py-3">
            <ul className="divide-y">
              {(pending?.preview.chiTiet ?? []).map((r) => (
                <li key={r.id} className="py-2 flex items-start gap-2 text-sm">
                  {r.apDung ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs truncate">{r.id}</div>
                    {r.lyDo && (
                      <div className="text-xs text-muted-foreground mt-0.5">{r.lyDo}</div>
                    )}
                  </div>
                  <Badge variant={r.apDung ? "secondary" : "outline"} className="text-[10px] uppercase">
                    {r.apDung ? "Áp dụng" : "Bỏ qua"}
                  </Badge>
                </li>
              ))}
              {!pending?.preview.chiTiet.length && (
                <li className="py-6 text-center text-sm text-muted-foreground">Không có dòng nào.</li>
              )}
            </ul>
          </ScrollArea>

          <SheetFooter className="px-5 py-3 border-t flex-row justify-between gap-2">
            <div className="text-xs text-muted-foreground self-center">
              Ghi qua RPC theo lô · nguồn <code>ui_bulk</code>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" disabled={busy} onClick={() => setPending(null)}>Huỷ</Button>
              <Button
                disabled={busy || !pending || pending.preview.apDung === 0}
                onClick={() => setConfirming(true)}
              >
                {busy ? "Đang ghi…" : `Lưu ${pending?.preview.apDung ?? 0} dòng`}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirming} onOpenChange={(o) => !busy && setConfirming(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Xác nhận cập nhật hàng loạt
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <div>
                  Bạn sắp cập nhật{" "}
                  <b className="text-foreground">{pending?.preview.apDung ?? 0} tài sản</b>
                  {pending && pending.preview.boQua > 0 && (
                    <> ({pending.preview.boQua} dòng sẽ bị bỏ qua)</>
                  )}
                  .
                </div>
                <div className="rounded-md border bg-muted/40 px-3 py-2">
                  <div className="text-xs uppercase text-muted-foreground mb-1">Hành động</div>
                  <div className="font-medium">{describeHanhDong(pending?.hanhDong)}</div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Undo2 className="h-3.5 w-3.5" />
                  Có thể hoàn tác ngay sau khi lưu.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Huỷ</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); void confirmRun(); }}>
              {busy ? "Đang ghi…" : "Xác nhận lưu"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


function describeHanhDong(h: BulkHanhDong | undefined): string {
  if (!h) return "—";
  if (h.kieu === "chuyen_trang_thai") return `Chuyển trạng thái → ${String(h.giaTri)}`;
  if (h.kieu === "gan_danh_muc") return `Gán ${h.field} = ${String(h.giaTri)}`;
  if (h.kieu === "gan_nguoi") return `Gán người (${h.field}) = ${String(h.giaTri)}`;
  return h.kieu;
}

