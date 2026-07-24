// Task 39 — Chính sách retry cho TanStack Query.
//
// Nguyên tắc:
// - Không retry lỗi 4xx (lỗi phía client / RLS / xác thực) — thử lại vô nghĩa.
// - Retry tối đa 3 lần cho lỗi 5xx, timeout hoặc lỗi mạng.
// - Backoff mũ 2^n, tối đa 15s để không "đóng băng" UI khi mạng chậm.

export const RETRY_LAN_TOI_DA = 3;
export const RETRY_TRE_TOI_DA_MS = 15_000;

/** Trích mã HTTP từ nhiều dạng lỗi khác nhau (Response, Supabase, fetch). */
export function docMaHttp(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;
  const e = err as Record<string, unknown>;
  if (typeof e.status === "number") return e.status;
  if (typeof e.statusCode === "number") return e.statusCode;
  if (typeof e.code === "string") {
    // Supabase PostgREST: "PGRST301" — 401; "42501" — 403 (permission denied)
    if (e.code === "42501" || e.code === "PGRST301") return 403;
    if (e.code === "PGRST116") return 404;
  }
  const nested = e.response as Record<string, unknown> | undefined;
  if (nested && typeof nested.status === "number") return nested.status;
  return null;
}

/** Có phải lỗi mạng (mất kết nối, DNS, fetch abort không mong muốn)? */
export function laLoiMang(err: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (!err) return false;
  const msg = (err as Error).message?.toLowerCase?.() ?? "";
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("load failed") ||
    msg === "typeerror: fetch"
  );
}

/** Quyết định có retry hay không cho TanStack Query. */
export function nenRetry(soLan: number, err: unknown, gioiHan = RETRY_LAN_TOI_DA): boolean {
  if (soLan >= gioiHan) return false;
  const ma = docMaHttp(err);
  if (ma !== null) {
    // 4xx: đừng retry — không thay đổi được kết quả.
    if (ma >= 400 && ma < 500) return false;
    // 5xx: có thể tạm thời — cho retry.
    if (ma >= 500) return true;
  }
  if (laLoiMang(err)) return true;
  // Lỗi không rõ mã: cho 1 lần retry.
  return soLan < 1;
}

/** Backoff mũ 2^n * 1000ms, tối đa `RETRY_TRE_TOI_DA_MS`. */
export function tinhTreRetry(soLan: number, tranMs = RETRY_TRE_TOI_DA_MS): number {
  return Math.min(tranMs, 1000 * 2 ** soLan);
}
