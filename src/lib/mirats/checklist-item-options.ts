// ============================================================================
// checklist-item-options.ts — Chuẩn hoá "tuỳ chọn nâng cao" cho form_check_item
// mà KHÔNG cần đổi schema DB. Toàn bộ được nhét vào cột `tuy_chon` (JSONB).
//
// Mục tiêu (Bước 1 kế hoạch chuẩn hoá phiếu bảo dưỡng):
//   • Tách "Hạng mục" và "Nội dung chi tiết" như bảng Word (2 cột riêng).
//   • Ngưỡng đo dạng min/max (VD điện trở tiếp địa < 4 Ohm) — tự chấm Đạt.
//   • Bắt buộc mô tả khắc phục khi K.Đạt (đã default true).
//   • Nhóm cha (A/B) để render subheader gộp trong bảng.
//
// Tương thích ngược: nếu `tuy_chon` là mảng chuỗi (kiểu cũ dùng cho "chọn"),
// helpers bên dưới trả về giá trị mặc định và giữ nguyên mảng chuỗi trong
// trường `choices`.
// ============================================================================

export type ChecklistItemOptions = {
  /** Nhóm cha (A/B/…) — hiển thị subheader gộp cả hàng trong bảng checklist. */
  nhom_lon: string | null;
  /** Cột "Hạng mục" (tiêu đề ngắn) trong bảng Word. Fallback = `item.ten`. */
  hang_muc: string | null;
  /** Cột "Nội dung chi tiết" (mô tả dài) — khác với `huong_dan` nội bộ. */
  noi_dung_chi_tiet: string | null;
  /** Ngưỡng số tối thiểu (>=). null = không xét. */
  tieu_chuan_min: number | null;
  /** Ngưỡng số tối đa (<=). null = không xét. */
  tieu_chuan_max: number | null;
  /** Bắt buộc điền "Hành động khắc phục" khi kết luận K.Đạt (mặc định TRUE). */
  require_note_when_fail: boolean;
  /** Danh sách lựa chọn (dành cho result_kind = "chon"). */
  choices: string[] | null;
};

export const DEFAULT_ITEM_OPTIONS: ChecklistItemOptions = {
  nhom_lon: null,
  hang_muc: null,
  noi_dung_chi_tiet: null,
  tieu_chuan_min: null,
  tieu_chuan_max: null,
  require_note_when_fail: true,
  choices: null,
};

function toNumOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function toStrOrNull(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/** Đọc tuỳ chọn từ giá trị JSON thô của cột `form_check_item.tuy_chon`. */
export function parseItemOptions(raw: unknown): ChecklistItemOptions {
  // Kiểu cũ: mảng chuỗi = danh sách lựa chọn.
  if (Array.isArray(raw)) {
    return { ...DEFAULT_ITEM_OPTIONS, choices: raw.map((x) => String(x)) };
  }
  if (!raw || typeof raw !== "object") return { ...DEFAULT_ITEM_OPTIONS };
  const o = raw as Record<string, unknown>;
  const choices = Array.isArray(o.choices) ? o.choices.map((x) => String(x)) : null;
  return {
    nhom_lon: toStrOrNull(o.nhom_lon),
    hang_muc: toStrOrNull(o.hang_muc),
    noi_dung_chi_tiet: toStrOrNull(o.noi_dung_chi_tiet),
    tieu_chuan_min: toNumOrNull(o.tieu_chuan_min),
    tieu_chuan_max: toNumOrNull(o.tieu_chuan_max),
    require_note_when_fail:
      typeof o.require_note_when_fail === "boolean" ? o.require_note_when_fail : true,
    choices,
  };
}

/** Ghi lại JSON gọn (bỏ các trường default) để không phồng DB. */
export function serializeItemOptions(opts: Partial<ChecklistItemOptions>): unknown {
  const out: Record<string, unknown> = {};
  if (opts.nhom_lon) out.nhom_lon = opts.nhom_lon;
  if (opts.hang_muc) out.hang_muc = opts.hang_muc;
  if (opts.noi_dung_chi_tiet) out.noi_dung_chi_tiet = opts.noi_dung_chi_tiet;
  if (typeof opts.tieu_chuan_min === "number") out.tieu_chuan_min = opts.tieu_chuan_min;
  if (typeof opts.tieu_chuan_max === "number") out.tieu_chuan_max = opts.tieu_chuan_max;
  // require_note_when_fail default TRUE — chỉ ghi khi tắt.
  if (opts.require_note_when_fail === false) out.require_note_when_fail = false;
  if (opts.choices && opts.choices.length > 0) out.choices = opts.choices;
  return Object.keys(out).length === 0 ? null : out;
}

/**
 * Tự chấm Đạt/K.Đạt cho hạng mục kiểu số theo ngưỡng min/max.
 *   • Cả min và max null → không xét (trả null, để người dùng tự chọn).
 *   • Giá trị null/NaN → null.
 *   • Trong khoảng → "dat", ngoài khoảng → "khong_dat".
 */
export function evaluateAutoResult(
  value: number | null,
  min: number | null,
  max: number | null,
): "dat" | "khong_dat" | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (min == null && max == null) return null;
  if (min != null && value < min) return "khong_dat";
  if (max != null && value > max) return "khong_dat";
  return "dat";
}

/** Hiển thị chuỗi ngưỡng gọn cho UI (VD "< 4", "≥ 5", "5–10", "= 3.3"). */
export function formatThreshold(
  min: number | null,
  max: number | null,
  unit: string | null,
): string | null {
  const u = unit ? ` ${unit}` : "";
  if (min == null && max == null) return null;
  if (min != null && max != null) {
    if (min === max) return `= ${min}${u}`;
    return `${min}–${max}${u}`;
  }
  if (min != null) return `≥ ${min}${u}`;
  if (max != null) return `≤ ${max}${u}`;
  return null;
}