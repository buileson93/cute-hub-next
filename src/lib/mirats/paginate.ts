/**
 * Nạp trọn một truy vấn Supabase bằng `.range()` để vượt qua giới hạn 1000
 * dòng mặc định của PostgREST. Truyền vào một hàm build nhận `(from, to)` và
 * trả về builder đã áp `.range(from, to)`.
 *
 * Dùng cho các truy vấn có khả năng vượt 1000 dòng (thiet_bi, gan_chuc_nang,
 * he_thong_thanh_phan…).
 */
export async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 1000,
): Promise<T[]> {
  const out: T[] = [];
  let from = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await build(from, to);
    if (error) throw error;
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return out;
}
