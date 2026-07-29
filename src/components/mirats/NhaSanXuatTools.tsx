// ============================================================================
// Công cụ quản lý danh mục Nhà sản xuất: gộp bản trùng (an toàn, giữ liên kết
// tài sản/mẫu) và nhập/xuất CSV hàng loạt. Dùng kèm <CatalogTable> qua prop
// `headerActions`.
// ============================================================================

import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GitMerge, Download, Upload, Loader2, ArrowRight, AlertTriangle, Boxes, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/backend/client";

import { useSession } from "@/hooks/use-session";
import { toCsv, parseCsv, noAccent } from "@/lib/mirats/import-config";
import { exportCatalogTemplateXlsx, readXlsxFirstSheet } from "@/lib/mirats/catalog-template";
import { ImportPreviewDialog, type ImportPreviewRowStatus } from "@/components/mirats/ImportPreviewDialog";
import { FileDropZone } from "@/components/mirats/FileDropZone";
import { useServerImportEngine } from "@/lib/mirats/use-import-engine";
import { buildRunOptions } from "@/lib/mirats/import-engine";
import { isFeatureEnabled } from "@/lib/mirats/feature-flags";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Nsx = {
  id: string;
  ma: string | null;
  ten: string;
  mo_ta: string | null;
  trang_web: string | null;
  ghi_chu: string | null;
  xuat_xu: string | null;
  active: boolean;
  soMau: number;
  soThietBi: number;
};

/** Chuẩn hoá mã danh mục từ tên. */
function slug(name: string): string {
  const s = noAccent(name).toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return s.slice(0, 40) || "NSX_" + Date.now().toString(36).toUpperCase();
}

export function NhaSanXuatTools() {
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");
  const qc = useQueryClient();
  const engine = useServerImportEngine();
  const [mergeOpen, setMergeOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<
    { title: string; headers: string[]; rows: Array<Record<string, unknown>>; statuses?: ImportPreviewRowStatus[]; note?: string; commit: () => Promise<void> } | null
  >(null);

  const { data: rows } = useQuery({
    queryKey: ["nsx-tools"],
    queryFn: async (): Promise<Nsx[]> => {
      const [{ data: nsx, error }, { data: stats, error: statsErr }] = await Promise.all([
        supabase.from("dm_nha_san_xuat").select("id,ma,ten,mo_ta,trang_web,ghi_chu,xuat_xu,active").order("ten"),
        supabase.from("v_nsx_stats").select("nha_san_xuat_id,so_model,so_thiet_bi"),
      ]);
      if (error) throw error;
      if (statsErr) throw statsErr;
      const mc = new Map<string, number>();
      const tc = new Map<string, number>();
      for (const s of (stats ?? []) as Array<{ nha_san_xuat_id: string; so_model: number; so_thiet_bi: number }>) {
        mc.set(s.nha_san_xuat_id, s.so_model);
        tc.set(s.nha_san_xuat_id, s.so_thiet_bi);
      }
      return ((nsx ?? []) as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        ma: (r.ma as string) ?? null,
        ten: r.ten as string,
        mo_ta: (r.mo_ta as string) ?? null,
        trang_web: (r.trang_web as string) ?? null,
        ghi_chu: (r.ghi_chu as string) ?? null,
        xuat_xu: (r.xuat_xu as string) ?? null,
        active: r.active as boolean,
        soMau: mc.get(r.id as string) ?? 0,
        soThietBi: tc.get(r.id as string) ?? 0,
      }));
    },
  });

  /* -------------------------------- Xuất CSV -------------------------------- */
  function exportCsv() {
    // Khóa tự nhiên = `ma` (thống nhất với Nhập/Xuất hàng loạt). KHÔNG xuất cột
    // `id`: nhập lại sẽ upsert theo `ma` (có thì cập nhật, chưa có thì tạo).
    const headers = ["ma", "ten", "mo_ta", "trang_web", "xuat_xu", "ghi_chu", "active"];
    const csv = toCsv(headers, (rows ?? []).map((r) => ({
      ma: r.ma ?? "",
      ten: r.ten,
      mo_ta: r.mo_ta ?? "",
      trang_web: r.trang_web ?? "",
      ghi_chu: r.ghi_chu ?? "",
      xuat_xu: r.xuat_xu ?? "",
      active: r.active ? "1" : "0",
    })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nha-san-xuat-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất ${rows?.length ?? 0} nhà sản xuất ra CSV.`);
  }

  /* --------------------------- Xuất mẫu XLSX (đẹp) --------------------------- */
  async function exportXlsxTemplate() {
    const headers = ["ma", "ten", "mo_ta", "trang_web", "xuat_xu", "ghi_chu", "active"];
    const dataRows = (rows ?? []).map((r) => [
      r.ma ?? "", r.ten, r.mo_ta ?? "", r.trang_web ?? "", r.xuat_xu ?? "", r.ghi_chu ?? "", r.active ? "1" : "0",
    ]);
    await exportCatalogTemplateXlsx({
      fileName: `nha-san-xuat-${new Date().toISOString().slice(0, 10)}.xlsx`,
      labelSingular: "nhà sản xuất",
      headers,
      rows: dataRows,
      refDropdowns: [],
      required: ["ten"],
      notes: {
        ma: "Khoá tự nhiên. Trống = tạo mới, hệ thống tự sinh mã theo tên.",
        ten: "Tên nhà sản xuất (bắt buộc).",
        trang_web: "URL website chính thức.",
        xuat_xu: "Quốc gia/khu vực xuất xứ.",
      },
    });
    toast.success("Đã xuất mẫu XLSX nhà sản xuất.");
  }

  /* ---------------------------- Nhập CSV / XLSX ----------------------------- */
  async function importCsv(file: File) {
    setImporting(true);
    try {
      let headers: string[] = [];
      let parsed: Record<string, string>[] = [];
      if (/\.xlsx$/i.test(file.name)) {
        const r = await readXlsxFirstSheet(file);
        headers = r.headers; parsed = r.rows;
      } else {
        const text = await file.text();
        const r = parseCsv(text);
        headers = r.headers; parsed = r.rows;
      }
      if (!headers.includes("ten")) {
        toast.error('File phải có cột "ten". Hãy Xuất mẫu XLSX trước để lấy khung chuẩn.');
        return;
      }
      type Row = { ma: string; ten: string; mo_ta: string | null; trang_web: string | null; ghi_chu: string | null; xuat_xu: string | null; active: boolean };
      const upserts: Row[] = [];
      const seen = new Set<string>();
      for (const r of parsed) {
        const ten = (r.ten ?? "").trim();
        if (!ten) continue;
        const ma = (r.ma?.trim() || slug(ten)).toUpperCase();
        if (seen.has(ma)) continue; // gộp trùng mã ngay trong file
        seen.add(ma);
        const activeRaw = (r.active ?? "").trim().toLowerCase();
        upserts.push({
          ma,
          ten,
          mo_ta: r.mo_ta?.trim() || null,
          trang_web: r.trang_web?.trim() || null,
          ghi_chu: r.ghi_chu?.trim() || null,
          xuat_xu: r.xuat_xu?.trim() || null,
          active: activeRaw === "" ? true : !["0", "false", "no", "ẩn", "an"].includes(activeRaw),
        });
      }
      if (upserts.length === 0) {
        toast.error("Không có dòng hợp lệ (thiếu cột tên).");
        return;
      }
      // Ngữ cảnh màn hình tự điền entity/danh mục — người dùng không cần chọn lại.
      const unified = isFeatureEnabled("importEngineUnified");
      const ctx = { entity: "danh_muc", catTable: "dm_nha_san_xuat" };
      // Các dòng gửi engine: giữ nguyên field key từ file (ma/ten/mo_ta/trang_web/…).
      const engineRows = upserts.map((r) => ({
        ma: r.ma, ten: r.ten,
        mo_ta: r.mo_ta ?? "", trang_web: r.trang_web ?? "", xuat_xu: r.xuat_xu ?? "", ghi_chu: r.ghi_chu ?? "",
      }));

      // Nếu bật engine chung: chạy engine.preview() để lấy hành động/lỗi từng dòng
      // → hiển thị badge trong bảng xem trước, chặn ghi khi có lỗi.
      let statuses: ImportPreviewRowStatus[] | undefined;
      let previewNote =
        `Khoá upsert = mã (có mã → cập nhật, chưa có → tạo). ${upserts.length} dòng hợp lệ.` +
        (unified ? " · Ghi qua ImportEngine chung (giống Import Studio)." : "");
      if (unified) {
        try {
          const pre = await engine.preview(buildRunOptions(ctx, engineRows));
          statuses = engineRows.map((_, i) => {
            const p = pre.rows.find((x) => x.index === i);
            return p
              ? { action: p.action, messages: p.messages, warnings: p.warnings }
              : { action: "skip" as const, warnings: ["Không có kết quả xem trước cho dòng này."] };
          });
          previewNote += ` · Kết quả xem trước: +${pre.create} tạo · ~${pre.update} cập nhật` + (pre.error ? ` · ${pre.error} lỗi` : "") + ".";
        } catch (e) {
          previewNote += ` · Không lấy được xem trước từ server: ${(e as Error).message}`;
        }
      }

      // Mở XEM TRƯỚC dạng bảng; chỉ ghi khi người dùng xác nhận.
      setPreview({
        title: "Nhập lại nhà sản xuất",
        headers: ["ma", "ten", "mo_ta", "trang_web", "xuat_xu", "ghi_chu", "active"],
        rows: upserts as unknown as Array<Record<string, unknown>>,
        statuses,
        note: previewNote,
        commit: async () => {
          if (unified) {
            // Đi qua CÙNG một logic với Import Studio (đối chiếu, chống trùng, guard).
            const res = await engine.commit(buildRunOptions(ctx, engineRows));
            toast.success(`Đã nhập nhà sản xuất: tạo ${res.create}, cập nhật ${res.update}` + (res.error ? ` · ${res.error} lỗi` : "") + ".");
          } else {
            // Khóa tự nhiên duy nhất = `ma` (thống nhất với Nhập/Xuất hàng loạt).
            const { error } = await supabase.from("dm_nha_san_xuat").upsert(upserts as never, { onConflict: "ma" });
            if (error) throw error;
            toast.success(`Đã nhập/cập nhật ${upserts.length} nhà sản xuất (theo mã).`);
          }
          qc.invalidateQueries({ queryKey: ["catalog", "dm_nha_san_xuat"] });
          qc.invalidateQueries({ queryKey: ["nsx-tools"] });
        },
      });
    } catch (e) {
      toast.error("Nhập thất bại: " + (e as Error).message);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }


  if (!canManage) return null;

  return (
    <>
      <Button variant="outline" className="gap-1.5" onClick={() => setMergeOpen(true)}>
        <GitMerge className="h-4 w-4" /> Gộp trùng
      </Button>
      <Button variant="outline" className="gap-1.5" onClick={exportCsv}>
        <Download className="h-4 w-4" /> Xuất CSV
      </Button>
      <Button variant="outline" className="gap-1.5" onClick={exportXlsxTemplate}>
        <Download className="h-4 w-4" /> Xuất mẫu XLSX
      </Button>
      <FileDropZone onFile={importCsv} disabled={importing} hint="Kéo-thả file CSV/XLSX để nhập">
        <Button variant="outline" className="gap-1.5" onClick={() => fileRef.current?.click()} disabled={importing}>
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Nhập CSV/XLSX
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); }}
        />
      </FileDropZone>

      {mergeOpen && (
        <MergeDialog rows={rows ?? []} onClose={() => setMergeOpen(false)} onDone={() => {
          setMergeOpen(false);
          qc.invalidateQueries({ queryKey: ["catalog", "dm_nha_san_xuat"] });
          qc.invalidateQueries({ queryKey: ["nsx-tools"] });
        }} />
      )}

      {preview && (
        <ImportPreviewDialog
          title={preview.title}
          headers={preview.headers}
          rows={preview.rows}
          statuses={preview.statuses}
          note={preview.note}
          onCommit={preview.commit}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}


/* ============================ Hộp thoại gộp trùng ============================ */

function MergeDialog({ rows, onClose, onDone }: { rows: Nsx[]; onClose: () => void; onDone: () => void }) {
  const [q, setQ] = useState("");
  const [targetId, setTargetId] = useState<string>("");
  const [sourceIds, setSourceIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  // Nhóm gợi ý các bản có tên gần trùng (không dấu) để con người rà soát lại.
  const groups = useMemo(() => {
    const m = new Map<string, Nsx[]>();
    for (const r of rows) {
      const key = noAccent(r.ten).replace(/[^a-z0-9]/g, "");
      const arr = m.get(key) ?? [];
      arr.push(r);
      m.set(key, arr);
    }
    return Array.from(m.values()).filter((g) => g.length > 1).sort((a, b) => b.length - a.length);
  }, [rows]);

  const filtered = useMemo(() => {
    const nq = noAccent(q);
    if (!nq) return rows;
    return rows.filter((r) => noAccent(r.ten).includes(nq) || noAccent(r.ma ?? "").includes(nq));
  }, [rows, q]);

  const target = rows.find((r) => r.id === targetId) ?? null;
  const sources = rows.filter((r) => sourceIds.has(r.id) && r.id !== targetId);
  const movedModels = sources.reduce((s, r) => s + r.soMau, 0);
  const movedDevices = sources.reduce((s, r) => s + r.soThietBi, 0);

  function toggleSource(id: string) {
    setSourceIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  function applyGroup(g: Nsx[]) {
    // Bản chính = bản nhiều liên kết nhất; còn lại là nguồn.
    const sorted = [...g].sort((a, b) => (b.soMau + b.soThietBi) - (a.soMau + a.soThietBi));
    setTargetId(sorted[0].id);
    setSourceIds(new Set(sorted.slice(1).map((r) => r.id)));
    setConfirm(false);
  }

  async function doMerge() {
    if (!target || sources.length === 0) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("gop_nha_san_xuat", {
        p_source_ids: sources.map((r) => r.id),
        p_target_id: target.id,
      });
      if (error) throw error;
      const res = (data ?? {}) as { models_moved?: number; devices_moved?: number; deleted?: number };
      toast.success(
        `Đã gộp vào "${target.ten}": chuyển ${res.models_moved ?? 0} mẫu, ${res.devices_moved ?? 0} tài sản · xoá ${res.deleted ?? 0} bản trùng.`,
      );
      onDone();
    } catch (e) {
      toast.error("Gộp thất bại: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><GitMerge className="h-5 w-5" /> Gộp nhà sản xuất trùng</DialogTitle>
          <DialogDescription>
            Chọn <b>bản giữ lại</b> (radio) và các <b>bản trùng cần gộp vào</b> (tích chọn). Toàn bộ mẫu &amp; tài sản
            đang liên kết sẽ được chuyển sang bản giữ lại, không mất dữ liệu.
          </DialogDescription>
        </DialogHeader>

        {groups.length > 0 && (
          <div className="rounded-md border bg-muted/40 p-2.5">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Gợi ý bản có tên gần trùng — bấm để chọn nhanh:</p>
            <div className="flex flex-wrap gap-1.5">
              {groups.slice(0, 8).map((g, i) => (
                <Button key={i} size="sm" variant="secondary" className="h-7 gap-1 text-xs" onClick={() => applyGroup(g)}>
                  {g[0].ten} <Badge variant="outline" className="ml-0.5 h-4 px-1 text-[10px]">{g.length}</Badge>
                </Button>
              ))}
            </div>
          </div>
        )}

        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm nhà sản xuất, mã…" />

        <div className="max-h-[38vh] overflow-y-auto rounded-md border">
          <RadioGroup value={targetId} onValueChange={(v) => { setTargetId(v); setSourceIds((p) => { const n = new Set(p); n.delete(v); return n; }); setConfirm(false); }}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="w-16 p-2 text-center">Giữ lại</th>
                  <th className="w-16 p-2 text-center">Gộp</th>
                  <th className="p-2 text-left">Nhà sản xuất</th>
                  <th className="w-20 p-2 text-center">Mẫu</th>
                  <th className="w-20 p-2 text-center">Tài sản</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isTarget = r.id === targetId;
                  const isSource = sourceIds.has(r.id) && !isTarget;
                  return (
                    <tr key={r.id} className={cn("border-b last:border-0", isTarget && "bg-primary/5", isSource && "bg-destructive/5")}>
                      <td className="p-2 text-center"><RadioGroupItem value={r.id} /></td>
                      <td className="p-2 text-center">
                        <Checkbox checked={isSource} disabled={isTarget} onCheckedChange={() => toggleSource(r.id)} />
                      </td>
                      <td className="p-2">
                        <div className="font-medium">{r.ten}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{r.ma ?? "—"}</div>
                      </td>
                      <td className="p-2 text-center text-xs">{r.soMau}</td>
                      <td className="p-2 text-center text-xs">{r.soThietBi}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </RadioGroup>
        </div>

        {target && sources.length > 0 && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              {sources.map((s) => <Badge key={s.id} variant="outline" className="text-xs line-through">{s.ten}</Badge>)}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge className="text-xs">{target.ten}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> Chuyển {movedModels} mẫu</span>
              <span className="flex items-center gap-1"><Boxes className="h-3.5 w-3.5" /> Chuyển {movedDevices} tài sản</span>
              <span className="flex items-center gap-1 text-destructive"><AlertTriangle className="h-3.5 w-3.5" /> Xoá {sources.length} bản trùng</span>
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs">
              <Checkbox checked={confirm} onCheckedChange={(v) => setConfirm(!!v)} />
              Tôi đã rà soát và xác nhận gộp các bản trên vào <b>{target.ten}</b>.
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button disabled={!target || sources.length === 0 || !confirm || saving} onClick={doMerge} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
            Gộp {sources.length > 0 ? `${sources.length} bản` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
