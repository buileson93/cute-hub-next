import { KHONG_CO } from "./format";

/**
 * ERP Chart Formatters standardizing number and date presentation.
 * Enforces 'vi-VN' locale and consistent decimal precision.
 */

export const chartNumberFormatter = (
  value: number | null | undefined,
  unit?: string,
  precision = 0
): string => {
  if (value == null || !Number.isFinite(value)) return KHONG_CO;
  
  const formatted = new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
  
  return unit ? `${formatted} ${unit}` : formatted;
};

export const chartCurrencyFormatter = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(value)) return KHONG_CO;
  
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr`;
  }
  
  return new Intl.NumberFormat("vi-VN").format(value);
};

export const chartDateFormatter = (
  value: string | number | Date | null | undefined,
  format: "short" | "full" = "short"
): string => {
  if (!value) return KHONG_CO;
  const date = new Date(value);
  if (isNaN(date.getTime())) return KHONG_CO;
  
  if (format === "short") {
    // Return MM/YY or similar for axis
    return date.toLocaleDateString("vi-VN", { month: "2-digit", year: "2-digit" });
  }
  
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
