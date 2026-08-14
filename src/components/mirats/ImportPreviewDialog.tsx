// ============================================================================
// Hộp thoại XEM TRƯỚC dạng bảng (tableview) cho các nút "Nhập CSV" rải rác
// (danh mục nền, nhà sản xuất…). Thống nhất trải nghiệm với Nhập/Xuất hàng loạt:
// luôn xem trước từng dòng trong bảng RỒI mới bấm "Ghi vào CSDL".
// ============================================================================

import { Fragment, useId, useMemo, useState } from "react";
import {
  Loader2, Database, X, FileDown, CheckCircle2, Circle, AlertTriangle, GitCompare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export type ImportPreviewIssue = {
  /** Cột dữ liệu bị vi phạm. Bỏ trống = lỗi mức dòng. */
  field?: string;
  /** Giá trị đọc được ở cột đó. */
  value?: string;
  /** Mô tả ngắn cho người dùng. */
  message: string;
  level: "error" | "warning";
};

export type ImportPreviewRowStatus = {
  action?: "create" | "update" | "error" | "skip";
  messages?: string[];
  warnings?: string[];
  /** Chi tiết theo cột — dùng để tô ô lỗi + tooltip cụ thể. */
  issues?: ImportPreviewIssue[];
  /** Ảnh chụp dữ liệu HIỆN CÓ (khoá theo mã) để so sánh trước/sau. */
  before?: Record<string, unknown>;
};

export type ImportPreviewStep = {
  label: string;
  status: "done" | "active" | "pending" | "error";
};

export type ImportPreviewProps = {
  title: string;
  /** Các cột hiển thị trong bảng xem trước. */
  headers: string[];
  /** Các dòng đã phân tích từ file (hiển thị theo `headers`). */
  rows: Array<Record<string, unknown>>;
  /** Trạng thái/hành động mỗi dòng (align theo `rows`). Tuỳ chọn — nếu có sẽ hiện badge + cảnh báo. */
  statuses?: ImportPreviewRowStatus[];
  /** Ghi chú ngắn dưới tiêu đề (khoá upsert, quy tắc trùng…). */
  note?: string;
  /** Cảnh báo mức file (VD phiên bản mẫu cũ, thiếu sheet). Hiện dạng banner vàng. */
  fileWarnings?: string[];
  /** Bước xử lý (parse → validate → preview). Hiện dạng stepper trên đầu bảng. */
  steps?: ImportPreviewStep[];
  /** Callback tải báo cáo lỗi (CSV các dòng lỗi + lý do). Nếu có sẽ hiện nút. */
  onDownloadErrors?: () => void;
  /** Thực thi ghi vào CSDL khi người dùng xác nhận. */
  onCommit: () => Promise<void>;
  onClose: () => void;
};

const ACTION_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  create: { label: "Tạo", variant: "default" },
  update: { label: "Cập nhật", variant: "secondary" },
  error: { label: "Lỗi", variant: "destructive" },
  skip: { label: "Bỏ qua", variant: "outline" },
};

const STEP_STATUS_LABEL: Record<ImportPreviewStep["status"], string> = {
  done: "Hoàn tất",
  active: "Đang xử lý",
  pending: "Chờ",
  error: "Lỗi",
};

function toDisplay(v: unknown): string {
  if (v == null || v === "") return "";
  return String(v);
}

export function ImportPreviewDialog({ title, headers, rows, statuses, note, fileWarnings, steps, onDownloadErrors, onCommit, onClose }: ImportPreviewProps) {
  const [saving, setSaving] = useState(false);
  const [diffMode, setDiffMode] = useState(false);
  const uid = useId();
  const shown = rows.slice(0, 200);
  const hasStatus = Array.isArray(statuses) && statuses.length > 0;
  const errorCount = hasStatus ? statuses!.filter((s) => s?.action === "error").length : 0;
  const createCount = hasStatus ? statuses!.filter((s) => s?.action === "create").length : 0;
  const updateCount = hasStatus ? statuses!.filter((s) => s?.action === "update").length : 0;
  const commitDisabled = saving || rows.length === 0 || errorCount > 0;
  const hasDiff = useMemo(
    () => hasStatus && statuses!.some((s) => s?.before && s?.action === "update"),
    [hasStatus, statuses],
  );

  async function commit() {
    setSaving(true);
    try {
      await onCommit();
      onClose();
    } catch (e) {
      toast.error("Ghi thất bại: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> {title}
            <Badge variant="secondary">{rows.length} dòng</Badge>
            {hasStatus && (
              <>
                {createCount > 0 && <Badge variant="default">+{createCount} tạo</Badge>}
                {updateCount > 0 && <Badge variant="secondary">~{updateCount} cập nhật</Badge>}
                {errorCount > 0 && <Badge variant="destructive">{errorCount} lỗi</Badge>}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {note ?? "Xem trước dữ liệu sẽ nạp. Bấm “Ghi vào CSDL” để áp dụng, hoặc “Huỷ” để bỏ."}
            {errorCount > 0 && " Có dòng lỗi — sửa file rồi tải lại trước khi ghi."}
          </DialogDescription>
        </DialogHeader>

        {/* Vùng live-region: đọc số dòng, số lỗi để screen reader tự thông báo. */}
        <div className="sr-only" role="status" aria-live="polite">
          {`${rows.length} dòng · ${createCount} tạo · ${updateCount} cập nhật · ${errorCount} lỗi.`}
        </div>

        {Array.isArray(steps) && steps.length > 0 && (
          <ol
            aria-label="Tiến trình xử lý nhập liệu"
            className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs"
          >
            {steps.map((s, i) => {
              const isActive = s.status === "active";
              return (
                <li
                  key={i}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`Bước ${i + 1}: ${s.label} — ${STEP_STATUS_LABEL[s.status]}`}
                  className="flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-primary"
                  tabIndex={0}
                >
                  {s.status === "done" && <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />}
                  {s.status === "active" && <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin text-primary" />}
                  {s.status === "pending" && <Circle aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />}
                  {s.status === "error" && <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 text-destructive" />}
                  <span className={isActive ? "font-medium text-foreground" : "text-muted-foreground"}>{s.label}</span>
                  {i < steps.length - 1 && <span aria-hidden="true" className="text-muted-foreground/50">›</span>}
                </li>
              );
            })}
          </ol>
        )}

        {Array.isArray(fileWarnings) && fileWarnings.length > 0 && (
          <div
            role="alert"
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200"
          >
            <div className="mb-1 flex items-center gap-1.5 font-medium">
              <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" /> Cảnh báo định dạng mẫu
            </div>
            {fileWarnings.map((w, i) => <div key={i}>• {w}</div>)}
          </div>
        )}

        {hasDiff && (
          <div className="flex items-center justify-end">
            <Button
              type="button"
              size="sm"
              variant={diffMode ? "default" : "outline"}
              className="gap-1.5"
              aria-pressed={diffMode}
              aria-label={diffMode ? "Tắt so sánh trước/sau" : "Bật so sánh trước/sau"}
              onClick={() => setDiffMode((v) => !v)}
            >
              <GitCompare aria-hidden="true" className="h-4 w-4" />
              {diffMode ? "Đang so sánh trước/sau" : "So sánh trước/sau"}
            </Button>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Không có dòng hợp lệ trong file.
          </div>
        ) : (
          <div className="max-h-[52vh] overflow-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                <TableRow>
                  <TableHead scope="col" className="w-10 text-center">#</TableHead>
                  {hasStatus && <TableHead scope="col" className="w-24">Hành động</TableHead>}
                  {headers.map((h) => (
                    <TableHead scope="col" key={h} className="whitespace-nowrap font-mono text-xs">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((r, i) => {
                  const st = statuses?.[i];
                  const badge = st?.action ? ACTION_BADGE[st.action] : undefined;
                  const rowClass = st?.action === "error"
                    ? "bg-destructive/5"
                    : st?.warnings?.length
                      ? "bg-amber-500/5"
                      : "";
                  // Ánh xạ cột → chi tiết vi phạm để tô ô + tooltip cụ thể.
                  const fieldIssues = new Map<string, ImportPreviewIssue[]>();
                  for (const iss of st?.issues ?? []) {
                    if (!iss.field) continue;
                    const arr = fieldIssues.get(iss.field) ?? [];
                    arr.push(iss);
                    fieldIssues.set(iss.field, arr);
                  }
                  const issuesId = `${uid}-row-${i}-issues`;
                  const hasIssuesBlock = Boolean(
                    st?.issues?.length || st?.messages?.length || st?.warnings?.length,
                  );
                  const showDiff = diffMode && st?.action === "update" && st?.before;
                  return (
                    <Fragment key={i}>
                      <TableRow className={rowClass}>
                        <TableCell className="text-center text-xs text-muted-foreground">{i + 1}</TableCell>
                        {hasStatus && (
                          <TableCell>
                            {badge ? <Badge variant={badge.variant}>{badge.label}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                        )}
                        {headers.map((h) => {
                          const cellIssues = fieldIssues.get(h);
                          const hasError = cellIssues?.some((x) => x.level === "error");
                          const hasWarn = cellIssues?.some((x) => x.level === "warning");
                          const afterVal = toDisplay(r[h]);
                          const beforeVal = showDiff ? toDisplay((st!.before as Record<string, unknown>)[h]) : "";
                          const changed = showDiff && beforeVal !== afterVal;
                          const cellClass = hasError
                            ? "max-w-[220px] truncate text-sm ring-1 ring-inset ring-destructive/60 bg-destructive/10"
                            : hasWarn
                              ? "max-w-[220px] truncate text-sm ring-1 ring-inset ring-amber-500/50 bg-amber-500/10"
                              : changed
                                ? "max-w-[260px] truncate text-sm ring-1 ring-inset ring-primary/40 bg-primary/5"
                                : "max-w-[220px] truncate text-sm";
                          const tooltip = cellIssues?.length
                            ? cellIssues.map((x) => x.message).join("\n")
                            : showDiff && changed
                              ? `Trước: ${beforeVal || "(trống)"} → Sau: ${afterVal || "(trống)"}`
                              : afterVal;
                          return (
                            <TableCell
                              key={h}
                              tabIndex={hasError || hasWarn || changed ? 0 : -1}
                              className={cellClass}
                              title={tooltip}
                              aria-invalid={hasError ? true : undefined}
                              aria-describedby={hasIssuesBlock && (hasError || hasWarn) ? issuesId : undefined}
                              data-invalid={hasError ? "error" : hasWarn ? "warning" : undefined}
                              data-changed={changed || undefined}
                              data-field={h}
                            >
                              {showDiff && changed ? (
                                <span className="flex items-center gap-1">
                                  <span className="text-muted-foreground line-through decoration-destructive/50">
                                    {beforeVal || "—"}
                                  </span>
                                  <span aria-hidden="true" className="text-muted-foreground">→</span>
                                  <span className="font-medium text-foreground">{afterVal || "—"}</span>
                                  <span className="sr-only">Trước: {beforeVal || "trống"}. Sau: {afterVal || "trống"}.</span>
                                </span>
                              ) : afterVal === "" ? (
                                <span className="text-muted-foreground">—</span>
                              ) : (
                                afterVal
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      {hasIssuesBlock ? (
                        <TableRow className={rowClass} data-testid={`row-issues-${i}`}>
                          <TableCell />
                          <TableCell colSpan={headers.length + (hasStatus ? 1 : 0)} className="py-1">
                            <ul id={issuesId} aria-label={`Chi tiết vấn đề dòng ${i + 1}`} className="space-y-0.5">
                              {st?.issues?.map((x, k) => (
                                <li
                                  key={`iss-${k}`}
                                  role={x.level === "error" ? "alert" : undefined}
                                  className={x.level === "error" ? "text-[11px] text-destructive" : "text-[11px] text-amber-700 dark:text-amber-400"}
                                >
                                  <span aria-hidden="true">{x.level === "error" ? "• " : "! "}</span>
                                  <span className="sr-only">{x.level === "error" ? "Lỗi: " : "Cảnh báo: "}</span>
                                  {x.field && (
                                    <>
                                      cột <span className="font-mono">{x.field}</span>
                                      {x.value !== undefined && x.value !== "" ? (
                                        <> = <span className="font-mono">"{x.value}"</span></>
                                      ) : null}
                                      : {" "}
                                    </>
                                  )}
                                  {x.message}
                                </li>
                              ))}
                              {!st?.issues?.length && st?.messages?.map((m, k) => (
                                <li key={`e-${k}`} role="alert" className="text-[11px] text-destructive">
                                  <span aria-hidden="true">• </span>
                                  <span className="sr-only">Lỗi: </span>{m}
                                </li>
                              ))}
                              {!st?.issues?.length && st?.warnings?.map((w, k) => (
                                <li key={`w-${k}`} className="text-[11px] text-amber-700 dark:text-amber-400">
                                  <span aria-hidden="true">! </span>
                                  <span className="sr-only">Cảnh báo: </span>{w}
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {rows.length > shown.length && (
          <p className="text-xs text-muted-foreground">Hiển thị {shown.length} dòng đầu · tổng {rows.length} dòng sẽ được ghi.</p>
        )}

        <DialogFooter>
          <AppTooltip noiDung="Huỷ bỏ quá trình nhập liệu">
            <Button variant="ghost" onClick={onClose} disabled={saving} className="h-8 w-8 p-0">
              <X aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only">Huỷ</span>
            </Button>
          </AppTooltip>
          
          {onDownloadErrors && errorCount > 0 && (
            <AppTooltip noiDung="Tải file CSV chứa các dòng bị lỗi để kiểm tra">
              <Button variant="outline" onClick={onDownloadErrors} disabled={saving} className="h-8 w-8 p-0">
                <FileDown aria-hidden="true" className="h-4 w-4" />
                <span className="sr-only">Tải báo cáo lỗi</span>
              </Button>
            </AppTooltip>
          )}

          <AppTooltip noiDung={commitDisabled ? "Khắc phục lỗi trước khi ghi" : "Ghi dữ liệu hợp lệ vào CSDL"}>
            <Button onClick={commit} disabled={commitDisabled} className="h-8 w-8 p-0">
              {saving ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Database aria-hidden="true" className="h-4 w-4" />}
              <span className="sr-only">Ghi vào CSDL</span>
            </Button>
          </AppTooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
