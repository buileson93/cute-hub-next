// Extract fetchPage cho `/danh-muc/dac-tinh` để test tích hợp không cần DB thật.
// Không còn phân nhóm — chỉ còn tìm/sort/paginate.

export interface DacTinhPageRow {
  id: string;
  ma: string;
  ten: string;
  mo_ta: string | null;
  thu_tu: number | null;
  mau?: string | null;
}

export interface DacTinhPageParams {
  trang: number;
  kichThuoc: number;
  q: string;
  sortField: string;
  sortDir: "asc" | "desc";
}

/** Chặn %/_/, trong .ilike() để tránh vỡ pattern. */
export function escapeIlike(s: string) { return s.replace(/[%_,]/g, ""); }

/** Chain-like giao diện tối thiểu (khớp Supabase PostgREST — thenable). */
export interface DacTinhQueryBuilder extends PromiseLike<{ data: DacTinhPageRow[] | null; error: unknown; count: number | null }> {
  range(from: number, to: number): DacTinhQueryBuilder;
  or(filter: string): DacTinhQueryBuilder;
  order(column: string, opts?: { ascending?: boolean; nullsFirst?: boolean }): DacTinhQueryBuilder;
}
export interface DacTinhClient {
  from(table: "dm_dac_tinh"): {
    select(cols: string, opts?: { count?: "exact" }): DacTinhQueryBuilder;
  };
}

/**
 * Thực thi truy vấn 1 trang. Filter tìm kiếm + sort + phân trang ở server.
 * sortField ∈ {ma,ten,thu_tu}; khác → default (thu_tu asc, ma asc).
 * Luôn kèm .order("ma", asc) làm tie-breaker để ổn định.
 */
export async function fetchDacTinhPage(
  client: DacTinhClient,
  { trang, kichThuoc, q, sortField, sortDir }: DacTinhPageParams,
): Promise<{ rows: DacTinhPageRow[]; tong: number }> {
  const from = (trang - 1) * kichThuoc;
  const to = from + kichThuoc - 1;
  let q1 = client
    .from("dm_dac_tinh")
    .select("id, ma, ten, mo_ta, thu_tu, mau", { count: "exact" })
    .range(from, to);

  const kw = escapeIlike(q.trim());
  if (kw) q1 = q1.or(`ma.ilike.%${kw}%,ten.ilike.%${kw}%,mo_ta.ilike.%${kw}%`);

  const asc = sortDir === "asc";
  if (sortField === "ma" || sortField === "ten") {
    q1 = q1.order(sortField, { ascending: asc });
  } else if (sortField === "thu_tu") {
    q1 = q1.order("thu_tu", { ascending: asc, nullsFirst: false });
  } else {
    q1 = q1.order("thu_tu", { ascending: true, nullsFirst: false });
  }
  q1 = q1.order("ma", { ascending: true });

  const { data, error, count } = await q1;
  if (error) throw error;
  return { rows: data ?? [], tong: count ?? 0 };
}

