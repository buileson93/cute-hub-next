/**
 * Token mật độ giao diện — dùng để đồng bộ padding/gap/scroll cho các trang.
 * Chỉ chứa hằng lớp Tailwind, không có logic runtime.
 */
export const UI_DENSITY = {
  PAGE_PADDING: "px-4 py-4 lg:px-6",
  SECTION_GAP: "space-y-4",
  TABLE_MAX_H: "max-h-[calc(100vh-16rem)]",
  HEADER_GAP: "gap-2",
} as const;

export type UiDensityKey = keyof typeof UI_DENSITY;
