// ============================================================================
// form-visibility.ts — Đánh giá visible_if + tính toán computed formula.
// Module thuần, không phụ thuộc React/DB — dễ test.
// ============================================================================
import type { CompiledField, VisibleIfRule } from "./form-schema";

export type FormValues = Record<string, unknown>;

function toNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function eq(a: unknown, b: unknown): boolean {
  if (a == null && b == null) return true;
  if (typeof a === "number" || typeof b === "number") {
    const na = toNum(a);
    const nb = toNum(b);
    if (na != null && nb != null) return na === nb;
  }
  return String(a ?? "") === String(b ?? "");
}

export function evalVisible(rule: VisibleIfRule, values: FormValues): boolean {
  if (!rule) return true;
  const v = values[rule.field_key];
  const target = rule.value;
  switch (rule.op) {
    case "eq":  return eq(v, target);
    case "neq": return !eq(v, target);
    case "gt":  { const a = toNum(v), b = toNum(target); return a != null && b != null && a > b; }
    case "lt":  { const a = toNum(v), b = toNum(target); return a != null && b != null && a < b; }
    case "gte": { const a = toNum(v), b = toNum(target); return a != null && b != null && a >= b; }
    case "lte": { const a = toNum(v), b = toNum(target); return a != null && b != null && a <= b; }
    case "in":  return Array.isArray(target) && target.some((t) => eq(v, t));
    case "not_in": return Array.isArray(target) && !target.some((t) => eq(v, t));
    default: return true;
  }
}

/**
 * Đánh giá công thức đơn giản — chỉ +, -, *, /, (), số và tham chiếu {key}.
 * Không dùng eval, không cho phép identifier tự do → an toàn với input người dùng.
 */
export function evalFormula(formula: string, values: FormValues): number | null {
  if (!formula || !formula.trim()) return null;
  let missing = false;
  const substituted = formula.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => {
    const n = toNum(values[key]);
    if (n == null) { missing = true; return "0"; }
    return String(n);
  });
  if (missing) return null;
  if (!/^[\d+\-*/().\s]+$/.test(substituted)) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const fn = new Function(`"use strict"; return (${substituted});`);
    const r = fn();
    return typeof r === "number" && Number.isFinite(r) ? r : null;
  } catch {
    return null;
  }
}

/**
 * Đánh giá predicate cross-field: hỗ trợ so sánh <,<=,>,>=,==,!=, &&, ||, !,
 * số, `true/false`, và tham chiếu `{key}`. Whitelist ký tự → an toàn.
 * Trả `true/false`, hoặc `null` khi thiếu dữ liệu / biểu thức không hợp lệ.
 */
export function evalPredicate(expr: string, values: FormValues): boolean | null {
  if (!expr || !expr.trim()) return null;
  let missing = false;
  const substituted = expr.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => {
    const v = values[key];
    if (v == null || v === "") { missing = true; return "null"; }
    const n = toNum(v);
    if (n != null) return String(n);
    if (typeof v === "boolean") return v ? "true" : "false";
    // string → gói trong quotes an toàn (chỉ chữ/số/dấu gạch dưới).
    const s = String(v).replace(/[^\w.\-:@\s]/g, "");
    return JSON.stringify(s);
  });
  if (missing) return null;
  // Cho phép: chữ số, phép toán, so sánh, logic, quote đơn giản.
  if (!/^[\w\s+\-*/().<>=!&|"',:.@]+$/.test(substituted)) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const fn = new Function(`"use strict"; return (${substituted});`);
    const r = fn();
    return typeof r === "boolean" ? r : Boolean(r);
  } catch {
    return null;
  }
}

/**
 * Với 1 field measure: xác định giá trị có "Đạt" ngưỡng min/max không.
 * Trả null nếu không đủ dữ liệu để đánh giá.
 */
export function checkThreshold(f: CompiledField, v: unknown): "pass" | "fail" | null {
  const n = toNum(v);
  if (n == null) return null;
  if (f.min_value != null && n < f.min_value) return "fail";
  if (f.max_value != null && n > f.max_value) return "fail";
  if (f.min_value == null && f.max_value == null) return null;
  return "pass";
}

/** Trả true nếu field đang bắt buộc dựa trên `required` + `required_if`. */
export function isRequiredNow(f: CompiledField, values: FormValues): boolean {
  if (f.required_if) return evalVisible(f.required_if, values);
  return !!f.required;
}

/** Kết quả validate 1 field: null = OK, string = message lỗi. */
export type FieldError = { key: string; label: string; message: string };

/**
 * Validate toàn bộ form: (1) required/required_if với field đang HIỂN THỊ,
 * (2) constraint_formula predicate, (3) min/max ngưỡng.
 */
export function validateForm(
  fields: readonly CompiledField[],
  values: FormValues,
): FieldError[] {
  const errors: FieldError[] = [];
  for (const f of fields) {
    if (!evalVisible(f.visible_if, values)) continue;
    // Section/repeat/display: bỏ qua các trường không nhập.
    if (["heading", "divider", "note"].includes(f.kind)) continue;

    const v = values[f.key];
    const isEmpty =
      v == null || v === "" ||
      (Array.isArray(v) && v.length === 0) ||
      (typeof v === "object" && !Array.isArray(v) && Object.keys(v ?? {}).length === 0);

    if (isRequiredNow(f, values) && isEmpty) {
      errors.push({ key: f.key, label: f.label, message: `Thiếu trường bắt buộc: ${f.label}` });
      continue;
    }
    if (!isEmpty && f.kind === "number" || f.kind === "measure") {
      const th = checkThreshold(f, v);
      if (th === "fail") {
        const rng = [
          f.min_value != null ? `≥ ${f.min_value}` : null,
          f.max_value != null ? `≤ ${f.max_value}` : null,
        ].filter(Boolean).join(", ");
        errors.push({ key: f.key, label: f.label, message: `${f.label} ngoài ngưỡng cho phép (${rng}).` });
      }
    }
    if (f.constraint_formula && f.constraint_formula.trim()) {
      const ok = evalPredicate(f.constraint_formula, values);
      if (ok === false) {
        errors.push({
          key: f.key, label: f.label,
          message: f.constraint_message?.trim() || `${f.label}: vi phạm điều kiện kiểm tra chéo.`,
        });
      }
    }
  }
  return errors;
}

