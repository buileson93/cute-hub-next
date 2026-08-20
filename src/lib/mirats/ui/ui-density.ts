/**
 * Token mật độ giao diện — nguồn sự thật duy nhất cho padding/gap/size.
 * Các giá trị này hỗ trợ cả data-density="comfortable" và "compact".
 */
export const UI_DENSITY = {
  // --- Spacing & Layout ---
  PAGE_PADDING: "p-2 md:p-3 data-[density=comfortable]:p-4 md:data-[density=comfortable]:p-6 data-[density=spacious]:p-6 md:data-[density=spacious]:p-8",
  SECTION_GAP: "gap-2 data-[density=comfortable]:gap-4 data-[density=spacious]:gap-6",
  HEADER_GAP: "gap-1 data-[density=comfortable]:gap-2 data-[density=spacious]:gap-3",

  // --- AppShell specific ---
  APP_HEADER_H: "h-11 data-[density=comfortable]:h-14 data-[density=spacious]:h-16",
  RAIL_W: "w-[56px] data-[density=comfortable]:w-16 data-[density=spacious]:w-20",
  SIDEBAR_W: "w-[208px] data-[density=comfortable]:w-64 data-[density=spacious]:w-72",

  // --- Mobile & Safe Area ---
  MOBILE_NAV_H: "pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1", // Chiều cao padding cho MobileNav
  SAFE_AREA_BOTTOM: "env(safe-area-inset-bottom)",
  MOBILE_NAV_TOTAL_H: "calc(3.5rem + env(safe-area-inset-bottom))", // 56px + safe area


  // --- Container breakpoints for Responsive Tables ---
  CONT_MD: 768,
  CONT_SM: 480,

  // --- Cards ---
  CARD_RADIUS: "rounded-2xl data-[density=comfortable]:rounded-3xl data-[density=spacious]:rounded-4xl",
  CONTROL_RADIUS: "rounded-xl data-[density=comfortable]:rounded-2xl",
  BADGE_RADIUS: "rounded-full",
  CARD_PADDING: "p-3 data-[density=comfortable]:p-5 data-[density=spacious]:p-8",
  CARD_HEADER: "px-3 pt-3 pb-1 data-[density=comfortable]:px-5 data-[density=comfortable]:pt-5 data-[density=comfortable]:pb-3",

  // --- KPI ---
  KPI_LABEL_FS: "text-[11px] data-[density=comfortable]:text-[13px] text-muted-foreground",
  KPI_VALUE_FS: "text-[18px] data-[density=comfortable]:text-[22px] data-[density=spacious]:text-[26px] font-bold tabular-nums",

  // --- Tables ---
  TABLE_ROW_H: "h-7 data-[density=comfortable]:h-8 data-[density=spacious]:h-11",
  TABLE_HEADER_FS: "text-[11px] data-[density=comfortable]:text-[12px] text-muted-foreground uppercase tracking-wider font-bold",
  TABLE_CELL_PX: "px-1.5 data-[density=comfortable]:px-3.5 data-[density=spacious]:px-4",
  TABLE_CELL_PY: "py-0.5 data-[density=comfortable]:py-1.5 data-[density=spacious]:py-2",
  TABLE_MAX_H: "max-h-[calc(100vh-8rem)] data-[density=comfortable]:max-h-[calc(100vh-10rem)]",

  // --- Controls & Icons ---
  CONTROL_H: "h-7 data-[density=comfortable]:h-8 data-[density=spacious]:h-9",
  CONTROL_PX: "px-2 data-[density=comfortable]:px-3 data-[density=spacious]:px-4",
  CONTROL_FS: "text-[11px] data-[density=comfortable]:text-[13px] data-[density=spacious]:text-[14px]",
  ICON_SM: "h-3 w-3 data-[density=comfortable]:h-4 data-[density=comfortable]:w-4",
  ICON_MD: "h-3.5 w-3.5 data-[density=comfortable]:h-4.5 data-[density=comfortable]:w-4.5 data-[density=spacious]:h-5 data-[density=spacious]:w-5",

  // --- Typography (Plex Mono for numbers/code) ---
  TEXT_BODY: "text-[12px] data-[density=comfortable]:text-[14px] data-[density=spacious]:text-[15px] leading-relaxed",
  TEXT_LABEL: "text-[11px] data-[density=comfortable]:text-[13px] font-medium uppercase tracking-wider",
  TEXT_MONO: "font-mono tabular-nums tracking-tight",
  CHART_H: "h-[200px] data-[density=comfortable]:h-[220px] data-[density=spacious]:h-[260px]",
} as const;

export type UiDensityKey = keyof typeof UI_DENSITY;
export type UiDensityMode = "compact" | "comfortable" | "spacious";


