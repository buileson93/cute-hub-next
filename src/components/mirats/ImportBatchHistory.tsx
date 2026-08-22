// ============================================================================
// Lịch sử lô nhập (staging): liệt kê các lô đã tải, cho phép mở lại xem chi
// tiết dòng và xóa lô (rollback staging). Không đụng dữ liệu nghiệp vụ.
// ============================================================================

import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  History,
  Loader2,
  Trash2,
  Eye,
  RefreshCw,
  PlayCircle,
  Undo2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  listImportBatches,
  getImportBatch,
  deleteImportBatch,
} from "@/lib/mirats/import-staging.functions";
import {
  applyImportBatch,
  previewRollbackImportBatch,
  rollbackImportBatch,
} from "@/lib/mirats/import-apply.functions";
import {
  summarizeRollbackPreview,
  actionLabel,
  type RollbackPreview,
  type RollbackSummary,
} from "@/lib/mirats/rollback-preview";
import { ImportBatchDetail } from "@/components/mirats/ImportBatchDetail";

type Batch = {
  id: string;
  file_name: string;
  source: string;
  status: string;
  summary: Record<string, unknown>;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  staged: "Đã lưu tạm",
  reviewing: "Đang xem lại",
  committed: "Đã ghi",
  discarded: "Đã hủy",
  rolled_back: "Đã hoàn tác",
  partially_rolled_back: "Hoàn tác một phần",
};

export function ImportBatchHistory() {
  const list = useServerFn(listImportBatches);
  const getOne = useServerFn(getImportBatch);
  const remove = useServerFn(deleteImportBatch);
  const apply = useServerFn(applyImportBatch);
  const previewRollback = useServerFn(previewRollbackImportBatch);
  const doRollback = useServerFn(rollbackImportBatch);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [busy, setBusy] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [rbId, setRbId] = useState<string | null>(null);
  const [rbSummary, setRbSummary] = useState<RollbackSummary | null>(null);

  async function refresh() {
    setBusy(true);
    try {
      const res = await list();
      setBatches((res.batches ?? []) as Batch[]);
    } catch (e) {
      toast.error("Không tải được lịch sử: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Nạp lịch sử một lần khi mở dialog; refresh ổn định, không cần trong deps.

  useEffect(() => {
    void refresh();
  }, []);

  async function open(id: string) {
    setOpenId(id);
    setItems([]);
    try {
      const res = await getOne({ data: { id } });
      setItems((res.items ?? []) as Array<Record<string, unknown>>);
    } catch (e) {
      toast.error("Không mở được lô: " + (e as Error).message);
    }
  }

  async function del(id: string) {
    if (!window.confirm("Xóa hẳn lô staging này? (không ảnh hưởng dữ liệu đã ghi)")) return;
    try {
      await remove({ data: { id } });
      toast.success("Đã xóa lô staging");
      if (openId === id) {
        setOpenId(null);
        setItems([]);
      }
      void refresh();
    } catch (e) {
      toast.error("Không xóa được: " + (e as Error).message);
    }
  }

  async function applyBatch(id: string) {
    if (
      !window.confirm(
        "Áp dụng lô này vào dữ liệu nghiệp vụ? Thao tác chạy trong một giao dịch (lỗi sẽ hoàn tác toàn bộ).",
      )
    )
      return;
    setActingId(id);
    try {
      const res = await apply({ data: { id } });
      const r = (res.result ?? {}) as Record<string, number>;
      toast.success(
        `Đã áp dụng: tạo ${r.created ?? 0}, cập nhật ${r.updated ?? 0}, ngừng dùng ${r.retired ?? 0}, giữ ${r.kept ?? 0}`,
      );
      void refresh();
    } catch (e) {
      toast.error("Áp dụng thất bại: " + (e as Error).message);
    } finally {
      setActingId(null);
    }
  }

  async function openRollback(id: string) {
    setActingId(id);
    try {
      const res = await previewRollback({ data: { id } });
      setRbSummary(summarizeRollbackPreview((res.preview ?? null) as RollbackPreview | null));
      setRbId(id);
    } catch (e) {
      toast.error("Không xem trước được: " + (e as Error).message);
    } finally {
      setActingId(null);
    }
  }

  async function confirmRollback() {
    if (!rbId) return;
    const id = rbId;
    setActingId(id);
    try {
      const res = await doRollback({ data: { id } });
      const r = (res.result ?? {}) as Record<string, number>;
      toast.success(
        `Đã hoàn tác ${r.rolled ?? 0} dòng${r.blocked ? `, ${r.blocked} dòng bị chặn (có lịch sử)` : ""}`,
      );
      setRbId(null);
      setRbSummary(null);
      void refresh();
    } catch (e) {
      toast.error("Hoàn tác thất bại: " + (e as Error).message);
    } finally {
      setActingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-primary" /> Lịch sử lô nhập (staging)
            </CardTitle>
            <CardDescription>
              Mỗi lần tải file tạo một lô tạm. Mở lại để xem chi tiết dòng hoặc xóa.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => void refresh()} disabled={busy}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {batches.length === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa có lô nhập nào.</p>
        ) : (
          <div className="overflow-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead className="w-28">Nguồn</TableHead>
                  <TableHead className="w-32">Trạng thái</TableHead>
                  <TableHead className="w-40">Thời điểm</TableHead>
                  <TableHead className="w-24 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-xs font-medium">{b.file_name}</TableCell>
                    <TableCell className="text-xs uppercase">{b.source}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{STATUS_LABEL[b.status] ?? b.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">
                      {new Date(b.created_at).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => void open(b.id)}
                        title="Mở lại"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {b.status !== "committed" && b.status !== "rolled_back" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-primary"
                          disabled={actingId === b.id}
                          onClick={() => void applyBatch(b.id)}
                          title="Áp dụng vào dữ liệu"
                        >
                          {actingId === b.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <PlayCircle className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                      {(b.status === "committed" || b.status === "partially_rolled_back") && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-amber-600"
                          disabled={actingId === b.id}
                          onClick={() => void openRollback(b.id)}
                          title="Hoàn tác"
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => void del(b.id)}
                        title="Xóa"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {openId && (
          <div className="rounded-md border bg-muted/20 p-3">
            <p className="mb-2 text-xs font-medium">Chi tiết lô — {items.length} dòng</p>
            <ImportBatchDetail
              items={items as any}
              batchName={batches.find((b) => b.id === openId)?.file_name}
            />
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={!!rbId}
        onOpenChange={(o) => {
          if (!o) {
            setRbId(null);
            setRbSummary(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Undo2 className="h-4 w-4" /> Xem trước hoàn tác
            </AlertDialogTitle>
            <AlertDialogDescription>
              {rbSummary
                ? `${rbSummary.canCount}/${rbSummary.total} dòng có thể hoàn tác an toàn.`
                : "Đang tải..."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {rbSummary?.hasBlocked && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
              <p className="mb-2 flex items-center gap-1.5 font-medium text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" /> {rbSummary.cannotCount} dòng KHÔNG thể
                hoàn tác (đã có lịch sử/phụ thuộc):
              </p>
              <ul className="max-h-40 space-y-1 overflow-auto">
                {rbSummary.blocked.map((b) => (
                  <li key={b.item_id} className="text-muted-foreground">
                    #{b.row_index} · {actionLabel(b.action)} · {b.target_table} — {b.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Đóng</AlertDialogCancel>
            <AlertDialogAction
              disabled={!rbSummary?.canProceed || !!actingId}
              onClick={(e) => {
                e.preventDefault();
                void confirmRollback();
              }}
            >
              {actingId ? "Đang hoàn tác..." : "Hoàn tác các dòng an toàn"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
