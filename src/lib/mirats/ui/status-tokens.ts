export const TRANG_THAI_TOKEN = {
  "Đang khai thác": {
    class: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-500",
    kyHieu: "●",
  },
  "Đang sử dụng": {
    class: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-500",
    kyHieu: "●",
  },
  "Dự phòng": {
    class: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
    dot: "bg-sky-500",
    kyHieu: "○",
  },
  "Đang sửa chữa": {
    class: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    dot: "bg-amber-500",
    kyHieu: "⚠",
  },
  "Hỏng": {
    class: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
    dot: "bg-red-500",
    kyHieu: "✖",
  },
  "Chờ thanh lý": {
    class: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30 border-dashed",
    dot: "bg-orange-500",
    kyHieu: "◐",
  },
  "Đã thanh lý": {
    class: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
    dot: "bg-slate-500",
    kyHieu: "⊘",
  },
  "Ngừng hoạt động": {
    class: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
    dot: "bg-slate-500",
    kyHieu: "□",
  },
} as const;

export type TrangThaiMa = keyof typeof TRANG_THAI_TOKEN;

export function getTrangThaiToken(trangThai: string | null) {
  if (!trangThai) return null;
  return TRANG_THAI_TOKEN[trangThai as TrangThaiMa] || {
    class: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
    kyHieu: "•",
  };
}
