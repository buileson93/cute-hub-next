// ============================================================================
// Registry trường dữ liệu mở rộng cho lớp Tài sản (bảng he_thong_truong).
//
// Đây là "single source of truth" cho việc PARSE một bản ghi cấu hình trường
// (từ CSDL) thành FieldSpec dùng ở UI. Giữ nguyên FieldKind hiện có, chỉ mở
// rộng thêm các thuộc tính: bat_buoc, rang_buoc (regex/min/max), mac_dinh
// (jsonb), help_text, nhom_field.
// ============================================================================

import type { FieldKind } from "@/lib/mirats/cay-reorg";

export type { FieldKind };

/** Danh sách FieldKind hợp lệ — giữ nguyên đúng các kiểu đang dùng. */
export const FIELD_KINDS = ["text", "number", "date", "select", "textarea", "reference"] as const;

export function isValidFieldKind(v: unknown): v is FieldKind {
  return typeof v === "string" && (FIELD_KINDS as readonly string[]).includes(v);
}

/** Ràng buộc giá trị: biểu thức chính quy + min/max + nguồn liên kết CSDL. */
export interface FieldRule {
  regex?: string;
  min?: number;
  max?: number;
  /** Với kieu="reference": khoá bảng danh mục nguồn (VD "dm_don_vi"). */
  ref?: string;
}

/** Giá trị mặc định là JSON tuỳ ý (string | number | boolean | null | object | array). */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** Mô tả đầy đủ một trường dữ liệu tuỳ chỉnh. */
export interface FieldSpec {
  field_key: string;
  nhan: string;
  kieu: FieldKind;
  tuy_chon: string[];
  thu_tu: number;
  bat_buoc: boolean;
  rang_buoc: FieldRule;
  mac_dinh: JsonValue | null;
  help_text: string | null;
  nhom_field: string | null;
}

/* ------------------------------ Helpers ------------------------------ */

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function toStr(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function toNullableStr(v: unknown): string | null {
  if (v == null) return null;
  const s = typeof v === "string" ? v : String(v);
  return s.length ? s : null;
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === "string" ? x : String(x))).filter((s) => s.length > 0);
}

function toNumberOrUndef(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Parse cột jsonb `rang_buoc` → FieldRule an toàn (loại giá trị không hợp lệ). */
export function parseFieldRule(v: unknown): FieldRule {
  const obj = asRecord(v);
  const rule: FieldRule = {};
  const regex = obj.regex;
  if (typeof regex === "string" && regex.length > 0) rule.regex = regex;
  const min = toNumberOrUndef(obj.min);
  if (min !== undefined) rule.min = min;
  const max = toNumberOrUndef(obj.max);
  if (max !== undefined) rule.max = max;
  const ref = obj.ref;
  if (typeof ref === "string" && ref.length > 0) rule.ref = ref;
  return rule;
}

/** Parse một bản ghi he_thong_truong (dạng thô) thành FieldSpec. */
export function parseFieldSpec(raw: unknown): FieldSpec {
  const r = asRecord(raw);
  const kieuRaw = r.kieu;
  return {
    field_key: toStr(r.field_key),
    nhan: toStr(r.nhan),
    kieu: isValidFieldKind(kieuRaw) ? kieuRaw : "text",
    tuy_chon: toStringArray(r.tuy_chon),
    thu_tu: typeof r.thu_tu === "number" ? r.thu_tu : Number(r.thu_tu ?? 0) || 0,
    bat_buoc: r.bat_buoc === true,
    rang_buoc: parseFieldRule(r.rang_buoc),
    mac_dinh: r.mac_dinh === undefined ? null : (r.mac_dinh as JsonValue | null),
    help_text: toNullableStr(r.help_text),
    nhom_field: toNullableStr(r.nhom_field),
  };
}

/** Parse một mảng bản ghi; bỏ dòng thiếu field_key và sắp theo thu_tu. */
export function parseFieldSpecs(rows: unknown): FieldSpec[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map(parseFieldSpec)
    .filter((s) => s.field_key.length > 0)
    .sort((a, b) => a.thu_tu - b.thu_tu);
}

/* ---------------------- Mô tả field động cho AI ---------------------- */

/** Thông tin rút gọn của một field động, kèm biểu thức truy vấn JSONB. */
export interface DynamicFieldInfo {
  field_key: string;
  nhan: string;
  kieu: FieldKind;
  bat_buoc: boolean;
  /** Cách lấy giá trị từ cột JSONB, ví dụ: thuoc_tinh->>'tan_so'. */
  truy_van: string;
}

/** Khối mô tả field động của lớp tài sản dùng cho tool describe_schema. */
export interface DynamicFieldsSchema {
  /** Bảng chứa cột JSONB. */
  bang: string;
  /** Tên cột JSONB lưu giá trị field động. */
  cot_jsonb: string;
  /** Ghi chú tiếng Việt giải thích cho AI. */
  ghi_chu: string;
  /** Mẫu câu truy vấn tổng quát. */
  mau_truy_van: string;
  /** Số field động đang bật. */
  so_luong: number;
  fields: DynamicFieldInfo[];
}

const DYNAMIC_TABLE = "thiet_bi";
const DYNAMIC_JSONB_COL = "thuoc_tinh";

/**
 * Chuyển các bản ghi he_thong_truong (đã lọc hoạt động) thành mô tả field động
 * cho AI: nhãn tiếng Việt, kiểu, bắt buộc, và cách truy vấn giá trị trong cột
 * JSONB `thuoc_tinh` (thuoc_tinh->>'key'). Giá trị KHÔNG nằm ở cột vật lý.
 */
export function describeDynamicFields(rows: unknown): DynamicFieldsSchema {
  const specs = parseFieldSpecs(rows);
  return {
    bang: DYNAMIC_TABLE,
    cot_jsonb: DYNAMIC_JSONB_COL,
    ghi_chu:
      `Đây là các trường khai thêm (động) theo hệ thống. Giá trị KHÔNG nằm ở ` +
      `cột vật lý mà lưu trong cột JSONB ${DYNAMIC_TABLE}.${DYNAMIC_JSONB_COL}. ` +
      `Truy vấn bằng ${DYNAMIC_JSONB_COL}->>'field_key' (trả text) và ép kiểu khi cần, ` +
      `ví dụ (${DYNAMIC_JSONB_COL}->>'cong_suat')::numeric.`,
    mau_truy_van: `SELECT ${DYNAMIC_JSONB_COL}->>'field_key' FROM public.${DYNAMIC_TABLE}`,
    so_luong: specs.length,
    fields: specs.map((s) => ({
      field_key: s.field_key,
      nhan: s.nhan,
      kieu: s.kieu,
      bat_buoc: s.bat_buoc,
      truy_van: `${DYNAMIC_JSONB_COL}->>'${s.field_key}'`,
    })),
  };
}
