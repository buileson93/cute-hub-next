import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, Plus, RefreshCw, ArrowRightLeft,
  FileUp, Columns3, ClipboardCheck, ChevronRight, ChevronLeft, X, Wand2, Table2, ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { runBulkImport } from "@/lib/mirats/import-export.functions";
import {
  ENTITIES, CATALOG_TABLES, findEntity, csvHeaders, toCsv, parseCsv, catalogEntity, noAccent,
} from "@/lib/mirats/import-config";
import { PrepareCatalogs } from "@/components/mirats/PrepareCatalogs";
import { PageHeader } from "@/components/mirats/PageHeader";
import { AllInOneImport } from "@/components/mirats/AllInOneImport";
import { ImportBatchHistory } from "@/components/mirats/ImportBatchHistory";
import { InfoHint } from "@/components/mirats/InfoHint";

import { AllInOneExportPanel } from "@/components/mirats/AllInOneExportPanel";
import { AllInOneChecklist } from "@/components/mirats/AllInOneChecklist";
import { exportAllInOneXlsx } from "@/lib/mirats/allinone-template";


export const Route = createFileRoute("/_app/admin/nhap-lieu")({
  head: () => ({
    meta: [
      { title: "Nhập/Xuất hàng loạt — MIRATS 2.0" },
      { name: "description", content: "Nhập và xuất dữ liệu tài sản, hệ thống, danh mục, giấy phép hàng loạt bằng CSV." },
    ],
  }),
  component: NhapLieuPage,
});

type PreviewRow = { index: number; action: "create" | "update" | "error"; key: string; messages: string[]; warnings?: string[]; refCreations: string[] };
type RefCreatedGroup = { table: string; label: string; items: Array<{ id: string; ma: string | null; ten: string }> };
type RefReusedGroup = { table: string; label: string; count: number };
type PreviewResult = {
  committed: boolean;
  summary: { total: number; create: number; update: number; error: number; refCreate: number; refReused?: number; created?: number; updated?: number; writeErrors?: number };
  preview?: PreviewRow[];
  errors?: Array<{ key: string; message: string }>;
  refCreatedByTable?: RefCreatedGroup[];
  refReusedByTable?: RefReusedGroup[];
};

const ENTITY_OPTIONS = [
  ...ENTITIES.map((e) => ({ value: e.id, label: e.label })),
  { value: "danh_muc", label: "Danh mục nền" },
];

function download(name: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function NhapLieuPage() {
  const runImport = useServerFn(runBulkImport);
  const [entity, setEntity] = useState("thiet_bi");
  const [catTable, setCatTable] = useState("dm_don_vi");
  const [csvText, setCsvText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  // Ánh xạ cột: tên cột trên file CSV → key trường trong CSDL (hoặc "" = bỏ qua).
  const [mapping, setMapping] = useState<Record<string, string>>({});
  // Giá trị mặc định: trường CSDL (key) → giá trị áp cho mọi dòng bỏ trống (file thiếu thông tin).
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  // Điều hướng: tab chính + bước wizard nhập liệu (1: nguồn, 2: ánh xạ, 3: kiểm tra & ghi).
  const [tab, setTab] = useState<"import" | "allinone" | "export">("import");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const ent = useMemo(() => findEntity(entity, catTable), [entity, catTable]);
  const parsed = useMemo(() => (csvText.trim() ? parseCsv(csvText) : null), [csvText]);

  const isCat = entity === "danh_muc";
  // Vị trí cha mặc định cho các vị trí tự tạo khi nhập tài sản (tránh nằm rời).
  const [viTriParentId, setViTriParentId] = useState<string>("");


  // Mặc định chọn: khóa tự nhiên + các trường bắt buộc.
  useEffect(() => {
    setDefaults({}); // đổi loại dữ liệu → xóa giá trị mặc định cũ
    if (!ent) { setPicked(new Set()); return; }
    const def = new Set<string>([ent.keyHeader]);
    ent.fields.forEach((f) => { if (f.required) def.add(f.key); });
    setPicked(def);
  }, [ent]);

  // Tự đoán ánh xạ cột mỗi khi đổi file CSV hoặc đổi đối tượng (khớp theo key/label, bỏ dấu).
  useEffect(() => {
    if (!ent || !parsed) { setMapping({}); return; }
    // Chỉ mục trường theo tên đã chuẩn hoá để tra nhanh.
    const byNorm = new Map<string, string>();
    for (const f of ent.fields) {
      byNorm.set(noAccent(f.key), f.key);
      byNorm.set(noAccent(f.label), f.key);
    }
    const next: Record<string, string> = {};
    for (const h of parsed.headers) {
      const n = noAccent(h);
      // Cột x_* (thuộc tính mở rộng tài sản) giữ nguyên tên.
      if (ent.table === "thiet_bi" && h.startsWith("x_")) { next[h] = h; continue; }
      next[h] = byNorm.get(n) ?? "";
    }
    setMapping(next);
  }, [ent, parsed]);

  // Áp ánh xạ: đổi các dòng CSV thô sang dạng dùng key trường CSDL.
  // Trường đã ánh xạ từ 1 cột trong file (dùng để loại khỏi danh sách "khai mặc định").
  const mappedFieldKeys = useMemo(() => new Set(Object.values(mapping).filter(Boolean)), [mapping]);
  // Trường có giá trị mặc định thực sự (đã điền).
  const activeDefaults = useMemo(
    () => Object.fromEntries(Object.entries(defaults).filter(([k, v]) => !mappedFieldKeys.has(k) && (v ?? "").trim() !== "")),
    [defaults, mappedFieldKeys],
  );

  const remappedRows = useMemo(() => {
    if (!parsed) return [];
    return parsed.rows.map((raw) => {
      const o: Record<string, string> = {};
      for (const [csvCol, fieldKey] of Object.entries(mapping)) {
        if (!fieldKey) continue;
        const v = raw[csvCol];
        if (v != null && v !== "") o[fieldKey] = v;
      }
      // Áp giá trị mặc định cho các trường bỏ trống (file thiếu nhưng admin biết trước).
      for (const [k, v] of Object.entries(activeDefaults)) {
        if ((o[k] ?? "") === "") o[k] = v;
      }
      return o;
    });
  }, [parsed, mapping, activeDefaults]);

  // Cột hiển thị cho bảng xem trước dữ liệu (cột đã ánh xạ + trường có mặc định), kèm nhãn dễ đọc.
  const previewCols = useMemo(() => {
    if (!ent) return [] as Array<{ key: string; label: string }>;
    const labelOf = (k: string) => ent.fields.find((f) => f.key === k)?.label ?? k;
    const seen = new Set<string>();
    const cols: Array<{ key: string; label: string }> = [];
    for (const fieldKey of Object.values(mapping)) {
      if (!fieldKey || seen.has(fieldKey)) continue;
      seen.add(fieldKey);
      cols.push({ key: fieldKey, label: labelOf(fieldKey) });
    }
    for (const fieldKey of Object.keys(activeDefaults)) {
      if (seen.has(fieldKey)) continue;
      seen.add(fieldKey);
      cols.push({ key: fieldKey, label: labelOf(fieldKey) });
    }
    return cols;
  }, [ent, mapping, activeDefaults]);

  // Ánh xạ cột: KHÔNG có trường nào chặn cứng nữa.
  // - Không ánh xạ cột khóa (mã) → mã sẽ được TỰ SINH khi tạo mới (insert).
  // - Có ánh xạ cột khóa → dòng nào trùng mã sẽ CẬP NHẬT, còn lại tạo mới.
  const mappedKeys = useMemo(() => new Set(Object.values(mapping).filter(Boolean)), [mapping]);
  const keyLabel = useMemo(() => ent?.fields.find((f) => f.key === ent.keyHeader)?.label ?? ent?.keyHeader ?? "", [ent]);
  const missingKey = useMemo(() => !!ent && !mappedKeys.has(ent.keyHeader), [ent, mappedKeys]);
  // Trường bắt buộc (không phải khóa) chưa ánh xạ VÀ chưa khai mặc định → cảnh báo mềm.
  const missingCreateFields = useMemo(() => {
    if (!ent) return [] as string[];
    return ent.fields
      .filter((f) => f.required && f.key !== ent.keyHeader && !mappedKeys.has(f.key) && !activeDefaults[f.key])
      .map((f) => f.label);
  }, [ent, mappedKeys, activeDefaults]);
  // Không chặn cứng bước nào — mọi thiếu sót đều là cảnh báo mềm.
  const missingRequired = useMemo(() => [] as string[], []);

  // Rà soát chất lượng file: phát hiện lỗi/vấn đề để cảnh báo ngay ở ô ánh xạ cột.
  const fileIssues = useMemo(() => {
    const out: Array<{ level: "error" | "warn" | "info"; text: string }> = [];
    if (!ent || !parsed) return out;
    const headers = parsed.headers;

    // 1) File rỗng / không có cột.
    if (headers.length === 0 || parsed.rows.length === 0) {
      out.push({ level: "error", text: "File không có dữ liệu (thiếu dòng tiêu đề hoặc không có dòng nào)." });
      return out;
    }
    // 2) Cột trùng tên → dữ liệu đè lên nhau khi đọc.
    const hCount = new Map<string, number>();
    headers.forEach((h) => hCount.set(h, (hCount.get(h) ?? 0) + 1));
    const dupHeaders = [...hCount.entries()].filter(([h, n]) => h && n > 1).map(([h]) => h);
    if (dupHeaders.length) out.push({ level: "error", text: `Cột trùng tên: ${dupHeaders.join(", ")} — dữ liệu các cột trùng sẽ đè lên nhau. Hãy đổi tên cho khác nhau trong file.` });
    // 3) Cột không có tiêu đề.
    const blank = headers.filter((h) => !h || h.trim() === "").length;
    if (blank) out.push({ level: "warn", text: `Có ${blank} cột không có tiêu đề — sẽ bị bỏ qua khi nhập.` });
    // 4) Cột chưa ánh xạ (dữ liệu sẽ không được nhập).
    const unmapped = headers.filter((h) => h && !mapping[h] && !(ent.table === "thiet_bi" && h.startsWith("x_")));
    if (unmapped.length) out.push({ level: "info", text: `Cột chưa dùng (dữ liệu sẽ KHÔNG được nhập): ${unmapped.join(", ")}. Nếu cần, chọn trường CSDL tương ứng bên dưới.` });

    // 5) Trùng mã trong file (khi đã ánh xạ cột khóa).
    if (!missingKey) {
      const seen = new Map<string, number>();
      for (const r of remappedRows) {
        const k = (r[ent.keyHeader] ?? "").trim().toLowerCase();
        if (k) seen.set(k, (seen.get(k) ?? 0) + 1);
      }
      const dupKeys = [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
      if (dupKeys.length) out.push({ level: "warn", text: `${dupKeys.length} mã bị lặp trong file (vd: ${dupKeys.slice(0, 3).join(", ")}…) — các dòng cùng mã sẽ ghi đè lên nhau.` });
    }

    // 6) Ô bắt buộc bỏ trống (với trường đã ánh xạ hoặc có mặc định).
    const reqFields = ent.fields.filter((f) => f.required && f.key !== ent.keyHeader && (mappedKeys.has(f.key) || activeDefaults[f.key]));
    // 7) Giá trị số / ngày sai định dạng (server sẽ cố làm sạch, nhưng cảnh báo trước).
    const numFields = ent.fields.filter((f) => (f.kind === "int" || f.kind === "num") && (mappedKeys.has(f.key) || activeDefaults[f.key]));
    const dateFields = ent.fields.filter((f) => f.kind === "date" && (mappedKeys.has(f.key) || activeDefaults[f.key]));
    let emptyReq = 0; const emptyEx = new Set<string>();
    let badNum = 0; const badNumEx: string[] = [];
    let badDate = 0; const badDateEx: string[] = [];
    remappedRows.forEach((r, i) => {
      for (const f of reqFields) {
        if ((r[f.key] ?? "").trim() === "") { emptyReq++; if (emptyEx.size < 3) emptyEx.add(f.label); }
      }
      for (const f of numFields) {
        const v = (r[f.key] ?? "").trim();
        if (!v) continue;
        const cleaned = f.kind === "int" ? v.replace(/[^\d-]/g, "") : v.replace(/[^\d.,-]/g, "").replace(",", ".");
        if (cleaned === "" || !Number.isFinite(Number(cleaned))) { badNum++; if (badNumEx.length < 3) badNumEx.push(`dòng ${i + 1}: ${f.label}="${v}"`); }
      }
      for (const f of dateFields) {
        const v = (r[f.key] ?? "").trim();
        if (!v) continue;
        const ok = /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(v) || !Number.isNaN(Date.parse(v));
        if (!ok) { badDate++; if (badDateEx.length < 3) badDateEx.push(`dòng ${i + 1}: ${f.label}="${v}"`); }
      }
    });
    if (emptyReq) out.push({ level: "warn", text: `${emptyReq} ô bắt buộc đang bỏ trống (vd: ${[...emptyEx].join(", ")}) — dòng mã mới sẽ báo lỗi khi ghi.` });
    if (badNum) out.push({ level: "warn", text: `${badNum} ô số sai định dạng (${badNumEx.join("; ")}) — sẽ cố làm sạch, nếu không được sẽ bỏ trống.` });
    if (badDate) out.push({ level: "warn", text: `${badDate} ô ngày sai định dạng (${badDateEx.join("; ")}) — dùng dạng dd/mm/yyyy hoặc yyyy-mm-dd.` });

    return out;
  }, [ent, parsed, mapping, mappedKeys, activeDefaults, missingKey, remappedRows]);

  const hasFileErrors = useMemo(() => fileIssues.some((x) => x.level === "error"), [fileIssues]);




  function togglePick(key: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      next.add(ent!.keyHeader); // khóa luôn có
      return next;
    });
  }

  function resetPick(all: boolean) {
    if (!ent) return;
    if (all) { setPicked(new Set(ent.fields.map((f) => f.key))); return; }
    const def = new Set<string>([ent.keyHeader]);
    ent.fields.forEach((f) => { if (f.required) def.add(f.key); });
    setPicked(def);
  }

  /** Xuất mẫu — chỉ gồm các trường đã chọn (khóa tự nhiên luôn có). */
  function exportTemplate(onlyPicked: boolean) {
    if (!ent) return;
    const all = csvHeaders(ent);
    const headers = onlyPicked ? all.filter((h) => picked.has(h) || h === ent.keyHeader) : all;
    const example: Record<string, string> = {};
    ent.fields.forEach((f) => { if (headers.includes(f.key)) example[f.key] = f.required ? `(bắt buộc)` : ""; });
    const suffix = onlyPicked ? `_${headers.length}truong` : "_daydu";
    download(`mau_${ent.table}${suffix}.csv`, toCsv(headers, [example]));
  }

  async function exportAllInOne(withData: boolean, compact = false) {
    setBusy(true);
    try {
      await exportAllInOneXlsx({ withData, compact });
      toast.success(
        compact
          ? "Đã tải mẫu all-in-one RÚT GỌN (chỉ cột bắt buộc + hay dùng)"
          : withData ? "Đã tải file kèm dữ liệu hiện có" : "Đã tải mẫu all-in-one trống",
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function exportData() {

    if (!ent) return;
    setBusy(true);
    try {
      const table = ent.table;
      // 1) Nạp bảng tham chiếu để giải ID → mã (để nhập lại không mất liên kết).
      const refTables = Array.from(new Set(
        ent.fields.filter((f) => f.kind === "ref" && f.ref).map((f) => f.ref!.table),
      ));
      const refMap: Record<string, Map<string, string>> = {};
      for (const rt of refTables) {
        const { data } = await (supabase as any).from(rt).select("id, ma").limit(20000);
        const m = new Map<string, string>();
        for (const r of data ?? []) if ((r as any).id) m.set(String((r as any).id), String((r as any).ma ?? ""));
        refMap[rt] = m;
      }
      // 2) Nạp dữ liệu thật.
      const { data, error } = await (supabase as any).from(table).select("*").limit(20000);
      if (error) throw new Error(error.message);
      const dataRows: Array<Record<string, unknown>> = data ?? [];
      // 3) Thu thập cột thuộc tính mở rộng x_* (tài sản) để chỉnh sửa được.
      const extraCols = new Set<string>();
      if (table === "thiet_bi") {
        for (const r of dataRows) {
          const tt = r.thuoc_tinh as Record<string, unknown> | null;
          if (tt && typeof tt === "object") for (const k of Object.keys(tt)) if (k.startsWith("x_")) extraCols.add(k);
        }
      }
      const headers = [...csvHeaders(ent), ...Array.from(extraCols)];
      const rows = dataRows.map((r) => {
        const o: Record<string, unknown> = {};
        for (const f of ent.fields) {
          if (f.kind === "ref" && f.ref) {
            const id = r[f.ref.idCol];
            o[f.key] = id ? (refMap[f.ref.table]?.get(String(id)) ?? "") : "";
          } else {
            o[f.key] = r[f.col ?? f.key] ?? "";
          }
        }
        const tt = r.thuoc_tinh as Record<string, unknown> | null;
        if (tt && typeof tt === "object") for (const k of extraCols) o[k] = tt[k] ?? "";
        return o;
      });
      download(`${table}_export.csv`, toCsv(headers, rows));
      toast.success(`Đã xuất ${rows.length} dòng (đã giải mã liên kết về mã)`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function readFile(file: File) {
    if (!/\.csv$/i.test(file.name) && file.type && !/csv|excel|spreadsheet|text/.test(file.type)) {
      toast.error("Chỉ hỗ trợ file .csv");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setCsvText(String(reader.result ?? "")); setFileName(file.name); setResult(null); };
    reader.onerror = () => toast.error("Không đọc được file");
    reader.readAsText(file, "utf-8");
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    e.target.value = "";
  }

  function clearFile() {
    setCsvText(""); setFileName(""); setResult(null); setMapping({}); setStep(1);
  }

  async function run(commit: boolean) {
    if (!parsed || parsed.rows.length === 0) { toast.error("Chưa có dữ liệu CSV"); return; }
    if (missingRequired.length) {
      toast.error(`Chưa ánh xạ cột bắt buộc: ${missingRequired.join(", ")}`);
      return;
    }
    setBusy(true);
    try {
      const res = (await runImport({
        data: {
          entity, catTable: isCat ? catTable : undefined, rows: remappedRows, commit,
          viTriParentId: entity === "thiet_bi" && viTriParentId ? viTriParentId : undefined,
        },
      })) as PreviewResult;
      setResult(res);
      if (commit) {
        toast.success(`Đã ghi: ${res.summary.created ?? 0} mới, ${res.summary.updated ?? 0} cập nhật`);
      } else {
        toast.success(`Xem trước: ${res.summary.create} tạo mới · ${res.summary.update} cập nhật · ${res.summary.error} lỗi`);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }


  const canCommit = result && !result.committed && result.summary.error < result.summary.total;

  const hasData = !!parsed && parsed.rows.length > 0;
  const previewWarnings = result?.preview?.reduce((s, p) => s + (p.warnings?.length ?? 0), 0) ?? 0;

  const STEPS = [
    { n: 1 as const, label: "Nguồn dữ liệu", desc: "Chọn loại & tải CSV", icon: FileUp },
    { n: 2 as const, label: "Ánh xạ cột", desc: "Khớp cột với CSDL", icon: Columns3 },
    { n: 3 as const, label: "Kiểm tra & Ghi", desc: "Soát rồi ghi vào CSDL", icon: ClipboardCheck },
  ];

  function goStep(target: 1 | 2 | 3) {
    if (target === 2 && !hasData) { toast.error("Hãy tải file CSV trước"); return; }
    if (target === 3) {
      if (!hasData) { toast.error("Hãy tải file CSV trước"); return; }
      if (hasFileErrors) { toast.error("File có lỗi nghiêm trọng — hãy sửa theo phần rà soát ở ô ánh xạ cột."); return; }
      if (missingRequired.length) { toast.error(`Chưa ánh xạ cột bắt buộc: ${missingRequired.join(", ")}`); return; }
    }
    setStep(target);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6 lg:p-8">
      {/* Đầu trang + chuyển tab */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          title="Nhập / Xuất hàng loạt"
          subtitle="CSV → ánh xạ → xem trước → ghi"
          help={<>Trùng <b>mã</b>: cập nhật. Chưa có: tạo mới. Ô trống: giữ nguyên. Thứ tự: Danh mục → Model → Hệ thống → Tài sản.</>}
        />

        <div className="inline-flex rounded-lg border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setTab("import")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "import" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Upload className="h-4 w-4" /> Nhập dữ liệu
          </button>
          <button
            type="button"
            onClick={() => setTab("allinone")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "allinone" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <FileSpreadsheet className="h-4 w-4" /> All-in-one (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => setTab("export")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "export" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Download className="h-4 w-4" /> Xuất & Mẫu
          </button>

        </div>
      </div>

      {/* ================= TAB: NHẬP DỮ LIỆU (wizard 3 bước) ================= */}
      {tab === "import" && (
        <>
          {/* Thanh bước */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const active = step === s.n;
              const done = step > s.n;
              const Icon = s.icon;
              return (
                <div key={s.n} className="flex flex-1 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goStep(s.n)}
                    className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      active ? "border-primary bg-primary/5" : done ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      active ? "bg-primary text-primary-foreground" : done ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className={`truncate text-sm font-medium ${active ? "text-foreground" : done ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
                        {s.n}. {s.label}
                      </div>
                      <div className="hidden truncate text-[11px] text-muted-foreground sm:block">{s.desc}</div>
                    </div>
                  </button>
                  {i < STEPS.length - 1 && <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground/50 sm:block" />}
                </div>
              );
            })}
          </div>

          {/* ---------- Bước 1: Nguồn dữ liệu ---------- */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSpreadsheet className="h-4 w-4 text-primary" /> Chọn loại dữ liệu & tải file
                  <InfoHint>
                    Thứ tự: Danh mục → Model → Hệ thống → Tài sản.
                    Khoá <b>mã</b>: trùng thì cập nhật, mới thì tạo. Serial không được trùng.
                    Cột số tự bỏ chữ (vd "08 bộ" → 8). Nên sao lưu trước khi ghi lượng lớn.
                  </InfoHint>

                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1">
                      Đối tượng
                      {ent?.note && <InfoHint>{ent.note}</InfoHint>}
                    </Label>
                    <Select value={entity} onValueChange={(v) => { setEntity(v); setResult(null); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ENTITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {isCat && (
                    <div className="space-y-1.5">
                      <Label>Bảng danh mục</Label>
                      <Select value={catTable} onValueChange={(v) => { setCatTable(v); setResult(null); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATALOG_TABLES.map((c) => <SelectItem key={c.table} value={c.table}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>


                <label
                  htmlFor="csv-upload"
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                  onDrop={(e) => {
                    e.preventDefault(); setDragActive(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) readFile(file);
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors ${
                    dragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${dragActive ? "bg-primary/20" : "bg-muted"}`}>
                    <Upload className={`h-6 w-6 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="text-sm font-medium">
                    {fileName ? <span className="text-primary">{fileName}</span> : "Kéo & thả file CSV vào đây"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {fileName ? "Bấm để chọn file khác" : "hoặc bấm để chọn file — chỉ hỗ trợ .csv, ngày dd/mm/yyyy"}
                  </div>
                  <input id="csv-upload" type="file" accept=".csv,text/csv" onChange={onFile} className="sr-only" />
                </label>

                {parsed && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Đọc được <b className="text-foreground">{parsed.rows.length}</b> dòng · <b className="text-foreground">{parsed.headers.length}</b> cột
                    </p>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFile}>
                      <X className="mr-1 h-3.5 w-3.5" /> Xóa file
                    </Button>
                  </div>
                )}

                {entity === "thiet_bi" && (
                  <PrepareCatalogs
                    systemMa={defaults["he_thong"] ?? ""}
                    onPickSystem={(ma) => setDefaults((d) => ({ ...d, he_thong: ma }))}
                    modelMa={defaults["model"] ?? ""}
                    onPickModel={(ma) => setDefaults((d) => ({ ...d, model: ma }))}
                    viTriParentId={viTriParentId}
                    onPickViTriParent={setViTriParentId}
                  />
                )}

              </CardContent>
            </Card>
          )}

          {/* ---------- Bước 2: Ánh xạ cột + xem trước dữ liệu ---------- */}
          {step === 2 && ent && parsed && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ArrowRightLeft className="h-4 w-4 text-primary" /> Ánh xạ cột (khớp file với CSDL)
                    <InfoHint>Mỗi cột trong file được khớp với một trường CSDL. Hệ thống đã tự đoán — chỉnh lại nếu cần, chọn <b>“— Bỏ qua —”</b> để không nhập cột đó.</InfoHint>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {missingKey ? (
                    <div className="flex items-start gap-2 rounded-md border border-sky-500/40 bg-sky-500/5 p-2 text-xs text-sky-700 dark:text-sky-400">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>Chưa ánh xạ cột khoá <b>{keyLabel}</b> — mã sẽ tự sinh (tất cả là tạo mới).</span>
                      <InfoHint>Nếu file có sẵn mã và bạn muốn cập nhật bản ghi cũ thì hãy ánh xạ cột khoá.</InfoHint>
                    </div>
                  ) : missingCreateFields.length > 0 ? (
                    <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-2 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>Thiếu trường bắt buộc: <b>{missingCreateFields.join(", ")}</b>.</span>
                      <InfoHint>Dòng có sẵn mã sẽ được cập nhật (cột thiếu giữ nguyên); dòng mã mới sẽ báo lỗi khi ghi.</InfoHint>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-2 text-xs text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>Đã ánh xạ đủ — sang bước kiểm tra.</span>
                    </div>
                  )}

                  {fileIssues.length > 0 && (
                    <div className="space-y-1.5 rounded-md border border-border/60 bg-muted/30 p-2.5">
                      <p className="flex items-center gap-1.5 text-xs font-medium">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        Kết quả rà soát file ({fileIssues.length} vấn đề)
                      </p>
                      <ul className="space-y-1">
                        {fileIssues.map((iss, idx) => {
                          const tone =
                            iss.level === "error"
                              ? "text-red-700 dark:text-red-400"
                              : iss.level === "warn"
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-muted-foreground";
                          return (
                            <li key={idx} className={`flex items-start gap-1.5 text-[11px] ${tone}`}>
                              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                              <span>{iss.text}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  <div className="max-h-[420px] overflow-auto rounded-md border">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead className="w-[32%]">Cột trong file</TableHead>
                          <TableHead className="w-[28%]">Ví dụ (dòng 1)</TableHead>
                          <TableHead>Trường trong CSDL</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsed.headers.map((h) => {
                          const sample = parsed.rows[0]?.[h] ?? "";
                          const usedElsewhere = new Set(
                            Object.entries(mapping).filter(([c]) => c !== h).map(([, v]) => v).filter(Boolean),
                          );
                          const mapped = !!mapping[h];
                          return (
                            <TableRow key={h}>
                              <TableCell className="font-mono text-xs">
                                <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${mapped ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                                {h}
                              </TableCell>
                              <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">{sample || "—"}</TableCell>
                              <TableCell>
                                <Select
                                  value={mapping[h] || "__ignore__"}
                                  onValueChange={(v) => {
                                    setMapping((prev) => ({ ...prev, [h]: v === "__ignore__" ? "" : v }));
                                    setResult(null);
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__ignore__">— Bỏ qua —</SelectItem>
                                    {ent.table === "thiet_bi" && h.startsWith("x_") && (
                                      <SelectItem value={h}>Thuộc tính mở rộng: {h}</SelectItem>
                                    )}
                                    {ent.fields.map((f) => (
                                      <SelectItem key={f.key} value={f.key} disabled={usedElsewhere.has(f.key)}>
                                        {f.label}{f.required ? " *" : ""}{f.key === ent.keyHeader ? " (khóa)" : ""}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* ---------- Giá trị mặc định cho trường file thiếu ---------- */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wand2 className="h-4 w-4 text-primary" /> Điền sẵn trường file thiếu
                    <InfoHint>File thiếu thông tin nhưng bạn biết trước? Điền một lần vào đây — áp cho <b>mọi dòng bỏ trống</b>. Vd file không có cột <i>Phân loại</i> nhưng đều là <b>Nhóm 3</b> thì gõ “Nhóm 3”. Ô đã có trong file thì <b>giữ nguyên</b>.</InfoHint>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {ent.fields
                      .filter((f) => f.key !== ent.keyHeader && !mappedFieldKeys.has(f.key))
                      .sort((a, b) => Number(!!b.required) - Number(!!a.required))
                      .map((f) => (
                        <div key={f.key} className="space-y-1">
                          <Label className="text-xs">
                            {f.label}
                            {f.required && <span className="ml-1 text-amber-600">*</span>}
                            {f.kind === "ref" && <span className="ml-1 text-[10px] text-muted-foreground">(danh mục)</span>}
                          </Label>
                          <Input
                            value={defaults[f.key] ?? ""}
                            placeholder="— để trống —"
                            className="h-8 text-xs"
                            onChange={(e) => {
                              const v = e.target.value;
                              setDefaults((prev) => ({ ...prev, [f.key]: v }));
                              setResult(null);
                            }}
                          />
                        </div>
                      ))}
                  </div>
                  {Object.keys(activeDefaults).length > 0 && (
                    <p className="mt-3 flex items-start gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2 text-[11px] text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
                      <span>Đang áp mặc định cho: <b>{Object.keys(activeDefaults).map((k) => ent.fields.find((f) => f.key === k)?.label ?? k).join(", ")}</b>. Giá trị danh mục chưa có sẽ được tạo mới tự động.</span>
                    </p>
                  )}
                </CardContent>
              </Card>


              {previewCols.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Table2 className="h-4 w-4 text-primary" /> Xem trước dữ liệu (sau ánh xạ)
                      <InfoHint>Hiển thị {Math.min(remappedRows.length, 20)}/{remappedRows.length} dòng đầu với đúng các cột đã ánh xạ. Ô trống = giữ nguyên khi cập nhật.</InfoHint>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[360px] overflow-auto rounded-md border">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background">
                          <TableRow>
                            <TableHead className="w-12 text-xs">#</TableHead>
                            {previewCols.map((c) => (
                              <TableHead key={c.key} className="whitespace-nowrap text-xs">
                                {c.label}
                                {c.key === ent.keyHeader && <span className="ml-1 text-primary">(khóa)</span>}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {remappedRows.slice(0, 20).map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs tabular-nums text-muted-foreground">{i + 1}</TableCell>
                              {previewCols.map((c) => (
                                <TableCell key={c.key} className="max-w-[220px] truncate text-xs">
                                  {row[c.key] ? row[c.key] : <span className="text-muted-foreground/50">—</span>}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ---------- Bước 3: Kiểm tra & Ghi ---------- */}
          {step === 3 && ent && parsed && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardCheck className="h-4 w-4 text-primary" /> Kiểm tra & Ghi vào CSDL
                  <InfoHint>Bấm <b>Kiểm tra dữ liệu</b> để soát từng dòng (tạo mới / cập nhật / lỗi), sau đó <b>Ghi vào CSDL</b>.</InfoHint>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => run(false)} disabled={busy || !hasData}>
                    {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
                    Kiểm tra dữ liệu
                  </Button>
                  <Button size="sm" onClick={() => run(true)} disabled={busy || !canCommit}
                    className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Ghi vào CSDL
                  </Button>
                  {!result && <p className="self-center text-xs text-muted-foreground">Hãy kiểm tra dữ liệu trước khi ghi.</p>}
                </div>

                {result && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {result.committed ? (
                        <>
                          <Badge className="bg-emerald-600">Tạo mới: {result.summary.created ?? 0}</Badge>
                          <Badge className="bg-sky-600">Cập nhật: {result.summary.updated ?? 0}</Badge>
                          {(result.summary.writeErrors ?? 0) > 0 && (
                            <Badge variant="destructive">Lỗi ghi: {result.summary.writeErrors}</Badge>
                          )}
                        </>
                      ) : (
                        <>
                          <Badge className="bg-emerald-600"><Plus className="mr-1 h-3 w-3" />Tạo mới: {result.summary.create}</Badge>
                          <Badge className="bg-sky-600"><RefreshCw className="mr-1 h-3 w-3" />Cập nhật: {result.summary.update}</Badge>
                          <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Lỗi: {result.summary.error}</Badge>
                          {result.summary.refCreate > 0 && <Badge variant="outline">Danh mục sẽ tạo: {result.summary.refCreate}</Badge>}
                          {previewWarnings > 0 && <Badge className="bg-amber-500"><AlertTriangle className="mr-1 h-3 w-3" />Cảnh báo: {previewWarnings}</Badge>}
                        </>
                      )}
                    </div>

                    {!result.committed && result.preview && (
                      <div className="max-h-[420px] overflow-auto rounded-md border">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                              <TableHead className="w-14">Dòng</TableHead>
                              <TableHead className="w-28">Hành động</TableHead>
                              <TableHead>Khóa</TableHead>
                              <TableHead>Ghi chú</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {result.preview.map((p) => (
                              <TableRow key={p.index} className={p.action === "error" ? "bg-destructive/5" : ""}>
                                <TableCell className="text-xs tabular-nums">{p.index + 1}</TableCell>
                                <TableCell>
                                  {p.action === "create" && <Badge className="bg-emerald-600">Tạo mới</Badge>}
                                  {p.action === "update" && <Badge className="bg-sky-600">Cập nhật</Badge>}
                                  {p.action === "error" && <Badge variant="destructive">Lỗi</Badge>}
                                </TableCell>
                                <TableCell className="font-mono text-xs">{p.key || "—"}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {p.messages.length > 0 && <span className="text-destructive">{p.messages.join("; ")}</span>}
                                  {p.refCreations.length > 0 && (
                                    <span className="text-amber-600"> {p.messages.length ? " · " : ""}Tạo danh mục: {p.refCreations.join(", ")}</span>
                                  )}
                                  {(p.warnings?.length ?? 0) > 0 && (
                                    <span className="text-amber-500"> {(p.messages.length || p.refCreations.length) ? " · " : ""}⚠ {p.warnings!.join("; ")}</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {result.committed && (
                      <div className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Đã ghi xong. Bạn có thể tải file khác để nhập tiếp.</span>
                      </div>
                    )}

                    {result.committed && (result.refCreatedByTable?.length ?? 0) > 0 && (
                      <div className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-2.5 text-sm">
                        <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5" /> Danh mục tự tạo trong lần nhập này
                          <InfoHint>Rà lại các bản ghi tự tạo — bổ sung chủng loại, nhà sản xuất… để CSDL đầy đủ.</InfoHint>
                        </p>
                        <ul className="space-y-1">

                          {result.refCreatedByTable!.map((g) => (
                            <li key={g.table} className="flex flex-wrap items-center gap-1.5 text-xs">
                              <Badge variant="outline" className="border-amber-500/50">{g.label}: {g.items.length} mới</Badge>
                              {g.table === "dm_model" && (
                                <Link
                                  to="/danh-muc/model"
                                  search={{ filter: "thieu-loai" }}
                                  className="text-primary underline underline-offset-2 hover:opacity-80"
                                >
                                  Mở mẫu thiếu loại →
                                </Link>
                              )}
                              <span className="text-muted-foreground">
                                {g.items.slice(0, 6).map((x) => x.ten || x.ma).filter(Boolean).join(" · ")}
                                {g.items.length > 6 ? ` … +${g.items.length - 6}` : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.committed && (result.refReusedByTable?.length ?? 0) > 0 && (
                      <div className="rounded-md border border-sky-500/30 bg-sky-500/5 p-3 text-xs text-muted-foreground">
                        <span className="font-medium text-sky-700 dark:text-sky-400">Dùng lại danh mục:</span>{" "}
                        {result.refReusedByTable!.map((r) => `${r.label}: ${r.count}`).join(" · ")}
                      </div>
                    )}


                    {result.committed && result.errors && result.errors.length > 0 && (
                      <div className="rounded-md border border-destructive/30 p-3 text-xs">
                        <p className="mb-1 font-medium text-destructive">Các dòng lỗi khi ghi:</p>
                        <ul className="space-y-0.5">
                          {result.errors.map((e, i) => (
                            <li key={i}><span className="font-mono">{e.key}</span>: {e.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Điều hướng bước */}
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" disabled={step === 1} onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Quay lại
            </Button>
            {step < 3 ? (
              <Button size="sm" onClick={() => goStep((step + 1) as 1 | 2 | 3)} disabled={step === 1 ? !hasData : missingRequired.length > 0}>
                Tiếp tục <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={clearFile}>
                <RefreshCw className="mr-1 h-4 w-4" /> Nhập file mới
              </Button>
            )}
          </div>
        </>
      )}

      {/* ================= TAB: ALL-IN-ONE (.xlsx) ================= */}
      {tab === "allinone" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/20 p-3">
            <Button size="sm" variant="outline" onClick={() => exportAllInOne(false)} disabled={busy}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
              Tải mẫu all-in-one (trống)
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportAllInOne(false, true)} disabled={busy}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
              Tải mẫu RÚT GỌN (trống)
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportAllInOne(true)} disabled={busy}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
              Tải kèm TẤT CẢ dữ liệu
            </Button>
          </div>
          <AllInOneChecklist />
          <AllInOneExportPanel />
          <AllInOneImport />
          <ImportBatchHistory />
        </div>
      )}



      {/* ================= TAB: XUẤT & MẪU ================= */}
      {tab === "export" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4 text-primary" /> Xuất dữ liệu & tải mẫu nhập liệu
              <InfoHint>
                Tải mẫu CSV để điền, hoặc xuất dữ liệu hiện có (đã giải mã liên kết về mã).
                Quy trình: Danh mục → Model → Hệ thống → Tài sản.
              </InfoHint>

            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5 sm:max-w-xs">
              <Label>Đối tượng</Label>
              <Select value={entity} onValueChange={(v) => { setEntity(v); setResult(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENTITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {isCat && (
              <div className="space-y-1.5 sm:max-w-xs">
                <Label>Bảng danh mục</Label>
                <Select value={catTable} onValueChange={(v) => { setCatTable(v); setResult(null); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATALOG_TABLES.map((c) => <SelectItem key={c.table} value={c.table}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Chọn trường cần nhập (kiểu Snipe-IT) — chỉ xuất mẫu những cột đã chọn */}
            {ent && !isCat && (
              <div className="rounded-md border bg-muted/30 p-3">
                <button
                  type="button"
                  onClick={() => setShowPicker((s) => !s)}
                  className="flex w-full items-center justify-between text-sm font-medium"
                >
                  <span className="flex items-center gap-1.5"><Wand2 className="h-4 w-4 text-primary" /> Chọn trường cho mẫu ({picked.size}/{ent.fields.length})</span>
                  <span className="text-xs text-muted-foreground">{showPicker ? "Ẩn ▲" : "Hiện ▼"}</span>
                </button>
                {showPicker && (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Button variant="ghost" size="sm" className="h-7" onClick={() => resetPick(true)}>Chọn tất cả</Button>
                      <Button variant="ghost" size="sm" className="h-7" onClick={() => resetPick(false)}>Chỉ trường bắt buộc</Button>
                    </div>
                    <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                      {ent.fields.map((f) => {
                        const locked = f.key === ent.keyHeader;
                        return (
                          <label key={f.key} className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 accent-primary"
                              checked={picked.has(f.key) || locked}
                              disabled={locked}
                              onChange={() => togglePick(f.key)}
                            />
                            <span className={locked ? "font-medium" : ""}>
                              {f.label}
                              {f.required && <span className="text-destructive"> *</span>}
                              {locked && <span className="text-muted-foreground"> (khóa)</span>}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="default" size="sm" onClick={() => exportTemplate(true)}>
                <Download className="mr-1.5 h-4 w-4" /> Tải mẫu (trường đã chọn)
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportTemplate(false)}>
                <Download className="mr-1.5 h-4 w-4" /> Tải mẫu đầy đủ
              </Button>
              <Button variant="outline" size="sm" onClick={exportData} disabled={busy}>
                {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />} Xuất dữ liệu hiện có
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

void catalogEntity;
