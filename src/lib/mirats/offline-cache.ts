/**
 * N11 — Cache offline (localStorage) cho các trang cần mở nhanh khi mất mạng.
 *
 * - Có TTL mềm (soft-expire): quá TTL vẫn trả (kèm cờ `stale`) để hiển thị
 *   thông tin cũ khi offline, thay vì màn trắng.
 * - Danh sách "QR gần đây" giữ N mã tra cứu gần nhất để user mở lại nhanh.
 * - Không phụ thuộc React → dùng được từ route loader, hook, và test.
 */

const NS = "mirats.cache.v1";
const RECENT_KEY = `${NS}.qr.recent`;
const RECENT_MAX = 20;
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface Envelope<T> {
  v: 1;
  savedAt: number;
  ttlMs: number;
  data: T;
}

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // QuotaExceeded / private mode — bỏ qua, cache chỉ là bonus.
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Lưu dữ liệu cache theo key logic (không cần prefix). */
export function putCache<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  const env: Envelope<T> = { v: 1, savedAt: Date.now(), ttlMs, data };
  safeSet(`${NS}.${key}`, JSON.stringify(env));
}

export interface CachedRead<T> {
  data: T;
  savedAt: number;
  stale: boolean;
}

/** Đọc cache; trả `null` khi không có / hỏng dữ liệu. */
export function getCache<T>(key: string): CachedRead<T> | null {
  const raw = safeGet(`${NS}.${key}`);
  if (!raw) return null;
  try {
    const env = JSON.parse(raw) as Envelope<T>;
    if (!env || env.v !== 1) return null;
    const stale = Date.now() - env.savedAt > env.ttlMs;
    return { data: env.data, savedAt: env.savedAt, stale };
  } catch {
    return null;
  }
}

export function dropCache(key: string): void {
  safeRemove(`${NS}.${key}`);
}

// ---------------- Recent QR list ----------------------------------------

export interface RecentQrItem {
  ma: string;
  ten?: string | null;
  at: number;
}

export function pushRecentQr(item: { ma: string; ten?: string | null }): void {
  const raw = safeGet(RECENT_KEY);
  let list: RecentQrItem[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed as RecentQrItem[];
    } catch {
      list = [];
    }
  }
  const next: RecentQrItem[] = [
    { ma: item.ma, ten: item.ten ?? null, at: Date.now() },
    ...list.filter((x) => x.ma !== item.ma),
  ].slice(0, RECENT_MAX);
  safeSet(RECENT_KEY, JSON.stringify(next));
}

export function listRecentQr(): RecentQrItem[] {
  const raw = safeGet(RECENT_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentQrItem[]) : [];
  } catch {
    return [];
  }
}
