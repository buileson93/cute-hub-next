/**
 * Formats a value for display in the change log.
 */
export function formatVal(v: any): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Có" : "Không";
  if (v instanceof Date) return v.toLocaleString("vi-VN");
  return String(v);
}
