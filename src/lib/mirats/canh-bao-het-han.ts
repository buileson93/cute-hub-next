// ============================================================================
// canh-bao-het-han.ts — Logic THUẦN cho cảnh báo sắp hết hạn (bảo hành/giấy phép).
//
// Nguyên tắc:
//  - Mọi mốc ngày tính theo múi giờ Việt Nam (Asia/Ho_Chi_Minh, UTC+7, không DST)
//    để "số ngày còn lại" không lệch do máy chủ chạy UTC.
//  - Ba ngưỡng cảnh báo cố định: 30 / 60 / 90 ngày (escalation dần).
//  - Chống trùng: mỗi (mục + ngưỡng) chỉ sinh thông báo một lần → job chạy lại
//    KHÔNG tạo notification trùng. Khoá chống trùng do đây quyết định, đồng nhất
//    với bảng log phía CSDL (canh_bao_het_han_log).
//
// Module không phụ thuộc DB để test được và dùng chung server/client.
// ============================================================================

import { NGUONG_CANH_BAO, nguongCho, type NguongCanhBao } from "./han-canh-bao";
export { NGUONG_CANH_BAO, nguongCho } from "./han-canh-bao";
export type Nguong = NguongCanhBao;

export const VN_TZ = "Asia/Ho_Chi_Minh";

/** Phần ngày `YYYY-MM-DD` của một thời điểm theo múi giờ tz (mặc định VN). */
export function ngayTheoMuiGio(when: string | Date, tz: string = VN_TZ): string {
  const d = typeof when === "string" ? new Date(when) : when;
  if (Number.isNaN(d.getTime())) throw new Error("thời điểm không hợp lệ");
  // en-CA cho định dạng YYYY-MM-DD ổn định.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Số ngày lịch giữa hai chuỗi ngày `YYYY-MM-DD` (b - a). */
function diffNgay(a: string, b: string): number {
  const da = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const db = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.round((db - da) / 86_400_000);
}

/**
 * Số ngày còn lại tới hạn, tính theo NGÀY LỊCH giờ VN.
 * @param ngayHetHan chuỗi ngày (chấp nhận cả ISO có giờ, chỉ lấy phần ngày).
 * @param now thời điểm hiện tại (mặc định bây giờ).
 */
export function soNgayConLai(
  ngayHetHan: string,
  now: string | Date = new Date(),
  tz: string = VN_TZ,
): number {
  const today = ngayTheoMuiGio(now, tz);
  return diffNgay(today, ngayHetHan.slice(0, 10));
}

// nguongCho được re-export ở đầu file (nguồn: han-canh-bao.ts).

/** Khoá chống trùng ổn định cho một (mục + ngưỡng). Đồng nhất với log CSDL. */
export function khoaChongTrung(
  loai: string,
  thietBiId: string | null,
  ngayHetHan: string,
  nguong: Nguong,
): string {
  return `${loai}|${thietBiId ?? "-"}|${ngayHetHan.slice(0, 10)}|${nguong}`;
}

export interface CanhBaoInput {
  loai: string;
  thiet_bi_id: string | null;
  ten: string | null;
  ngay_het_han: string;
}

export interface CanhBaoRa extends CanhBaoInput {
  so_ngay_con_lai: number;
  nguong: Nguong;
  khoa: string;
}

/**
 * Lọc danh sách mục còn hạn về đúng các mục cần cảnh báo:
 *  - bỏ mục đã quá hạn (<0) và mục ngoài 90 ngày;
 *  - gán ngưỡng 30/60/90 và khoá chống trùng;
 *  - loại các khoá đã báo trước đó (daBao) → job chạy lại không tạo trùng.
 */
export function locCanhBao(
  rows: readonly CanhBaoInput[],
  opts: { now?: string | Date; daBao?: ReadonlySet<string> } = {},
): CanhBaoRa[] {
  const now = opts.now ?? new Date();
  const daBao = opts.daBao ?? new Set<string>();
  const out: CanhBaoRa[] = [];
  for (const r of rows) {
    const so = soNgayConLai(r.ngay_het_han, now);
    const nguong = nguongCho(so);
    if (nguong == null) continue;
    const khoa = khoaChongTrung(r.loai, r.thiet_bi_id, r.ngay_het_han, nguong);
    if (daBao.has(khoa)) continue;
    out.push({ ...r, so_ngay_con_lai: so, nguong, khoa });
  }
  return out.sort((a, b) => a.so_ngay_con_lai - b.so_ngay_con_lai);
}
