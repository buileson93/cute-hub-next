import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Ban, RefreshCw, ShieldAlert, AlertTriangle } from "lucide-react";

import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { PageHeader } from "@/components/mirats/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

import {
  approveChangeRequest, cancelChangeRequest, rejectChangeRequest,
  isApplySupported, summarizePayload, useChangeRequests,
  LOAI_LABEL, STATUS_LABEL, STATUS_TONE,
  type ChangeRequestLoai, type ChangeRequestRow, type ChangeRequestStatus,
} from "@/lib/mirats/change-request";

export const Route = createFileRoute("/_app/cho-duyet")({
  head: () => ({
    meta: [
      { title: "Chờ duyệt — Change Request — MIRATS" },
      {
        name: "description",
        content:
          "Hàng đợi phê duyệt các thay đổi nhạy cảm: gộp danh mục, cấp/thu hồi vai trò, chuyển đơn vị, đổi nhóm hệ thống.",
      },
    ],
  }),
  component: ChoDuyetPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive" role="alert">
      Lỗi tải danh sách chờ duyệt: {error instanceof Error ? error.message : "Không xác định"}
    </div>
  ),
});

type StatusFilter = ChangeRequestStatus | "all";
type LoaiFilter = ChangeRequestLoai | "all";

const LOAI_OPTIONS: { value: LoaiFilter; label: string }[] = [
  { value: "all", label: "Tất cả loại" },
  ...(Object.entries(LOAI_LABEL) as [ChangeRequestLoai, string][]).map(([value, label]) => ({ value, label })),
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "pending", label: "Chờ duyệt" },
  { value: "all", label: "Tất cả trạng thái" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Đã từ chối" },
  { value: "cancelled", label: "Đã huỷ" },
  { value: "applied_failed", label: "Áp dụng lỗi" },
];

function ChoDuyetPage() {
  const qc = useQueryClient();
  const { user, roles } = useSession();
  const isAdmin = roles.includes("admin");
  const isPhongKt = roles.includes("phong_kt");
  const canView = isAdmin || isPhongKt;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [loaiFilter, setLoaiFilter] = useState<LoaiFilter>("all");

  const { data: rows = [], isLoading, error, refetch, isFetching } = useChangeRequests({
    trang_thai: statusFilter,
    loai: loaiFilter,
  });

  // Realtime — bất kỳ thay đổi nào cũng invalidate danh sách + badge.
  useEffect(() => {
    const channelName = `rt:change_request:${Math.random().toString(36).slice(2)}`;
    let ch: ReturnType<typeof supabase.channel> | null = null;
    const bust = () => {
      qc.invalidateQueries({ queryKey: ["change_request:list"] });
      qc.invalidateQueries({ queryKey: ["change_request:count:pending"] });
    };
    try {
      ch = supabase
        .channel(channelName)
        .on("postgres_changes", { event: "*", schema: "public", table: "change_request" }, bust)
        .subscribe((status, err) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            // eslint-disable-next-line no-console
            console.warn("[cho-duyet] realtime subscribe status", { status, channel: channelName, error: err?.message });
          }
        });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[cho-duyet] realtime subscribe threw", e);
    }
    return () => { try { if (ch) supabase.removeChannel(ch); } catch { /* noop */ } };
  }, [qc]);

  // Dialogs
  const [approveTarget, setApproveTarget] = useState<ChangeRequestRow | null>(null);
  const [approveNote, setApproveNote] = useState("");
  const [rejectTarget, setRejectTarget] = useState<ChangeRequestRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);

  const sortedRows = useMemo(() => rows.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1)), [rows]);

  if (!canView) {
    return (
      <div className="p-6">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <ShieldAlert className="h-5 w-5" />
              <CardTitle className="text-base">Bạn không có quyền xem trang này</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Chỉ vai trò <strong>admin</strong> hoặc <strong>phong_kt</strong> mới xem được hàng đợi phê duyệt.
          </CardContent>
        </Card>
      </div>
    );
  }

  const doApprove = async () => {
    if (!approveTarget) return;
    setBusy(true);
    try {
      await approveChangeRequest(approveTarget.id, approveNote || undefined);
      toast.success("Đã duyệt");
      setApproveTarget(null);
      setApproveNote("");
      refetch();
    } catch (e) {
      toast.error((e as Error).message || "Không duyệt được");
    } finally {
      setBusy(false);
    }
  };

  const doReject = async () => {
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 5) {
      toast.error("Lý do từ chối cần ≥ 5 ký tự");
      return;
    }
    setBusy(true);
    try {
      await rejectChangeRequest(rejectTarget.id, rejectReason.trim());
      toast.success("Đã từ chối");
      setRejectTarget(null);
      setRejectReason("");
      refetch();
    } catch (e) {
      toast.error((e as Error).message || "Không từ chối được");
    } finally {
      setBusy(false);
    }
  };

  const doCancel = async (row: ChangeRequestRow) => {
    if (!confirm("Huỷ đề xuất này?")) return;
    try {
      await cancelChangeRequest(row.id);
      toast.success("Đã huỷ đề xuất");
      refetch();
    } catch (e) {
      toast.error((e as Error).message || "Không huỷ được");
    }
  };

  return (
    <div className="space-y-4 p-4">
      <PageHeader
        title="Chờ duyệt"
        subtitle="Hàng đợi thay đổi nhạy cảm cần admin phê duyệt. Người tạo có thể huỷ khi còn chờ."
      />


      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[160px]">
          <Label className="mb-1 text-xs text-muted-foreground">Trạng thái</Label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[220px]">
          <Label className="mb-1 text-xs text-muted-foreground">Loại</Label>
          <Select value={loaiFilter} onValueChange={(v) => setLoaiFilter(v as LoaiFilter)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LOAI_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={"mr-2 h-4 w-4 " + (isFetching ? "animate-spin" : "")} />
            Làm mới
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Lỗi tải dữ liệu: {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <div className="p-6 text-sm text-muted-foreground">Đang tải…</div>
      ) : sortedRows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Không có đề xuất nào với bộ lọc hiện tại.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedRows.map((row) => {
            const isMine = user?.id === row.nguoi_tao;
            const canApprove = isAdmin && row.trang_thai === "pending" && !isMine;
            const canCancel = isMine && row.trang_thai === "pending";
            const applyable = isApplySupported(row.loai);
            return (
              <Card key={row.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-medium">{LOAI_LABEL[row.loai]}</Badge>
                        <Badge variant="outline" className={STATUS_TONE[row.trang_thai]}>
                          {STATUS_LABEL[row.trang_thai]}
                        </Badge>
                        {!applyable && row.trang_thai === "pending" && (
                          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Loại chưa hỗ trợ dispatch tự động
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Tạo lúc {new Date(row.created_at).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="break-all text-sm">
                        <span className="text-muted-foreground">Tóm tắt: </span>
                        <span className="font-mono">{summarizePayload(row.loai, row.payload)}</span>
                      </div>
                      {row.ghi_chu && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Ghi chú:</span> {row.ghi_chu}
                        </div>
                      )}
                      {row.ly_do && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Lý do xử lý:</span> {row.ly_do}
                        </div>
                      )}
                      {row.error_message && (
                        <div className="text-sm text-destructive">
                          <span className="font-medium">Lỗi áp dụng:</span> {row.error_message}
                        </div>
                      )}
                      <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer select-none">Xem payload đầy đủ</summary>
                        <pre className="mt-1 overflow-auto rounded bg-muted p-2 font-mono">
                          {JSON.stringify(row.payload, null, 2)}
                        </pre>
                      </details>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      {canApprove && (
                        <Button size="sm" onClick={() => { setApproveTarget(row); setApproveNote(""); }}>
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Duyệt
                        </Button>
                      )}
                      {isAdmin && row.trang_thai === "pending" && !isMine && (
                        <Button size="sm" variant="outline" onClick={() => { setRejectTarget(row); setRejectReason(""); }}>
                          <XCircle className="mr-2 h-4 w-4" /> Từ chối
                        </Button>
                      )}
                      {canCancel && (
                        <Button size="sm" variant="ghost" onClick={() => doCancel(row)}>
                          <Ban className="mr-2 h-4 w-4" /> Huỷ đề xuất
                        </Button>
                      )}
                      {isMine && row.trang_thai === "pending" && !isAdmin && (
                        <span className="text-xs text-muted-foreground">Chờ admin khác duyệt</span>
                      )}
                      {isAdmin && isMine && row.trang_thai === "pending" && (
                        <span className="text-xs text-muted-foreground">Bạn không được tự duyệt CR của mình</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve dialog */}
      <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duyệt đề xuất</DialogTitle>
            <DialogDescription>
              {approveTarget && `${LOAI_LABEL[approveTarget.loai]} — ${summarizePayload(approveTarget.loai, approveTarget.payload)}`}
            </DialogDescription>
          </DialogHeader>
          {approveTarget && !isApplySupported(approveTarget.loai) && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700">
              Loại này chưa có dispatcher tự động. Nếu duyệt, hệ thống sẽ đánh dấu <code>applied_failed</code>.
            </div>
          )}
          <div className="space-y-2">
            <Label>Ghi chú (không bắt buộc)</Label>
            <Textarea
              rows={3}
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              placeholder="Ghi chú lý do duyệt (nếu cần)…"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setApproveTarget(null)} disabled={busy}>Đóng</Button>
            <Button onClick={doApprove} disabled={busy}>Xác nhận duyệt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối đề xuất</DialogTitle>
            <DialogDescription>
              {rejectTarget && `${LOAI_LABEL[rejectTarget.loai]} — ${summarizePayload(rejectTarget.loai, rejectTarget.payload)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Lý do từ chối (bắt buộc, ≥ 5 ký tự)</Label>
            <Textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nêu ngắn gọn lý do từ chối để người đề xuất biết cần chỉnh gì…"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectTarget(null)} disabled={busy}>Đóng</Button>
            <Button variant="destructive" onClick={doReject} disabled={busy || rejectReason.trim().length < 5}>
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
