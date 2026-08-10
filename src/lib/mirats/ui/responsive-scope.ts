/**
 * Thống nhất các hằng số Breakpoint cho toàn hệ thống MIRATS 2.0
 * Dựa trên cấu hình của StandardTable và Tailwind mặc định
 */

export const BP_PX = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof BP_PX;

export const MOBILE_BREAKPOINT_PX = BP_PX.md; // 768px

/**
 * Kiểm tra xem kích thước hiện tại có dưới một breakpoint nào đó không
 */
export const isBelow = (width: number, bp: Breakpoint): boolean => {
  return width < BP_PX[bp];
};

/**
 * Kiểm tra xem có đang ở chế độ Mobile không (dưới md)
 */
export const isMobileWidth = (width: number): boolean => {
  return width < MOBILE_BREAKPOINT_PX;
};
