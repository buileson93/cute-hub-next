/**
 * Chuẩn hoá truy vấn tìm kiếm cho `tim_kiem_toan_cuc` (Task 46).
 *
 * - Bỏ dấu tiếng Việt (NFD + strip combining marks + đ→d)
 * - Chỉ giữ [a-z0-9\s], loại ký tự nguy hiểm ('", ;, --, %, \, ...)
 * - Tokenize theo khoảng trắng, ghép prefix tsquery: `word1:* & word2:*`
 * - Đầu vào rỗng/toàn ký tự lạ → trả '' (RPC coi là "không có truy vấn")
 */
export function boDauTiengViet(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/** Chuẩn hoá thành chuỗi an toàn (lowercase, không dấu, chỉ chữ-số-space). */
export function chuanHoaTho(q: string): string {
  return boDauTiengViet(String(q ?? ""))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Trả về chuỗi tsquery prefix an toàn cho `to_tsquery('simple', ...)`.
 * Ví dụ:
 *   'sự cố'  → 'su:* & co:*'
 *   'thie'   → 'thie:*'
 *   "'; DROP TABLE --" → ''
 */
export function chuanHoaTruyVan(q: string): string {
  const cleaned = chuanHoaTho(q);
  if (!cleaned) return "";
  const tokens = cleaned.split(" ").filter((t) => t.length > 0);
  if (tokens.length === 0) return "";
  return tokens.map((t) => `${t}:*`).join(" & ");
}
