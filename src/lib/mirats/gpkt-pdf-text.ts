// ============================================================================
// Trích xuất text thô từ PDF ngay trên trình duyệt bằng pdfjs-dist.
// Dùng làm bước Tầng-1 cho GPKT: có text sạch → regex parser hoạt động,
// không cần gọi AI. Nếu PDF là ảnh scan hoặc thiếu text-layer thì trả về
// chuỗi rỗng để caller quyết định fallback sang AI.
// ============================================================================
import * as pdfjsLib from "pdfjs-dist";
// eslint-disable-next-line import/no-unresolved
import PdfWorker from "pdfjs-dist/build/pdf.worker.mjs?worker";

let workerInitialized = false;
function ensureWorker() {
  if (workerInitialized) return;
  (pdfjsLib as unknown as { GlobalWorkerOptions: { workerPort: Worker | null } })
    .GlobalWorkerOptions.workerPort = new PdfWorker();
  workerInitialized = true;
}

export async function extractPdfText(file: File): Promise<string> {
  ensureWorker();
  const buf = await file.arrayBuffer();
  const loadingTask = (pdfjsLib as unknown as {
    getDocument: (src: { data: ArrayBuffer }) => { promise: Promise<{
      numPages: number;
      getPage: (n: number) => Promise<{
        getTextContent: () => Promise<{ items: Array<{ str?: string; transform?: number[] }> }>;
      }>;
    }> };
  }).getDocument({ data: buf });
  const pdf = await loadingTask.promise;
  const chunks: string[] = [];
  const maxPages = Math.min(pdf.numPages, 6);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    // Gom theo Y để tạo "dòng", loại bỏ text xoay (watermark dọc).
    const lines = new Map<number, string[]>();
    for (const it of tc.items) {
      const str = (it.str ?? "").trim();
      if (!str) continue;
      const t = it.transform ?? [1, 0, 0, 1, 0, 0];
      if (Math.abs(t[1]) > 0.3) continue; // bỏ chữ xoay/watermark
      const y = Math.round(t[5]);
      const arr = lines.get(y) ?? [];
      arr.push(str);
      lines.set(y, arr);
    }
    const ys = Array.from(lines.keys()).sort((a, b) => b - a);
    for (const y of ys) chunks.push((lines.get(y) ?? []).join(" "));
    chunks.push("");
  }
  return chunks.join("\n");
}
