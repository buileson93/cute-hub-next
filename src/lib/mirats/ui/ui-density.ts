/**
 * Token mật độ giao diện — nguồn sự thật duy nhất cho padding/gap/size.
 * Các giá trị này hỗ trợ cả data-density="comfortable" và "compact".
 */
export const UI_DENSITY = {
  // --- Spacing & Layout ---
  PAGE_PADDING: "p-4 md:p-6 data-[density=compact]:p-3 md:data-[density=compact]:p-4",
  SECTION_GAP: "gap-4 data-[density=compact]:gap-3",
  HEADER_GAP: "gap-2 data-[density=compact]:gap-1.5",

  // --- AppShell specific ---
  APP_HEADER_H: "h-14 data-[density=compact]:h-[48px]",
  RAIL_W: "w-16 data-[density=compact]:w-[56px]",
  SIDEBAR_W: "w-64 data-[density=compact]:w-[208px]",


  // --- Cards ---
  CARD_PADDING: "p-6 data-[density=compact]:p-3 md:data-[density=compact]:p-4",
  CARD_HEADER: "p-6 data-[density=compact]:px-4 data-[density=compact]:pt-3 data-[density=compact]:pb-2",

  // --- Tables ---
  TABLE_ROW_H: "h-10 data-[density=compact]:h-9",
  TABLE_CELL_PX: "px-2 data-[density=compact]:px-3",
  TABLE_CELL_PY: "py-2 data-[density=compact]:py-1.5",
  TABLE_MAX_H: "max-h-[calc(100vh-16rem)] data-[density=compact]:max-h-[calc(100vh-12rem)]",

  // --- Controls & Icons ---
  CONTROL_H: "h-9 data-[density=compact]:h-8",
  ICON_SM: "h-4 w-4 data-[density=compact]:h-3.5 data-[density=compact]:w-3.5",
  ICON_MD: "h-5 w-5 data-[density=compact]:h-4 data-[density=compact]:w-4",

  // --- Typography ---
  TEXT_BODY: "text-sm data-[density=compact]:text-[13px]",
  TEXT_LABEL: "text-xs data-[density=compact]:text-[12px]",
} as const;

export type UiDensityKey = keyof typeof UI_DENSITY;
export type UiDensityMode = "comfortable" | "compact";


