/**
 * @file status-tokens.ts
 * @description Nguồn sự thật duy nhất cho các token trạng thái trong MIRATS.
 */
import { nguongCho } from "@/lib/mirats/han-canh-bao";

export interface StatusToken {
  /** Class CSS semantic (ví dụ: astryx-status-attention) */
  color: string;
  /** @deprecated Dùng color. Giữ lại để tương thích ngược. */
  class: string;
  /** @deprecated Giữ lại cho tương thích ngược ở trang tuổi thọ. */
  hex?: string;
  /** Tên Lucide icon (ví dụ: status.success, status.warning) */
  icon: string;
  /** Nhãn hiển thị tiếng Việt */
  label: string;
  /** Ký hiệu bổ trợ cho in đen trắng hoặc màn hình nhỏ */
  kyHieu: string;
  /** @deprecated Dùng dotOnly variant trong StatusBadge */
  dot?: string;
}

let warningCount = 0;

/** Trả về số lần gặp mã trạng thái không hợp lệ */
export const getWarningCount = () => warningCount;

/**
 * TYPO_STATUS: Bảng mã trạng thái chuẩn hóa (Invariant Codes).
 * Ưu tiên các mã từ DB: DANG_KHAI_THAC, DANG_SUA_CHUA, HONG, CHO_XU_LY, NGUNG_KHAI_THAC, THANH_LY.
 */
export const TYPO_STATUS = {
  // --- THIẾT BỊ / TÀI SẢN ---
  DANG_KHAI_THAC: {
    color: "astryx-status-attention",
    class: "astryx-status-attention",
    icon: "status.success",
    label: "Đang khai thác",
    kyHieu: "●",
  },
  DANG_SUA_CHUA: {
    color: "astryx-status-warning",
    class: "astryx-status-warning",
    icon: "status.warning",
    label: "Đang sửa chữa",
    kyHieu: "⚠",
  },
  HONG: {
    color: "astryx-status-danger",
    class: "astryx-status-danger",
    icon: "status.danger",
    label: "Hỏng",
    kyHieu: "✖",
  },
  CHO_XU_LY: {
    color: "astryx-status-info",
    class: "astryx-status-info",
    icon: "entity.history",
    label: "Chờ xử lý",
    kyHieu: "◐",
  },
  NGUNG_KHAI_THAC: {
    color: "astryx-status-normal",
    class: "astryx-status-normal",
    icon: "action.close",
    label: "Ngừng khai thác",
    kyHieu: "□",
  },
  THANH_LY: {
    color: "astryx-status-normal",
    class: "astryx-status-normal",
    icon: "action.close",
    label: "Thanh lý",
    kyHieu: "⊘",
  },
  
  // Các mã khác dùng cho domain khác hoặc alias
  DU_PHONG: {
    color: "astryx-status-info",
    class: "astryx-status-info",
    icon: "entity.asset",
    label: "Dự phòng",
    kyHieu: "○",
  },
  KE_HOACH: {
    color: "astryx-status-info",
    class: "astryx-status-info",
    icon: "entity.calendar",
    label: "Kế hoạch",
    kyHieu: "📅",
  },
  HOAN_THANH: {
    color: "astryx-status-attention",
    class: "astryx-status-attention",
    icon: "status.success",
    label: "Hoàn thành",
    kyHieu: "✔",
  },
  // Health A/B/C/D mapping
  A: { color: "astryx-status-attention", class: "astryx-status-attention", hex: "#10b981", icon: "status.success", label: "A", kyHieu: "A" },
  B: { color: "astryx-status-info", class: "astryx-status-info", hex: "#3b82f6", icon: "status.info", label: "B", kyHieu: "B" },
  C: { color: "astryx-status-warning", class: "astryx-status-warning", hex: "#f59e0b", icon: "status.warning", label: "C", kyHieu: "C" },
  D: { color: "astryx-status-danger", class: "astryx-status-danger", hex: "#ef4444", icon: "status.danger", label: "D", kyHieu: "D" },

  // --- OCR STATUS (Task 63) ---
  completed: { color: "astryx-status-attention", class: "astryx-status-attention", icon: "status.success", label: "Hoàn tất", kyHieu: "✔" },
  ocr_ready: { color: "astryx-status-attention", class: "astryx-status-attention", icon: "entity.history", label: "OCR Sẵn có", kyHieu: "🗄" },
  partial: { color: "astryx-status-warning", class: "astryx-status-warning", icon: "action.pause", label: "Một phần", kyHieu: "⏸" },
  failed: { color: "astryx-status-danger", class: "astryx-status-danger", icon: "status.danger", label: "Thất bại", kyHieu: "✖" },
  ocr_running: { color: "astryx-status-info", class: "astryx-status-info", icon: "status.loading", label: "Đang xử lý", kyHieu: "⏳" },
  extracting: { color: "astryx-status-info", class: "astryx-status-info", icon: "status.loading", label: "Đang giải nén", kyHieu: "⏳" },
  queued: { color: "astryx-status-normal", class: "astryx-status-normal", icon: "status.info", label: "Chờ xử lý", kyHieu: "○" },
  cancelled: { color: "astryx-status-normal", class: "astryx-status-normal", icon: "action.pause", label: "Đã hủy", kyHieu: "⊘" },

  // --- CONNECTIVITY / OFFLINE (Task 63) ---
  offline: { color: "astryx-status-warning", class: "astryx-status-warning", icon: "status.warning", label: "Offline", kyHieu: "📵" },
  syncing: { color: "astryx-status-info", class: "astryx-status-info", icon: "status.loading", label: "Đang đồng bộ", kyHieu: "🔄" },
  conflict: { color: "astryx-status-danger", class: "astryx-status-danger", icon: "status.danger", label: "Cần xử lý", kyHieu: "⚠" },
  online: { color: "astryx-status-attention", class: "astryx-status-attention", icon: "status.success", label: "Online", kyHieu: "📶" },

  // --- EXPIRY (Task 63) ---
  overdue: { color: "astryx-status-danger", class: "astryx-status-danger", icon: "status.danger", label: "Quá hạn", kyHieu: "‼" },
  urgent: { color: "astryx-status-danger", class: "astryx-status-danger", icon: "status.danger", label: "Khẩn cấp", kyHieu: "‼" },
  warning: { color: "astryx-status-warning", class: "astryx-status-warning", icon: "status.warning", label: "Sắp hết hạn", kyHieu: "⚠" },
  normal: { color: "astryx-status-normal", class: "astryx-status-normal", icon: "status.info", label: "Bình thường", kyHieu: "○" },
} as const;

/**
 * Bảng ánh xạ từ tên cũ (Legacy) hoặc tên tiếng Việt sang MÃ chuẩn.
 * Sẽ bị xóa bỏ trong tương lai.
 */
export const LEGACY_NAME_TO_MA: Record<string, keyof typeof TYPO_STATUS> = {
  "Đang khai thác": "DANG_KHAI_THAC",
  "Đang sử dụng": "DANG_KHAI_THAC",
  "DANG_SU_DUNG": "DANG_KHAI_THAC",
  "Đang sửa chữa": "DANG_SUA_CHUA",
  "Hỏng": "HONG",
  "Chờ xử lý": "CHO_XU_LY",
  "Chờ thanh lý": "CHO_XU_LY",
  "CHO_THANH_LY": "CHO_XU_LY",
  "Ngừng hoạt động": "NGUNG_KHAI_THAC",
  "NGUNG_HOAT_DONG": "NGUNG_KHAI_THAC",
  "Thanh lý": "THANH_LY",
  "Đã thanh lý": "THANH_LY",
  "DA_THANH_LY": "THANH_LY",
  "Dự phòng": "DU_PHONG",
  "Kế hoạch": "KE_HOACH",
  "Hoàn thành": "HOAN_THANH",
};

/**
 * Lấy token giao diện cho một mã trạng thái.
 * @param domain Phạm vi (thiet_bi, su_co, v.v.)
 * @param key Mã trạng thái hoặc tên hiển thị
 */
export function getStatusToken(domain: string, key: string | null): StatusToken {
  if (!key) return FALLBACK_TOKEN;
  
  const rawKey = key.trim();
  
  // 1. Kiểm tra nếu là mã chuẩn (Invariant Code)
  if (rawKey in TYPO_STATUS) {
    return (TYPO_STATUS as any)[rawKey];
  }
  
  // 2. Kiểm tra nếu là tên cũ (Legacy Name)
  if (rawKey in LEGACY_NAME_TO_MA) {
    const ma = LEGACY_NAME_TO_MA[rawKey];
    return (TYPO_STATUS as any)[ma];
  }
  
  // 3. Không nhận diện - Fallback + Cảnh báo
  warningCount++;
  
  // Log cảnh báo để test capture được và dev biết
  console.warn(`[MIRATS UI] Mã trạng thái lạ gặp phải: "${rawKey}" tại domain "${domain}"`);

  return {
    ...FALLBACK_TOKEN,
    label: rawKey,
  };
}

const FALLBACK_TOKEN: StatusToken = {
  color: "astryx-status-normal",
  class: "astryx-status-normal",
  icon: "status.info",
  label: "Không xác định",
  kyHieu: "•",
};

export const MUC_DO_SU_CO_TOKEN = TYPO_STATUS;
export const LOAI_BAO_TRI_TOKEN = TYPO_STATUS;
export const PHUONG_AN_HONG_HOC_TOKEN = TYPO_STATUS;
export const LOAI_BAN_GIAO_TOKEN = TYPO_STATUS;
export const XEP_LOAI_HEALTH_TOKEN = TYPO_STATUS;

// --- Khôi phục các hàm cũ để tránh lỗi import ở các file chưa migrate ---
export const TRANG_THAI_TOKEN = TYPO_STATUS;

export function getTrangThaiToken(key: string | null) { return getStatusToken('thiet_bi', key); }
export function getMucDoSuCoToken(key: string | null) { return getStatusToken('su_co', key); }
export function getLoaiBaoTriToken(key: string | null) { return getStatusToken('bao_tri', key); }
export function getPhuongAnHongHocToken(key: string | null) { return getStatusToken('hong_hoc', key); }
export function getLoaiBanGiaoToken(key: string | null) { return getStatusToken('ban_giao', key); }
export function getXepLoaiHealthToken(key: string | null) { return getStatusToken('health', key); }

/**
 * Tính mã trạng thái từ số ngày còn lại (Task 63).
 */
export function getExpiryCode(soNgay: number | null | undefined): string {
  if (soNgay == null || !Number.isFinite(soNgay)) return "normal";
  if (soNgay < 0) return "overdue";
  const n = nguongCho(soNgay);
  if (n === 30) return "urgent";
  if (n === 60 || n === 90) return "warning";
  return "normal";
}

/**
 * Tính nhãn từ số ngày còn lại (Task 63).
 */
export function getExpiryLabel(soNgay: number | null | undefined, compact = false): string {
  if (soNgay == null || !Number.isFinite(soNgay)) return "—";
  if (soNgay < 0) return compact ? `${Math.abs(soNgay)}` : `quá hạn ${Math.abs(soNgay)} ngày`;
  return compact ? `${soNgay}` : `còn ${soNgay} ngày`;
}
