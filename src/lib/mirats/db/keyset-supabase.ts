/**
 * Task 44 — Áp keyset pagination lên Supabase client.
 *
 * Wrapper mỏng để dùng cùng `buildKeysetQuery` cho các bảng lớn
 * mà không phải viết SQL thô — Supabase-js hỗ trợ `.or()` để mô phỏng
 * điều kiện `(sortField, id) > (lastValue, lastId)`.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { nextCursor, type KeysetCursor } from "./keyset";

export interface KeysetFetchConfig {
  bang: string;
  cot: string[];
  sortField: string;
  dir?: "asc" | "desc";
  cursor?: KeysetCursor | null;
  kichThuoc?: number;
  filters?: (query: any) => any;
  signal?: AbortSignal;
}

export interface KeysetPage<T> {
  rows: T[];
  cursor: KeysetCursor | null;
  ket: boolean;
  totalCount?: number;
}


export async function fetchKeyset<T extends Record<string, unknown>>(
  client: SupabaseClient,
  cfg: KeysetFetchConfig,
): Promise<KeysetPage<T>> {
  const dir = cfg.dir ?? "desc";
  const kichThuoc = cfg.kichThuoc ?? 50;
  const cot = cfg.cot.includes("id") ? cfg.cot : [...cfg.cot, "id"];

  let q = client
    .from(cfg.bang)
    .select(cot.join(","), { count: "exact" });

  if (cfg.filters) {
    q = cfg.filters(q);
  }

  q = q.order(cfg.sortField, { ascending: dir === "asc" })
    .order("id", { ascending: dir === "asc" })
    .limit(kichThuoc);

  if (cfg.signal) {
    q = q.abortSignal(cfg.signal);
  }

  if (cfg.cursor && cfg.cursor.lastId) {
    const op = dir === "asc" ? "gt" : "lt";
    const { lastValue, lastId } = cfg.cursor;
    if (lastValue === null) {
      q = q.is(cfg.sortField, null).filter("id", op, lastId);
    } else {
      // (sortField, id) op (lastValue, lastId)
      const encoded = typeof lastValue === "string" ? `"${lastValue}"` : String(lastValue);
      q = q.or(
        `${cfg.sortField}.${op}.${encoded},and(${cfg.sortField}.eq.${encoded},id.${op}.${lastId})`,
      );
    }
  }

  const { data, count, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as unknown as T[];
  return {
    rows,
    cursor: nextCursor(rows, cfg.sortField),
    ket: rows.length < kichThuoc,
    totalCount: count ?? undefined,
  };
}

