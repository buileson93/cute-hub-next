// ============================================================================
// Công cụ danh mục dùng chung: Gộp bản trùng (an toàn, giữ liên kết) + Nhập/Xuất
// CSV hàng loạt. Dùng chung cho Nhà cung cấp, Chủng loại, Model…
// Truyền vào <CatalogTable> qua prop `headerActions`.
// ============================================================================

import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GitMerge, Download, Upload, Loader2, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { toCsv, parseCsv, noAccent } from "@/lib/mirats/import-config";
import { invalidateTaxonomy } from "@/lib/mirats/db-taxonomy";
import {
  ImportPreviewDialog,
  type ImportPreviewRowStatus,
} from "@/components/mirats/ImportPreviewDialog";
import { FileDropZone } from "@/components/mirats/FileDropZone";
import { useServerImportEngine } from "@/lib/mirats/use-import-engine";
import { buildRunOptions } from "@/lib/mirats/import-engine";
import { isFeatureEnabled } from "@/lib/mirats/feature-flags";
import {
  exportCatalogTemplateXlsx,
  readXlsxFirstSheet,
  validateCatalogRows,
} from "@/lib/mirats/catalog-template";
import type { ImportPreviewStep } from "@/components/mirats/ImportPreviewDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AppTooltip } from "@/components/mirats/AppTooltip";

// Bảng danh mục được truyền động (string) nên dùng client không ràng buộc kiểu literal.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

/** Một cột đếm liên kết (VD "Tài sản" gồm các bảng/cột khoá ngoại trỏ về danh mục). */
export type CountDef = { key: string; header: string; rels: { table: string; col: string }[] };

/** Một cột khoá ngoại xuất/nhập theo TÊN (VD Model có Nhà sản xuất, Chủng loại). */
export type RefDef = { col: string; refTable: string; csvKey: string; header: string };

export type CatalogToolsConfig = {
  /** Tên bảng danh mục, VD "dm_nha_cung_cap". */
  table: string;
  /** Hàm RPC gộp trùng, VD "gop_nha_cung_cap". */
  rpc: string;
  /** Nhãn hiển thị số ít, VD "nhà cung cấp". */
  labelSingular: string;
  /** Tiền tố mã tự sinh khi thiếu, VD "NCC". */
  slugPrefix: string;
  /** Các cột văn bản thường (ngoài ma/ten/active) để xuất/nhập trực tiếp. */
  textCols?: { key: string; header: string }[];
  /** Các cột khoá ngoại xuất/nhập theo tên. */
  refs?: RefDef[];
  /** Các cột đếm liên kết hiển thị trong hộp thoại gộp. */
  counts: CountDef[];
  /** Xuất kèm danh sách bản ghi con (VD Chủng loại kèm Model) để dễ đánh giá. */
  childExport?: {
    /** Nhãn nút, VD "Xuất kèm mẫu". */
    label: string;
    /** Bảng con, VD "dm_model". */
    table: string;
    /** Cột khoá ngoại trỏ về danh mục, VD "loai_thiet_bi_id". */
    fkCol: string;
    /** Tiền tố tên file. */
    filePrefix: string;
    /** Nhãn số nhiều cho toast, VD "model". */
    childLabel: string;
    /** Các cột của bản con xuất trực tiếp. */
    cols: { key: string; header: string }[];
    /** Các cột khoá ngoại của bản con xuất theo tên. */
    refs?: { col: string; refTable: string; csvKey: string; header: string }[];
  };
};

type Row = {
  id: string;
  ma: string | null;
  ten: string;
  active: boolean;
  text: Record<string, string | null>;
  ref: Record<string, string | null>; // col -> ten
  refId: Record<string, string | null>; // col -> id
  counts: Record<string, number>;
};

function slug(name: string, prefix: string): string {
  const s = noAccent(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return s.slice(0, 40) || `${prefix}_` + Date.now().toString(36).toUpperCase();
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function CatalogTools({ config }: { config: CatalogToolsConfig }) {
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");
  const qc = useQueryClient();
  const engine = useServerImportEngine();
  const [mergeOpen, setMergeOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<{
    title: string;
    headers: string[];
    rows: Array<Record<string, unknown>>;
    statuses?: ImportPreviewRowStatus[];
    note?: string;
    steps?: ImportPreviewStep[];
    fileWarnings?: string[];
    onDownloadErrors?: () => void;
    commit: () => Promise<void>;
  } | null>(null);

  const textKeys = config.textCols?.map((c) => c.key) ?? [];
  const refCols = config.refs ?? [];

  const { data: rows } = useQuery({
    queryKey: ["catalog-tools", config.table],
    queryFn: async (): Promise<Row[]> => {
      const cols = ["id", "ma", "ten", "active", ...textKeys, ...refCols.map((r) => r.col)];
      const { data: base, error } = await sb.from(config.table).select(cols.join(",")).order("ten");
      if (error) throw error;

      // Bản đồ tên cho các bảng khoá ngoại (xuất theo tên).
      const refNameMaps: Record<string, Map<string, string>> = {};
      await Promise.all(
        refCols.map(async (r) => {
          const { data } = await sb.from(r.refTable).select("id,ten");
          const m = new Map<string, string>();
          for (const x of (data ?? []) as { id: string; ten: string }[]) m.set(x.id, x.ten);
          refNameMaps[r.col] = m;
        }),
      );

      // Đếm liên kết cho từng cột đếm.
      const countMaps: Record<string, Map<string, number>> = {};
      await Promise.all(
        config.counts.map(async (c) => {
          const m = new Map<string, number>();
          for (const rel of c.rels) {
            const { data } = await sb.from(rel.table).select(rel.col).not(rel.col, "is", null);
            for (const x of (data ?? []) as Record<string, string>[]) {
              const id = x[rel.col];
              m.set(id, (m.get(id) ?? 0) + 1);
            }
          }
          countMaps[c.key] = m;
        }),
      );

      return ((base ?? []) as Record<string, unknown>[]).map((r) => {
        const id = r.id as string;
        const text: Record<string, string | null> = {};
        for (const k of textKeys) text[k] = (r[k] as string) ?? null;
        const ref: Record<string, string | null> = {};
        const refId: Record<string, string | null> = {};
        for (const rc of refCols) {
          const fid = (r[rc.col] as string) ?? null;
          refId[rc.col] = fid;
          ref[rc.col] = fid ? (refNameMaps[rc.col]?.get(fid) ?? null) : null;
        }
        const counts: Record<string, number> = {};
        for (const c of config.counts) counts[c.key] = countMaps[c.key]?.get(id) ?? 0;
        return {
          id,
          ma: (r.ma as string) ?? null,
          ten: r.ten as string,
          active: r.active as boolean,
          text,
          ref,
          refId,
          counts,
        };
      });
    },
  });

  /* -------------------------------- Xuất CSV -------------------------------- */
  function exportCsv() {
    // Khóa tự nhiên = `ma` (thống nhất với Nhập/Xuất hàng loạt). KHÔNG xuất `id`.
    const headers = ["ma", "ten", ...textKeys, ...refCols.map((r) => r.csvKey), "active"];
    const csv = toCsv(
      headers,
      (rows ?? []).map((r) => {
        const rec: Record<string, string> = {
          ma: r.ma ?? "",
          ten: r.ten,
          active: r.active ? "1" : "0",
        };
        for (const k of textKeys) rec[k] = r.text[k] ?? "";
        for (const rc of refCols) rec[rc.csvKey] = r.ref[rc.col] ?? "";
        return rec;
      }),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.table.replace(/^dm_/, "").replace(/_/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất ${rows?.length ?? 0} ${config.labelSingular} ra CSV.`);
  }

  /* ---------------------- Xuất mẫu XLSX (có dropdown) ---------------------- */
  const [exportingXlsx, setExportingXlsx] = useState(false);
  async function exportXlsxTemplate() {
    setExportingXlsx(true);
    try {
      const headers = ["ma", "ten", ...textKeys, ...refCols.map((r) => r.csvKey), "active"];
      const dataRows: string[][] = (rows ?? []).map((r) => {
        const line: string[] = [r.ma ?? "", r.ten];
        for (const k of textKeys) line.push(r.text[k] ?? "");
        for (const rc of refCols) line.push(r.ref[rc.col] ?? "");
        line.push(r.active ? "1" : "0");
        return line;
      });
      await exportCatalogTemplateXlsx({
        fileName: `${config.table.replace(/^dm_/, "").replace(/_/g, "-")}-mau-${new Date().toISOString().slice(0, 10)}.xlsx`,
        labelSingular: config.labelSingular,
        headers,
        rows: dataRows,
        refDropdowns: refCols.map((r) => ({ csvKey: r.csvKey, refTable: r.refTable })),
        required: ["ten"],
        notes: Object.fromEntries(
          refCols.map((r) => [
            r.csvKey,
            `Chọn ${r.header} từ danh mục sống. Bỏ trống = giữ nguyên.`,
          ]),
        ),
      });
      toast.success("Đã xuất mẫu XLSX (có dropdown).");
    } catch (e) {
      toast.error("Xuất mẫu XLSX thất bại: " + (e as Error).message);
    } finally {
      setExportingXlsx(false);
    }
  }

  /* ------------------ Xuất kèm bản con (VD Loại kèm Mẫu) ------------------ */
  const [exportingChild, setExportingChild] = useState(false);
  async function exportWithChildren() {
    const ce = config.childExport;
    if (!ce) return;
    setExportingChild(true);
    try {
      const childRefs = ce.refs ?? [];
      const childCols = [
        "id",
        "ma",
        "ten",
        ...ce.cols.map((c) => c.key),
        ...childRefs.map((r) => r.col),
        ce.fkCol,
      ];
      const { data: children, error } = await sb
        .from(ce.table)
        .select(childCols.join(","))
        .order("ten");
      if (error) throw error;

      // Bản đồ tên cho khoá ngoại của bản con.
      const refNameMaps: Record<string, Map<string, string>> = {};
      await Promise.all(
        childRefs.map(async (r) => {
          const { data } = await sb.from(r.refTable).select("id,ten");
          const m = new Map<string, string>();
          for (const x of (data ?? []) as { id: string; ten: string }[]) m.set(x.id, x.ten);
          refNameMaps[r.col] = m;
        }),
      );

      const parentById = new Map((rows ?? []).map((r) => [r.id, r] as const));
      const childList = (children ?? []) as Record<string, unknown>[];

      const pIdKey = `${config.slugPrefix.toLowerCase()}_id`;
      const pMaKey = `${config.slugPrefix.toLowerCase()}_ma`;
      const pTenKey = `${config.slugPrefix.toLowerCase()}_ten`;
      const headers = [
        pIdKey,
        pMaKey,
        pTenKey,
        "mau_id",
        "mau_ma",
        "mau_ten",
        ...ce.cols.map((c) => c.key),
        ...childRefs.map((r) => r.csvKey),
      ];

      const out: Record<string, string>[] = [];
      const parentsWithChild = new Set<string>();
      for (const ch of childList) {
        const pid = ch[ce.fkCol] as string | null;
        const p = pid ? parentById.get(pid) : null;
        if (pid) parentsWithChild.add(pid);
        const rec: Record<string, string> = {
          [pIdKey]: p?.id ?? "",
          [pMaKey]: p?.ma ?? "",
          [pTenKey]: p?.ten ?? (pid ? "" : "(chưa gán loại)"),
          mau_id: (ch.id as string) ?? "",
          mau_ma: (ch.ma as string) ?? "",
          mau_ten: (ch.ten as string) ?? "",
        };
        for (const c of ce.cols) rec[c.key] = (ch[c.key] as string) ?? "";
        for (const r of childRefs) {
          const fid = ch[r.col] as string | null;
          rec[r.csvKey] = fid ? (refNameMaps[r.col]?.get(fid) ?? "") : "";
        }
        out.push(rec);
      }
      // Các danh mục chưa có bản con → vẫn xuất 1 dòng trống để đánh giá.
      for (const p of rows ?? []) {
        if (parentsWithChild.has(p.id)) continue;
        const rec: Record<string, string> = {
          [pIdKey]: p.id,
          [pMaKey]: p.ma ?? "",
          [pTenKey]: p.ten,
          mau_id: "",
          mau_ma: "",
          mau_ten: "",
        };
        for (const c of ce.cols) rec[c.key] = "";
        for (const r of childRefs) rec[r.csvKey] = "";
        out.push(rec);
      }

      const csv = toCsv(headers, out);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${ce.filePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(
        `Đã xuất ${childList.length} ${ce.childLabel} kèm ${config.labelSingular} ra CSV.`,
      );
    } catch (e) {
      toast.error("Xuất thất bại: " + (e as Error).message);
    } finally {
      setExportingChild(false);
    }
  }

  /* ---------------- Nhập lại file "Xuất kèm mẫu" (loại + mẫu) ---------------- */
  async function importCombined(headers: string[], parsed: Record<string, string>[]) {
    const ce = config.childExport!;
    const prefix = config.slugPrefix.toLowerCase();
    const pIdKey = `${prefix}_id`,
      pMaKey = `${prefix}_ma`,
      pTenKey = `${prefix}_ten`;

    // 1) Upsert bản mẹ (loại) — gộp trùng theo id → mã → tên trong file.
    type P = { id?: string; ma: string; ten: string };
    const parentByKey = new Map<string, P>();
    for (const r of parsed) {
      const ten = (r[pTenKey] ?? "").trim();
      if (!ten || ten === "(chưa gán loại)") continue;
      const id = (r[pIdKey] ?? "").trim();
      const ma = (r[pMaKey]?.trim() || slug(ten, config.slugPrefix)).toUpperCase();
      const hasId = !!id && UUID_RE.test(id);
      const key = hasId ? `id:${id}` : `ma:${ma}`;
      if (!parentByKey.has(key)) parentByKey.set(key, hasId ? { id, ma, ten } : { ma, ten });
    }
    const pWithId = [...parentByKey.values()].filter((p) => p.id);
    const pNoId = [...parentByKey.values()].filter((p) => !p.id);
    if (pWithId.length) {
      const { error } = await sb.from(config.table).upsert(pWithId as never, { onConflict: "id" });
      if (error) throw error;
    }
    if (pNoId.length) {
      const { error } = await sb.from(config.table).upsert(pNoId as never, { onConflict: "ma" });
      if (error) throw error;
    }

    // 2) Bản đồ mã/tên → id của bản mẹ (sau khi đã upsert) để gán khoá ngoại cho mẫu.
    const { data: parentRows } = await sb.from(config.table).select("id,ma,ten");
    const pMaToId = new Map<string, string>();
    const pTenToId = new Map<string, string>();
    for (const p of (parentRows ?? []) as { id: string; ma: string | null; ten: string }[]) {
      if (p.ma) pMaToId.set(p.ma.toUpperCase(), p.id);
      pTenToId.set(noAccent(p.ten), p.id);
    }

    // 3) Bản đồ tên → id cho khoá ngoại của mẫu (VD Nhà sản xuất).
    const childRefs = ce.refs ?? [];
    const refIdMaps: Record<string, Map<string, string>> = {};
    await Promise.all(
      childRefs.map(async (rf) => {
        const { data } = await sb.from(rf.refTable).select("id,ten");
        const m = new Map<string, string>();
        for (const x of (data ?? []) as { id: string; ten: string }[]) m.set(noAccent(x.ten), x.id);
        refIdMaps[rf.col] = m;
      }),
    );

    // 4) Upsert bản con (mẫu) — theo mau_id → mau_ma.
    type C = Record<string, unknown> & { id?: string; ma: string; ten: string };
    const cWithId: C[] = [];
    const cNoId: C[] = [];
    let unmatchedParents = 0,
      unmatchedRefs = 0;
    for (const r of parsed) {
      const cTen = (r.mau_ten ?? "").trim();
      if (!cTen) continue; // dòng chỉ có loại (không có mẫu) → bỏ qua ở bước con
      const cId = (r.mau_id ?? "").trim();
      const cMa = (r.mau_ma?.trim() || slug(cTen, "MODEL")).toUpperCase();
      const pId = (r[pIdKey] ?? "").trim();
      const pMa = (r[pMaKey] ?? "").trim().toUpperCase();
      const pTen = noAccent((r[pTenKey] ?? "").trim());
      let fk: string | null = null;
      if (pId && UUID_RE.test(pId)) fk = pId;
      else if (pMa && pMaToId.has(pMa)) fk = pMaToId.get(pMa)!;
      else if (pTen && pTenToId.has(pTen)) fk = pTenToId.get(pTen)!;
      if (!fk && (pMa || pTen)) unmatchedParents++;
      const base: C = { ma: cMa, ten: cTen, [ce.fkCol]: fk };
      for (const c of ce.cols) base[c.key] = r[c.key]?.trim() || null;
      for (const rf of childRefs) {
        const nm = (r[rf.csvKey] ?? "").trim();
        if (!nm) {
          base[rf.col] = null;
          continue;
        }
        const fid = refIdMaps[rf.col]?.get(noAccent(nm)) ?? null;
        if (!fid) unmatchedRefs++;
        base[rf.col] = fid;
      }
      if (cId && UUID_RE.test(cId)) cWithId.push({ ...base, id: cId });
      else cNoId.push(base);
    }
    if (cWithId.length) {
      const { error } = await sb.from(ce.table).upsert(cWithId as never, { onConflict: "id" });
      if (error) throw error;
    }
    if (cNoId.length) {
      const { error } = await sb.from(ce.table).upsert(cNoId as never, { onConflict: "ma" });
      if (error) throw error;
    }

    toast.success(
      `Đã nhập lại: ${parentByKey.size} ${config.labelSingular}, ${cWithId.length + cNoId.length} ${ce.childLabel}` +
        (unmatchedParents > 0 ? ` · ${unmatchedParents} mẫu chưa khớp loại` : "") +
        (unmatchedRefs > 0 ? ` · ${unmatchedRefs} liên kết trống` : "") +
        ".",
    );
    qc.invalidateQueries({ queryKey: ["catalog", config.table] });
    qc.invalidateQueries({ queryKey: ["catalog-tools", config.table] });
    qc.invalidateQueries({ queryKey: ["catalog", ce.table] });
    qc.invalidateQueries({ queryKey: ["catalog-tools", ce.table] });
    invalidateTaxonomy(qc);
  }

  /* -------------------------------- Nhập CSV/XLSX --------------------------- */
  // 4 bước rõ ràng cho người dùng: đọc file → validate cột → chuẩn hoá dòng →
  // gọi engine.preview lấy hành động/lỗi. Luôn mở xem trước có badge (kể cả khi
  // engine chung tạm lỗi) trước khi cho phép ghi.
  async function importCsv(file: File) {
    setImporting(true);
    const t = toast.loading(`Đang đọc ${file.name}…`);
    try {
      const isXlsx = /\.xlsx$/i.test(file.name);
      let headers: string[];
      let parsed: Record<string, string>[];
      const fileWarnings: string[] = [];
      let templateVersion: string | null = null;
      if (isXlsx) {
        const r = await readXlsxFirstSheet(file);
        headers = r.headers;
        parsed = r.rows;
        templateVersion = r.version;
        fileWarnings.push(...r.warnings);
      } else {
        const text = await file.text();
        const p = parseCsv(text);
        headers = p.headers;
        parsed = p.rows;
      }
      toast.loading(`Đã đọc ${parsed.length} dòng. Đang kiểm tra cột…`, { id: t });

      // Nhánh "Xuất kèm mẫu" giữ nguyên hành vi cũ.
      const isCombined =
        !!config.childExport &&
        (headers.includes("mau_ten") || headers.includes("mau_ma") || headers.includes("mau_id"));
      if (isCombined) {
        toast.dismiss(t);
        setPreview({
          title: `Nhập lại ${config.labelSingular} (kèm mẫu)`,
          headers,
          rows: parsed,
          fileWarnings,
          note: "Xem trước file. Bấm “Ghi vào CSDL” để nhập cả loại + mẫu (khoá theo mã).",
          commit: () => importCombined(headers, parsed),
        });
        return;
      }

      if (!headers.includes("ten")) {
        toast.error('File phải có cột "ten". Hãy xuất mẫu XLSX/CSV trước để lấy khung chuẩn.', {
          id: t,
        });
        return;
      }

      toast.loading("Đang chuẩn hoá dòng & tra khoá ngoại…", { id: t });
      // Bản đồ tên → id cho các cột khoá ngoại (nhập theo tên).
      const refIdMaps: Record<string, Map<string, string>> = {};
      const refAllowed: Record<string, Set<string>> = {};
      await Promise.all(
        refCols.map(async (r) => {
          const { data } = await sb.from(r.refTable).select("id,ten");
          const m = new Map<string, string>();
          const allow = new Set<string>();
          for (const x of (data ?? []) as { id: string; ten: string }[]) {
            m.set(noAccent(x.ten), x.id);
            allow.add(x.ten.toLowerCase());
          }
          refIdMaps[r.col] = m;
          refAllowed[r.col] = allow;
        }),
      );

      // Validate theo dòng — báo cột thiếu, giá trị lạ ở active, ref không khớp.
      const rowIssues = validateCatalogRows(headers, parsed, {
        required: ["ten"],
        refCols: refCols.map((rc) => ({
          csvKey: rc.csvKey,
          allowed: refAllowed[rc.col] ?? new Set(),
        })),
      });

      type ImpRow = Record<string, unknown> & { ma: string; ten: string; active: boolean };
      const upserts: ImpRow[] = [];
      const upsertOrigIndex: number[] = []; // index về `parsed`
      const seen = new Set<string>();
      let unmatchedRefs = 0;
      parsed.forEach((r, idx) => {
        const ten = (r.ten ?? "").trim();
        if (!ten) return; // đã tính vào rowIssues[idx].errors
        const ma = (r.ma?.trim() || slug(ten, config.slugPrefix)).toUpperCase();
        if (seen.has(ma)) {
          const m = `Mã "${ma}" trùng với dòng trước trong file — bỏ qua.`;
          rowIssues[idx].errors.push(m);
          rowIssues[idx].issues.push({ field: "ma", value: ma, message: m, level: "error" });
          return;
        }
        seen.add(ma);
        const activeRaw = (r.active ?? "").trim().toLowerCase();
        const base: ImpRow = {
          ma,
          ten,
          active: activeRaw === "" ? true : !["0", "false", "no", "ẩn", "an"].includes(activeRaw),
        };
        for (const k of textKeys) base[k] = r[k]?.trim() || null;
        for (const rc of refCols) {
          const name = (r[rc.csvKey] ?? "").trim();
          if (!name) {
            base[rc.col] = null;
            continue;
          }
          const fid = refIdMaps[rc.col]?.get(noAccent(name)) ?? null;
          if (!fid) unmatchedRefs++;
          base[rc.col] = fid;
        }
        upserts.push(base);
        upsertOrigIndex.push(idx);
      });

      if (parsed.length === 0) {
        toast.error("File không có dòng dữ liệu.", { id: t });
        return;
      }

      toast.loading("Đang gọi xem trước ImportEngine…", { id: t });
      // Ngữ cảnh màn hình tự điền entity/danh mục theo bảng đang mở.
      const unified = isFeatureEnabled("importEngineUnified");
      const isModel = config.table === "dm_model";
      const ctx = {
        entity: isModel ? "dm_model" : "danh_muc",
        catTable: isModel ? undefined : config.table,
      };
      const engineRows = parsed.map((r) => {
        const ten = (r.ten ?? "").trim();
        const row: Record<string, string> = {
          ma: (r.ma?.trim() || slug(ten, config.slugPrefix)).toUpperCase(),
          ten,
        };
        for (const k of textKeys) if (r[k] != null) row[k] = r[k];
        for (const rc of refCols) if (r[rc.csvKey] != null) row[rc.csvKey] = r[rc.csvKey];
        return row;
      });

      // Bản đồ dữ liệu HIỆN CÓ theo mã, để hiện diff trước/sau khi update.
      const beforeByMa = new Map<string, Record<string, string>>();
      for (const rw of rows ?? []) {
        if (!rw.ma) continue;
        const rec: Record<string, string> = {
          ma: rw.ma,
          ten: rw.ten ?? "",
          active: rw.active ? "1" : "0",
        };
        for (const k of textKeys) rec[k] = rw.text[k] ?? "";
        for (const rc of refCols) rec[rc.csvKey] = rw.ref[rc.col] ?? "";
        beforeByMa.set(rw.ma.toUpperCase(), rec);
      }

      // Luôn thử engine.preview để có badge Tạo/Cập nhật/Lỗi; nếu engine offline
      // vẫn hiển thị statuses từ validate cục bộ để người dùng chủ động sửa.
      const statuses: ImportPreviewRowStatus[] = parsed.map((r, i) => {
        const iss = rowIssues[i];
        const ma = (r.ma?.trim() || slug((r.ten ?? "").trim(), config.slugPrefix)).toUpperCase();
        const before = beforeByMa.get(ma);
        if (iss.errors.length > 0) {
          return {
            action: "error",
            messages: iss.errors,
            warnings: iss.warnings,
            issues: iss.issues,
            before,
          };
        }
        return {
          action: before ? "update" : "create",
          warnings: iss.warnings,
          issues: iss.issues,
          before,
        };
      });
      let engineNote = "";
      try {
        const pre = await engine.preview(buildRunOptions(ctx, engineRows));
        pre.rows.forEach((p) => {
          const cur = statuses[p.index] ?? { action: "skip" as const };
          // Ưu tiên lỗi validate cục bộ (đã set) vì rõ nguyên nhân cho user.
          if (cur.action !== "error") {
            statuses[p.index] = {
              action: p.action,
              messages: p.messages,
              warnings: [...(cur.warnings ?? []), ...(p.warnings ?? [])],
              issues: cur.issues,
              before: cur.before,
            };
          }
        });
        engineNote =
          ` · Xem trước engine: +${pre.create} tạo · ~${pre.update} cập nhật` +
          (pre.error ? ` · ${pre.error} lỗi` : "") +
          ".";
      } catch (e) {
        fileWarnings.push(`Không lấy được xem trước từ engine: ${(e as Error).message}`);
      }

      const errorCount = statuses.filter((s) => s.action === "error").length;
      const createCount = statuses.filter((s) => s.action === "create").length;
      const updateCount = statuses.filter((s) => s.action === "update").length;
      toast.success(
        `Đã xem trước: ${createCount} tạo · ${updateCount} cập nhật · ${errorCount} lỗi.`,
        { id: t },
      );

      const previewHeaders = ["ma", "ten", ...textKeys, ...refCols.map((r) => r.csvKey)].filter(
        (h) => headers.includes(h) || h === "ma",
      );

      const steps: ImportPreviewStep[] = [
        { label: `Đọc file (${parsed.length} dòng)`, status: "done" },
        { label: `Kiểm tra cột & khoá ngoại`, status: "done" },
        { label: `Xem trước ImportEngine`, status: engineNote ? "done" : "error" },
        { label: `Xác nhận ghi`, status: "active" },
      ];

      const previewNote =
        `Khoá upsert = mã. Tổng ${parsed.length} dòng` +
        (errorCount > 0 ? ` · ${errorCount} dòng lỗi (bị loại).` : ".") +
        (unmatchedRefs > 0 ? ` · ${unmatchedRefs} liên kết không khớp (sẽ để trống).` : "") +
        (templateVersion ? ` · Mẫu v${templateVersion}.` : "") +
        (unified ? " · Ghi qua ImportEngine chung." : "") +
        engineNote;

      // Xuất báo cáo lỗi CSV: các dòng có lỗi + cột "loi".
      const onDownloadErrors = () => {
        const errRows: Record<string, string>[] = [];
        parsed.forEach((r, i) => {
          const st = statuses[i];
          if (st.action === "error") {
            const rec: Record<string, string> = {};
            for (const h of headers) rec[h] = r[h] ?? "";
            rec.loi = (st.messages ?? []).join(" | ");
            errRows.push(rec);
          }
        });
        const csv = toCsv([...headers, "loi"], errRows);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${config.table.replace(/^dm_/, "").replace(/_/g, "-")}-loi-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Đã tải ${errRows.length} dòng lỗi.`);
      };

      setPreview({
        title: `Nhập lại ${config.labelSingular}`,
        headers: previewHeaders,
        rows: parsed.map((r) => ({
          ...r,
          ma: (r.ma?.trim() || slug((r.ten ?? "").trim(), config.slugPrefix)).toUpperCase(),
        })),
        statuses,
        steps,
        fileWarnings,
        note: previewNote,
        onDownloadErrors,
        commit: async () => {
          if (unified) {
            const res = await engine.commit(buildRunOptions(ctx, engineRows));
            toast.success(
              `Đã nhập ${config.labelSingular}: tạo ${res.create}, cập nhật ${res.update}` +
                (res.error ? ` · ${res.error} lỗi` : "") +
                ".",
            );
          } else {
            // Khóa tự nhiên duy nhất = `ma` (thống nhất với Nhập/Xuất hàng loạt).
            // Chỉ upsert các dòng KHÔNG có lỗi validate cục bộ.
            const safe = upserts.filter((_, k) => statuses[upsertOrigIndex[k]]?.action !== "error");
            if (safe.length === 0) throw new Error("Không có dòng hợp lệ để ghi.");
            const { error } = await sb
              .from(config.table)
              .upsert(safe as never, { onConflict: "ma" });
            if (error) throw error;
            toast.success(
              `Đã nhập/cập nhật ${safe.length} ${config.labelSingular} (theo mã)` +
                (unmatchedRefs > 0 ? ` · ${unmatchedRefs} liên kết không khớp (để trống).` : "."),
            );
          }
          qc.invalidateQueries({ queryKey: ["catalog", config.table] });
          qc.invalidateQueries({ queryKey: ["catalog-tools", config.table] });
          invalidateTaxonomy(qc);
        },
      });
    } catch (e) {
      toast.error("Nhập thất bại: " + (e as Error).message, { id: t });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (!canManage) return null;

  return (
    <>
      <AppTooltip noiDung="Gộp bản trùng (an toàn, giữ liên kết)">
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={() => setMergeOpen(true)}
        >
          <GitMerge className="h-4 w-4" />
          <span className="sr-only">Gộp trùng</span>
        </Button>
      </AppTooltip>

      <AppTooltip noiDung="Xuất toàn bộ danh sách ra file CSV">
        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          <span className="sr-only">Xuất CSV</span>
        </Button>
      </AppTooltip>

      <AppTooltip noiDung="Xuất mẫu XLSX (có sẵn danh sách dropdown)">
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={exportXlsxTemplate}
          disabled={exportingXlsx}
        >
          {exportingXlsx ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="sr-only">Xuất mẫu XLSX</span>
        </Button>
      </AppTooltip>

      {config.childExport && (
        <AppTooltip noiDung={config.childExport.label}>
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            onClick={exportWithChildren}
            disabled={exportingChild}
          >
            {exportingChild ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="sr-only">{config.childExport.label}</span>
          </Button>
        </AppTooltip>
      )}

      <FileDropZone onFile={importCsv} disabled={importing} hint="Kéo-thả file CSV/XLSX để nhập">
        <AppTooltip noiDung="Nhập dữ liệu từ file CSV hoặc XLSX">
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span className="sr-only">Nhập CSV/XLSX</span>
          </Button>
        </AppTooltip>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importCsv(f);
          }}
        />
      </FileDropZone>

      {mergeOpen && (
        <MergeDialog
          config={config}
          rows={rows ?? []}
          onClose={() => setMergeOpen(false)}
          onDone={() => {
            setMergeOpen(false);
            qc.invalidateQueries({ queryKey: ["catalog", config.table] });
            qc.invalidateQueries({ queryKey: ["catalog-tools", config.table] });
            invalidateTaxonomy(qc);
          }}
        />
      )}

      {preview && (
        <ImportPreviewDialog
          title={preview.title}
          headers={preview.headers}
          rows={preview.rows}
          statuses={preview.statuses}
          note={preview.note}
          steps={preview.steps}
          fileWarnings={preview.fileWarnings}
          onDownloadErrors={preview.onDownloadErrors}
          onCommit={preview.commit}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}

/* ============================ Hộp thoại gộp trùng ============================ */

function MergeDialog({
  config,
  rows,
  onClose,
  onDone,
}: {
  config: CatalogToolsConfig;
  rows: Row[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [q, setQ] = useState("");
  const [targetId, setTargetId] = useState<string>("");
  const [sourceIds, setSourceIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const usageOf = (r: Row) => config.counts.reduce((s, c) => s + (r.counts[c.key] ?? 0), 0);

  const groups = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of rows) {
      const key = noAccent(r.ten).replace(/[^a-z0-9]/g, "");
      const arr = m.get(key) ?? [];
      arr.push(r);
      m.set(key, arr);
    }
    return Array.from(m.values())
      .filter((g) => g.length > 1)
      .sort((a, b) => b.length - a.length);
  }, [rows]);

  const filtered = useMemo(() => {
    const nq = noAccent(q);
    if (!nq) return rows;
    return rows.filter((r) => noAccent(r.ten).includes(nq) || noAccent(r.ma ?? "").includes(nq));
  }, [rows, q]);

  const target = rows.find((r) => r.id === targetId) ?? null;
  const sources = rows.filter((r) => sourceIds.has(r.id) && r.id !== targetId);
  const movedTotals = config.counts.map((c) => ({
    header: c.header,
    n: sources.reduce((s, r) => s + (r.counts[c.key] ?? 0), 0),
  }));

  function toggleSource(id: string) {
    setSourceIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function applyGroup(g: Row[]) {
    const sorted = [...g].sort((a, b) => usageOf(b) - usageOf(a));
    setTargetId(sorted[0].id);
    setSourceIds(new Set(sorted.slice(1).map((r) => r.id)));
    setConfirm(false);
  }

  async function doMerge() {
    if (!target || sources.length === 0) return;
    setSaving(true);
    try {
      const { data, error } = await sb.rpc(
        config.rpc as never,
        {
          p_source_ids: sources.map((r) => r.id),
          p_target_id: target.id,
        } as never,
      );
      if (error) throw error;
      const res = (data ?? {}) as {
        models_moved?: number;
        devices_moved?: number;
        deleted?: number;
      };
      toast.success(
        `Đã gộp vào "${target.ten}": chuyển ${res.devices_moved ?? 0} tài sản` +
          (res.models_moved ? `, ${res.models_moved} mẫu` : "") +
          ` · xoá ${res.deleted ?? 0} bản trùng.`,
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
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" /> Gộp {config.labelSingular} trùng
          </DialogTitle>
          <DialogDescription>
            Chọn <b>bản giữ lại</b> (radio) và các <b>bản trùng cần gộp vào</b> (tích chọn). Toàn bộ
            liên kết đang có sẽ được chuyển sang bản giữ lại, không mất dữ liệu.
          </DialogDescription>
        </DialogHeader>

        {groups.length > 0 && (
          <div className="rounded-md border bg-muted/40 p-2.5">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Gợi ý bản có tên gần trùng — bấm để chọn nhanh:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {groups.slice(0, 8).map((g, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant="secondary"
                  className="h-7 gap-1 text-xs"
                  onClick={() => applyGroup(g)}
                >
                  {g[0].ten}{" "}
                  <Badge variant="outline" className="ml-0.5 h-4 px-1 text-[10px]">
                    {g.length}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        )}

        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Tìm ${config.labelSingular}, mã…`}
        />

        <div className="max-h-[38vh] overflow-x-auto rounded-md border">
          <RadioGroup
            value={targetId}
            onValueChange={(v) => {
              setTargetId(v);
              setSourceIds((p) => {
                const n = new Set(p);
                n.delete(v);
                return n;
              });
              setConfirm(false);
            }}
          >
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="w-16 p-2 text-center">Giữ lại</th>
                  <th className="w-16 p-2 text-center">Gộp</th>
                  <th className="p-2 text-left">{config.labelSingular}</th>
                  {config.counts.map((c) => (
                    <th key={c.key} className="w-20 p-2 text-center">
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isTarget = r.id === targetId;
                  const isSource = sourceIds.has(r.id) && !isTarget;
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        "border-b last:border-0",
                        isTarget && "bg-primary/5",
                        isSource && "bg-destructive/5",
                      )}
                    >
                      <td className="p-2 text-center">
                        <RadioGroupItem value={r.id} />
                      </td>
                      <td className="p-2 text-center">
                        <Checkbox
                          checked={isSource}
                          disabled={isTarget}
                          onCheckedChange={() => toggleSource(r.id)}
                        />
                      </td>
                      <td className="p-2">
                        <div className="font-medium">{r.ten}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {r.ma ?? "—"}
                        </div>
                      </td>
                      {config.counts.map((c) => (
                        <td key={c.key} className="p-2 text-center text-xs">
                          {r.counts[c.key] ?? 0}
                        </td>
                      ))}
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
              {sources.map((s) => (
                <Badge key={s.id} variant="outline" className="text-xs line-through">
                  {s.ten}
                </Badge>
              ))}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge className="text-xs">{target.ten}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {movedTotals
                .filter((m) => m.n > 0)
                .map((m) => (
                  <span key={m.header}>
                    Chuyển {m.n} {m.header.toLowerCase()}
                  </span>
                ))}
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> Xoá {sources.length} bản trùng
              </span>
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs">
              <Checkbox checked={confirm} onCheckedChange={(v) => setConfirm(!!v)} />
              Tôi đã rà soát và xác nhận gộp các bản trên vào <b>{target.ten}</b>.
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            disabled={!target || sources.length === 0 || !confirm || saving}
            onClick={doMerge}
            className="gap-1.5"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GitMerge className="h-4 w-4" />
            )}
            Gộp {sources.length > 0 ? `${sources.length} bản` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
