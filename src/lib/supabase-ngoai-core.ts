/**
 * Tiện ích dùng chung cho tính năng "Kết nối Supabase ngoài".
 * File này an toàn cho cả máy chủ lẫn trình duyệt (không import gì bí mật).
 */

export const normUrl = (u: string) => u.trim().replace(/\/+$/, "");

/** Header gọi REST của Supabase đích. Khoá dạng sb_… không phải JWT → chỉ gửi apikey. */
export function targetHeaders(key: string, extra?: Record<string, string>) {
  const h: Record<string, string> = { apikey: key, "Content-Type": "application/json", ...extra };
  if (key.startsWith("eyJ")) h.Authorization = `Bearer ${key}`;
  return h;
}

export function mask(key: string | null | undefined) {
  if (!key) return null;
  if (key.length <= 12) return "••••";
  return `${key.slice(0, 6)}••••${key.slice(-4)}`;
}

/** Chạy song song có giới hạn số việc đồng thời. */
export async function chayGioiHan<T>(
  items: T[],
  gioiHan: number,
  worker: (item: T, index: number) => Promise<void>,
) {
  let i = 0;
  const runners = Array.from({ length: Math.max(1, Math.min(gioiHan, items.length)) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
}

export type TrangThaiPhien = "dang_chay" | "tam_dung" | "hoan_thanh" | "that_bai" | "da_hoan_tac";
export type TrangThaiBang = "cho" | "dang_chay" | "hoan_thanh" | "that_bai" | "bo_qua";

export interface PhienBang {
  ten_bang: string;
  tong_dong: number;
  da_chuyen: number;
  offset_tiep: number;
  dich_dong_truoc: number | null;
  trang_thai: TrangThaiBang;
  loi: string | null;
}

export interface Phien {
  id: string;
  ngoai_id: string;
  che_do: "dry_run" | "that";
  trang_thai: TrangThaiPhien;
  tong_dong: number;
  da_chuyen: number;
  bat_dau: string;
  ket_thuc: string | null;
  loi: string | null;
  bang: PhienBang[];
}

export interface BaoCaoTuongThich {
  tuong_thich: boolean;
  luc: string;
  thieu_bang: string[];
  thieu_cot: { bang: string; cot: string[] }[];
  thieu_extension: string[];
  thieu_policy: number;
  bang_dich: number;
  bang_nguon: number;
  canh_bao: string[];
}
