import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Download, Upload, Copy, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/backend/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  parseDacTinhCell,
  serializeExport,
  planImportDacTinh,
  type ImportRow,
} from "@/lib/mirats/dac-tinh-io";

/**
 * Dialog nhập/xuất cột `dac_tinh` cấp Mẫu.
 * - Xuất: sinh CSV `model_ma,dac_tinh` cho tất cả Mẫu (dac_tinh sort A→Z, roundtrip ổn định).
 * - Nhập: dán CSV → preview (thêm/xoá/cảnh báo mã lạ/model lạ) → áp dụng idempotent.
 * - RLS + `canManage` chặn ghi phía server (kiểm tra client thêm để tránh gọi vô ích).
 */
export function ModelDacTinhIODialog({
  open, onOpenChange, canManage,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const [csv, setCsv] = useState("");

  const dataQ = useQuery({
    enabled: open,
    queryKey: ["dac-tinh-io", "snapshot"],
    queryFn: async () => {
      const [models, tags, links] = await Promise.all([
        supabase.from("dm_model").select("id, ma").not("ma", "is", null),
        supabase.from("dm_dac_tinh").select("id, ma"),
        supabase.from("dm_model_dac_tinh").select("model_id, dac_tinh_id"),
      ]);
      if (models.error) throw models.error;
      if (tags.error) throw tags.error;
      if (links.error) throw links.error;
      const modelIdByMa = new Map<string, string>();
      const modelMaById = new Map<string, string>();
      for (const m of models.data ?? []) {
        if (!m.ma) continue;
        modelIdByMa.set(m.ma.trim().toUpperCase(), m.id);
        modelMaById.set(m.id, m.ma);
      }
      const tagIdByMa = new Map<string, string>();
      const tagMaById = new Map<string, string>();
      for (const t of tags.data ?? []) {
        tagIdByMa.set(t.ma.trim().toUpperCase(), t.id);
        tagMaById.set(t.id, t.ma);
      }
      const existingLinks = new Map<string, Set<string>>();
      for (const l of links.data ?? []) {
        if (!existingLinks.has(l.model_id)) existingLinks.set(l.model_id, new Set());
        existingLinks.get(l.model_id)!.add(l.dac_tinh_id);
      }
      return { modelIdByMa, modelMaById, tagIdByMa, tagMaById, existingLinks };
    },
  });

  // Phiên bản schema xuất — tăng khi đổi tên cột / thứ tự cột.
  const EXPORT_SCHEMA_VERSION = "v2";
  // Thứ tự cột CHUẨN — mọi bản xuất phải theo đúng thứ tự này.
  const EXPORT_COLUMNS = ["model_ma", "nhan_thiet_bi"] as const;

  const exportMeta = useMemo(() => {
    const now = new Date();
    // ISO local (không có milli) để người dùng dễ đọc.
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp =
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
      `T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    return { stamp, iso: now.toISOString() };
  }, [dataQ.data]);

  const exportCsv = useMemo(() => {
    if (!dataQ.data) return "";
    const { modelIdByMa, modelMaById, tagMaById, existingLinks } = dataQ.data;
    const rows = Array.from(modelIdByMa.entries()).map(([, id]) => ({
      model_ma: modelMaById.get(id)!,
      dac_tinh_codes: Array.from(existingLinks.get(id) ?? []).map((tid) => tagMaById.get(tid)!).filter(Boolean),
    }));
    rows.sort((a, b) => a.model_ma.localeCompare(b.model_ma));
    const serialized = serializeExport(rows);
    // Dòng meta bắt đầu bằng `#` — importer sẽ bỏ qua để đối soát dễ dàng.
    const meta = [
      `# mirats.export=model_nhan_thiet_bi`,
      `# schema=${EXPORT_SCHEMA_VERSION}`,
      `# columns=${EXPORT_COLUMNS.join(",")}`,
      `# exported_at=${exportMeta.iso}`,
      `# rows=${rows.length}`,
    ].join("\n");
    const header = EXPORT_COLUMNS.join(",");
    const body = serialized.map((r) => `${csvCell(r.model_ma)},${csvCell(r.dac_tinh)}`).join("\n");
    return `${meta}\n${header}\n${body}`;
  }, [dataQ.data, exportMeta]);

  // Parse CSV thô (đơn giản, hỗ trợ quote "..").
  const { parsedRows, legacyHeader, hasHeader } = useMemo<{
    parsedRows: ImportRow[]; legacyHeader: boolean; hasHeader: boolean;
  }>(() => {
    if (!csv.trim()) return { parsedRows: [], legacyHeader: false, hasHeader: false };
    // Bỏ dòng meta `#...` (chú thích/phiên bản/timestamp) và dòng trắng.
    const lines = csv.split(/\r?\n/).filter((l) => l.trim() && !l.trimStart().startsWith("#"));
    if (!lines.length) return { parsedRows: [], legacyHeader: false, hasHeader: false };
    // Bỏ header nếu match — chấp nhận cả tên mới `nhan_thiet_bi` và tên cũ `dac_tinh`.
    const first = splitCsvLine(lines[0]).map((s) => s.trim().toLowerCase());
    const isHeader = first[0] === "model_ma" || first[1] === "nhan_thiet_bi" || first[1] === "dac_tinh";
    const legacy = isHeader && first[1] === "dac_tinh";
    const startIdx = isHeader ? 1 : 0;
    const out: ImportRow[] = [];
    for (let i = startIdx; i < lines.length; i++) {
      const cols = splitCsvLine(lines[i]);
      if (!cols[0]) continue;
      out.push({ model_ma: cols[0], dac_tinh: cols[1] ?? "" });
    }
    return { parsedRows: out, legacyHeader: legacy, hasHeader: isHeader };
  }, [csv]);


  const plan = useMemo(() => {
    if (!dataQ.data || !parsedRows.length) return null;
    return planImportDacTinh({
      rows: parsedRows,
      modelIdByMa: dataQ.data.modelIdByMa,
      tagIdByMa: dataQ.data.tagIdByMa,
      existingLinks: dataQ.data.existingLinks,
    });
  }, [dataQ.data, parsedRows]);

  const stats = useMemo(() => {
    if (!plan) return null;
    let ins = 0, del = 0, noop = 0;
    for (const op of plan.operations) {
      ins += op.toInsert.length;
      del += op.toDelete.length;
      if (!op.toInsert.length && !op.toDelete.length) noop++;
    }
    return { ins, del, noop, models: plan.operations.length };
  }, [plan]);

  const applyMut = useMutation({
    mutationFn: async () => {
      if (!plan) throw new Error("Chưa có kế hoạch");
      if (!canManage) throw new Error("Bạn không có quyền ghi (canManage=false).");
      const inserts: Array<{ model_id: string; dac_tinh_id: string }> = [];
      const deleteByModel = new Map<string, string[]>();
      for (const op of plan.operations) {
        for (const id of op.toInsert) inserts.push({ model_id: op.model_id, dac_tinh_id: id });
        if (op.toDelete.length) deleteByModel.set(op.model_id, op.toDelete);
      }
      // Xoá trước, chèn sau — mỗi model 1 câu delete để tránh mất bản ghi ngoài scope.
      for (const [model_id, ids] of deleteByModel) {
        const { error } = await supabase
          .from("dm_model_dac_tinh")
          .delete()
          .eq("model_id", model_id)
          .in("dac_tinh_id", ids);
        if (error) throw error;
      }
      if (inserts.length) {
        // Upsert để idempotent nếu race — dựa vào unique (model_id, dac_tinh_id).
        const { error } = await supabase
          .from("dm_model_dac_tinh")
          .upsert(inserts, { onConflict: "model_id,dac_tinh_id", ignoreDuplicates: true });
        if (error) throw error;
      }
      return { inserted: inserts.length, deletedModels: deleteByModel.size };
    },
    onSuccess: (res) => {
      const summary =
        `Đã import ${parsedRows.length} dòng · +${res.inserted} liên kết mới · ` +
        `${res.deletedModels} mẫu gỡ bớt` +
        (legacyHeader ? " · đã map dac_tinh → nhan_thiet_bi" : "");
      toast.success("Áp dụng import thành công", { description: summary });
      qc.invalidateQueries({ queryKey: ["dac-tinh-io"] });
      qc.invalidateQueries({ queryKey: ["dm_model_dac_tinh"] });
      qc.invalidateQueries({ queryKey: ["model_dac_tinh"] });
      setCsv("");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      if (/permission|denied|rls/i.test(msg)) {
        toast.error("Không đủ quyền để ghi dm_model_dac_tinh. Dữ liệu KHÔNG bị thay đổi.");
      } else {
        toast.error(`Không áp dụng được: ${msg}`);
      }
    },
  });

  const canApply = canManage && !!plan && !!stats && (stats.ins + stats.del) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nhập / Xuất nhãn tài sản theo Mẫu</DialogTitle>
          <DialogDescription>
            CSV 2 cột: <code>model_ma,nhan_thiet_bi</code> (tương thích tên cũ <code>dac_tinh</code>). Nhiều mã nhãn tài sản tách bởi <code>;</code>.
            Import <b>idempotent</b> — chạy lại cùng file không nhân đôi bản ghi.
          </DialogDescription>

        </DialogHeader>

        <div className="grid gap-4">
          {/* Export */}
          <section className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Download className="h-4 w-4" /> Xuất dữ liệu hiện tại
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  schema {EXPORT_SCHEMA_VERSION} · cột: {EXPORT_COLUMNS.join(", ")} · {exportMeta.stamp}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={!exportCsv}
                  onClick={() => { navigator.clipboard.writeText(exportCsv); toast.success("Đã copy CSV"); }}
                >
                  <Copy className="mr-1.5 h-4 w-4" /> Copy
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={!exportCsv}
                  onClick={() => downloadCsv(exportCsv, `nhan_thiet_bi_theo_mau_${exportMeta.stamp.replace(/[:T]/g, "-")}.csv`)}
                >
                  <Download className="mr-1.5 h-4 w-4" /> Tải .csv

                </Button>
              </div>
            </div>
            {dataQ.isLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Đang tải…</div>
            ) : (
              <Textarea readOnly value={exportCsv} className="h-28 font-mono text-xs" />
            )}
          </section>

          {/* Import */}
          <section className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Upload className="h-4 w-4" /> Dán CSV để nhập
            </div>
            <Textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={"model_ma,nhan_thiet_bi\nAWOS-001,THU;PHAT;VHF"}
              className="h-32 font-mono text-xs"
            />
            {legacyHeader && (
              <div className="mt-2 flex items-start gap-1.5 rounded border border-sky-300 bg-sky-50 p-2 text-xs text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  Phát hiện header cũ <code>dac_tinh</code> — đã tự động map sang{" "}
                  <code>nhan_thiet_bi</code>. File vẫn nhập bình thường, khuyến nghị đổi header
                  ở lần sau.
                </div>
              </div>
            )}
            {parsedRows.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                Đã đọc <b className="text-foreground">{parsedRows.length}</b> dòng
                {hasHeader ? " (bỏ header)" : " (không có header)"}
                {legacyHeader && " · header cũ dac_tinh"}
              </div>
            )}
            {plan && stats && (
              <div className="mt-2 grid gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary">Mẫu xử lý: {stats.models}</Badge>
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">+ {stats.ins} chèn</Badge>
                  <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300">− {stats.del} xoá</Badge>
                  <Badge variant="outline">{stats.noop} không đổi</Badge>
                </div>
                {(plan.unknownTags.length > 0 || plan.missingModels.length > 0) && (
                  <ScrollArea className="max-h-40 rounded border bg-amber-50 p-2 text-xs dark:bg-amber-950/30">
                    <div className="flex items-start gap-1.5 text-amber-800 dark:text-amber-200">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <div className="grid gap-1">
                        {plan.missingModels.length > 0 && (
                          <div><b>Mẫu không tồn tại (bỏ qua):</b> {plan.missingModels.join(", ")}</div>
                        )}
                        {plan.unknownTags.length > 0 && (
                          <div>
                            <b>Mã nhãn tài sản lạ (bỏ qua):</b>{" "}
                            {plan.unknownTags.map((u, i) => (
                              <span key={i} className="mr-1">{u.model_ma}/<code>{u.ma}</code></span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
            {!canManage && (
              <div className="mt-2 text-xs text-muted-foreground">Chỉ xem — bạn không có quyền canManage để ghi.</div>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button
            disabled={!canApply || applyMut.isPending}
            onClick={() => applyMut.mutate()}
          >
            {applyMut.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Áp dụng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------ helpers ------------
function csvCell(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  // Trả string mà giữ chuỗi (parseDacTinhCell sẽ trim từng phần tử).
  // Đối với dac_tinh, parseDacTinhCell tự xử lý; với model_ma, trim ở đây.
  return out.map((s, idx) => (idx === 0 ? s.trim() : s));
}
function downloadCsv(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
