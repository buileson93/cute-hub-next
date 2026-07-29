// ============================================================================
// Nền tảng phân trang phía server (GĐ 1 — hiệu năng dữ liệu lớn).
//
// Dùng cho các bảng có khả năng vượt vài nghìn dòng: thay vì tải toàn bộ về
// client rồi lọc/sắp xếp, ta gửi `range/order/filter/search` xuống Postgres
// và chỉ nhận đúng trang đang xem + số tổng.
//
// Cách dùng:
//
//   const { data } = usePagedQuery({
//     key: ["thiet-bi", { page, pageSize, filters, sort, q }],
//     table: "thiet_bi",
//     select: "id, ma_thiet_bi, ten_thiet_bi, trang_thai_id",
//     page, pageSize,
//     filters: [{ column: "trang_thai_id", op: "eq", value: statusId }],
//     sort: { column: "created_at", ascending: false },
//     search: q ? { column: "search_tsv", tsquery: q } : undefined,
//   });
//   // data.rows: trang hiện tại; data.total: tổng dòng (planned count)
// ============================================================================
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";

export type FilterOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "ilike" | "is_null" | "not_null";
export interface Filter {
  column: string;
  op: FilterOp;
  value?: string | number | boolean | null | Array<string | number>;
}
export interface Sort { column: string; ascending?: boolean }
export interface TsSearch { column: string; tsquery: string }

export interface PagedResult<T> { rows: T[]; total: number }

export interface PagedQueryOpts<T> {
  key: readonly unknown[];
  table: string;
  /** Chuỗi SELECT (chỉ định `sel(...)` bên ngoài nếu muốn giữ typecheck nhanh). */
  select: string;
  page: number;
  pageSize: number;
  filters?: Filter[];
  sort?: Sort | Sort[];
  /** Tìm kiếm full-text: dùng cột tsvector (vd `search_tsv` trên `thiet_bi`). */
  search?: TsSearch;
  /** `planned` nhanh + đủ dùng cho phân trang UI; `exact` khi cần chính xác. */
  countMode?: "planned" | "exact";
  enabled?: boolean;
  staleTime?: number;
}

/** Áp mảng filter vào builder Supabase (giữ nguyên `.range()` phía trên). */
function applyFilters<B extends { eq: unknown }>(qb: B, filters: Filter[]): B {
  // Ép kiểu vì kiểu builder của supabase-js rất tổng quát — filter column name
  // vẫn được typecheck ở nơi gọi vì `Filter.column` là string thuần.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = qb;
  for (const f of filters) {
    switch (f.op) {
      case "eq": q = q.eq(f.column, f.value); break;
      case "neq": q = q.neq(f.column, f.value); break;
      case "gt": q = q.gt(f.column, f.value); break;
      case "gte": q = q.gte(f.column, f.value); break;
      case "lt": q = q.lt(f.column, f.value); break;
      case "lte": q = q.lte(f.column, f.value); break;
      case "in": q = q.in(f.column, (f.value ?? []) as Array<string | number>); break;
      case "ilike": q = q.ilike(f.column, `%${f.value ?? ""}%`); break;
      case "is_null": q = q.is(f.column, null); break;
      case "not_null": q = q.not(f.column, "is", null); break;
    }
  }
  return q as B;
}

/**
 * Gửi mọi thao tác (filter/sort/search/pagination) xuống Postgres.
 * Trả về đúng 1 trang + tổng số dòng để render UI phân trang.
 */
export function usePagedQuery<T>(opts: PagedQueryOpts<T>) {
  const { key, table, select, page, pageSize, filters = [], sort, search,
    countMode = "planned", enabled = true, staleTime = 10_000 } = opts;

  return useQuery({
    queryKey: key,
    enabled,
    staleTime,
    queryFn: async (): Promise<PagedResult<T>> => {
      // Cast `select` xuống string để supabase-js không parse cả literal khổng
      // lồ ở type level (xem query-builder-type-performance).
      const sel: string = select;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = supabase.from(table as never).select(sel, { count: countMode });
      q = applyFilters(q, filters);
      if (search && search.tsquery.trim()) {
        // websearch_to_tsquery an toàn với input người dùng.
        q = q.textSearch(search.column, search.tsquery, { type: "websearch", config: "simple" });
      }
      const sorts = Array.isArray(sort) ? sort : sort ? [sort] : [];
      for (const s of sorts) q = q.order(s.column, { ascending: s.ascending ?? true });
      const from = page * pageSize;
      const to = from + pageSize - 1;
      q = q.range(from, to);
      const { data, count, error } = (await q) as { data: T[] | null; count: number | null; error: unknown };
      if (error) throw error;
      return { rows: (data ?? []) as T[], total: count ?? 0 };
    },
  });
}

/** Chuỗi SELECT an toàn với typecheck (tránh literal parse hàng-triệu-lần). */
export const sel = (s: string): string => s;
