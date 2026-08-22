// ============================================================================
// kiem-dinh.ts — Task 47: chứng chỉ KĐ/HC nhẹ cho tài sản.
// Dùng chung ngưỡng cảnh báo 30/60/90 từ han-canh-bao.ts (Task 13).
// ============================================================================

import { nguongCho, type NguongCanhBao } from "./han-canh-bao";

export type LoaiChungNhan = "KIEM_DINH" | "HIEU_CHUAN";
export type CheDoKdHc = "KHONG" | "KIEM_DINH" | "HIEU_CHUAN";

export const LOAI_CHUNG_NHAN: readonly LoaiChungNhan[] = ["KIEM_DINH", "HIEU_CHUAN"] as const;
export const CHE_DO_KD_HC: readonly CheDoKdHc[] = ["KHONG", "KIEM_DINH", "HIEU_CHUAN"] as const;

export interface ChungChi {
  id?: string;
  thiet_bi_id: string;
  loai: LoaiChungNhan;
  so_giay_chung_nhan: string;
  ngay_bat_dau: string | null;
  ngay_het_han: string | null;
  ghi_chu?: string | null;
}

/** Ngày hôm nay theo giờ VN, dạng YYYY-MM-DD. */
function homNayVN(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function diffNgay(a: string, b: string): number {
  // "YYYY-MM-DD" - lấy chênh lệch ngày lịch (không quan tâm giờ).
  const ma = /^(\d{4})-(\d{2})-(\d{2})$/.exec(a);
  const mb = /^(\d{4})-(\d{2})-(\d{2})$/.exec(b);
  if (!ma || !mb) return NaN;
  const da = Date.UTC(+ma[1], +ma[2] - 1, +ma[3]);
  const db = Date.UTC(+mb[1], +mb[2] - 1, +mb[3]);
  return Math.round((da - db) / 86_400_000);
}

/** Kiểm tra tối thiểu cho chứng chỉ. */
export function validateChungChi(c: Partial<ChungChi>): { hopLe: boolean; loi: string[] } {
  const loi: string[] = [];
  if (!c.thiet_bi_id || typeof c.thiet_bi_id !== "string") loi.push("Thiếu thiet_bi_id");
  if (!c.loai || !LOAI_CHUNG_NHAN.includes(c.loai as LoaiChungNhan))
    loi.push("Loại chứng chỉ không hợp lệ");
  if (!c.so_giay_chung_nhan || !String(c.so_giay_chung_nhan).trim())
    loi.push("Thiếu số giấy chứng nhận");
  if (c.ngay_bat_dau && c.ngay_het_han) {
    const d = diffNgay(c.ngay_het_han, c.ngay_bat_dau);
    if (!Number.isFinite(d) || d < 0) loi.push("ngay_bat_dau phải ≤ ngay_het_han");
  }
  return { hopLe: loi.length === 0, loi };
}

/** Trạng thái hết hạn dùng chung ngưỡng 30/60/90 từ han-canh-bao.ts. */
export function trangThaiHetHan(
  ngay_het_han: string | null,
  homNay?: string,
): { soNgay: number | null; nguong: NguongCanhBao | null; daHetHan: boolean } {
  if (!ngay_het_han) return { soNgay: null, nguong: null, daHetHan: false };
  const base = homNay ?? homNayVN();
  const soNgay = diffNgay(ngay_het_han, base);
  if (!Number.isFinite(soNgay)) return { soNgay: null, nguong: null, daHetHan: false };
  if (soNgay < 0) return { soNgay, nguong: null, daHetHan: true };
  return { soNgay, nguong: nguongCho(soNgay), daHetHan: false };
}

/** Chọn chứng chỉ mới nhất (ưu tiên ngay_het_han, rồi ngay_bat_dau). */
export function chungChiMoiNhat(ds: ChungChi[]): ChungChi | null {
  if (!ds || ds.length === 0) return null;
  const key = (c: ChungChi): string => c.ngay_het_han ?? c.ngay_bat_dau ?? "0000-00-00";
  let best = ds[0];
  for (let i = 1; i < ds.length; i++) {
    if (key(ds[i]) > key(best)) best = ds[i];
  }
  return best;
}
