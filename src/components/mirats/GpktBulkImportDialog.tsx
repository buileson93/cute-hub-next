// ============================================================================
// GpktBulkImportDialog — Kéo/thả nhiều PDF, bóc tách tầng-1 (regex) song song,
// gộp cảnh báo trùng theo `gp_so` (trong batch + so với DB), cho phép chọn
// những bản đạt để lưu hàng loạt kèm ghi đè bản cũ.
// ============================================================================
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, FileText, Upload, AlertTriangle, CheckCircle2, X,
  Sparkles, Copy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { extractPdfText } from "@/lib/mirats/gpkt-pdf-text";
import {
  parseGpktText, validateFields,
  type FieldMetaMap,
} from "@/lib/mirats/gpkt-regex-parser";
import {
  parseGpktPdf, checkGpktDuplicate, saveGpktRecord,
  type GpktParsedFields, type GpktDuplicate,
} from "@/lib/mirats/gpkt-import.functions";
import { useQueryClient } from "@tanstack/react-query";

const BUCKET = "giay-phep-khai-thac";

type RowStatus = "pending" | "parsing" | "ready" | "failed" | "saving" | "saved" | "skipped";

interface BulkRow {
  id: string;
  file: File;
  status: RowStatus;
  method?: "regex" | "ai" | null;
  fields?: GpktParsedFields;
  meta?: FieldMetaMap;
  filled?: number;
  needsCheck?: number;
  dbDup?: GpktDuplicate | null;   // trùng số GP trong DB
  overwrite?: boolean;             // ghi đè bản DB trùng
  selected: boolean;
  error?: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("Không đọc được tệp"));
    r.onload = () => {
      const s = String(r.result ?? "");
      const i = s.indexOf("base64,");
      resolve(i >= 0 ? s.slice(i + 7) : s);
    };
    r.readAsDataURL(file);
  });
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function GpktBulkImportDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { if (!open) { setRows([]); setBusy(false); } }, [open]);

  // Duplicate số GP trong cùng batch
  const batchDupIds = useMemo(() => {
    const seen = new Map<string, string[]>(); // gp_so → ids
    for (const r of rows) {
      const gp = (r.fields?.gp_so ?? "").trim();
      if (!gp) continue;
      const arr = seen.get(gp) ?? [];
      arr.push(r.id);
      seen.set(gp, arr);
    }
    const dups = new Set<string>();
    seen.forEach((ids) => { if (ids.length > 1) ids.forEach((i) => dups.add(i)); });
    return dups;
  }, [rows]);

  async function processFile(row: BulkRow): Promise<BulkRow> {
    try {
      const txt = await extractPdfText(row.file);
      let fields: GpktParsedFields | null = null;
      let method: "regex" | "ai" = "regex";
      let filled = 0;
      if (txt && txt.length > 200) {
        const r = parseGpktText(txt);
        if (r.fields.gp_so && r.filledCount >= 8) {
          fields = r.fields; filled = r.filledCount;
        }
      }
      if (!fields) {
        // fallback AI
        method = "ai";
        const base64 = await fileToBase64(row.file);
        fields = await parseGpktPdf({
          data: { base64, filename: row.file.name, mime: row.file.type || "application/pdf" },
        });
        filled = Object.values(fields).filter(Boolean).length;
      }
      const meta = validateFields(fields, method);
      const needsCheck = Object.values(meta).filter((m) => m.needsCheck).length;
      // DB dedup
      let dbDup: GpktDuplicate | null = null;
      if (fields.gp_so.trim()) {
        try {
          const rs = await checkGpktDuplicate({ data: { gp_so: fields.gp_so, he_thong_id: null } });
          dbDup = rs.find((d) => d.match === "gp_so") ?? null;
        } catch { /* ignore */ }
      }
      return {
        ...row, status: "ready", method, fields, meta, filled, needsCheck,
        dbDup, overwrite: false,
        selected: !!fields.gp_so && needsCheck <= 3,
      };
    } catch (e) {
      return { ...row, status: "failed", error: e instanceof Error ? e.message : String(e), selected: false };
    }
  }

  async function onFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name));
    if (!list.length) { toast.error("Không có tệp PDF hợp lệ"); return; }
    const newRows: BulkRow[] = list.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: f, status: "parsing", selected: false,
    }));
    setRows((prev) => [...prev, ...newRows]);
    setBusy(true);
    // Song song có giới hạn 3
    const conc = 3;
    const queue = [...newRows];
    async function worker() {
      while (queue.length) {
        const r = queue.shift();
        if (!r) return;
        const done = await processFile(r);
        setRows((prev) => prev.map((x) => (x.id === r.id ? done : x)));
      }
    }
    await Promise.all(Array.from({ length: Math.min(conc, queue.length) }, worker));
    setBusy(false);
    toast.success(`Đã bóc tách ${list.length} tệp`);
  }

  async function saveOne(row: BulkRow): Promise<{ ok: boolean; msg?: string }> {
    if (!row.fields || !row.fields.gp_so.trim()) return { ok: false, msg: "Thiếu số GP" };
    const safe = row.file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${new Date().getFullYear()}/${Date.now()}_${safe}`;
    const { compressForUpload } = await import("@/lib/storage/compress");
    const c = await compressForUpload(row.file);
    const up = await supabase.storage.from(BUCKET).upload(path, c.blob, {
      contentType: c.contentType || "application/pdf",
      upsert: false,
    });
    if (up.error) return { ok: false, msg: "Upload lỗi: " + up.error.message };
    const sig = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    const fileUrl = sig.data?.signedUrl ?? null;
    const overwriteId = row.overwrite && row.dbDup ? row.dbDup.id : null;
    try {
      await saveGpktRecord({
        data: {
          fields: row.fields, he_thong_id: null, file_gpkt: fileUrl, overwrite_id: overwriteId,
        },
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e instanceof Error ? e.message : String(e) };
    }
  }

  async function saveSelected() {
    setBusy(true);
    let ok = 0, fail = 0, skipped = 0;
    for (const r of rows) {
      if (!r.selected || r.status === "saved") { if (!r.selected) skipped++; continue; }
      if (batchDupIds.has(r.id) && !r.overwrite) {
        // giữ nguyên: cảnh báo dedup trong batch — bỏ qua trừ khi ghi đè
      }
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "saving" } : x)));
      const res = await saveOne(r);
      if (res.ok) { ok++; setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "saved" } : x))); }
      else { fail++; setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "failed", error: res.msg } : x))); }
    }
    setBusy(false);
    qc.invalidateQueries({ queryKey: ["licenses_data"] });
    toast[fail ? "warning" : "success"](`Lưu xong: ${ok} thành công, ${fail} lỗi, ${skipped} bỏ qua`);
  }

  const totalReady = rows.filter((r) => r.status === "ready").length;
  const totalSelected = rows.filter((r) => r.selected && r.status !== "saved").length;
  const totalSaved = rows.filter((r) => r.status === "saved").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Nhập giấy phép hàng loạt
          </DialogTitle>
          <DialogDescription>
            Kéo/thả nhiều PDF (tối đa 20 tệp mỗi lần). Hệ thống bóc tách nhanh
            bằng regex, gộp cảnh báo trùng theo số GP trong batch và trong CSDL.
          </DialogDescription>
        </DialogHeader>

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            if (e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files);
          }}
          className={`rounded-md border-2 border-dashed p-6 text-center transition ${
            dragOver ? "bg-primary/5 border-primary" : "bg-muted/20"
          }`}
        >
          <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
          <div className="text-sm">Kéo/thả PDF hoặc bấm chọn</div>
          <input
            id="gpkt-bulk-input"
            type="file"
            multiple
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => { if (e.target.files) onFiles(e.target.files); e.target.value = ""; }}
          />
          <Button variant="outline" size="sm" className="mt-3" onClick={() => document.getElementById("gpkt-bulk-input")?.click()}>
            Chọn tệp…
          </Button>
        </div>

        {/* Rows */}
        {rows.length > 0 && (
          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-[24px_1fr_140px_90px_90px_140px_60px] gap-2 items-center px-3 py-2 text-[11px] font-medium bg-muted/50 uppercase text-muted-foreground">
              <span></span>
              <span>Tệp / Số GP / Hệ thống</span>
              <span>Nguồn</span>
              <span>Trường</span>
              <span>Cần KT</span>
              <span>Trùng</span>
              <span></span>
            </div>
            <div className="divide-y max-h-[45vh] overflow-y-auto">
              {rows.map((r) => {
                const inBatchDup = batchDupIds.has(r.id);
                return (
                  <div key={r.id} className="grid grid-cols-[24px_1fr_140px_90px_90px_140px_60px] gap-2 items-center px-3 py-2 text-xs">
                    <Checkbox
                      checked={r.selected}
                      onCheckedChange={(v) => setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, selected: !!v } : x))}
                      disabled={r.status !== "ready"}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate font-medium">{r.file.name}</span>
                      </div>
                      <div className="text-muted-foreground truncate">
                        {r.fields?.gp_so ? <b className="text-foreground">{r.fields.gp_so}</b> : <em>—</em>}
                        {r.fields?.ten_he_thong_theo_gp ? ` · ${r.fields.ten_he_thong_theo_gp}` : ""}
                      </div>
                      {r.error && <div className="text-red-600 mt-0.5">{r.error}</div>}
                    </div>
                    <div>
                      {r.status === "parsing" && <Badge variant="outline"><Loader2 className="h-3 w-3 mr-1 animate-spin" />bóc tách…</Badge>}
                      {r.status === "saving" && <Badge variant="outline"><Loader2 className="h-3 w-3 mr-1 animate-spin" />đang lưu…</Badge>}
                      {r.status === "saved" && <Badge className="bg-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1" />đã lưu</Badge>}
                      {r.status === "failed" && <Badge variant="destructive"><X className="h-3 w-3 mr-1" />lỗi</Badge>}
                      {r.status === "ready" && r.method === "regex" && <Badge variant="outline" className="border-emerald-500 text-emerald-700">regex</Badge>}
                      {r.status === "ready" && r.method === "ai" && <Badge variant="outline" className="border-primary text-primary">AI</Badge>}
                    </div>
                    <div>{r.filled != null && <span>{r.filled}/17</span>}</div>
                    <div>
                      {r.needsCheck != null && (
                        <span className={r.needsCheck > 0 ? "text-amber-600 font-medium" : "text-emerald-600"}>
                          {r.needsCheck}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {inBatchDup && (
                        <div className="text-red-600 flex items-center gap-1"><Copy className="h-3 w-3" />trùng trong batch</div>
                      )}
                      {r.dbDup && (
                        <label className="flex items-center gap-1 cursor-pointer">
                          <Checkbox
                            checked={!!r.overwrite}
                            onCheckedChange={(v) => setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, overwrite: !!v } : x))}
                          />
                          <span className="text-amber-600" title={`Đã có GP ${r.dbDup.gp_so} trong CSDL`}>ghi đè DB</span>
                        </label>
                      )}
                      {!inBatchDup && !r.dbDup && r.status === "ready" && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {batchDupIds.size > 0 && (
          <div className="rounded-md border border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10 p-2.5 text-xs text-red-900 dark:text-red-100 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div>
              Có {batchDupIds.size} tệp trùng số GP trong batch. Bỏ chọn các bản trùng
              hoặc chỉ giữ lại 1 bản trước khi lưu.
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <div className="mr-auto text-xs text-muted-foreground">
            {rows.length > 0 && (
              <>
                Đã bóc tách: <b className="text-foreground">{totalReady}</b>/{rows.length}
                {" · "}Đã chọn: <b className="text-foreground">{totalSelected}</b>
                {" · "}Đã lưu: <b className="text-foreground">{totalSaved}</b>
              </>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button
            disabled={busy || totalSelected === 0}
            onClick={saveSelected}
          >
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu {totalSelected} bản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}