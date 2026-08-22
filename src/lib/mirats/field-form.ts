// ============================================================================
// Logic thuần (không phụ thuộc DOM) cho form trường dữ liệu động.
//
// Tách riêng khỏi component để dễ kiểm thử: prefill mac_dinh, validate theo
// bat_buoc + rang_buoc (mirror trigger validate_thuoc_tinh của CSDL), và
// serialize về đúng key/kiểu để ghi vào cột jsonb `thuoc_tinh` của thiet_bi.
// ============================================================================

import type { FieldSpec, JsonValue } from "@/lib/mirats/registry";

/** Giá trị trên form luôn ở dạng chuỗi hoặc rỗng (input controlled). */
export type FormValue = string;
export type FormValues = Record<string, FormValue>;

function macDinhToStr(v: JsonValue | null): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

/** Prefill: ưu tiên giá trị hiện có, sau đó tới mac_dinh, cuối cùng rỗng. */
export function buildInitialValues(
  specs: FieldSpec[],
  existing?: Record<string, unknown> | null,
): FormValues {
  const out: FormValues = {};
  for (const s of specs) {
    const cur = existing?.[s.field_key];
    if (cur != null && cur !== "") {
      out[s.field_key] =
        typeof cur === "string"
          ? cur
          : typeof cur === "number" || typeof cur === "boolean"
            ? String(cur)
            : "";
    } else {
      out[s.field_key] = macDinhToStr(s.mac_dinh);
    }
  }
  return out;
}

function isEmpty(v: FormValue | null | undefined): boolean {
  return v == null || String(v).trim() === "";
}

/** Validate một giá trị theo spec. Trả về thông báo lỗi hoặc null nếu hợp lệ. */
export function validateFieldValue(spec: FieldSpec, value: FormValue | null): string | null {
  const empty = isEmpty(value);
  if (spec.bat_buoc && empty) return "Bắt buộc nhập";
  if (empty) return null; // không bắt buộc + rỗng → bỏ qua ràng buộc

  const val = String(value);

  if (spec.kieu === "number") {
    const n = Number(val);
    if (!Number.isFinite(n)) return "Phải là số hợp lệ";
    if (spec.rang_buoc.min !== undefined && n < spec.rang_buoc.min)
      return `Tối thiểu ${spec.rang_buoc.min}`;
    if (spec.rang_buoc.max !== undefined && n > spec.rang_buoc.max)
      return `Tối đa ${spec.rang_buoc.max}`;
    return null;
  }

  if (spec.kieu === "select") {
    if (spec.tuy_chon.length > 0 && !spec.tuy_chon.includes(val))
      return "Giá trị không nằm trong danh sách";
    return null;
  }

  // text / textarea / date → kiểm regex nếu có
  if (spec.rang_buoc.regex) {
    try {
      if (!new RegExp(spec.rang_buoc.regex).test(val)) return "Không đúng định dạng";
    } catch {
      // regex khai sai ở cấu hình → bỏ qua để không chặn oan người nhập
    }
  }
  return null;
}

/** Validate toàn bộ; trả map { field_key: message } chỉ chứa field lỗi. */
export function validateFields(specs: FieldSpec[], values: FormValues): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const s of specs) {
    const e = validateFieldValue(s, values[s.field_key] ?? "");
    if (e) errs[s.field_key] = e;
  }
  return errs;
}

/**
 * Chuẩn hoá về đúng key & kiểu để ghi vào jsonb `thuoc_tinh`.
 * - Số → number; còn lại giữ chuỗi.
 * - Bỏ qua field rỗng & không bắt buộc (không ghi key thừa).
 * - Chỉ giữ key thuộc specs (tránh rác từ giá trị ngoài lề).
 */
export function serializeThuocTinh(
  specs: FieldSpec[],
  values: FormValues,
): Record<string, JsonValue> {
  const out: Record<string, JsonValue> = {};
  for (const s of specs) {
    const raw = values[s.field_key];
    if (isEmpty(raw)) continue; // rỗng → không ghi (bắt buộc đã chặn ở validate)
    const val = String(raw).trim();
    if (s.kieu === "number") {
      const n = Number(val);
      out[s.field_key] = Number.isFinite(n) ? n : val;
    } else {
      out[s.field_key] = val;
    }
  }
  return out;
}
