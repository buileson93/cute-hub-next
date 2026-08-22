// ============================================================================
// form-schema.ts — "Đóng băng" cấu trúc mẫu (schema) tại thời điểm lập phiếu.
//
// Vấn đề: chi tiết & xuất Word của phiếu đang đọc form_field HIỆN TẠI theo
// template_id. Sửa mẫu/field sau này sẽ làm ĐỔI luôn phiếu cũ → sai lịch sử.
//
// Giải pháp: mỗi phiếu ghim 1 "snapshot" cấu trúc mẫu (compiled schema).
// Khi hiển thị/xuất: ưu tiên snapshot của phiếu → bản version đã publish →
// (fallback) form_field hiện tại cho phiếu cũ chưa có snapshot.
//
// Module THUẦN, không phụ thuộc DB — để test được và dùng chung server/client.
// ============================================================================

export type VisibleIfOp = "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "in" | "not_in";
export type VisibleIfValue = string | number | boolean | null | string[];
export type VisibleIfRule = {
  field_key: string;
  op: VisibleIfOp;
  value: VisibleIfValue;
} | null;

const VISIBLE_OPS: readonly VisibleIfOp[] = ["eq", "neq", "gt", "lt", "gte", "lte", "in", "not_in"];

export type TableColumnDef = {
  key: string;
  label: string;
  kind: string;
  unit?: string | null;
  options?: string[] | null;
};

export type RatingLevel = { value: string; label: string; color?: string | null };

export type CompiledField = {
  key: string;
  label: string;
  kind: string;
  required: boolean;
  options: string[] | null;
  help_text: string | null;
  placeholder: string | null;
  position: number;
  // Mở rộng cho Form Designer 2.0 — mọi field đều tuỳ chọn để giữ tương thích.
  unit: string | null;
  tieu_chuan: string | null;
  min_value: number | null;
  max_value: number | null;
  col_span: number;
  visible_if: VisibleIfRule;
  columns: TableColumnDef[] | null;
  ratings: RatingLevel[] | null;
  formula: string | null;
  nhom: string | null;
  // Điều kiện required động: bắt buộc chỉ khi rule true (ưu tiên hơn `required`).
  required_if: VisibleIfRule;
  // Kiểm tra chéo trường: biểu thức predicate an toàn (evalPredicate).
  constraint_formula: string | null;
  constraint_message: string | null;
};

export type CompiledTemplateMeta = {
  id: string;
  code: string;
  ten: string;
  version: number;
  require_signature: boolean;
  thiet_bi_mode: string;
};

export type CompiledSchema = {
  template: CompiledTemplateMeta;
  fields: CompiledField[];
};

/** 1 dòng form_field thô từ DB (kiểu lỏng để nhận cả jsonb). */
export type RawFieldRow = {
  key: string;
  label: string;
  kind?: string | null;
  required?: boolean | null;
  options?: unknown;
  help_text?: string | null;
  placeholder?: string | null;
  position?: number | null;
  unit?: string | null;
  tieu_chuan?: string | null;
  min_value?: number | string | null;
  max_value?: number | string | null;
  col_span?: number | null;
  visible_if?: unknown;
  columns?: unknown;
  ratings?: unknown;
  formula?: string | null;
  nhom?: string | null;
  required_if?: unknown;
  constraint_formula?: string | null;
  constraint_message?: string | null;
};

function toStringArray(v: unknown): string[] | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v.map((x) => String(x));
  return null;
}

function toNumberOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toVisibleIf(v: unknown): VisibleIfRule {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.field_key !== "string" || typeof o.op !== "string") return null;
  if (!VISIBLE_OPS.includes(o.op as VisibleIfOp)) return null;
  const raw = o.value;
  let val: VisibleIfValue;
  if (raw == null) val = null;
  else if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean")
    val = raw;
  else if (Array.isArray(raw)) val = raw.map((x) => String(x));
  else return null;
  return { field_key: o.field_key, op: o.op as VisibleIfOp, value: val };
}

function toColumns(v: unknown): TableColumnDef[] | null {
  if (!Array.isArray(v)) return null;
  const out: TableColumnDef[] = [];
  for (const c of v) {
    if (!c || typeof c !== "object") continue;
    const o = c as Record<string, unknown>;
    if (typeof o.key !== "string" || typeof o.label !== "string") continue;
    out.push({
      key: o.key,
      label: o.label,
      kind: typeof o.kind === "string" ? o.kind : "text",
      unit: typeof o.unit === "string" ? o.unit : null,
      options: toStringArray(o.options),
    });
  }
  return out.length ? out : null;
}

function toRatings(v: unknown): RatingLevel[] | null {
  if (!Array.isArray(v)) return null;
  const out: RatingLevel[] = [];
  for (const r of v) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    if (typeof o.value !== "string" || typeof o.label !== "string") continue;
    out.push({
      value: o.value,
      label: o.label,
      color: typeof o.color === "string" ? o.color : null,
    });
  }
  return out.length ? out : null;
}

/** Chuẩn hoá 1 dòng form_field DB -> CompiledField ổn định. */
export function compileField(row: RawFieldRow, index = 0): CompiledField {
  const col =
    typeof row.col_span === "number" && row.col_span >= 1 && row.col_span <= 3 ? row.col_span : 3;
  return {
    key: row.key,
    label: row.label,
    kind: row.kind ?? "text",
    required: row.required ?? false,
    options: toStringArray(row.options),
    help_text: row.help_text ?? null,
    placeholder: row.placeholder ?? null,
    position: typeof row.position === "number" ? row.position : index,
    unit: row.unit ?? null,
    tieu_chuan: row.tieu_chuan ?? null,
    min_value: toNumberOrNull(row.min_value),
    max_value: toNumberOrNull(row.max_value),
    col_span: col,
    visible_if: toVisibleIf(row.visible_if),
    columns: toColumns(row.columns),
    ratings: toRatings(row.ratings),
    formula: row.formula ?? null,
    nhom: row.nhom ?? null,
    required_if: toVisibleIf(row.required_if),
    constraint_formula: row.constraint_formula ?? null,
    constraint_message: row.constraint_message ?? null,
  };
}

export type RawTemplateRow = {
  id: string;
  code: string;
  ten: string;
  version?: number | null;
  require_signature?: boolean | null;
  thiet_bi_mode?: string | null;
};

/** Dựng compiled schema từ template + danh sách field hiện tại (dùng khi lập phiếu). */
export function compileSchema(
  template: RawTemplateRow,
  fields: readonly RawFieldRow[] | null | undefined,
): CompiledSchema {
  const compiled = (fields ?? []).map((f, i) => compileField(f, i));
  compiled.sort((a, b) => a.position - b.position);
  return {
    template: {
      id: template.id,
      code: template.code,
      ten: template.ten,
      version: template.version ?? 1,
      require_signature: template.require_signature ?? false,
      thiet_bi_mode: template.thiet_bi_mode ?? "none",
    },
    fields: compiled,
  };
}

/** Parse jsonb (unknown) thành CompiledSchema; trả null nếu không hợp lệ. */
export function parseCompiledSchema(v: unknown): CompiledSchema | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (!Array.isArray(o.fields)) return null;
  const t = (o.template ?? {}) as Record<string, unknown>;
  const fields = o.fields.map((f, i) => compileField((f ?? {}) as RawFieldRow, i));
  fields.sort((a, b) => a.position - b.position);
  return {
    template: {
      id: String(t.id ?? ""),
      code: String(t.code ?? ""),
      ten: String(t.ten ?? ""),
      version: typeof t.version === "number" ? t.version : 1,
      require_signature: Boolean(t.require_signature),
      thiet_bi_mode: String(t.thiet_bi_mode ?? "none"),
    },
    fields,
  };
}

export type ResolveResult = {
  fields: CompiledField[];
  source: "snapshot" | "version" | "current";
};

/**
 * Quyết định cấu trúc field để render/xuất 1 phiếu.
 * Ưu tiên: snapshot ghim theo phiếu → compiled_schema của version → form_field hiện tại.
 */
export function resolveSubmissionFields(args: {
  snapshot?: CompiledSchema | null;
  versionSchema?: CompiledSchema | null;
  currentFields: readonly CompiledField[];
}): ResolveResult {
  const sortCopy = (arr: readonly CompiledField[]) =>
    [...arr].sort((a, b) => a.position - b.position);

  if (args.snapshot && Array.isArray(args.snapshot.fields)) {
    return { fields: sortCopy(args.snapshot.fields), source: "snapshot" };
  }
  if (args.versionSchema && Array.isArray(args.versionSchema.fields)) {
    return { fields: sortCopy(args.versionSchema.fields), source: "version" };
  }
  return { fields: sortCopy(args.currentFields), source: "current" };
}
