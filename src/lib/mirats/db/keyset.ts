/**
 * Task 44 — Keyset pagination cho danh sách lớn.
 *
 * Nguyên tắc:
 *  - Không dùng OFFSET (chậm khi bảng lớn).
 *  - Sắp theo (sortField, id) — id là tie-breaker ổn định.
 *  - Cursor mã hoá value cuối và id cuối của trang trước.
 *
 * PostgREST-friendly: dùng cho query builder Supabase (hoặc SQL thô).
 * File này thuần logic — không gọi network, dễ test.
 */

export interface KeysetCursor {
  sortField: string;
  lastValue: string | number | null;
  lastId: string | null;
}

export interface KeysetQueryConfig {
  bang: string;
  cot: string[];
  sortField: string;
  dir: "asc" | "desc";
  cursor?: KeysetCursor;
  kichThuoc: number;
}

export interface KeysetQueryResult {
  sql: string;
  params: unknown[];
}

/**
 * Build câu SQL keyset thuần.
 * ORDER BY (sortField dir, id dir) và WHERE (sortField, id) </ > cursor.
 */
export function buildKeysetQuery(cfg: KeysetQueryConfig): KeysetQueryResult {
  if (cfg.kichThuoc <= 0 || cfg.kichThuoc > 500) {
    throw new Error("kichThuoc phải trong khoảng 1..500");
  }
  if (!cfg.cot.length) throw new Error("Phải chỉ định cột cần select");
  if (!isSafeIdent(cfg.bang)) throw new Error(`Tên bảng không hợp lệ: ${cfg.bang}`);
  if (!isSafeIdent(cfg.sortField)) {
    throw new Error(`Cột sort không hợp lệ: ${cfg.sortField}`);
  }
  for (const c of cfg.cot) {
    if (!isSafeIdent(c)) throw new Error(`Cột không hợp lệ: ${c}`);
  }

  // luôn kèm id để cursor ổn định
  const cols = cfg.cot.includes("id") ? cfg.cot : [...cfg.cot, "id"];
  const orderOp = cfg.dir === "asc" ? ">" : "<";
  const orderDir = cfg.dir === "asc" ? "ASC" : "DESC";

  const params: unknown[] = [];
  let where = "";
  if (cfg.cursor && cfg.cursor.lastId != null) {
    // (sortField, id) > (lastValue, lastId)
    // Nếu lastValue null → so sánh chỉ theo id (cho phép field null)
    if (cfg.cursor.lastValue === null) {
      where = ` WHERE ${cfg.sortField} IS NULL AND id ${orderOp} $1`;
      params.push(cfg.cursor.lastId);
    } else {
      where = ` WHERE (${cfg.sortField}, id) ${orderOp} ($1, $2)`;
      params.push(cfg.cursor.lastValue, cfg.cursor.lastId);
    }
  }

  const sql =
    `SELECT ${cols.join(", ")} FROM ${cfg.bang}` +
    where +
    ` ORDER BY ${cfg.sortField} ${orderDir}, id ${orderDir}` +
    ` LIMIT ${cfg.kichThuoc}`;

  return { sql, params };
}

/** Sinh cursor tiếp theo từ hàng cuối của trang hiện tại. */
export function nextCursor<T extends Record<string, unknown>>(
  rows: T[],
  sortField: string,
): KeysetCursor | null {
  if (!rows.length) return null;
  const last = rows[rows.length - 1];
  const lastValue = last[sortField] as string | number | null | undefined;
  const lastId = last["id"] as string | null | undefined;
  if (lastId == null) return null;
  return {
    sortField,
    lastValue: lastValue == null ? null : (lastValue as string | number),
    lastId,
  };
}

/** Mã hoá cursor sang base64 để truyền qua URL. */
export function encodeCursor(c: KeysetCursor): string {
  const json = JSON.stringify(c);
  if (typeof btoa === "function") return btoa(unescape(encodeURIComponent(json)));
  return Buffer.from(json, "utf8").toString("base64");
}

export function decodeCursor(s: string): KeysetCursor | null {
  try {
    const json =
      typeof atob === "function"
        ? decodeURIComponent(escape(atob(s)))
        : Buffer.from(s, "base64").toString("utf8");
    const v = JSON.parse(json) as KeysetCursor;
    if (typeof v.sortField !== "string") return null;
    return v;
  } catch {
    return null;
  }
}

const IDENT_RE = /^[a-z_][a-z0-9_]*$/i;
function isSafeIdent(s: string): boolean {
  return IDENT_RE.test(s);
}
