/**
 * @file status-tokens.ts
 * @description Nguồn sự thật duy nhất cho các token trạng thái trong MIRATS.
 * Sử dụng biến semantic từ astryx-component-skins.css.
 */

export interface StatusToken {
  /** Class CSS semantic (ví dụ: astryx-status-attention) */
  color: string;
  /** Tên Lucide icon (ví dụ: status.success, status.warning) */
  icon: string;
  /** Nhãn hiển thị tiếng Việt */
  label: string;
  /** Ký hiệu bổ trợ cho in đen trắng hoặc màn hình nhỏ */
  kyHieu: string;
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
    color: "astryx-status-attention", // Success-like in Astryx skins
    icon: "status.success",
    label: "Đang khai thác",
    kyHieu: "●",
  },
  DANG_SUA_CHUA: {
    color: "astryx-status-warning",
    icon: "status.warning",
    label: "Đang sửa chữa",
    kyHieu: "⚠",
  },
  HONG: {
    color: "astryx-status-danger",
    icon: "status.danger",
    label: "Hỏng",
    kyHieu: "✖",
  },
  CHO_XU_LY: {
    color: "astryx-status-info",
    icon: "entity.history",
    label: "Chờ xử lý",
    kyHieu: "◐",
  },
  NGUNG_KHAI_THAC: {
    color: "astryx-status-normal",
    icon: "action.close",
    label: "Ngừng khai thác",
    kyHieu: "□",
  },
  THANH_LY: {
    color: "astryx-status-normal",
    icon: "action.close",
    label: "Thanh lý",
    kyHieu: "⊘",
  },
  
  // Các mã khác dùng cho domain khác hoặc alias
  DU_PHONG: {
    color: "astryx-status-info",
    icon: "entity.asset",
    label: "Dự phòng",
    kyHieu: "○",
  },
  KE_HOACH: {
    color: "astryx-status-info",
    icon: "entity.calendar",
    label: "Kế hoạch",
    kyHieu: "📅",
  },
  HOAN_THANH: {
    color: "astryx-status-attention",
    icon: "status.success",
    label: "Hoàn thành",
    kyHieu: "✔",
  },
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
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[MIRATS UI] Mã trạng thái lạ gặp phải: "${rawKey}" tại domain "${domain}"`);
  }
  
  return {
    ...FALLBACK_TOKEN,
    label: rawKey,
  };
}

const FALLBACK_TOKEN: StatusToken = {
  color: "astryx-status-normal",
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
