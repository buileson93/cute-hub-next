// ============================================================================
// Logic thuần cho mẫu hình "khe chức năng ↔ đơn vị vật lý ↔ gán theo thời gian".
// Dùng chung cho CẢ HAI tầng:
//   - Tầng 1: Hệ thống -> Vị trí chức năng (he_thong_thanh_phan) -> Tài sản.
//   - Tầng 2: Tài sản -> Khe linh kiện (thiet_bi_khe_linh_kien) -> Linh kiện.
//
// Mục tiêu: PHẢN CHIẾU đúng các ràng buộc mà CSDL enforce (trigger + unique
// index + RPC guard) để giao diện tự kiểm tra trước, vô hiệu hoá nút và hiển
// thị lý do — KHÔNG phụ thuộc React/CSDL nên test độc lập được.
// ============================================================================

/** Trạng thái của một khe (đứng yên, không xoá cứng). */
export type KheTrangThai = "hoat_dong" | "ngung";

/** Lý do một dòng gán theo thời gian — khớp CHECK constraint của CSDL. */
export type LyDoGan = "lắp mới" | "thay do hỏng" | "điều chuyển" | "tháo";

export const LY_DO_GAN: readonly LyDoGan[] = [
  "lắp mới",
  "thay do hỏng",
  "điều chuyển",
  "tháo",
] as const;

/** Kết quả kiểm tra: cho phép hay không, kèm lý do người dùng đọc được. */
export interface KetQuaKiemTra {
  ok: boolean;
  reason?: string;
}

const OK: KetQuaKiemTra = { ok: true };
const no = (reason: string): KetQuaKiemTra => ({ ok: false, reason });

/**
 * Lọc đơn vị vật lý ĐỦ ĐIỀU KIỆN gán vào một khe:
 *  - `ranh` đã là các đơn vị RẢNH (không có dòng gán hiệu lực);
 *  - nếu khe yêu cầu loại (`loaiYeuCau`) thì chỉ giữ đơn vị đúng loại.
 * Tổng quát cho cả tài sản (tầng 1) và linh kiện (tầng 2).
 */
export function filterEligibleUnits<T extends { loai_thiet_bi_id: string | null }>(
  ranh: T[],
  loaiYeuCau: string | null,
): T[] {
  if (!loaiYeuCau) return ranh;
  return ranh.filter((r) => r.loai_thiet_bi_id === loaiYeuCau);
}

/**
 * Xếp hạng đơn vị RẢNH để chọn lắp/thay thế: KHÔNG loại bỏ đơn vị khác loại
 * (CSDL không ràng buộc loại), mà giữ TẤT CẢ và đưa đơn vị ĐÚNG LOẠI yêu cầu
 * lên đầu, kèm cờ `khopLoai` để giao diện gợi ý. Cho phép đổi sang bất kỳ
 * tài sản nào đang rảnh.
 */
export function rankEligibleUnits<T extends { loai_thiet_bi_id: string | null }>(
  ranh: T[],
  loaiYeuCau: string | null,
): (T & { khopLoai: boolean })[] {
  return ranh
    .map((r) => ({ ...r, khopLoai: !loaiYeuCau || r.loai_thiet_bi_id === loaiYeuCau }))
    .sort((a, b) => Number(b.khopLoai) - Number(a.khopLoai));
}

/** Có thể LẮP một đơn vị vào khe hay không (khớp guard của RPC lap_*). */
export function canLap(args: {
  kheTrangThai: KheTrangThai;
  kheDangCoDonVi: boolean;
  donViDangBanO: boolean;
}): KetQuaKiemTra {
  if (args.kheTrangThai !== "hoat_dong") return no("Khe đã ngừng, không thể lắp");
  if (args.kheDangCoDonVi) return no("Khe đang có, hãy dùng Thay thế / Điều chuyển");
  if (args.donViDangBanO) return no("Đơn vị đang được lắp ở khe khác");
  return OK;
}

/** Có thể THÁO khỏi khe hay không. */
export function canThao(args: { kheDangCoDonVi: boolean }): KetQuaKiemTra {
  if (!args.kheDangCoDonVi) return no("Khe chưa có gì để tháo");
  return OK;
}

/** Có thể THAY THẾ đơn vị ở khe (đơn vị mới phải rảnh). */
export function canThayThe(args: {
  kheTrangThai: KheTrangThai;
  donViMoiDangBanO: boolean;
}): KetQuaKiemTra {
  if (args.kheTrangThai !== "hoat_dong") return no("Khe đã ngừng, không thể thay thế");
  if (args.donViMoiDangBanO) return no("Đơn vị mới đang được lắp ở khe khác");
  return OK;
}

/** Có thể ĐIỀU CHUYỂN sang khe đích (khe đích trống + đang hoạt động). */
export function canDieuChuyen(args: {
  kheDichTrangThai: KheTrangThai;
  kheDichDangCoDonVi: boolean;
}): KetQuaKiemTra {
  if (args.kheDichTrangThai !== "hoat_dong") return no("Khe đích đã ngừng");
  if (args.kheDichDangCoDonVi) return no("Khe đích đang có, hãy dùng Thay thế");
  return OK;
}

/** Có thể NGỪNG khe hay không (phải rỗng — trigger CSDL chặn nếu còn gán). */
export function canNgungKhe(args: { kheDangCoDonVi: boolean }): KetQuaKiemTra {
  if (args.kheDangCoDonVi) return no("Khe còn đơn vị đang gán, hãy tháo trước khi ngừng");
  return OK;
}
