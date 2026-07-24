// Điều khiển danh sách dùng chung — phần thuần logic (không đụng React).
// Test đơn giản, tái sử dụng ở mọi route _app.*.

export interface ListControlsState {
  q: string;
  filters: Record<string, string | string[]>;
  sort: { field: string; dir: "asc" | "desc" } | null;
  trang: number; // 1-based
  kichThuoc: number;
}

export const DEFAULT_LIST_STATE: ListControlsState = {
  q: "",
  filters: {},
  sort: null,
  trang: 1,
  kichThuoc: 20,
};

export interface LocSortConfig<T> {
  timKiem: (r: T) => string;
  loc?: Record<string, (r: T, v: unknown) => boolean>;
  sort?: Record<string, (a: T, b: T) => number>;
}

/** Bỏ dấu tiếng Việt, hạ về chữ thường — dùng cho search không dấu. */
export function chuanHoaTimKiem(s: string): string {
  return (s ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}

function filterMatch(value: string | string[] | undefined, target: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) {
    if (value.length === 0) return true;
    return value.some((v) => String(v) === String(target));
  }
  if (value === "" || value === "all" || value === "tat_ca") return true;
  return String(value) === String(target);
}

export function locVaSapXep<T>(
  rows: T[],
  state: ListControlsState,
  cfg: LocSortConfig<T>,
): { data: T[]; tong: number } {
  const qNorm = chuanHoaTimKiem(state.q);
  let out = rows;

  if (qNorm) {
    out = out.filter((r) => chuanHoaTimKiem(cfg.timKiem(r)).includes(qNorm));
  }

  for (const [key, val] of Object.entries(state.filters)) {
    const fn = cfg.loc?.[key];
    if (fn) {
      out = out.filter((r) => fn(r, val));
    } else {
      // Filter chưa được cấu hình → so sánh field cùng tên nếu có
      out = out.filter((r) => {
        const target = (r as unknown as Record<string, unknown>)[key];
        return filterMatch(val, target);
      });
    }
  }

  if (state.sort) {
    const cmp = cfg.sort?.[state.sort.field];
    if (cmp) {
      const dir = state.sort.dir === "asc" ? 1 : -1;
      out = [...out].sort((a, b) => cmp(a, b) * dir);
    } else {
      const field = state.sort.field;
      const dir = state.sort.dir === "asc" ? 1 : -1;
      out = [...out].sort((a, b) => {
        const av = (a as Record<string, unknown>)[field];
        const bv = (b as Record<string, unknown>)[field];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
        return String(av).localeCompare(String(bv), "vi") * dir;
      });
    }
  }

  const tong = out.length;
  const trang = Math.max(1, state.trang);
  const kt = Math.max(1, state.kichThuoc);
  const from = (trang - 1) * kt;
  const data = out.slice(from, from + kt);
  return { data, tong };
}

/** Số trang tổng cho phần paging UI. */
export function tongSoTrang(tong: number, kichThuoc: number): number {
  if (tong <= 0) return 1;
  return Math.max(1, Math.ceil(tong / Math.max(1, kichThuoc)));
}
