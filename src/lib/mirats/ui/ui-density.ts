/**
 * Token mật độ giao diện — nguồn sự thật duy nhất cho padding/gap/size.
 * Các giá trị này hỗ trợ cả data-density="comfortable" và "compact".
 */
export const UI_DENSITY = {
  // --- Spacing & Layout ---
  PAGE_PADDING: "p-3 md:p-4 data-[density=comfortable]:p-4 md:data-[density=comfortable]:p-6",
  SECTION_GAP: "gap-3 data-[density=comfortable]:gap-4",
  HEADER_GAP: "gap-1.5 data-[density=comfortable]:gap-2",

  // --- AppShell specific ---
  APP_HEADER_H: "h-12 data-[density=comfortable]:h-14",
  RAIL_W: "w-[56px] data-[density=comfortable]:w-16",
  SIDEBAR_W: "w-[208px] data-[density=comfortable]:w-64",




  // --- Cards ---
  CARD_RADIUS: "rounded-2xl", // 16px
  CONTROL_RADIUS: "rounded-lg", // 8px
  BADGE_RADIUS: "rounded-full",
  CARD_PADDING: "p-4",
  CARD_HEADER: "px-4 pt-4 pb-2",

  // --- KPI ---
  KPI_LABEL_FS: "text-[13px] text-muted-foreground",
  KPI_VALUE_FS: "text-[22px] font-semibold",

  // --- Tables ---
  TABLE_ROW_H: "h-9",
  TABLE_HEADER_FS: "text-[12px] text-muted-foreground uppercase tracking-wider",
  TABLE_CELL_PX: "px-3",
  TABLE_CELL_PY: "py-2",
  TABLE_MAX_H: "max-h-[calc(100vh-12rem)]",

  // --- Controls & Icons ---
  CONTROL_H: "h-8",
  ICON_SM: "h-3.5 w-3.5",
  ICON_MD: "h-4 w-4",

  // --- Typography ---
  TEXT_BODY: "text-[13px]",
  TEXT_LABEL: "text-[12px]",
  CHART_H: "h-[220px]",
} as const;

export type UiDensityKey = keyof typeof UI_DENSITY;
export type UiDensityMode = "comfortable" | "compact";


