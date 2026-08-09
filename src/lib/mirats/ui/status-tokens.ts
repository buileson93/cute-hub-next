/**
 * TRANG_THAI_TOKEN: Định nghĩa màu sắc và ký hiệu cho trạng thái tài sản.
 * Hỗ trợ ánh xạ cả theo mã (invariant code) và tên tiếng Việt (legacy).
 */
export const TRANG_THAI_TOKEN = {
  // --- Ánh xạ theo MÃ (Ưu tiên) ---
  DANG_KHAI_THAC: {
    class: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-500",
    kyHieu: "●",
    label: "Đang khai thác",
  },
  DANG_SU_DUNG: {
    class: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-500",
    kyHieu: "●",
    label: "Đang sử dụng",
  },
  DU_PHONG: {
    class: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
    dot: "bg-sky-500",
    kyHieu: "○",
    label: "Dự phòng",
  },
  DANG_SUA_CHUA: {
    class: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    dot: "bg-amber-500",
    kyHieu: "⚠",
    label: "Đang sửa chữa",
  },
  HONG: {
    class: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
    dot: "bg-red-500",
    kyHieu: "✖",
    label: "Hỏng",
  },
  CHO_XU_LY: {
    class: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30 border-dashed",
    dot: "bg-orange-500",
    kyHieu: "◐",
    label: "Chờ xử lý",
  },
  CHO_THANH_LY: {
    class: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30 border-dashed",
    dot: "bg-orange-500",
    kyHieu: "◐",
    label: "Chờ thanh lý",
  },
  THANH_LY: {
    class: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
    dot: "bg-slate-500",
    kyHieu: "⊘",
    label: "Thanh lý",
  },
  DA_THANH_LY: {
    class: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
    dot: "bg-slate-500",
    kyHieu: "⊘",
    label: "Đã thanh lý",
  },
  NGUNG_KHAI_THAC: {
    class: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
    dot: "bg-slate-500",
    kyHieu: "□",
    label: "Ngừng khai thác",
  },

  // --- Ánh xạ ngược theo TÊN (Legacy support) ---
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

/**
 * MUC_DO_SU_CO_TOKEN: Màu sắc cho mức độ nghiêm trọng của sự cố.
 */
export const MUC_DO_SU_CO_TOKEN = {
  "Nghiêm trọng": { class: "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-500/20" },
  "Cao": { class: "bg-orange-500/10 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border-orange-500/20" },
  "Trung bình": { class: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/20" },
  "Thấp": { class: "bg-slate-500/10 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 border-slate-500/20" },
} as const;


/**
 * LOAI_BAO_TRI_TOKEN: Màu sắc cho các loại hình bảo trì.
 */
export const LOAI_BAO_TRI_TOKEN = {
  "Định kỳ": { class: "bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border-sky-500/20" },
  "Đột xuất": { class: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/20" },
  "Hiệu chuẩn": { class: "bg-violet-500/10 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 border-violet-500/20" },
  "Nâng cấp": { class: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/20" },
} as const;


/**
 * PHUONG_AN_HONG_HOC_TOKEN: Màu sắc cho phương án xử lý hỏng hóc.
 */
export const PHUONG_AN_HONG_HOC_TOKEN = {
  "Sửa chữa": { class: "bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border-sky-500/20" },
  "Thay thế": { class: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/20" },
  "Thanh lý": { class: "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-500/20" },
} as const;


export type TrangThaiMa = keyof typeof TRANG_THAI_TOKEN;

/**
 * Lấy token giao diện cho trạng thái.
 * Chấp nhận cả mã (DANG_KHAI_THAC) và tên hiển thị (Đang khai thác).
 */
export function getTrangThaiToken(key: string | null) {
  if (!key) return null;
  const k = key.trim();
  return (TRANG_THAI_TOKEN as any)[k] || {
    class: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400",
    dot: "bg-slate-400",
    kyHieu: "•",
  };
}

/**
 * Lấy token giao diện cho mức độ sự cố.
 */
export function getMucDoSuCoToken(key: string | null) {
  if (!key) return null;
  return (MUC_DO_SU_CO_TOKEN as any)[key.trim()] || { class: "bg-slate-100 text-slate-600" };
}

/**
 * Lấy token giao diện cho loại bảo trì.
 */
export function getLoaiBaoTriToken(key: string | null) {
  if (!key) return null;
  return (LOAI_BAO_TRI_TOKEN as any)[key.trim()] || { class: "bg-slate-100 text-slate-600" };
}

/**
 * Lấy token giao diện cho phương án hỏng hóc.
 */
export function getPhuongAnHongHocToken(key: string | null) {
  if (!key) return null;
  return (PHUONG_AN_HONG_HOC_TOKEN as any)[key.trim()] || { class: "bg-slate-100 text-slate-600" };
}

/**
 * Lấy token giao diện cho loại bàn giao.
 */
export const LOAI_BAN_GIAO_TOKEN = {
  "Cấp phát": { class: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300" },
  "Thu hồi": { class: "bg-orange-500/10 text-orange-700 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-300" },
  "Luân chuyển": { class: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300" },
  "Mượn tạm": { class: "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300" },
} as const;

export function getLoaiBanGiaoToken(key: string | null) {
  if (!key) return null;
  return (LOAI_BAN_GIAO_TOKEN as any)[key.trim()] || { class: "bg-slate-100 text-slate-600" };
}

/**
 * Lấy token giao diện cho xếp loại tuổi thọ (A/B/C/D).
 */
export const XEP_LOAI_HEALTH_TOKEN = {
  A: { class: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20", hex: "#10b981" },
  B: { class: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20", hex: "#3b82f6" },
  C: { class: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20", hex: "#f59e0b" },
  D: { class: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20", hex: "#ef4444" },
} as const;

export function getXepLoaiHealthToken(key: string | null) {
  if (!key) return null;
  return (XEP_LOAI_HEALTH_TOKEN as any)[key.trim()] || { class: "bg-slate-100 text-slate-600", hex: "#666" };
}


