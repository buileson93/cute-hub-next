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

  const start = performance.now();
  const { data, count, error } = await q;
  const end = performance.now();
  
  if (error) {
    // Huỷ request (đổi trang / unmount) không phải lỗi thật → không ghi console.error.
    const aborted =
      (error as any)?.name === "AbortError" ||
      String((error as any)?.message ?? "").includes("aborted");
    if (!aborted) console.error(`[KeysetFetch] Lỗi tải bảng ${cfg.bang}:`, error);
    throw error;
  }

  
  const rows = (data ?? []) as unknown as T[];
  const duration = Math.round(end - start);
  
  // Telemetry logging để phát hiện nguyên nhân không tải đủ dữ liệu
  if (rows.length === 0 && count && count > 0 && !cfg.cursor) {
    console.warn(`[KeysetFetch] Cảnh báo: Bảng ${cfg.bang} có ${count} bản ghi nhưng trả về 0 dòng.`);
  }

  if (rows.length > 0 && cfg.cursor) {
    const isDuplicate = rows.some(r => String(r.id) === cfg.cursor?.lastId);
    if (isDuplicate) {
      console.error(`[KeysetFetch] PHÁT HIỆN TRÙNG LẶP: Dòng đầu tiên của trang mới trùng với cursor.lastId: ${cfg.cursor.lastId}. Bảng: ${cfg.bang}`);
    }
  }

  console.log(`[KeysetFetch] ${cfg.bang}: Tải ${rows.length}/${count || 'unknown'} dòng trong ${duration}ms (cursor: ${!!cfg.cursor})`);

  return {
    rows,
    cursor: nextCursor(rows, cfg.sortField),
    ket: rows.length < kichThuoc,
    totalCount: count ?? undefined,
  };
}

