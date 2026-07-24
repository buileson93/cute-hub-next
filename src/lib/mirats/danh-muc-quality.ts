// ============================================================================
// N1 — Chất lượng & Chống trùng Danh mục
// Spec: docs/superpowers/specs/n1-danh-muc-quality.md
//
// Module thuần: normalizeName + findNearDuplicates + validateRequired +
// MERGE_REF_MAP. Không phụ thuộc DB/network để dễ test và tái dùng.
// ============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Chuẩn hoá tên: bỏ dấu, đ→d, lowercase, gộp ký tự đặc biệt về khoảng trắng. */
export function normalizeName(input: unknown): string {
  const s = String(input ?? "");
  if (!s) return "";
  // NFD tách dấu, sau đó strip diacritic
  let out = s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  // đ/Đ không tách được qua NFD → thay tay
  out = out.replace(/đ/g, "d").replace(/Đ/g, "d");
  out = out.toLowerCase();
  out = out.replace(/[^a-z0-9]+/g, " ");
  out = out.replace(/\s+/g, " ").trim();
  return out;
}

/** Levenshtein distance (iterative, O(n*m) space O(min)). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (a.length < b.length) [a, b] = [b, a];
  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

export type NearDuplicateReason = "exact-normalized" | "contains" | "levenshtein";

export type NearDuplicateHit = {
  id: string;
  ten: string;
  score: number;
  reason: NearDuplicateReason;
};

export type NearDuplicateItem = {
  id: string;
  ten: string;
  active?: boolean;
  nha_san_xuat_id?: string | null;
};

export type FindNearDuplicatesOptions = {
  threshold?: number;
  limit?: number;
  includeInactive?: boolean;
  /** Scope: chỉ so trong cùng nha_san_xuat_id (áp dụng cho dm_model). */
  scopeNhaSanXuatId?: string | null;
};

/**
 * Tìm danh mục nghi trùng theo thứ tự: exact-normalized → contains → levenshtein.
 * Trả về top `limit` (mặc định 5), sắp xếp score giảm dần.
 */
export function findNearDuplicates(
  list: NearDuplicateItem[],
  name: string,
  opts: FindNearDuplicatesOptions = {},
): NearDuplicateHit[] {
  const threshold = opts.threshold ?? 0.86;
  const limit = opts.limit ?? 5;
  const includeInactive = opts.includeInactive ?? false;
  const scope = opts.scopeNhaSanXuatId;

  const target = normalizeName(name);
  if (!target) return [];

  const hits: NearDuplicateHit[] = [];
  for (const item of list) {
    if (!includeInactive && item.active === false) continue;
    if (scope !== undefined && scope !== null && item.nha_san_xuat_id !== scope) continue;
    const cand = normalizeName(item.ten);
    if (!cand) continue;

    if (cand === target) {
      hits.push({ id: item.id, ten: item.ten, score: 1, reason: "exact-normalized" });
      continue;
    }
    // contains (min length ≥ 4)
    const minLen = Math.min(cand.length, target.length);
    if (minLen >= 4 && (cand.includes(target) || target.includes(cand))) {
      hits.push({ id: item.id, ten: item.ten, score: 0.95, reason: "contains" });
      continue;
    }
    const dist = levenshtein(cand, target);
    const maxLen = Math.max(cand.length, target.length);
    if (maxLen === 0) continue;
    const sim = 1 - dist / maxLen;
    if (sim >= threshold && dist <= 3) {
      hits.push({ id: item.id, ten: item.ten, score: sim, reason: "levenshtein" });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

// ---------------------------------------------------------------------------
// validateRequired
// ---------------------------------------------------------------------------

export type FieldSchema = {
  required: boolean;
  label: string;
  type?: "string" | "uuid" | "number";
};

export type RequiredSchema = Record<string, FieldSchema>;

export type ValidateResult = {
  ok: boolean;
  missing: Array<{ field: string; label: string }>;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isEmpty(v: unknown, type?: FieldSchema["type"]): boolean {
  if (v === null || v === undefined) return true;
  if (type === "string" || type === undefined) {
    return String(v).trim() === "";
  }
  if (type === "uuid") {
    return typeof v !== "string" || !UUID_RE.test(v);
  }
  if (type === "number") {
    return typeof v !== "number" || Number.isNaN(v);
  }
  return false;
}

export function validateRequired(
  record: Record<string, unknown>,
  schema: RequiredSchema,
): ValidateResult {
  const missing: Array<{ field: string; label: string }> = [];
  for (const [field, def] of Object.entries(schema)) {
    if (!def.required) continue;
    if (isEmpty(record[field], def.type)) {
      missing.push({ field, label: def.label });
    }
  }
  return { ok: missing.length === 0, missing };
}

// ---------------------------------------------------------------------------
// REQUIRED_SCHEMAS theo bảng (spec §4)
// ---------------------------------------------------------------------------

export const REQUIRED_SCHEMAS: Record<string, RequiredSchema> = {
  dm_don_vi: {
    ma: { required: true, label: "Mã" },
    ten: { required: true, label: "Tên" },
  },
  dm_vi_tri: {
    ma: { required: true, label: "Mã" },
    ten: { required: true, label: "Tên" },
    don_vi_id: { required: true, label: "Đơn vị", type: "uuid" },
  },
  dm_loai_thiet_bi: {
    ma: { required: true, label: "Mã" },
    ten: { required: true, label: "Tên" },
  },
  dm_nha_san_xuat: {
    ten: { required: true, label: "Tên" },
  },
  dm_nha_cung_cap: {
    ten: { required: true, label: "Tên" },
  },
  dm_model: {
    ten: { required: true, label: "Tên" },
    nha_san_xuat_id: { required: true, label: "Nhà sản xuất", type: "uuid" },
    loai_thiet_bi_id: { required: true, label: "Loại thiết bị", type: "uuid" },
  },
  dm_nhom_he_thong: {
    ma: { required: true, label: "Mã" },
    ten: { required: true, label: "Tên" },
    don_vi_id: { required: true, label: "Đơn vị", type: "uuid" },
  },
  dm_he_thong: {
    ma: { required: true, label: "Mã" },
    ten: { required: true, label: "Tên" },
    nhom_he_thong_id: { required: true, label: "Nhóm hệ thống", type: "uuid" },
    don_vi_id: { required: true, label: "Đơn vị", type: "uuid" },
  },
  dm_phan_loai: {
    ma: { required: true, label: "Mã" },
    ten: { required: true, label: "Tên" },
  },
  dm_dac_tinh: {
    ma: { required: true, label: "Mã" },
    ten: { required: true, label: "Tên" },
  },
  dm_noi_cap: { ten: { required: true, label: "Tên" } },
  dm_loai_giay_phep: {
    ma: { required: true, label: "Mã" },
    ten: { required: true, label: "Tên" },
  },
  dm_loai_lien_ket: {
    ma: { required: true, label: "Mã" },
    ten: { required: true, label: "Tên" },
  },
  dm_trang_thai_thiet_bi: {
    ma: { required: true, label: "Mã" },
    ten: { required: true, label: "Tên" },
  },
  dm_danh_gia_nien_han: {
    ma: { required: true, label: "Mã" },
    ten: { required: true, label: "Tên" },
  },
  dm_to_chuc: { ten: { required: true, label: "Tên" } },
};

// ---------------------------------------------------------------------------
// MERGE_REF_MAP — bảng tham chiếu để redirect FK khi merge (spec §6)
// ---------------------------------------------------------------------------

export type MergeRef = { table: string; column: string };

export const MERGE_REF_MAP: Record<string, MergeRef[]> = {
  dm_don_vi: [
    { table: "dm_vi_tri", column: "don_vi_id" },
    { table: "dm_he_thong", column: "don_vi_id" },
    { table: "dm_nhom_he_thong", column: "don_vi_id" },
    { table: "nhan_vien", column: "don_vi_id" },
    { table: "user_scope", column: "don_vi_id" },
  ],
  dm_vi_tri: [
    { table: "thiet_bi", column: "vi_tri_id" },
    { table: "he_thong_thanh_phan", column: "vi_tri_id" },
  ],
  dm_loai_thiet_bi: [
    { table: "thiet_bi", column: "loai_thiet_bi_id" },
    { table: "dm_model", column: "loai_thiet_bi_id" },
  ],
  dm_nha_san_xuat: [
    { table: "dm_model", column: "nha_san_xuat_id" },
    { table: "thiet_bi", column: "nha_san_xuat_id" },
  ],
  dm_nha_cung_cap: [{ table: "thiet_bi", column: "nha_cung_cap_id" }],
  dm_model: [
    { table: "thiet_bi", column: "model_id" },
    { table: "dm_model_dac_tinh", column: "model_id" },
    { table: "model_tai_lieu", column: "model_id" },
  ],
  dm_nhom_he_thong: [{ table: "dm_he_thong", column: "nhom_he_thong_id" }],
  dm_he_thong: [
    { table: "he_thong_thanh_phan", column: "he_thong_id" },
    { table: "lien_ket_he_thong", column: "he_thong_a_id" },
    { table: "lien_ket_he_thong", column: "he_thong_b_id" },
    { table: "form_template_he_thong", column: "he_thong_id" },
  ],
  dm_phan_loai: [
    { table: "dm_he_thong", column: "phan_loai_id" },
    { table: "dm_nhom_he_thong", column: "phan_loai_id" },
    { table: "thiet_bi", column: "phan_loai_id" },
  ],
  dm_dac_tinh: [{ table: "dm_model_dac_tinh", column: "dac_tinh_id" }],
  dm_noi_cap: [],
  dm_loai_giay_phep: [{ table: "giay_phep", column: "loai_giay_phep_id" }],
  dm_loai_lien_ket: [
    { table: "lien_ket_he_thong", column: "loai_lien_ket_id" },
    { table: "lien_ket_khe", column: "loai_lien_ket_id" },
  ],
  dm_trang_thai_thiet_bi: [{ table: "thiet_bi", column: "trang_thai_id" }],
  dm_danh_gia_nien_han: [{ table: "thiet_bi", column: "danh_gia_nien_han_id" }],
  dm_to_chuc: [],
};

/** Danh mục whitelisted cho merge. */
export const MERGEABLE_ENTITIES = Object.keys(MERGE_REF_MAP);

export function isMergeableEntity(entity: string): boolean {
  return Object.prototype.hasOwnProperty.call(MERGE_REF_MAP, entity);
}
