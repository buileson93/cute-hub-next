/**
 * Định nghĩa bộ trường cốt lõi (Core Fields) để tính độ hoàn thiện dữ liệu.
 */

export const CORE_FIELDS: Record<string, string[]> = {
  thiet_bi: [
    "ten_thiet_bi",
    "ma_serial",
    "model_id",
    "trang_thai_id",
    "he_thong_id",
    "don_vi_id",
    "nguoi_quan_ly_id"
  ],
  he_thong: [
    "ten_he_thong",
    "ma_he_thong",
    "loai_he_thong_id",
    "don_vi_id",
    "nhom_he_thong_id"
  ]
};

/**
 * Tính % hoàn thiện dựa trên các trường core.
 */
export function calculateCompleteness(
  entity: "thiet_bi" | "he_thong",
  data: Record<string, any>
): number {
  const fields = CORE_FIELDS[entity];
  if (!fields) return 0;

  const filled = fields.filter(f => {
    const val = data[f];
    return val !== null && val !== undefined && val !== "";
  });

  return Math.round((filled.length / fields.length) * 100);
}
