// ============================================================================
// Tiện ích xuất CSV dùng chung cho mọi bảng (StandardTable).
//  • Xuất theo TẬP DÒNG (đang chọn / đã lọc / trang hiện tại).
//  • Xuất theo CỘT ĐANG HIỂN THỊ hoặc cột tự chọn.
//  • Có BOM UTF-8 để Excel tiếng Việt mở đúng.
// ============================================================================

export type ExportCol<T> = {
  key: string;
  label?: string;
  header?: string;
  value?: (row: T) => unknown;
  exportHeader?: string;
  exportValue?: (row: T) => unknown;
};

export type ExportScope = "selected" | "filtered" | "page";

export const SCOPE_LABEL: Record<ExportScope, string> = {
  selected: "Dòng đã chọn",
  filtered: "Toàn bộ dòng đã tải",
  page: "Dòng đang hiển thị (viewport)",
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

export async function buildCsv<T>(
  rows: readonly T[],
  cols: readonly ExportCol<T>[],
  sep = ";",
  onProgress?: (progress: number) => void
): Promise<string> {
  const use = exportableCols(cols);
  const header = use
    .map((c) => csvCell(c.exportHeader || c.header || c.label || "", sep))
    .join(sep);
  
  const CHUNK_SIZE = 500;
  const total = rows.length;
  let body = "";
  
  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const chunkCsv = chunk
      .map((r) => use.map((c) => csvCell((c.exportValue ?? c.value)!(r), sep)).join(sep))
      .join("\r\n");
    
    body += (body ? "\r\n" : "") + chunkCsv;
    
    if (onProgress) {
      onProgress(Math.min(100, Math.round(((i + chunk.length) / total) * 100)));
    }
    
    // Give time for UI to breathe
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  
  return header + "\r\n" + body;
}

export function slugTen(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/gi, "d")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "bang"
  );
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
export async function xuatCsv<T>(
  ten: string,
  rows: readonly T[],
  cols: readonly ExportCol<T>[],
  sep = ";",
) {
  const ngay = new Date().toISOString().slice(0, 10);
  const csv = await buildCsv(rows, cols, sep);
  taiFileCsv(`${slugTen(ten)}-${ngay}-${rows.length}-dong.csv`, csv);
}
