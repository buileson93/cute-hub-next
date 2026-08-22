// ============================================================================
// NHẬP FILE ALL-IN-ONE (.xlsx): đọc mọi sheet → Xem trước tất cả các lớp →
// Ghi theo đúng thứ tự phụ thuộc (cha trước, con sau) bằng chính động cơ
// runBulkImport (giống luồng CSV, một nguồn logic duy nhất).
// ============================================================================

import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
  RefreshCw,
  ArrowRight,
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
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { runBulkImport } from "@/lib/mirats/import-export.functions";
import { createImportBatch } from "@/lib/mirats/import-staging.functions";
import { sha256Hex, layersToStagedItems } from "@/lib/mirats/import-staging";
import { isFeatureEnabled } from "@/lib/mirats/feature-flags";
import { parseAllInOneXlsx, type ParsedLayer } from "@/lib/mirats/allinone-template";
import { findEntity } from "@/lib/mirats/import-config";

type ExtraRefs = Record<string, Array<{ ma?: string; ten?: string }>>;

// Các "nhóm nền" cần admin xác nhận trước khi tự tạo mới (khớp cờ guard ở import-config).
const CONFIRMABLE_TABLES = ["dm_phan_loai", "dm_nhom_he_thong"];

/**
 * Gom khóa (mã + tên) của MỌI lớp khác trong file, nhóm theo bảng CSDL, để gửi
 * kèm khi XEM TRƯỚC. Nhờ vậy lớp con (VD Tài sản) tham chiếu tới hệ thống/mẫu
 * khai ở lớp cha (cùng file, chưa ghi) sẽ khớp và không báo "Không tìm thấy".
 */
function buildExtraRefs(all: LayerState[], exceptIndex: number): ExtraRefs {
  const map: ExtraRefs = {};
  for (let j = 0; j < all.length; j++) {
    if (j === exceptIndex) continue;
    const l = all[j];
    if (l.parsed.rows.length === 0) continue;
    const ent = findEntity(l.parsed.layer.entity, l.parsed.layer.catTable);
    if (!ent) continue;
    const nameKey = ent.fields.find((f) => f.key === "ten_thiet_bi" || f.key === "ten")?.key;
    const arr = map[ent.table] ?? (map[ent.table] = []);
    for (const row of l.parsed.rows) {
      const ma = (row[ent.keyHeader] ?? "").trim();
      const ten = nameKey ? (row[nameKey] ?? "").trim() : "";
      if (ma || ten) arr.push({ ma: ma || undefined, ten: ten || undefined });
    }
  }
  return map;
}

type RefConfirm = { table: string; label: string; value: string };
type RefCreatedGroup = {
  table: string;
  label: string;
  items: Array<{ id: string; ma: string | null; ten: string }>;
};
type RefReusedGroup = { table: string; label: string; count: number };
type Summary = {
  total: number;
  create: number;
  update: number;
  error: number;
  skip?: number;
  refCreate: number;
  refConfirm?: number;
  refReused?: number;
  created?: number;
  updated?: number;
  lapped?: number;
  writeErrors?: number;
};
type LayerState = {
  parsed: ParsedLayer;
  status: "idle" | "checking" | "checked" | "writing" | "done" | "error";
  summary?: Summary;
  errorMsg?: string;
  firstErrors?: string[];
  confirms?: RefConfirm[];
  refCreatedByTable?: RefCreatedGroup[];
  refReusedByTable?: RefReusedGroup[];
};

export function AllInOneImport() {
  const runImport = useServerFn(runBulkImport);
  const stageBatch = useServerFn(createImportBatch);
  const [fileName, setFileName] = useState("");
  const [layers, setLayers] = useState<LayerState[]>([]);
  const [busy, setBusy] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [phase, setPhase] = useState<"empty" | "loaded" | "checked" | "committed">("empty");
  // Admin đã xác nhận cho phép tự tạo các "nhóm nền" (dm_phan_loai, dm_nhom_he_thong…) còn thiếu.
  const [allowCreateBase, setAllowCreateBase] = useState(false);
  // Cho phép GHI ĐÈ các dòng bị phát hiện xung đột (bản ghi đã đổi trong CSDL sau khi tải mẫu).
  const [allowOverwrite, setAllowOverwrite] = useState(false);

  const nonEmpty = useMemo(() => layers.filter((l) => l.parsed.rows.length > 0), [layers]);
  const totals = useMemo(() => {
    let create = 0,
      update = 0,
      error = 0,
      skip = 0,
      refCreate = 0;
    for (const l of layers)
      if (l.summary) {
        create += l.summary.create;
        update += l.summary.update;
        error += l.summary.error;
        skip += l.summary.skip ?? 0;
        refCreate += l.summary.refCreate;
      }
    return { create, update, error, skip, refCreate };
  }, [layers]);

  // Gom các "nhóm nền" đang thiếu (chờ xác nhận), khử trùng theo bảng|giá trị.
  const pendingConfirms = useMemo(() => {
    const m = new Map<string, RefConfirm>();
    for (const l of layers)
      for (const c of l.confirms ?? []) m.set(`${c.table}|${c.value.toLowerCase()}`, c);
    return [...m.values()];
  }, [layers]);
  const confirmTables = useMemo(
    () => [...new Set(pendingConfirms.map((c) => c.table))],
    [pendingConfirms],
  );

  const hasErrors = useMemo(() => layers.some((l) => (l.summary?.error ?? 0) > 0), [layers]);

  async function readFile(file: File) {
    if (!/\.xlsx$/i.test(file.name)) {
      toast.error("Chỉ hỗ trợ file .xlsx (mẫu all-in-one)");
      return;
    }
    setBusy(true);
    try {
      const parsed = await parseAllInOneXlsx(file);
      const withRows = parsed.filter((p) => p.rows.length > 0);
      if (withRows.length === 0) {
        toast.error("File không có dòng dữ liệu nào ở các sheet đã biết.");
        return;
      }
      setLayers(parsed.map((p) => ({ parsed: p, status: "idle" })));
      setFileName(file.name);
      setPhase("loaded");
      toast.success(`Đọc được ${withRows.length} lớp có dữ liệu`);

      // Lưu STAGING: upload/parse chỉ tạo lô tạm, chưa ghi bảng nghiệp vụ.
      if (isFeatureEnabled("importStaging")) {
        try {
          const hash = await sha256Hex(file);
          const items = layersToStagedItems(parsed);
          const res = await stageBatch({
            data: {
              fileName: file.name,
              fileHash: hash,
              fileSize: file.size,
              source: "allinone",
              summary: { total: items.length, layers: withRows.length },
              items: items as never,
            },
          });
          setBatchId(res.batchId);
          if (res.duplicate) {
            toast.warning(`File này đã từng được nhập trước đó (${res.duplicate.fileName}).`);
          }
        } catch (e) {
          toast.error("Không lưu được bản nháp staging: " + (e as Error).message);
        }
      }
    } catch (e) {
      toast.error("Không đọc được file: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    setLayers([]);
    setFileName("");
    setPhase("empty");
    setBatchId(null);
  }

  async function runOne(
    ls: LayerState,
    commit: boolean,
    extraRefs?: ExtraRefs,
    allow = allowCreateBase,
  ): Promise<Summary | null> {
    const { entity, catTable } = ls.parsed.layer;
    const res = (await runImport({
      data: {
        entity,
        catTable: entity === "danh_muc" ? catTable : undefined,
        rows: ls.parsed.rows,
        // Cột kỹ thuật song song với rows (nhắm đúng bản ghi + phát hiện xung đột).
        meta: ls.parsed.meta as never,
        allowOverwrite,
        commit,
        // Chỉ gửi kèm khi xem trước (commit=false) — commit thật ghi cha trước nên không cần.
        ...(!commit && extraRefs ? { extraRefs } : {}),
        // Admin đã bấm xác nhận → cho phép tự tạo các nhóm nền còn thiếu.
        ...(allow ? { allowRefCreate: CONFIRMABLE_TABLES } : {}),
      },
    })) as {
      summary: Summary;
      errors?: Array<{ key: string; message: string }>;
      preview?: Array<{ action: string; key: string; messages: string[] }>;
      confirms?: RefConfirm[];
      refCreatedByTable?: RefCreatedGroup[];
      refReusedByTable?: RefReusedGroup[];
    };
    // Ghi thật trả về `errors`; xem trước trả về `preview` (lấy các dòng action="error").
    const previewErrs = (res.preview ?? [])
      .filter((p) => p.action === "error")
      .map((p) => ({ key: p.key, message: p.messages.join("; ") }));
    const __errs = res.errors ?? previewErrs;
    return {
      ...res.summary,
      __errs,
      __confirms: res.confirms ?? [],
      __refCreated: res.refCreatedByTable ?? [],
      __refReused: res.refReusedByTable ?? [],
    } as Summary & {
      __errs?: unknown;
      __confirms?: RefConfirm[];
      __refCreated?: RefCreatedGroup[];
      __refReused?: RefReusedGroup[];
    };
  }

  async function checkAll(allow = allowCreateBase) {
    setBusy(true);
    try {
      const next = [...layers];
      for (let i = 0; i < next.length; i++) {
        if (next[i].parsed.rows.length === 0) continue;
        next[i] = { ...next[i], status: "checking" };
        setLayers([...next]);
        try {
          const summary = (await runOne(next[i], false, buildExtraRefs(next, i), allow)) as
            | (Summary & {
                __errs?: Array<{ key: string; message: string }>;
                __confirms?: RefConfirm[];
              })
            | null;
          const firstErrors = (summary?.__errs ?? [])
            .slice(0, 8)
            .map((e) => `${e.key}: ${e.message}`);
          next[i] = {
            ...next[i],
            status: "checked",
            summary: summary ?? undefined,
            firstErrors,
            confirms: summary?.__confirms ?? [],
          };
        } catch (e) {
          next[i] = { ...next[i], status: "error", errorMsg: (e as Error).message };
        }
        setLayers([...next]);
      }
      setPhase("checked");
      toast.success("Đã xem trước tất cả các lớp");
    } finally {
      setBusy(false);
    }
  }

  async function commitAll() {
    setBusy(true);
    try {
      const next = [...layers];
      for (let i = 0; i < next.length; i++) {
        if (next[i].parsed.rows.length === 0) continue;
        // Soát LẠI lớp này theo trạng thái CSDL mới nhất — vì lớp cha (danh mục,
        // mẫu, hệ thống) vừa được ghi ở vòng trước nên tham chiếu của lớp con
        // giờ mới khớp. Không dùng kết quả xem trước cũ (lúc đó cha chưa tồn tại).
        next[i] = { ...next[i], status: "checking" };
        setLayers([...next]);
        let fresh: (Summary & { __errs?: Array<{ key: string; message: string }> }) | null = null;
        try {
          fresh = (await runOne(next[i], false)) as
            | (Summary & { __errs?: Array<{ key: string; message: string }> })
            | null;
        } catch {
          /* để lỗi hiện ở bước ghi bên dưới */
        }
        if (fresh) next[i] = { ...next[i], summary: fresh };
        // Còn dòng lỗi (sau khi cha đã ghi) → bỏ qua lớp để không ghi dở dang.
        if ((fresh?.error ?? next[i].summary?.error ?? 0) > 0) {
          const firstErrors = (fresh?.__errs ?? [])
            .slice(0, 8)
            .map((e) => `${e.key}: ${e.message}`);
          next[i] = {
            ...next[i],
            status: "error",
            errorMsg: "Còn dòng lỗi — sửa file rồi kiểm tra lại.",
            firstErrors,
          };
          setLayers([...next]);
          continue;
        }
        next[i] = { ...next[i], status: "writing" };
        setLayers([...next]);
        try {
          const r = (await runOne(next[i], true)) as
            | (Summary & {
                __errs?: Array<{ key: string; message: string }>;
                __refCreated?: RefCreatedGroup[];
                __refReused?: RefReusedGroup[];
              })
            | null;
          const firstErrors = (r?.__errs ?? []).slice(0, 5).map((e) => `${e.key}: ${e.message}`);
          next[i] = {
            ...next[i],
            status: "done",
            summary: r ?? undefined,
            firstErrors,
            refCreatedByTable: r?.__refCreated ?? [],
            refReusedByTable: r?.__refReused ?? [],
          };
        } catch (e) {
          next[i] = { ...next[i], status: "error", errorMsg: (e as Error).message };
        }
        setLayers([...next]);
      }
      setPhase("committed");
      const created = next.reduce((s, l) => s + (l.summary?.created ?? 0), 0);
      const updated = next.reduce((s, l) => s + (l.summary?.updated ?? 0), 0);
      toast.success(`Đã ghi toàn bộ: ${created} mới · ${updated} cập nhật`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-4 w-4 text-primary" /> Nhập file All-in-one (.xlsx)
          </CardTitle>
          <CardDescription>
            Một file, nhiều sheet — khai cả hệ thống trong một lần. Tải file →{" "}
            <b>Xem trước tất cả</b> → <b>Ghi theo thứ tự</b> (cha trước, con sau). Trùng <b>mã</b> =
            cập nhật, không nhân bản.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {phase === "empty" ? (
            <label
              htmlFor="allinone-upload"
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const f = e.dataTransfer.files?.[0];
                if (f) readFile(f);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/10"
                  : "border-muted-foreground/25 bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${dragActive ? "bg-primary/20" : "bg-muted"}`}
              >
                {busy ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <Upload
                    className={`h-6 w-6 ${dragActive ? "text-primary" : "text-muted-foreground"}`}
                  />
                )}
              </div>
              <div className="text-sm font-medium">Kéo & thả file .xlsx mẫu all-in-one</div>
              <div className="text-xs text-muted-foreground">
                hoặc bấm để chọn — dùng file tải từ nút “Mẫu all-in-one”
              </div>
              <input
                id="allinone-upload"
                type="file"
                accept=".xlsx"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) readFile(f);
                  e.target.value = "";
                }}
              />
            </label>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  <b className="text-foreground">{fileName}</b> · {nonEmpty.length} lớp có dữ liệu ·{" "}
                  {nonEmpty.reduce((s, l) => s + l.parsed.rows.length, 0)} dòng
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={clearAll}
                  disabled={busy}
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Xóa file
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => checkAll()} disabled={busy}>
                  {busy && phase === "loaded" ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-1.5 h-4 w-4" />
                  )}
                  Xem trước tất cả
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={commitAll}
                  disabled={busy || phase === "loaded"}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Ghi theo thứ tự
                </Button>
                {phase === "checked" && hasErrors && (
                  <span className="self-center text-xs text-amber-600">
                    Còn lớp báo lỗi — thường do lớp con tham chiếu cha chưa ghi. Bấm “Ghi theo thứ
                    tự”: hệ thống ghi cha trước rồi soát lại lớp con. Lớp nào vẫn lỗi sẽ được bỏ
                    qua.
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium">Ghi đè dòng xung đột</p>
                  <p className="text-[11px] text-muted-foreground">
                    Mặc định TẮT: bỏ qua dòng đã bị người khác sửa trong CSDL để tránh mất thay đổi
                    mới.
                  </p>
                </div>
                <Switch
                  checked={allowOverwrite}
                  onChange={(e: any) => setAllowOverwrite(e.target.checked)}
                  disabled={busy}
                />
              </div>

              {phase !== "committed" && pendingConfirms.length > 0 && (
                <div className="rounded-md border border-amber-400 bg-amber-50 p-3 text-xs dark:border-amber-500/40 dark:bg-amber-500/10">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="space-y-2">
                      <p className="font-medium text-amber-800 dark:text-amber-300">
                        Cảnh báo: {pendingConfirms.length} nhóm nền chưa có trong CSDL
                      </p>
                      <p className="text-amber-700 dark:text-amber-200/90">
                        File tham chiếu tới các <b>nhóm phân loại / nhóm hệ thống</b> chưa tồn tại (
                        {confirmTables.join(", ")}). Nếu do gõ nhầm chính tả, hãy sửa file rồi{" "}
                        <b>Xem trước lại</b>. Nếu cố ý khai nhóm mới, tích ô bên dưới để cho phép
                        tạo.
                      </p>
                      <ul className="list-disc space-y-0.5 pl-4 text-amber-700 dark:text-amber-200/90">
                        {pendingConfirms.slice(0, 12).map((c) => (
                          <li key={`${c.table}|${c.value}`}>
                            <span className="font-medium">{c.label}</span>: “{c.value}”
                          </li>
                        ))}
                        {pendingConfirms.length > 12 && (
                          <li>… và {pendingConfirms.length - 12} mục khác</li>
                        )}
                      </ul>
                      <label className="mt-1 flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-100/60 px-2 py-1.5 dark:bg-amber-500/10">
                        <Switch
                          checked={allowCreateBase}
                          disabled={busy}
                          onCheckedChange={(v) => {
                            setAllowCreateBase(v);
                            void checkAll(v);
                          }}
                        />
                        <span className="text-amber-800 dark:text-amber-200">
                          <b>Cho phép tự tạo</b> {pendingConfirms.length} nhóm nền còn thiếu khi
                          ghi.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {(phase === "checked" || phase === "committed") && (
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-emerald-600">Tạo mới: {totals.create}</Badge>
                  <Badge className="bg-sky-600">Cập nhật: {totals.update}</Badge>
                  {totals.error > 0 && <Badge variant="destructive">Lỗi: {totals.error}</Badge>}
                  {totals.skip > 0 && (
                    <Badge variant="outline" className="border-amber-500 text-amber-600">
                      Bỏ qua (xung đột): {totals.skip}
                    </Badge>
                  )}
                  {totals.refCreate > 0 && (
                    <Badge variant="outline">Danh mục sẽ tạo: {totals.refCreate}</Badge>
                  )}
                </div>
              )}

              {phase === "committed" &&
                (() => {
                  const created = new Map<
                    string,
                    { label: string; items: RefCreatedGroup["items"] }
                  >();
                  const reused = new Map<string, { label: string; count: number }>();
                  for (const l of layers) {
                    for (const g of l.refCreatedByTable ?? []) {
                      const cur = created.get(g.table) ?? { label: g.label, items: [] };
                      cur.items.push(...g.items);
                      created.set(g.table, cur);
                    }
                    for (const g of l.refReusedByTable ?? []) {
                      const cur = reused.get(g.table) ?? { label: g.label, count: 0 };
                      cur.count += g.count;
                      reused.set(g.table, cur);
                    }
                  }
                  if (created.size === 0 && reused.size === 0) return null;
                  return (
                    <div className="space-y-2">
                      {created.size > 0 && (
                        <div className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
                          <p className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="h-4 w-4" /> Danh mục tự tạo trong lần nhập này
                          </p>
                          <ul className="space-y-1">
                            {[...created.entries()].map(([table, g]) => (
                              <li
                                key={table}
                                className="flex flex-wrap items-center gap-1.5 text-xs"
                              >
                                <Badge variant="outline" className="border-amber-500/50">
                                  {g.label}: {g.items.length} mới
                                </Badge>
                                {table === "dm_model" && (
                                  <Link
                                    to="/danh-muc/model"
                                    search={{ filter: "thieu-loai" }}
                                    className="text-primary underline underline-offset-2 hover:opacity-80"
                                  >
                                    Mở mẫu thiếu loại →
                                  </Link>
                                )}
                                <span className="text-muted-foreground">
                                  {g.items
                                    .slice(0, 6)
                                    .map((x) => x.ten || x.ma)
                                    .filter(Boolean)
                                    .join(" · ")}
                                  {g.items.length > 6 ? ` … +${g.items.length - 6}` : ""}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {reused.size > 0 && (
                        <div className="rounded-md border border-sky-500/30 bg-sky-500/5 p-3 text-xs text-muted-foreground">
                          <span className="font-medium text-sky-700 dark:text-sky-400">
                            Dùng lại danh mục:
                          </span>{" "}
                          {[...reused.values()].map((r) => `${r.label}: ${r.count}`).join(" · ")}
                        </div>
                      )}
                    </div>
                  );
                })()}

              <div className="overflow-auto rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Lớp (sheet)</TableHead>
                      <TableHead className="w-20 text-right">Dòng</TableHead>
                      <TableHead className="w-28">Trạng thái</TableHead>
                      <TableHead>Kết quả</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {layers.map((l, i) => {
                      const empty = l.parsed.rows.length === 0;
                      return (
                        <TableRow key={l.parsed.layer.sheet} className={empty ? "opacity-40" : ""}>
                          <TableCell className="text-xs tabular-nums text-muted-foreground">
                            {i + 1}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {l.parsed.layer.sheet}
                            {l.parsed.unmapped.length > 0 && (
                              <span
                                className="ml-1 text-[10px] text-amber-600"
                                title={l.parsed.unmapped.join(", ")}
                              >
                                (bỏ {l.parsed.unmapped.length} cột)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {l.parsed.rows.length}
                          </TableCell>
                          <TableCell>
                            {empty ? (
                              <span className="text-[11px] text-muted-foreground">trống</span>
                            ) : l.status === "checking" || l.status === "writing" ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : l.status === "done" ? (
                              <Badge className="bg-emerald-600">Đã ghi</Badge>
                            ) : l.status === "checked" ? (
                              <Badge variant="outline">Đã soát</Badge>
                            ) : l.status === "error" ? (
                              <Badge variant="destructive">Lỗi</Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">chờ</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {l.errorMsg && <span className="text-destructive">{l.errorMsg}</span>}
                            {!l.errorMsg && l.summary && (
                              <span className="flex flex-wrap items-center gap-1.5">
                                {l.status === "done" ? (
                                  <>
                                    <span className="text-emerald-600">
                                      +{l.summary.created ?? 0} mới
                                    </span>
                                    <ArrowRight className="h-3 w-3" />
                                    <span className="text-sky-600">
                                      {l.summary.updated ?? 0} cập nhật
                                    </span>
                                    {(l.summary.writeErrors ?? 0) > 0 && (
                                      <span className="text-destructive">
                                        · {l.summary.writeErrors} lỗi ghi
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <span className="text-emerald-600">{l.summary.create} tạo</span>
                                    <span className="text-sky-600">
                                      {l.summary.update} cập nhật
                                    </span>
                                    {l.summary.error > 0 && (
                                      <span className="text-destructive">
                                        {l.summary.error} lỗi
                                      </span>
                                    )}
                                    {l.summary.refCreate > 0 && (
                                      <span className="text-amber-600">
                                        +{l.summary.refCreate} danh mục
                                      </span>
                                    )}
                                  </>
                                )}
                                {(l.firstErrors?.length ?? 0) > 0 && (
                                  <span className="block w-full text-destructive">
                                    {l.firstErrors!.join(" · ")}
                                  </span>
                                )}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  Ghi theo <b>đúng thứ tự sheet</b>: danh mục & mẫu trước, hệ thống rồi tài sản sau
                  — nên liên kết luôn khớp. Lớp còn lỗi sẽ bị bỏ qua để không ghi dở dang.
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
