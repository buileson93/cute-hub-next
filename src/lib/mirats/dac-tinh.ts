// Nhãn tài sản (tag) đa trị — lớp phân loại phụ, KHÔNG thay thế chủng loại.
// Không còn phân nhóm; mã nhãn tài sản do DB tự sinh ngẫu nhiên (dạng DT_XXXXXXXX).
// Pure logic: không đụng DB/UI.

export interface DacTinh {
  ma: string;
  ten: string;
  thu_tu?: number;
  /** Token màu preset (xem `mau-sac.ts`). Không set → dùng fallback xám. */
  mau?: string;
}

export type CheDoLoc = "any" | "all" | "none";

/**
 * Sắp danh sách nhãn tài sản theo `thu_tu` tăng dần (thiếu → cuối), tie-break theo `ma`.
 * Trước đây gom theo nhóm — giờ chỉ trả 1 mảng phẳng.
 */
export function sortDacTinh(ds: DacTinh[]): DacTinh[] {
  return [...ds].sort((a, b) => {
    const ta = a.thu_tu ?? Number.POSITIVE_INFINITY;
    const tb = b.thu_tu ?? Number.POSITIVE_INFINITY;
    if (ta !== tb) return ta - tb;
    return a.ma.localeCompare(b.ma);
  });
}

/**
 * So khớp bộ lọc đa trị.
 * - `any`  : tài sản có ÍT NHẤT 1 tag trong `daChon`.
 * - `all`  : tài sản có ĐỦ toàn bộ tag trong `daChon`.
 * - `none` : tài sản KHÔNG có bất kỳ tag nào trong `daChon`.
 * Quy ước: `daChon` rỗng → true (không lọc).
 */
export function matchFilter(cuaThietBi: string[], daChon: string[], che_do: CheDoLoc): boolean {
  if (!daChon || daChon.length === 0) return true;
  const set = new Set(cuaThietBi);
  switch (che_do) {
    case "any":
      return daChon.some((t) => set.has(t));
    case "all":
      return daChon.every((t) => set.has(t));
    case "none":
      return daChon.every((t) => !set.has(t));
  }
}

/** Chip hiển thị gọn cho UI: "ten (ma)". */
export function formatChip(dt: DacTinh): string {
  return `${dt.ten} (${dt.ma})`;
}

/**
 * Tính payload đồng bộ M:N cho `dm_model_dac_tinh`.
 * - Dedupe cả `prev` và `next` (tránh nhân đôi khi bảng có bản ghi trùng).
 * - `toInsert` = có trong `next` nhưng không trong `prev`.
 * - `toDelete` = có trong `prev` nhưng không trong `next`.
 */
export function diffModelDacTinh(
  prev: string[],
  next: string[],
): { toInsert: string[]; toDelete: string[] } {
  const prevSet = new Set(prev);
  const nextSet = new Set(next);
  const toInsert: string[] = [];
  const toDelete: string[] = [];
  for (const id of nextSet) if (!prevSet.has(id)) toInsert.push(id);
  for (const id of prevSet) if (!nextSet.has(id)) toDelete.push(id);
  return { toInsert, toDelete };
}
