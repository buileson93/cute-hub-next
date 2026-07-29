// ============================================================================
// form-designer-io.ts — Helpers dùng chung cho Form Designer:
//   • validateTemplate  — kiểm tra cấu hình field trước khi lưu / autosave.
//   • buildSnapshot     — dựng payload jsonb để ghi vào form_template_version.
//   • exportDesignerJson — tạo blob JSON tải xuống.
//   • parseDesignerJson  — nạp lại từ JSON (dùng khi import).
//   • persistDesigner   — ghi tpl + fields + links vào DB (cả Designer &
//                         History dùng chung → không lệch logic).
// ============================================================================
import { supabase } from "@/integrations/backend/client";
import type { InspectorField } from "@/components/mirats/FieldInspector";

export type DesignerField = InspectorField & { id?: string; position: number };

export type DesignerTpl = {
  ten: string;
  mo_ta: string;
  nhom: string;
  thiet_bi_mode: string;
  require_signature: boolean;
  active: boolean;
};

export type DesignerBundle = {
  version: 1;
  exported_at: string;
  template: DesignerTpl;
  fields: DesignerField[];
  linked_he_thong: string[]; // id hệ thống (chỉ dùng khi nhom = 'bao_duong')
};

// ────────────────────────────── VALIDATE ──────────────────────────────────
export type ValidationIssue = {
  level: "error" | "warning";
  field_index: number | null; // null = lỗi ở phạm vi template
  field_key?: string;
  message: string;
};

const KIND_NEEDS_OPTIONS = new Set(["select", "radio", "multiselect"]);
const KIND_NEEDS_COLUMNS = new Set(["table", "section_repeat"]);
const KEY_RE = /^[a-z][a-z0-9_]*$/;

export function validateTemplate(tpl: DesignerTpl, fields: DesignerField[]): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  if (!tpl.ten.trim()) out.push({ level: "error", field_index: null, message: "Tên mẫu không được trống." });

  const seenKeys = new Map<string, number>();
  const knownKeys = new Set(fields.map((f) => f.key.trim()));

  fields.forEach((f, i) => {
    const key = f.key.trim();
    const label = f.label.trim();
    if (!key) out.push({ level: "error", field_index: i, message: "Thiếu mã trường (key)." });
    else if (!KEY_RE.test(key)) out.push({
      level: "error", field_index: i, field_key: key,
      message: `Key "${key}" không hợp lệ — chỉ chữ thường/chữ số/_ và bắt đầu bằng chữ.`,
    });
    else if (seenKeys.has(key)) out.push({
      level: "error", field_index: i, field_key: key,
      message: `Key "${key}" trùng với trường #${(seenKeys.get(key) ?? 0) + 1}.`,
    });
    else seenKeys.set(key, i);

    if (!label) out.push({ level: "error", field_index: i, field_key: key, message: "Thiếu nhãn hiển thị (label)." });

    if (KIND_NEEDS_OPTIONS.has(f.kind) && (!f.options || f.options.length === 0)) {
      out.push({ level: "error", field_index: i, field_key: key, message: `Trường "${label || key}" (${f.kind}) cần ít nhất 1 tuỳ chọn.` });
    }
    if (KIND_NEEDS_COLUMNS.has(f.kind)) {
      const cols = f.columns ?? [];
      if (cols.length === 0) out.push({ level: "error", field_index: i, field_key: key, message: `Trường "${label || key}" cần ít nhất 1 cột con.` });
      const seenCol = new Set<string>();
      cols.forEach((c, ci) => {
        if (!c.key?.trim() || !c.label?.trim()) out.push({ level: "error", field_index: i, field_key: key, message: `Cột #${ci + 1} thiếu key hoặc label.` });
        else if (seenCol.has(c.key)) out.push({ level: "error", field_index: i, field_key: key, message: `Cột "${c.key}" trùng lặp.` });
        seenCol.add(c.key);
      });
    }

    if (f.min_value != null && f.max_value != null && f.min_value > f.max_value) {
      out.push({ level: "error", field_index: i, field_key: key, message: `min_value (${f.min_value}) > max_value (${f.max_value}).` });
    }

    const cs = typeof f.col_span === "number" ? f.col_span : 3;
    if (cs < 1 || cs > 3) out.push({ level: "warning", field_index: i, field_key: key, message: `col_span nên nằm trong [1..3] (hiện tại ${cs}).` });

    for (const rule of [
      { name: "visible_if", v: f.visible_if },
      { name: "required_if", v: f.required_if },
    ]) {
      if (rule.v && !knownKeys.has(rule.v.field_key)) {
        out.push({ level: "error", field_index: i, field_key: key, message: `${rule.name} tham chiếu field_key "${rule.v.field_key}" không tồn tại.` });
      }
      if (rule.v && rule.v.field_key === key) {
        out.push({ level: "error", field_index: i, field_key: key, message: `${rule.name} không được tham chiếu chính nó.` });
      }
    }

    if (f.constraint_formula && !f.constraint_message?.trim()) {
      out.push({ level: "warning", field_index: i, field_key: key, message: `Có constraint_formula nhưng thiếu constraint_message hiển thị cho người dùng.` });
    }
  });

  return out;
}

export function hasBlockingIssues(issues: ValidationIssue[]): boolean {
  return issues.some((x) => x.level === "error");
}

// ─────────────────────── EXPORT / IMPORT JSON ────────────────────────────
export function buildBundle(tpl: DesignerTpl, fields: DesignerField[], linkedHt: string[]): DesignerBundle {
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    template: { ...tpl },
    fields: fields.map((f, i) => ({ ...f, id: undefined, position: i })),
    linked_he_thong: linkedHt,
  };
}

export function downloadBundleJson(bundle: DesignerBundle, filenameHint: string) {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameHint || "form-template"}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function parseBundleJson(raw: string): DesignerBundle {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") throw new Error("JSON không hợp lệ.");
  if (parsed.version !== 1) throw new Error(`Bundle version ${parsed.version} không được hỗ trợ.`);
  if (!parsed.template || !Array.isArray(parsed.fields)) throw new Error("Thiếu template hoặc fields.");
  return {
    version: 1,
    exported_at: String(parsed.exported_at ?? new Date().toISOString()),
    template: parsed.template as DesignerTpl,
    fields: (parsed.fields as DesignerField[]).map((f, i) => ({ ...f, id: undefined, position: i })),
    linked_he_thong: Array.isArray(parsed.linked_he_thong) ? parsed.linked_he_thong : [],
  };
}

// ─────────────────────────── PERSIST ─────────────────────────────────────
/** Ghi tpl + fields + links vào DB. Dùng chung cho Save/Autosave/Import/Restore. */
export async function persistDesigner(templateId: string, tpl: DesignerTpl, fields: DesignerField[], linkedHt: string[]) {
  const { error: tErr } = await supabase.from("form_template").update({
    ten: tpl.ten.trim(),
    mo_ta: tpl.mo_ta.trim() || null,
    nhom: tpl.nhom,
    thiet_bi_mode: tpl.thiet_bi_mode as "none" | "single" | "multi",
    require_signature: tpl.require_signature,
    active: tpl.active,
  }).eq("id", templateId);
  if (tErr) throw tErr;

  const payload = fields.map((f, i) => ({
    id: f.id, template_id: templateId, key: f.key.trim(), label: f.label.trim(),
    kind: f.kind, required: f.required,
    help_text: f.help_text?.trim() || null,
    placeholder: f.placeholder?.trim() || null,
    options: f.options && f.options.length > 0 ? f.options : null,
    position: i,
    unit: f.unit?.trim() || null,
    tieu_chuan: f.tieu_chuan?.trim() || null,
    min_value: f.min_value,
    max_value: f.max_value,
    col_span: f.col_span,
    visible_if: f.visible_if ?? null,
    columns: f.columns && f.columns.length > 0 ? f.columns : null,
    ratings: f.ratings && f.ratings.length > 0 ? f.ratings : null,
    formula: f.formula?.trim() || null,
    nhom: f.nhom?.trim() || null,
    required_if: f.required_if ?? null,
    constraint_formula: f.constraint_formula?.trim() || null,
    constraint_message: f.constraint_message?.trim() || null,
  }));

  const { data: existing } = await supabase.from("form_field").select("id").eq("template_id", templateId);
  const keepIds = new Set(payload.filter((p) => p.id).map((p) => p.id!));
  const toDel = (existing ?? []).filter((e) => !keepIds.has(e.id)).map((e) => e.id);
  if (toDel.length > 0) {
    const { error } = await supabase.from("form_field").delete().in("id", toDel);
    if (error) throw error;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: uErr } = await supabase.from("form_field").upsert(payload as any);
  if (uErr) throw uErr;

  const { error: delLink } = await supabase.from("form_template_he_thong").delete().eq("template_id", templateId);
  if (delLink) throw delLink;
  const links = tpl.nhom === "bao_duong" ? linkedHt : [];
  if (links.length > 0) {
    const { error: insLink } = await supabase.from("form_template_he_thong")
      .insert(links.map((htId) => ({ template_id: templateId, he_thong_id: htId })));
    if (insLink) throw insLink;
  }
}

// ─────────────────────── SNAPSHOT VERSION ────────────────────────────────
/** Tạo 1 dòng form_template_version (status=draft) làm mốc lịch sử. */
export async function createSnapshot(templateId: string, bundle: DesignerBundle) {
  const { data: rows, error: qErr } = await supabase
    .from("form_template_version")
    .select("version")
    .eq("template_id", templateId)
    .order("version", { ascending: false })
    .limit(1);
  if (qErr) throw qErr;
  const nextVersion = ((rows ?? [])[0]?.version ?? 0) + 1;

  const { error } = await supabase.from("form_template_version").insert({
    template_id: templateId,
    version: nextVersion,
    status: "draft",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    compiled_schema: bundle as any,
  });
  if (error) throw error;
  return nextVersion;
}
