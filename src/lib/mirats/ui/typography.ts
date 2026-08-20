import { UI_DENSITY } from "./ui-density";

/**
 * NGUỒN SỰ THẬT DUY NHẤT CHO TYPOGRAPHY (HỌ CHỮ) MIRATS.
 * 
 * Quy tắc:
 * 1. Chỉ tồn tại 7 bậc bên dưới. Bậc nào không có trong bảng này thì KHÔNG TỒN TẠI trong hệ thống.
 * 2. Tái sử dụng tối đa các giá trị từ UI_DENSITY để đảm bảo đồng bộ mật độ (Density).
 * 3. Hỗ trợ 3 mức: compact, comfortable, spacious qua data-[density].
 * 4. BODY compact >= 12px. LABEL >= 11px.
 */
export const TYPO = {
  /**
   * DISPLAY: Dùng cho số liệu KPI cực lớn, tiêu đề Hero hoặc các mốc quan trọng.
   * KHÔNG DÙNG cho văn bản thông thường hoặc tiêu đề trang.
   */
  DISPLAY: `${UI_DENSITY.KPI_VALUE_FS} leading-none tracking-tight`,

  /**
   * H1: Tiêu đề trang chính (Main Page Header). 
   * Mỗi trang chỉ nên có một H1.
   */
  H1: "text-[20px] data-[density=comfortable]:text-[24px] data-[density=spacious]:text-[28px] font-bold leading-tight tracking-tight",

  /**
   * H2: Tiêu đề phân đoạn lớn (Section Header).
   * Dùng để chia các khối nội dung chính trong trang.
   */
  H2: "text-[16px] data-[density=comfortable]:text-[18px] data-[density=spacious]:text-[22px] font-semibold leading-snug",

  /**
   * H3: Tiêu đề nhóm, tiêu đề Widget hoặc tiêu đề Card con.
   */
  H3: "text-[14px] data-[density=comfortable]:text-[16px] data-[density=spacious]:text-[18px] font-semibold leading-normal",

  /**
   * BODY: Văn bản nội dung chính.
   * Dùng cho mô tả, đoạn văn, hội thoại. 
   * Tái sử dụng TEXT_BODY từ UI_DENSITY.
   */
  BODY: UI_DENSITY.TEXT_BODY,

  /**
   * LABEL: Nhãn form, tiêu đề bảng, chú thích nhỏ.
   * Tái sử dụng TEXT_LABEL/TABLE_HEADER_FS từ UI_DENSITY.
   * Luôn đi kèm uppercase và tracking-wider.
   */
  LABEL: UI_DENSITY.TEXT_LABEL,

  /**
   * MONO: Dữ liệu số kỹ thuật, mã định danh, tọa độ.
   * Tái sử dụng TEXT_MONO từ UI_DENSITY.
   * Phải có font-mono và tabular-nums.
   */
  MONO: `${UI_DENSITY.TEXT_MONO} text-[12px] data-[density=comfortable]:text-[13px]`,
} as const;

export type TypoLevel = keyof typeof TYPO;
