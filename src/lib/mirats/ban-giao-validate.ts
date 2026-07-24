/**
 * Đối soát bàn giao vs trạng thái "đang lắp" (gan_chuc_nang).
 *
 * Nếu tài sản đang được lắp tại một vị trí chức năng mà lại xuất hiện phiếu bàn
 * giao cho người/đơn vị khác (không phải trả tài sản), ta trả về một cảnh báo
 * để UI hiển thị — không chặn cứng, chỉ nhắc để người dùng xác nhận.
 */

export interface HoldingConflict {
  thietBiId: string;
  viTri: string;
  /**
   * Người/đơn vị đang được ghi là giữ tài sản theo bản ghi lắp gần nhất (nếu có).
   * Có thể là "" khi bảng gan_chuc_nang không lưu người giữ — vẫn báo là "đang lắp".
   */
  nguoiGiu: string;
}

export interface DangLapRow {
  thiet_bi_id: string;
  ten_vi_tri: string;
  /** Optional — người đang giữ / đơn vị đang giữ ở vị trí đó */
  nguoi_giu?: string | null;
}

export interface BanGiaoInput {
  thiet_bi_id: string;
  ngay_nhan: string;
  /** Nếu true (phiếu Thu hồi / Trả) thì bỏ qua đối soát */
  is_return?: boolean;
}

export function detectHoldingConflict(
  banGiao: BanGiaoInput,
  dangLap: DangLapRow[],
): HoldingConflict | null {
  if (!banGiao.thiet_bi_id) return null;
  if (banGiao.is_return) return null;

  const match = dangLap.find((r) => r.thiet_bi_id === banGiao.thiet_bi_id);
  if (!match) return null;

  return {
    thietBiId: match.thiet_bi_id,
    viTri: match.ten_vi_tri,
    nguoiGiu: (match.nguoi_giu ?? "").trim(),
  };
}
