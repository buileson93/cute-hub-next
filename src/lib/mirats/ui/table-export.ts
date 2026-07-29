// ============================================================================
// Tiện ích xuất CSV dùng chung cho mọi bảng (StandardTable).
//  • Xuất theo TẬP DÒNG (đang chọn / đã lọc / trang hiện tại).
//  • Xuất theo CỘT ĐANG HIỂN THỊ hoặc cột tự chọn.
//  • Có BOM UTF-8 để Excel tiếng Việt mở đúng.
// ============================================================================

export type ExportCol<T> = {
  key: string;
  label: string;
  value?: (row: T) => unknown;
  exportHeader?: string;
  exportValue?: (row: T) => unknown;
};

export type ExportScope = "selected" | "filtered" | "page";

export const SCOPE_LABEL: Record<ExportScope, string> = {
  selected: "Các dòng đã chọn",
  filtered: "Toàn bộ dòng sau khi lọc",
  page: "Trang đang xem",
};

export function csvCell(v: unknown, sep: string): string {
  const s = v === null || v === undefined ? "" : String(v);
  const needQuote = s.includes('"') || s.includes("\n") || s.includes("\r") || s.includes(sep);
  return needQuote ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Chỉ giữ những cột thực sự lấy được giá trị để xuất. */
export function exportableCols<T>(cols: readonly ExportCol<T>[]): ExportCol<T>[] {
  return cols.filter((c) => typeof (c.exportValue ?? c.value) === "function");
}

export function buildCsv<T>(
  rows: readonly T[],
  cols: readonly ExportCol<T>[],
  sep = ";",
): string {
  const use = exportableCols(cols);
  const header = use.map((c) => csvCell(c.exportHeader ?? c.label, sep)).join(sep);
  const body = rows
    .map((r) => use.map((c) => csvCell((c.exportValue ?? c.value)!(r), sep)).join(sep))
    .join("\r\n");
  return header + "\r\n" + body;
}

export function slugTen(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "bang";
}

export function taiFileCsv(tenFile: string, noiDung: string) {
  const blob = new Blob(["\uFEFF" + noiDung], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = tenFile;
  a.click();
  URL.revokeObjectURL(url);
}

/** Xuất nhanh không qua hộp thoại (dùng cho nút "Xuất CSV" 1 chạm). */
export function xuatCsv<T>(
  ten: string,
  rows: readonly T[],
  cols: readonly ExportCol<T>[],
  sep = ";",
) {
  const ngay = new Date().toISOString().slice(0, 10);
  taiFileCsv(`${slugTen(ten)}-${ngay}-${rows.length}-dong.csv`, buildCsv(rows, cols, sep));
}
