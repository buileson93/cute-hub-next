// ============================================================================
// Task 11 — Toàn vẹn khi xoá danh mục:
// Đếm số tài sản đang tham chiếu tới một mục danh mục theo cột FK cụ thể.
// Module thuần (không phụ thuộc mạng/DB) để test dễ và tái dùng ở mọi trang
// /danh-muc/*.
// ============================================================================

export type ThietBiRefSubset = {
  nha_san_xuat_id?: string | null;
  nha_cung_cap_id?: string | null;
  loai_thiet_bi_id?: string | null;
  model_id?: string | null;
};

/** Các cột FK trên bảng thiet_bi được hỗ trợ để đếm tham chiếu. */
export type DanhMucRefField =
  | "nha_san_xuat_id"
  | "nha_cung_cap_id"
  | "loai_thiet_bi_id"
  | "model_id";

/**
 * Đếm số tài sản có `field === id`.
 * Trả về 0 khi không có tài sản nào đang dùng — cho phép xoá an toàn.
 */
export function countRefs(
  id: string,
  thietBi: ThietBiRefSubset[],
  field: DanhMucRefField | string,
): number {
  if (!id) return 0;
  let n = 0;
  for (const t of thietBi) {
    if ((t as Record<string, string | null | undefined>)[field] === id) n++;
  }
  return n;
}
