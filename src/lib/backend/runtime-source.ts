/**
 * Nguồn dữ liệu đang dùng (chạy thời gian thực, không cần build lại).
 *
 * Quản trị viên có thể chọn một Supabase bên ngoài làm nguồn dữ liệu ngay trong app.
 * Lựa chọn được lưu ở `localStorage` của trình duyệt và được `resolveBrowserBackend()`
 * ưu tiên hơn mọi biến môi trường. Bỏ chọn → quay lại Lovable Cloud.
 */

export const BACKEND_OVERRIDE_KEY = "mirats.backend.override";

export interface BackendOverride {
  url: string;
  publishableKey: string;
  ten?: string;
}

/** Đọc lựa chọn đang lưu (chỉ chạy ở trình duyệt). */
export function readBackendOverride(): BackendOverride | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BACKEND_OVERRIDE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as BackendOverride;
    return v?.url && v?.publishableKey ? v : null;
  } catch {
    return null;
  }
}

/** Ghi lựa chọn. Trả về true nếu có thay đổi so với hiện tại. */
export function writeBackendOverride(v: BackendOverride | null): boolean {
  if (typeof window === "undefined") return false;
  const cu = readBackendOverride();
  const same =
    (cu?.url ?? null) === (v?.url ?? null) &&
    (cu?.publishableKey ?? null) === (v?.publishableKey ?? null);
  if (v) window.localStorage.setItem(BACKEND_OVERRIDE_KEY, JSON.stringify(v));
  else window.localStorage.removeItem(BACKEND_OVERRIDE_KEY);
  return !same;
}

/**
 * Dọn mọi bộ nhớ đệm còn dính DB cũ: phiên đăng nhập Supabase, cache truy vấn
 * lưu ở localStorage/sessionStorage, IndexedDB của supabase-js và Cache Storage.
 */
export async function donCacheNguonCu() {
  if (typeof window === "undefined") return;
  try {
    for (const k of Object.keys(window.localStorage)) {
      if (
        (k.startsWith("sb-") && k.includes("auth-token")) ||
        k.startsWith("mirats.cache") ||
        k.startsWith("REACT_QUERY") ||
        k.startsWith("tanstack-query")
      ) {
        window.localStorage.removeItem(k);
      }
    }
    window.sessionStorage.clear();
  } catch {
    /* bỏ qua */
  }
  try {
    const idb = (window as any).indexedDB;
    if (idb?.databases) {
      const dbs = await idb.databases();
      await Promise.all(
        (dbs ?? [])
          .map((d: any) => d?.name as string | undefined)
          .filter(
            (n: string | undefined): n is string =>
              !!n && (n.startsWith("supabase") || n.startsWith("mirats")),
          )
          .map(
            (n: string) =>
              new Promise((res) => {
                const req = idb.deleteDatabase(n);
                req.onsuccess = req.onerror = req.onblocked = () => res(null);
              }),
          ),
      );
    }
  } catch {
    /* bỏ qua */
  }
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* bỏ qua */
  }
}

/**
 * Áp dụng lựa chọn mới: dọn sạch cache/phiên của nguồn cũ rồi nạp lại app
 * ở địa chỉ gốc để chắc chắn không còn truy vấn nào dính DB cũ.
 */
export function applyBackendOverrideAndReload(v: BackendOverride | null) {
  writeBackendOverride(v);
  if (typeof window === "undefined") return;
  void donCacheNguonCu().finally(() => {
    // replace() để không quay lại trang cũ bằng nút Back với state của DB cũ.
    window.location.replace(`${window.location.pathname}?nguon=${Date.now()}`);
  });
}
