// ============================================================================
// canh-bao.ts — N5: logic THUẦN sinh cảnh báo theo ngưỡng có thể cấu hình
// (mặc định 30/15/7). Độc lập với `canh-bao-het-han.ts` (giữ ngưỡng KPI cũ
// 30/60/90). Không phụ thuộc DB → dễ test và dùng chung server/client.
// ============================================================================

import { ngayTheoMuiGio } from "./canh-bao-het-han";

/** Ngưỡng thông báo mặc định cho N5. Có thể ghi đè qua `thong_bao_cau_hinh`. */
export const NGUONG_THONG_BAO = [30, 15, 7] as const;

export type LoaiCanhBao = "bao_hanh" | "giay_phep" | "chung_chi_kd" | "chung_chi_hc";

export type MucDo = "info" | "warning" | "critical" | "overdue";

export interface AlertItem {
  loai: LoaiCanhBao;
  doi_tuong_bang: string;
  doi_tuong_ref: string;
  don_vi_id: string | null;
  ten: string | null;
  ngay_het_han: string; // YYYY-MM-DD (chấp nhận ISO, chỉ dùng 10 ký tự đầu)
}

export interface AlertOut extends AlertItem {
  so_ngay_con_lai: number;
  nguong: number | "overdue";
  muc_do: MucDo;
  khoa_chong_trung: string;
  tieu_de: string;
  noi_dung: string;
}

/** Số ngày lịch còn lại đến hạn theo giờ VN. */
export function daysRemaining(ngayHetHan: string, now: string | Date = new Date()): number {
  const today = ngayTheoMuiGio(now);
  const target = ngayHetHan.slice(0, 10);
  const da = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10));
  const db = Date.UTC(+target.slice(0, 4), +target.slice(5, 7) - 1, +target.slice(8, 10));
  return Math.round((db - da) / 86_400_000);
}

/**
 * Chọn ngưỡng NHỎ NHẤT ≥ soNgay. Trả `null` khi âm hoặc vượt max.
 * Ví dụ thresholds=[30,15,7]: 20→15, 8→15, 5→7, 31→null, -1→null.
 */
export function pickThreshold(soNgay: number, thresholds: readonly number[]): number | null {
  if (!Number.isFinite(soNgay) || soNgay < 0) return null;
  const sorted = [...thresholds].sort((a, b) => a - b);
  for (const n of sorted) if (soNgay <= n) return n;
  return null;
}

function mucDoTheoNguong(n: number | "overdue"): MucDo {
  if (n === "overdue") return "overdue";
  if (n <= 7) return "critical";
  if (n <= 15) return "warning";
  return "info";
}

const NHAN_LOAI: Record<LoaiCanhBao, string> = {
  bao_hanh: "Bảo hành",
  giay_phep: "Giấy phép",
  chung_chi_kd: "Kiểm định",
  chung_chi_hc: "Hiệu chuẩn",
};

function keyOf(loai: string, ref: string, ngay: string, nguong: number | "overdue"): string {
  return `${loai}|${ref}|${ngay.slice(0, 10)}|${nguong}`;
}

/**
 * Sinh 1 dòng cảnh báo cho mỗi (item, ngưỡng chạm). Item quá hạn tạo dòng
 * `overdue` một lần. Idempotent qua `khoa_chong_trung`.
 */
export function buildAlerts(
  items: readonly AlertItem[],
  opts: { thresholds?: readonly number[]; now?: string | Date } = {},
): AlertOut[] {
  const thresholds = opts.thresholds ?? NGUONG_THONG_BAO;
  const now = opts.now ?? new Date();
  const seen = new Set<string>();
  const out: AlertOut[] = [];

  for (const item of items) {
    const so = daysRemaining(item.ngay_het_han, now);
    let nguong: number | "overdue" | null;
    if (so < 0) nguong = "overdue";
    else nguong = pickThreshold(so, thresholds);
    if (nguong == null) continue;

    const key = keyOf(item.loai, item.doi_tuong_ref, item.ngay_het_han, nguong);
    if (seen.has(key)) continue;
    seen.add(key);

    const nhan = NHAN_LOAI[item.loai] ?? item.loai;
    const muc_do = mucDoTheoNguong(nguong);
    const ten = item.ten ?? "(không tên)";
    const tieu_de =
      nguong === "overdue" ? `[Quá hạn] ${nhan}: ${ten}` : `[Còn ${so} ngày] ${nhan}: ${ten}`;
    const noi_dung =
      nguong === "overdue"
        ? `${nhan} "${ten}" đã quá hạn ${Math.abs(so)} ngày (hết hạn ${item.ngay_het_han.slice(0, 10)}).`
        : `${nhan} "${ten}" sẽ hết hạn sau ${so} ngày (${item.ngay_het_han.slice(0, 10)}). Ngưỡng nhắc: ${nguong} ngày.`;

    out.push({
      ...item,
      so_ngay_con_lai: so,
      nguong,
      muc_do,
      khoa_chong_trung: key,
      tieu_de,
      noi_dung,
    });
  }

  return out.sort((a, b) => a.so_ngay_con_lai - b.so_ngay_con_lai);
}
