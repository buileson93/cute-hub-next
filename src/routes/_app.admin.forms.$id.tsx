// ============================================================================
// _app.admin.forms.$id.tsx — FORM DESIGNER 2.0 (P2, 3-pane).
//
// Pane trái  : Cây trường (list + add/remove/reorder + chọn).
// Pane giữa  : Live preview theo lưới 3 cột, dùng col_span, radar select ô.
// Pane phải  : Property Inspector cho field đang chọn (hoặc Info mẫu khi chưa
//              chọn).
//
// Không đổi hợp đồng lưu: vẫn upsert form_field / form_template / _he_thong
// như bản cũ, nhưng payload có thêm cột mới (unit/tieu_chuan/min/max/col_span/
// visible_if/columns/ratings/formula/nhom).
// ============================================================================
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2, ArrowLeft, Plus, Trash2, ShieldAlert, Save, ChevronUp, ChevronDown,
  Settings2, LayoutGrid, Link2, FileText, Copy, AlertTriangle, CheckCircle2,
  History, Download, Upload, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { FormVersionIncludePanel } from "@/components/mirats/FormVersionIncludePanel";
import { FieldInspector, type InspectorField } from "@/components/mirats/FieldInspector";
import { FieldPreview, type PreviewField } from "@/components/mirats/FieldPreview";
import { SimpleFormDesigner } from "@/components/mirats/SimpleFormDesigner";
import { FormLivePreview } from "@/components/mirats/FormLivePreview";
import { ChecklistDesigner } from "@/components/mirats/ChecklistDesigner";
import { fetchTemplateSections } from "@/lib/mirats/checklist-repo";
import {
  saveChecklistDesigner, validateChecklist, hasBlocking as hasChkBlocking,
  type DesignerSection,
} from "@/lib/mirats/checklist-designer-io";
import { DEFAULT_ITEM_OPTIONS } from "@/lib/mirats/checklist-item-options";
import { ListChecks } from "lucide-react";
import {
  validateTemplate, hasBlockingIssues, buildBundle, downloadBundleJson, parseBundleJson,
  persistDesigner, createSnapshot, type ValidationIssue,
} from "@/lib/mirats/form-designer-io";


export const Route = createFileRoute("/_app/admin/forms/$id")({
  head: () => ({ meta: [{ title: "Thiết kế mẫu — MIRATS" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: FormEditor,
});

type Field = InspectorField & { id?: string; position: number };

type Tpl = {
  ten: string; mo_ta: string; nhom: string;
  thiet_bi_mode: string; require_signature: boolean; active: boolean;
};

function emptyField(i: number): Field {
  return {
    key: `field_${i + 1}`, label: "Trường mới", kind: "text",
    required: false, help_text: null, placeholder: null, options: null,
    unit: null, tieu_chuan: null, min_value: null, max_value: null,
    col_span: 3, visible_if: null, columns: null, ratings: null,
    formula: null, nhom: null, position: i,
    required_if: null, constraint_formula: null, constraint_message: null,
  };
}

function FormEditor() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { hasRole, loading } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");

  const [fields, setFields] = useState<Field[] | null>(null);
  const [tpl, setTpl] = useState<Tpl | null>(null);
  const [linkedHt, setLinkedHt] = useState<string[] | null>(null);
  const [htSearch, setHtSearch] = useState("");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [tab, setTab] = useState<"design" | "checklist" | "info" | "includes">("design");
  const [chkSections, setChkSections] = useState<DesignerSection[] | null>(null);
  const [chkDirty, setChkDirty] = useState(false);
  const [chkSaving, setChkSaving] = useState(false);
  const [tabAutoPicked, setTabAutoPicked] = useState(false);
  const [autosaveOn, setAutosaveOn] = useState(true);
  const [mode, setMode] = useState<"simple" | "advanced">(() => {
    if (typeof window === "undefined") return "simple";
    return (localStorage.getItem("mirats.form-designer.mode") as "simple" | "advanced") || "simple";
  });
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("mirats.form-designer.mode", mode);
  }, [mode]);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [savingAuto, setSavingAuto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  void nav; // giữ tương thích ngược, chưa dùng navigate

  useQuery({
    queryKey: ["form-template", id],
    enabled: canManage,
    queryFn: async () => {
      const [tRes, fRes, lRes] = await Promise.all([
        supabase.from("form_template")
          .select("ten,mo_ta,nhom,thiet_bi_mode,require_signature,active")
          .eq("id", id).maybeSingle(),
        supabase.from("form_field").select("*").eq("template_id", id).order("position"),
        supabase.from("form_template_he_thong").select("he_thong_id").eq("template_id", id),
      ]);
      if (tRes.error) throw tRes.error;
      if (fRes.error) throw fRes.error;
      if (lRes.error) throw lRes.error;
      setTpl({
        ten: tRes.data?.ten ?? "",
        mo_ta: tRes.data?.mo_ta ?? "",
        nhom: tRes.data?.nhom ?? "bien_ban",
        thiet_bi_mode: tRes.data?.thiet_bi_mode ?? "none",
        require_signature: tRes.data?.require_signature ?? true,
        active: tRes.data?.active ?? true,
      });
      setLinkedHt((lRes.data ?? []).map((r) => r.he_thong_id as string));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFields((fRes.data ?? []).map((f: any, i: number) => ({
        id: f.id, key: f.key, label: f.label, kind: f.kind,
        required: f.required, help_text: f.help_text, placeholder: f.placeholder,
        options: Array.isArray(f.options) ? (f.options as string[]) : null,
        unit: f.unit ?? null,
        tieu_chuan: f.tieu_chuan ?? null,
        min_value: f.min_value == null ? null : Number(f.min_value),
        max_value: f.max_value == null ? null : Number(f.max_value),
        col_span: typeof f.col_span === "number" ? f.col_span : 3,
        visible_if: f.visible_if ?? null,
        columns: Array.isArray(f.columns) ? f.columns : null,
        ratings: Array.isArray(f.ratings) ? f.ratings : null,
        formula: f.formula ?? null,
        nhom: f.nhom ?? null,
        position: typeof f.position === "number" ? f.position : i,
        required_if: f.required_if ?? null,
        constraint_formula: f.constraint_formula ?? null,
        constraint_message: f.constraint_message ?? null,
      })));
      return true;
    },
  });

  // Load checklist sections (form_section + form_check_item) — dùng cho tab Bảng kiểm.
  useQuery({
    queryKey: ["form-template-checklist", id],
    enabled: canManage,
    queryFn: async () => {
      const raw = await fetchTemplateSections(id);
      const secs: DesignerSection[] = raw.map((s, si) => ({
        ...s,
        position: si,
        items: s.items.map((it, ii) => ({
          ...it,
          position: ii,
          options: it.options ?? { ...DEFAULT_ITEM_OPTIONS },
        })),
      }));
      setChkSections(secs);
      setChkDirty(false);
      return true;
    },
  });

  // Auto-chọn tab đúng dựa vào loại nội dung mẫu đang có:
  // - Có form_check_item (bảng kiểm) & không có form_field → mở tab "Bảng kiểm".
  // - Có form_field → giữ tab "Thiết kế".
  // Chỉ chạy 1 lần sau khi cả hai query đã tải xong.
  useEffect(() => {
    if (tabAutoPicked) return;
    if (fields === null || chkSections === null) return;
    const hasChecklist = chkSections.some((s) => (s.items?.length ?? 0) > 0);
    const hasFields = fields.length > 0;
    if (hasChecklist && !hasFields) setTab("checklist");
    setTabAutoPicked(true);
  }, [fields, chkSections, tabAutoPicked]);

  const { data: taxo } = useQuery({
    queryKey: ["db_taxonomy"],
    enabled: canManage,
    queryFn: async () => {
      const { data, error } = await supabase.from("dm_he_thong")
        .select("id, ma, ten").order("ten");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; ma: string; ten: string }>;
    },
  });

  // Validate live (runs on every state change) — dùng cho UI badge + gate save.
  const issues: ValidationIssue[] = useMemo(
    () => (tpl && fields ? validateTemplate(tpl, fields) : []),
    [tpl, fields],
  );
  const errorCount = issues.filter((x) => x.level === "error").length;
  const warnCount = issues.filter((x) => x.level === "warning").length;
  const blocked = hasBlockingIssues(issues);

  const doPersist = async () => {
    if (!tpl || fields === null) return;
    await persistDesigner(id, tpl, fields, linkedHt ?? []);
    setDirty(false);
    setLastSavedAt(new Date());
    qc.invalidateQueries({ queryKey: ["form-template", id] });
    qc.invalidateQueries({ queryKey: ["admin-form-templates"] });
    qc.invalidateQueries({ queryKey: ["bao-tri-templates"] });
  };

  const saveM = useMutation({
    mutationFn: async () => {
      if (!tpl || fields === null) throw new Error("Chưa tải xong.");
      if (blocked) throw new Error("Cấu hình chưa hợp lệ — xem panel cảnh báo.");
      await doPersist();
      // Snapshot lịch sử (chỉ khi bấm Lưu thủ công, autosave không tạo snapshot).
      try {
        const bundle = buildBundle(tpl, fields, linkedHt ?? []);
        const v = await createSnapshot(id, bundle);
        toast.success(`Đã lưu · snapshot v${v}`);
      } catch (e) {
        toast.success("Đã lưu (không tạo được snapshot: " + (e as Error).message + ")");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Autosave — 2s sau lần chỉnh sửa gần nhất, chỉ khi không blocked & đã dirty.
  useEffect(() => {
    if (!autosaveOn || !dirty || blocked || fields === null || !tpl) return;
    const t = setTimeout(async () => {
      try {
        setSavingAuto(true);
        await doPersist();
      } catch (e) {
        toast.error("Autosave thất bại: " + (e as Error).message);
      } finally {
        setSavingAuto(false);
      }
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, autosaveOn, blocked, tpl, fields, linkedHt]);

  // Wrapper setState đánh dấu dirty.
  const mark = () => setDirty(true);

  // ─── Import JSON ───
  const importFile = async (file: File) => {
    try {
      const text = await file.text();
      const bundle = parseBundleJson(text);
      // Xoá id để coi mọi field là mới → upsert sẽ chèn.
      setTpl(bundle.template);
      setFields(bundle.fields.map((f, i) => ({ ...f, id: undefined, position: i })));
      setLinkedHt(bundle.linked_he_thong);
      setSelectedIdx(null);
      setDirty(true);
      toast.success(`Đã nạp bundle (${bundle.fields.length} trường). Nhấn Lưu để ghi xuống DB.`);
    } catch (e) {
      toast.error("Không đọc được JSON: " + (e as Error).message);
    }
  };

  const selected = useMemo(
    () => (fields && selectedIdx != null ? fields[selectedIdx] : null),
    [fields, selectedIdx],
  );
  const otherFields = useMemo(
    () => (fields ?? []).filter((_, i) => i !== selectedIdx).map((f) => ({ key: f.key, label: f.label })),
    [fields, selectedIdx],
  );

  // Đánh dấu dirty khi state đổi (sau lần hydrate đầu tiên).
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (tpl && fields !== null && !hydratedRef.current) { hydratedRef.current = true; return; }
    if (hydratedRef.current) mark();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, tpl, linkedHt]);

  if (loading || !tpl || fields === null) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!canManage) {
    return <div className="p-16 text-center"><ShieldAlert className="mx-auto h-8 w-8 text-rose-500" /><p className="mt-3">Không có quyền.</p></div>;
  }

  const addField = () => {
    const nf = emptyField(fields.length);
    const next = [...fields, nf];
    setFields(next);
    setSelectedIdx(next.length - 1);
  };
  const duplicateField = (i: number) => {
    const f = fields[i];
    const clone: Field = { ...f, id: undefined, key: `${f.key}_copy`, position: i + 1 };
    const next = [...fields.slice(0, i + 1), clone, ...fields.slice(i + 1)];
    setFields(next);
    setSelectedIdx(i + 1);
  };
  const patchField = (i: number, patch: Partial<Field>) => {
    setFields(fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  };
  const removeField = (i: number) => {
    setFields(fields.filter((_, idx) => idx !== i));
    setSelectedIdx((cur) => (cur === i ? null : cur != null && cur > i ? cur - 1 : cur));
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= fields.length) return;
    const copy = [...fields];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setFields(copy);
    setSelectedIdx(j);
  };

  const chkIssues = chkSections ? validateChecklist(chkSections) : [];
  const chkBlocked = hasChkBlocking(chkIssues);
  const saveChecklist = async () => {
    if (!chkSections) return;
    if (chkBlocked) { toast.error("Bảng kiểm chưa hợp lệ — sửa lỗi trước khi lưu."); return; }
    try {
      setChkSaving(true);
      await saveChecklistDesigner(id, chkSections);
      setChkDirty(false);
      setLastSavedAt(new Date());
      toast.success("Đã lưu bảng kiểm");
      qc.invalidateQueries({ queryKey: ["form-template-checklist", id] });
    } catch (e) {
      toast.error("Lưu thất bại: " + (e as Error).message);
    } finally {
      setChkSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/forms"><ArrowLeft className="mr-1 h-4 w-4" />Danh sách</Link>
        </Button>
        <Input
          value={tpl.ten}
          onChange={(e) => setTpl({ ...tpl, ten: e.target.value })}
          className="h-8 max-w-md text-sm font-medium"
          placeholder="Tên mẫu…"
        />
        <Badge variant="outline" className="font-mono text-[10px]">{tpl.nhom}</Badge>

        {/* Trạng thái validate */}
        {errorCount > 0 ? (
          <Badge variant="destructive" className="gap-1 text-[10px]"><AlertTriangle className="h-3 w-3" />{errorCount} lỗi</Badge>
        ) : warnCount > 0 ? (
          <Badge variant="outline" className="gap-1 border-amber-400 text-amber-700 text-[10px]"><AlertTriangle className="h-3 w-3" />{warnCount} cảnh báo</Badge>
        ) : (
          <Badge variant="outline" className="gap-1 border-emerald-400 text-emerald-700 text-[10px]"><CheckCircle2 className="h-3 w-3" />Hợp lệ</Badge>
        )}

        {/* Trạng thái lưu */}
        <span className="text-[11px] text-muted-foreground">
          {savingAuto ? "Đang autosave…"
            : dirty ? "Chưa lưu"
            : lastSavedAt ? `Đã lưu ${lastSavedAt.toLocaleTimeString("vi-VN")}`
            : ""}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Switch checked={autosaveOn} onCheckedChange={setAutosaveOn} />
            Autosave
          </label>

          <Button asChild size="sm" variant="ghost" className="h-8">
            <Link to="/admin/forms/$id/history" params={{ id }}>
              <History className="mr-1 h-3 w-3" />Lịch sử
            </Link>
          </Button>

          <Button
            size="sm" variant="ghost" className="h-8"
            onClick={() => downloadBundleJson(buildBundle(tpl, fields, linkedHt ?? []), tpl.ten || "template")}
          >
            <Download className="mr-1 h-3 w-3" />JSON
          </Button>
          <Button
            size="sm" variant="ghost" className="h-8"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-1 h-3 w-3" />Nhập
          </Button>
          <input
            ref={fileInputRef} type="file" accept="application/json" className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importFile(f);
              e.target.value = "";
            }}
          />

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="h-8">
              <TabsTrigger value="design" className="h-6 text-xs"><LayoutGrid className="mr-1 h-3 w-3" />Thiết kế</TabsTrigger>
              <TabsTrigger value="checklist" className="h-6 text-xs"><ListChecks className="mr-1 h-3 w-3" />Bảng kiểm</TabsTrigger>
              <TabsTrigger value="info" className="h-6 text-xs"><FileText className="mr-1 h-3 w-3" />Thông tin</TabsTrigger>
              <TabsTrigger value="includes" className="h-6 text-xs"><Link2 className="mr-1 h-3 w-3" />Version / Include</TabsTrigger>
            </TabsList>
          </Tabs>
          {tab === "design" && (
            <div className="ml-1 flex items-center rounded-md border bg-muted/40 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => { setMode("simple"); setPreview(false); }}
                className={`rounded px-2 py-1 transition ${!preview && mode === "simple" ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                title="Chế độ đơn giản — dễ dùng cho người không rành kỹ thuật"
              >Đơn giản</button>
              <button
                type="button"
                onClick={() => { setMode("advanced"); setPreview(false); }}
                className={`rounded px-2 py-1 transition ${!preview && mode === "advanced" ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                title="Chế độ nâng cao — đủ mọi thuộc tính"
              >Nâng cao</button>
              <button
                type="button"
                onClick={() => setPreview((v) => !v)}
                className={`flex items-center gap-1 rounded px-2 py-1 transition ${preview ? "bg-background font-medium text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                title="Xem trước hoạt động — điền thử biểu mẫu"
              ><Eye className="h-3 w-3" />Xem trước</button>
            </div>
          )}
          {tab === "checklist" ? (
            <Button size="sm" onClick={saveChecklist} disabled={chkSaving || chkBlocked || !chkDirty}>
              {chkSaving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
              Lưu bảng kiểm {chkBlocked && "(chặn)"}
            </Button>
          ) : (
            <Button size="sm" onClick={() => saveM.mutate()} disabled={saveM.isPending || blocked}>
              {saveM.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
              Lưu {blocked && "(chặn)"}
            </Button>
          )}

        </div>
      </div>

      {/* Panel cảnh báo validate — hiện khi có lỗi/cảnh báo */}
      {issues.length > 0 && (
        <div className="max-h-32 overflow-y-auto border-b bg-amber-50/60 px-4 py-2 text-xs dark:bg-amber-950/20">
          <ul className="space-y-0.5">
            {issues.slice(0, 6).map((iss, k) => (
              <li key={k} className={iss.level === "error" ? "text-rose-700 dark:text-rose-400" : "text-amber-700 dark:text-amber-400"}>
                <AlertTriangle className="mr-1 inline h-3 w-3" />
                {iss.field_index != null && <span className="font-mono">#{iss.field_index + 1} </span>}
                {iss.message}
                {iss.field_index != null && (
                  <button className="ml-2 underline" onClick={() => setSelectedIdx(iss.field_index!)}>Đi tới</button>
                )}
              </li>
            ))}
            {issues.length > 6 && <li className="text-muted-foreground">… và {issues.length - 6} mục nữa</li>}
          </ul>
        </div>
      )}

      {tab === "design" && preview ? (
        null
      ) : null}
      {tab === "design" && !preview && fields.length === 0 && chkSections && chkSections.some((s) => (s.items?.length ?? 0) > 0) && (
        <div className="border-b bg-sky-50 px-4 py-2 text-xs text-sky-800 dark:bg-sky-950/30 dark:text-sky-200">
          <AlertTriangle className="mr-1 inline h-3 w-3" />
          Mẫu này (AWOS/PL-KT) dùng <b>Bảng kiểm</b> — không có "Trường" ở tab Thiết kế.
          <button className="ml-2 rounded bg-sky-600 px-2 py-0.5 text-white hover:bg-sky-700" onClick={() => setTab("checklist")}>
            Mở tab Bảng kiểm
          </button>
        </div>
      )}
      {tab === "design" && preview ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20">
          <FormLivePreview
            tplName={tpl.ten}
            tplDesc={tpl.mo_ta}
            fields={fields as unknown as ReadonlyArray<Record<string, unknown>>}
          />
        </div>
      ) : tab === "checklist" ? (
        chkSections === null ? (
          <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            {chkIssues.length > 0 && (
              <div className="max-h-24 overflow-y-auto border-b bg-amber-50/60 px-4 py-1.5 text-[11px] dark:bg-amber-950/20">
                <ul className="space-y-0.5">
                  {chkIssues.slice(0, 5).map((iss, k) => (
                    <li key={k} className={iss.level === "error" ? "text-rose-700" : "text-amber-700"}>
                      <AlertTriangle className="mr-1 inline h-3 w-3" />{iss.message}
                    </li>
                  ))}
                  {chkIssues.length > 5 && <li className="text-muted-foreground">… {chkIssues.length - 5} mục nữa</li>}
                </ul>
              </div>
            )}
            <ChecklistDesigner
              sections={chkSections}
              onChange={(next) => { setChkSections(next); setChkDirty(true); }}
              tplName={tpl.ten}
            />
          </div>
        )
      ) : tab === "design" && mode === "simple" ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20">
          <SimpleFormDesigner
            fields={fields}
            onChange={(next) => setFields(next.map((f, i) => ({ ...f, position: i })))}
            tplName={tpl.ten}
            tplDesc={tpl.mo_ta}
            onTplChange={(p) => setTpl({ ...tpl, ...p })}
          />
        </div>
      ) : tab === "design" ? (
        <div className="grid min-h-0 flex-1 grid-cols-[260px_1fr_320px]">
          {/* LEFT: field list */}
          <aside className="min-h-0 overflow-y-auto border-r bg-muted/30">
            <div className="flex items-center justify-between p-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Trường ({fields.length})</p>
              <Button size="sm" variant="outline" className="h-7" onClick={addField}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <ul className="space-y-0.5 px-1 pb-4">
              {fields.map((f, i) => {
                const isSel = i === selectedIdx;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => setSelectedIdx(i)}
                      className={`group flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-xs transition ${
                        isSel ? "bg-primary/10 text-primary" : "hover:bg-secondary"
                      }`}
                    >
                      <span className="flex-1 truncate">
                        <span className="font-medium">{f.label}</span>
                        <span className="ml-1 font-mono text-[10px] text-muted-foreground">{f.key}</span>
                      </span>
                      <Badge variant="outline" className="h-4 shrink-0 px-1 font-mono text-[9px]">{f.kind}</Badge>
                      <span className="flex opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); move(i, -1); }}
                          className="rounded p-0.5 hover:bg-background"
                        ><ChevronUp className="h-3 w-3" /></button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); move(i, 1); }}
                          className="rounded p-0.5 hover:bg-background"
                        ><ChevronDown className="h-3 w-3" /></button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); duplicateField(i); }}
                          className="rounded p-0.5 hover:bg-background"
                          title="Nhân bản"
                        ><Copy className="h-3 w-3" /></button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeField(i); }}
                          className="rounded p-0.5 hover:bg-background"
                        ><Trash2 className="h-3 w-3 text-rose-600" /></button>
                      </span>
                    </button>
                  </li>
                );
              })}
              {fields.length === 0 && (
                <li className="px-2 py-6 text-center text-xs text-muted-foreground">
                  Chưa có trường. Bấm + để thêm.
                </li>
              )}
            </ul>
          </aside>

          {/* CENTER: preview canvas */}
          <main className="min-h-0 overflow-y-auto bg-background p-6">
            <div className="mx-auto max-w-3xl">
              <div className="mb-4 text-center">
                <h1 className="text-lg font-bold uppercase">{tpl.ten || "Chưa đặt tên mẫu"}</h1>
                {tpl.mo_ta && <p className="mt-1 text-xs text-muted-foreground">{tpl.mo_ta}</p>}
              </div>
              <div className="grid grid-cols-3 gap-3 rounded-md border bg-card p-4">
                {fields.map((f, i) => {
                  const pv: PreviewField = f as PreviewField;
                  const span = `col-span-${Math.min(3, Math.max(1, f.col_span))}`;
                  const isSel = i === selectedIdx;
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedIdx(i)}
                      className={`${span} cursor-pointer rounded-md border-2 p-2 transition ${
                        isSel ? "border-primary bg-primary/5" : "border-transparent hover:border-muted"
                      }`}
                    >
                      <FieldPreview f={pv} />
                    </div>
                  );
                })}
                {fields.length === 0 && (
                  <div className="col-span-3 py-12 text-center text-sm text-muted-foreground">
                    Chưa có trường. Thêm ở panel bên trái.
                  </div>
                )}
              </div>
              {tpl.require_signature && (
                <div className="mt-4 rounded-md border bg-muted/20 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Chữ ký</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded border border-dashed p-4">Người lập</div>
                    <div className="rounded border border-dashed p-4">Trưởng phòng KT</div>
                    <div className="rounded border border-dashed p-4">Lãnh đạo</div>
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* RIGHT: inspector */}
          <aside className="min-h-0 overflow-y-auto border-l bg-muted/30 p-3">
            {selected ? (
              <>
                <div className="mb-2 flex items-center gap-1">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Thuộc tính trường</p>
                </div>
                <FieldInspector
                  field={selected}
                  otherFields={otherFields}
                  onChange={(patch) => patchField(selectedIdx!, patch)}
                />
              </>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                Chọn 1 trường ở panel trái hoặc preview để chỉnh thuộc tính.
              </div>
            )}
          </aside>
        </div>
      ) : tab === "info" ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Thông tin mẫu</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Mô tả</Label>
                  <Textarea value={tpl.mo_ta}
                    onChange={(e) => setTpl({ ...tpl, mo_ta: e.target.value })}
                    rows={2} maxLength={500} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <Label className="text-xs">Loại mẫu</Label>
                    <Select value={tpl.nhom} onValueChange={(v) => setTpl({ ...tpl, nhom: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bien_ban">Biên bản chung</SelectItem>
                        <SelectItem value="bao_duong">Phiếu bảo dưỡng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Liên kết tài sản</Label>
                    <Select value={tpl.thiet_bi_mode}
                      onValueChange={(v) => setTpl({ ...tpl, thiet_bi_mode: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không</SelectItem>
                        <SelectItem value="single">1 tài sản</SelectItem>
                        <SelectItem value="multi">Nhiều tài sản</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col justify-end gap-2 py-1">
                    <div className="flex items-center gap-2">
                      <Switch checked={tpl.require_signature}
                        onCheckedChange={(v) => setTpl({ ...tpl, require_signature: v })} />
                      <Label className="text-xs">Có phần chữ ký</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={tpl.active}
                        onCheckedChange={(v) => setTpl({ ...tpl, active: v })} />
                      <Label className="text-xs">Kích hoạt</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {tpl.nhom === "bao_duong" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Gắn với hệ thống ({(linkedHt ?? []).length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input placeholder="Tìm mã hoặc tên hệ thống…"
                    value={htSearch} onChange={(e) => setHtSearch(e.target.value)} />
                  <div className="max-h-72 space-y-1 overflow-auto rounded border p-2">
                    {(taxo ?? [])
                      .filter((h) => {
                        const q = htSearch.trim().toLowerCase();
                        if (!q) return true;
                        return `${h.ma} ${h.ten}`.toLowerCase().includes(q);
                      })
                      .map((h) => {
                        const on = (linkedHt ?? []).includes(h.id);
                        return (
                          <button
                            type="button" key={h.id}
                            onClick={() => setLinkedHt(on
                              ? (linkedHt ?? []).filter((x) => x !== h.id)
                              : [...(linkedHt ?? []), h.id])}
                            className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition ${
                              on ? "bg-primary/10 text-primary" : "hover:bg-secondary"
                            }`}
                          >
                            <span><span className="font-mono text-xs">{h.ma}</span> — {h.ten}</span>
                            {on && <Badge variant="outline" className="text-[10px]">Đã gắn</Badge>}
                          </button>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl">
            <FormVersionIncludePanel templateId={id} />
          </div>
        </div>
      )}
    </div>
  );
}
