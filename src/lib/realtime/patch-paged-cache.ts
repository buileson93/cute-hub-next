// ============================================================================
// GĐ 5 — Patch cache thay cho invalidate toàn bộ.
//
// Khi có realtime event (INSERT/UPDATE/DELETE) trên một bảng, thay vì
// invalidate → refetch cả trang, ta cập nhật đúng dòng trong `PagedResult`
// của trang đang xem trong React Query cache.
//
// Nếu payload không đủ thông tin (ví dụ thiếu cột join), fallback về
// `invalidateQueries` để đảm bảo dữ liệu vẫn đúng.
// ============================================================================
import type { QueryClient, Query } from "@tanstack/react-query";
import type { PagedResult } from "@/lib/mirats/paged";

export type RtEvent = "INSERT" | "UPDATE" | "DELETE";

interface RowLike {
  id?: string | number;
  [k: string]: unknown;
}

interface PagedShape {
  rows: RowLike[];
  total: number;
}

function isPagedShape(v: unknown): v is PagedShape {
  return (
    !!v &&
    typeof v === "object" &&
    Array.isArray((v as { rows?: unknown }).rows) &&
    typeof (v as { total?: unknown }).total === "number"
  );
}

/**
 * Patch tất cả PagedResult trong cache có `queryKey[0]` khớp `keyPrefix`.
 * - INSERT: chỉ tăng `total` (không chèn vào trang hiện tại để tránh phá sort/filter).
 * - UPDATE: replace dòng cùng `pk` trong `rows` nếu có mặt.
 * - DELETE: bỏ dòng cùng `pk` khỏi `rows`, giảm `total`.
 *
 * Trả về `true` nếu đã patch ít nhất 1 query (đủ đúng cho phần lớn UI list).
 * Trả về `false` khi không tìm thấy query nào — caller có thể fallback invalidate.
 */
export function patchPagedCache(
  qc: QueryClient,
  keyPrefix: string,
  event: RtEvent,
  newRow: RowLike | null,
  oldRow: RowLike | null,
  pk: string = "id",
): boolean {
  const queries: Query[] = qc.getQueryCache().findAll({ queryKey: [keyPrefix] });
  if (queries.length === 0) return false;

  let touched = 0;
  for (const q of queries) {
    const data = q.state.data as PagedResult<RowLike> | undefined;
    if (!isPagedShape(data)) continue;

    const id = (newRow?.[pk] ?? oldRow?.[pk]) as string | number | undefined;
    if (id === undefined) continue;

    if (event === "INSERT") {
      qc.setQueryData<PagedShape>(q.queryKey, {
        rows: data.rows,
        total: data.total + 1,
      });
      touched++;
    } else if (event === "UPDATE") {
      const idx = data.rows.findIndex((r) => r[pk] === id);
      if (idx === -1) continue;
      const next = data.rows.slice();
      next[idx] = { ...next[idx], ...(newRow ?? {}) };
      qc.setQueryData<PagedShape>(q.queryKey, { rows: next, total: data.total });
      touched++;
    } else {
      // DELETE
      const idx = data.rows.findIndex((r) => r[pk] === id);
      if (idx === -1) {
        // Không nằm trong trang hiện tại — chỉ giảm total.
        qc.setQueryData<PagedShape>(q.queryKey, {
          rows: data.rows,
          total: Math.max(0, data.total - 1),
        });
      } else {
        const next = data.rows.slice();
        next.splice(idx, 1);
        qc.setQueryData<PagedShape>(q.queryKey, {
          rows: next,
          total: Math.max(0, data.total - 1),
        });
      }
      touched++;
    }
  }
  return touched > 0;
}

/**
 * Bảng → danh sách key prefix của các PagedResult liên quan.
 * Chỉ liệt kê những chỗ đã dùng `usePagedQuery`. Khi thêm bảng paged mới,
 * bổ sung tại đây để realtime patch thay vì invalidate.
 */
export const PAGED_TABLE_TO_KEYS: Record<string, string[]> = {
  thiet_bi: ["paged-thiet-bi"],
  su_co: ["paged-su-co"],
  bao_tri: ["paged-bao-tri"],
  hong_hoc: ["paged-hong-hoc"],
  ban_giao: ["paged-ban-giao"],
};
