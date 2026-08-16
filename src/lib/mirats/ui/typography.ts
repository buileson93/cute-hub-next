/**
 * MIRATS UI Typography Standard
 * Mapping arbitrary classes to 6 semantic tiers.
 */

export const TYPOGRAPHY = {
  // meta: 11px - Metadata, small tags, captive mono numbers
  meta: "text-[11px] leading-tight font-medium tracking-tight",
  
  // bodySm: 12px - Secondary body, table cells, secondary labels
  bodySm: "text-[12px] leading-normal",
  
  // body: 14px - Primary reading text, form labels
  body: "text-[14px] leading-relaxed",
  
  // title: 16px - Block headings, card titles
  title: "text-[16px] font-semibold leading-snug tracking-tight",
  
  // pageTitle: 20px - Page headers, modal titles
  pageTitle: "text-[20px] font-bold leading-tight tracking-tighter font-display",
  
  // display: 24px - Dashboard KPIs, hero text
  display: "text-[24px] font-extrabold leading-none tracking-tighter font-display",
} as const;
