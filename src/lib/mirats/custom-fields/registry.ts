/**
 * Task 45 — Custom Fields registry.
 *
 * Cho phép thêm trường nghiệp vụ MỚI mà không cần migration cột:
 *  - `dinh_nghia_truong` (DB) lưu metadata trường (key, nhãn, loại, ...).
 *  - Mỗi bảng thực thể có cột JSONB `attrs` chứa giá trị theo key.
 *  - Frontend đọc metadata → render form + validate động; đọc `attrs` để hiển thị.
 *
 * File này thuần logic (không gọi network) — dễ test.
 */

export type LoaiTruong = "text" | "so" | "ngay" | "chon" | "checkbox";

export interface DinhNghiaTruong {
  key: string;              // slug định danh — /^[a-z][a-z0-9_]*$/
  nhan: string;             // label hiển thị
  loai: LoaiTruong;
  batBuoc?: boolean;
  luaChon?: string[];       // dùng khi loai = "chon"
  apDungCho: string;        // entity: "thiet_bi" | "he_thong" | ...
  moTa?: string;
  min?: number;             // cho loai = "so"
  max?: number;
}

export interface ValidateResult {
  hopLe: boolean;
  loi: string[];
}

const KEY_RE = /^[a-z][a-z0-9_]*$/;
const NGAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isMissing(v: unknown): boolean {
  return v === undefined || v === null || v === "";
}

/**
 * Validate `attrs` theo tập định nghĩa trường.
 * - Thiếu trường bắt buộc → lỗi.
 * - Sai kiểu → lỗi.
 * - Giá trị ngoài `luaChon` → lỗi.
 * - Trường ngoài định nghĩa → lỗi (ngăn ô nhiễm dữ liệu).
 */
export function validateAttrs(
  defs: DinhNghiaTruong[],
  attrs: Record<string, unknown>
): ValidateResult {
  const loi: string[] = [];
  const byKey = new Map(defs.map((d) => [d.key, d]));

  for (const d of defs) {
    if (!KEY_RE.test(d.key)) {
      loi.push(`Khoá không hợp lệ: ${d.key}`);
      continue;
    }
    const v = attrs[d.key];
    if (isMissing(v)) {
      if (d.batBuoc) loi.push(`Thiếu trường bắt buộc: ${d.nhan}`);
      continue;
    }
    switch (d.loai) {
      case "text":
        if (typeof v !== "string") loi.push(`${d.nhan}: phải là chuỗi`);
        break;
      case "so":
        if (typeof v !== "number" || Number.isNaN(v)) {
          loi.push(`${d.nhan}: phải là số`);
        } else {
          if (d.min != null && v < d.min) loi.push(`${d.nhan}: nhỏ hơn ${d.min}`);
          if (d.max != null && v > d.max) loi.push(`${d.nhan}: lớn hơn ${d.max}`);
        }
        break;
      case "ngay":
        if (typeof v !== "string" || !NGAY_RE.test(v)) {
          loi.push(`${d.nhan}: phải là ngày YYYY-MM-DD`);
        }
        break;
      case "checkbox":
        if (typeof v !== "boolean") loi.push(`${d.nhan}: phải là true/false`);
        break;
      case "chon":
        if (typeof v !== "string") {
          loi.push(`${d.nhan}: phải là chuỗi`);
        } else if (!d.luaChon || !d.luaChon.includes(v)) {
          loi.push(`${d.nhan}: giá trị "${v}" không nằm trong danh sách cho phép`);
        }
        break;
    }
  }

  for (const k of Object.keys(attrs)) {
    if (!byKey.has(k)) loi.push(`Trường lạ không nằm trong định nghĩa: ${k}`);
  }

  return { hopLe: loi.length === 0, loi };
}

/** Chuẩn hoá giá trị hiển thị (dùng cho DetailDrawer / bảng). */
export function renderAttrs(
  defs: DinhNghiaTruong[],
  attrs: Record<string, unknown>
): { key: string; nhan: string; giaTri: string }[] {
  return defs.map((d) => {
    const v = attrs[d.key];
    let giaTri = "";
    if (isMissing(v)) giaTri = "—";
    else if (d.loai === "checkbox") giaTri = v ? "Có" : "Không";
    else giaTri = String(v);
    return { key: d.key, nhan: d.nhan, giaTri };
  });
}

/** Lọc định nghĩa theo entity. */
export function locTheoEntity(
  defs: DinhNghiaTruong[],
  entity: string
): DinhNghiaTruong[] {
  return defs.filter((d) => d.apDungCho === entity);
}
