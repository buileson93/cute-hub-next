// Bảng màu preset dùng chung cho Chủng loại & Nhãn tài sản (shelf.nu-style).
// Thuần logic — KHÔNG import supabase, không phụ thuộc UI.
// `lop` là chuỗi class Tailwind: nền nhạt + chữ + viền, phù hợp badge/chip.

export interface MauPreset {
  token: string;
  ten: string;
  lop: string;
}

export const BANG_MAU: MauPreset[] = [
  {
    token: "do",
    ten: "Đỏ",
    lop: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-900",
  },
  {
    token: "cam",
    ten: "Cam",
    lop: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-200 dark:border-orange-900",
  },
  {
    token: "ho_phach",
    ten: "Hổ phách",
    lop: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900",
  },
  {
    token: "vang",
    ten: "Vàng",
    lop: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-200 dark:border-yellow-900",
  },
  {
    token: "luc",
    ten: "Lục",
    lop: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-200 dark:border-green-900",
  },
  {
    token: "luc_lam",
    ten: "Lục lam",
    lop: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-900",
  },
  {
    token: "lam",
    ten: "Lam",
    lop: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-900",
  },
  {
    token: "cham",
    ten: "Chàm",
    lop: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-200 dark:border-indigo-900",
  },
  {
    token: "tim",
    ten: "Tím",
    lop: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-900",
  },
  {
    token: "hong",
    ten: "Hồng",
    lop: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950/50 dark:text-pink-200 dark:border-pink-900",
  },
  {
    token: "xam",
    ten: "Xám",
    lop: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700",
  },
  {
    token: "nau",
    ten: "Nâu",
    lop: "bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-800/60 dark:text-stone-200 dark:border-stone-700",
  },
];

const FALLBACK: MauPreset = BANG_MAU.find((m) => m.token === "xam")!;

/** Tra màu theo token; null / không hợp lệ → màu xám fallback. */
export function mauTheoToken(token: string | null | undefined): MauPreset {
  if (!token) return FALLBACK;
  return BANG_MAU.find((m) => m.token === token) ?? FALLBACK;
}

/** Token màu mặc định gợi ý theo nhóm nhãn tài sản (lịch sử tương thích). */
export function mauMacDinhTheoNhom(nhom: "chuc_nang" | "bang_tan" | "khac"): string {
  switch (nhom) {
    case "chuc_nang":
      return "lam";
    case "bang_tan":
      return "tim";
    case "khac":
      return "xam";
  }
}
