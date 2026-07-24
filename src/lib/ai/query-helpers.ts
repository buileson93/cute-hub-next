/**
 * Bộ dựng SQL an toàn dùng chung cho AI chat + MCP.
 * Mọi truy vấn cuối cùng chạy qua RPC `ai_run_select` (SECURITY INVOKER, chỉ đọc,
 * chặn từ khoá nguy hiểm, giới hạn số dòng) nên RLS theo quyền user luôn được áp dụng.
 *
 * Các helper ở đây chỉ tạo chuỗi SQL SELECT hợp lệ và kiểm tra tên định danh.
 */
import { getKnownTableNames } from "./data-dictionary";
import { DEFAULT_NGAY_SAP_HET_HAN } from "@/lib/mirats/han-canh-bao";


/** Tên bảng/cột hợp lệ: bắt đầu bằng chữ thường/_ , chỉ gồm [a-z0-9_]. */
const IDENT_RE = /^[a-z_][a-z0-9_]*$/;

export function ident(name: string): string {
  if (!IDENT_RE.test(name)) throw new Error(`Tên định danh không hợp lệ: ${name}`);
  return `"${name}"`;
}

/** Escape giá trị thành literal an toàn (nhân đôi dấu nháy đơn). */
export function lit(v: string | number | boolean): string {
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  return `'${String(v).replace(/'/g, "''")}'`;
}

export type FilterOp =
  | "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "is_null" | "not_null";

export type Filter = { column: string; op: FilterOp; value?: string };

const OPS: Record<string, string> = {
  eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=", like: "ILIKE",
};

function whereClause(filters?: Filter[]): string {
  if (!filters?.length) return "";
  const parts = filters.map((f) => {
    const col = ident(f.column);
    if (f.op === "is_null") return `${col} IS NULL`;
    if (f.op === "not_null") return `${col} IS NOT NULL`;
    const sym = OPS[f.op];
    if (!sym) throw new Error(`Toán tử không hợp lệ: ${f.op}`);
    const val = f.value ?? "";
    if (f.op === "like") return `${col} ILIKE ${lit(`%${val}%`)}`;
    return `${col} ${sym} ${lit(val)}`;
  });
  return ` WHERE ${parts.join(" AND ")}`;
}

export type ListOpts = {
  columns?: string[] | null;
  filters?: Filter[] | null;
  order_by?: string | null;
  ascending?: boolean | null;
  limit?: number | null;
};

export function buildListSql(table: string, opts: ListOpts = {}): string {
  const cols = opts.columns?.length ? opts.columns.map(ident).join(", ") : "*";
  let sql = `SELECT ${cols} FROM public.${ident(table)}`;
  sql += whereClause(opts.filters ?? undefined);
  if (opts.order_by) sql += ` ORDER BY ${ident(opts.order_by)} ${opts.ascending ? "ASC" : "DESC"}`;
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 500);
  sql += ` LIMIT ${limit}`;
  return sql;
}

export function buildGetRowSql(table: string, idColumn: string, idValue: string): string {
  return `SELECT * FROM public.${ident(table)} WHERE ${ident(idColumn)} = ${lit(idValue)} LIMIT 1`;
}

export function buildCountSql(table: string, groupBy?: string | null, filters?: Filter[] | null): string {
  if (groupBy) {
    const col = ident(groupBy);
    return `SELECT ${col} AS nhom, count(*)::int AS so_luong FROM public.${ident(table)}` +
      whereClause(filters ?? undefined) +
      ` GROUP BY ${col} ORDER BY so_luong DESC LIMIT 200`;
  }
  return `SELECT count(*)::int AS so_luong FROM public.${ident(table)}` + whereClause(filters ?? undefined);
}

/** Thống kê tổng quan toàn hệ thống (RLS áp dụng theo user). */
export function buildDashboardSql(): string {
  return `SELECT
    (SELECT count(*) FROM public.thiet_bi)::int AS thiet_bi,
    (SELECT count(*) FROM public.giay_phep)::int AS giay_phep,
    (SELECT count(*) FROM public.v_sap_het_han WHERE loai = 'giay_phep' AND so_ngay_con_lai BETWEEN 0 AND ${DEFAULT_NGAY_SAP_HET_HAN})::int AS giay_phep_sap_het_han,
    (SELECT count(*) FROM public.form_submission)::int AS bieu_mau,
    (SELECT count(*) FROM public.form_submission WHERE status = 'submitted')::int AS bieu_mau_cho_duyet,
    (SELECT count(*) FROM public.tickets)::int AS tickets,
    (SELECT count(*) FROM public.tickets WHERE trang_thai <> 'closed')::int AS tickets_mo,
    (SELECT count(*) FROM public.du_an)::int AS du_an,
    (SELECT count(*) FROM public.so_do_he_thong)::int AS so_do`;
}

/**
 * Danh sách bảng nghiệp vụ được phép liệt kê/thống kê bằng tool generic.
 * Sinh trực tiếp từ TỪ ĐIỂN DỮ LIỆU (nguồn sự thật duy nhất) để không bao giờ lệch.
 */
export const KNOWN_TABLES = getKnownTableNames() as unknown as readonly [
  string,
  ...string[],
];
