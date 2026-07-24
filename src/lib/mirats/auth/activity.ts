// Nguồn sự thật cho timestamp "hoạt động gần nhất" của phiên.
// Reset khi: đăng nhập thành công (server confirm), auth state SIGNED_IN,
// hoặc user tương tác. Đọc ở use-idle-logout để tính thời gian idle.
export const ACTIVITY_STORAGE_KEY = "mirats:last-activity";

export function markActivityNow(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, String(Date.now()));
  } catch {
    /* quota / private mode */
  }
}

export function readLastActivity(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function clearActivity(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACTIVITY_STORAGE_KEY);
  } catch {
    /* noop */
  }
}
