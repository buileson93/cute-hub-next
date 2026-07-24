/**
 * Time utilities cho MIRATS.
 * - Mặc định hiển thị UTC.
 * - Cho phép user chuyển sang Vietnam +7 (Asia/Ho_Chi_Minh).
 * - Lưu preference vào localStorage, phát event 'mirats:tz-change' để UI cập nhật.
 * - KHÔNG bao giờ dùng giờ local của trình duyệt.
 */

export type TzMode = "UTC" | "VN";

const STORAGE_KEY = "mirats.tz";
const EVENT = "mirats:tz-change";

export const TZ_LABEL: Record<TzMode, string> = {
  UTC: "UTC",
  VN: "GMT+7 (VN)",
};

const TZ_IANA: Record<TzMode, string> = {
  UTC: "UTC",
  VN: "Asia/Ho_Chi_Minh",
};

export function getTz(): TzMode {
  if (typeof window === "undefined") return "UTC";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "VN" ? "VN" : "UTC";
}

export function setTz(mode: TzMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: mode }));
}

export function onTzChange(cb: (mode: TzMode) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<TzMode>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

function toDate(input: string | number | Date | null | undefined): Date | null {
  if (input == null || input === "") return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

type Kind = "datetime" | "date" | "time" | "datetime-sec";

function fmt(mode: TzMode, kind: Kind): Intl.DateTimeFormat {
  const tz = TZ_IANA[mode];
  const base: Intl.DateTimeFormatOptions = { timeZone: tz, hour12: false };
  const opts: Intl.DateTimeFormatOptions =
    kind === "date"
      ? { ...base, year: "numeric", month: "2-digit", day: "2-digit" }
      : kind === "time"
      ? { ...base, hour: "2-digit", minute: "2-digit" }
      : kind === "datetime-sec"
      ? { ...base, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }
      : { ...base, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" };
  return new Intl.DateTimeFormat("vi-VN", opts);
}

export function formatAt(
  input: string | number | Date | null | undefined,
  mode: TzMode = getTz(),
  kind: Kind = "datetime",
): string {
  const d = toDate(input);
  if (!d) return "—";
  const s = fmt(mode, kind).format(d);
  return `${s} ${TZ_LABEL[mode]}`;
}

/** Format theo TZ hiện tại của user (không kèm nhãn TZ). */
export function formatDT(
  input: string | number | Date | null | undefined,
  kind: Kind = "datetime",
): string {
  const d = toDate(input);
  if (!d) return "—";
  return fmt(getTz(), kind).format(d);
}

/** Khoảng cách so với hiện tại theo tiếng Việt (không phụ thuộc TZ). */
export function timeAgo(input: string | number | Date | null | undefined, now = Date.now()): string {
  const d = toDate(input);
  if (!d) return "—";
  const diff = Math.round((d.getTime() - now) / 1000);
  const abs = Math.abs(diff);
  const suffix = diff <= 0 ? "trước" : "nữa";
  if (abs < 60) return `${abs} giây ${suffix}`;
  if (abs < 3600) return `${Math.round(abs / 60)} phút ${suffix}`;
  if (abs < 86400) return `${Math.round(abs / 3600)} giờ ${suffix}`;
  if (abs < 30 * 86400) return `${Math.round(abs / 86400)} ngày ${suffix}`;
  if (abs < 365 * 86400) return `${Math.round(abs / (30 * 86400))} tháng ${suffix}`;
  return `${Math.round(abs / (365 * 86400))} năm ${suffix}`;
}
