/**
 * NGUỒN SỰ THẬT DUY NHẤT (SINGLE SOURCE OF TRUTH) về ngưỡng màn hình (Breakpoints).
 * Mọi component và hook trong hệ thống MIRATS phải import hằng số từ đây
 * để đảm bảo tính đồng nhất giữa CSS (Tailwind) và JS.
 */

export const BP_PX = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof BP_PX;

/**
 * Ngưỡng để xác định chế độ Mobile.
 * Mặc định khớp với 'md' (768px) của Tailwind.
 */
export const MOBILE_BREAKPOINT_PX = BP_PX.md;

/**
 * Ngưỡng để xác định chế độ Tablet.
 * Dưới 'lg' (1024px) và từ 'md' trở lên.
 */
export const TABLET_BREAKPOINT_PX = BP_PX.lg;

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
