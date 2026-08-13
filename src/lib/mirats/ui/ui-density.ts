/**
 * Token mật độ giao diện — dùng để đồng bộ padding/gap/scroll cho các trang.
 */
export const UI_DENSITY = {
  // Mặc định (Comfortable)
  PAGE_PADDING: "p-4 md:p-6",
  SECTION_GAP: "gap-4",
  HEADER_GAP: "gap-2",
  CARD_PADDING: "p-6",
  
  // Compact (Dùng qua CSS variables hoặc data-density="compact")
  COMPACT: {
    PAGE_PADDING: "p-3 md:p-4",
    SECTION_GAP: "gap-3",
    HEADER_GAP: "gap-1.5",
    CARD_PADDING: "p-4",
  }
} as const;

export type UiDensityKey = keyof typeof UI_DENSITY;
