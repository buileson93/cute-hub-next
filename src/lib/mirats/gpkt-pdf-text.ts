// ============================================================================
// Trích xuất text từ PDF ngay trên trình duyệt bằng pdfjs-dist + tiền xử lý:
//  · lọc watermark chữ chéo/dọc (theo góc xoay của transform matrix)
//  · gộp fragment cùng dòng theo Y, sắp theo X, dán các mẩu bị xé
//  · nối các dòng liền kề bị ngắt vụn (dòng trước không kết thúc câu và
//    dòng sau bắt đầu bằng chữ thường / dấu tiếp diễn)
//  · chuẩn hoá toạ độ WGS-84 (DMS → decimal) kèm ngay bên cạnh giá trị gốc
//
// `linesFromItems` và `normalizeWgs84` là pure functions — tái sử dụng được
// trong Node/Vitest bằng cách nạp pdfjs "legacy" build.
// ============================================================================
import * as pdfjsLib from "pdfjs-dist";
// eslint-disable-next-line import/no-unresolved
import PdfWorker from "pdfjs-dist/build/pdf.worker.mjs?worker";
import { linesFromItems, normalizeWgs84, type RawPdfItem } from "./gpkt-pdf-parse";

export { linesFromItems, normalizeWgs84, isWatermarkItem } from "./gpkt-pdf-parse";
export type { RawPdfItem } from "./gpkt-pdf-parse";

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
        getTextContent: () => Promise<{ items: RawPdfItem[] }>;
      }>;
    }> };
  }).getDocument({ data: buf });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];
  const maxPages = Math.min(pdf.numPages, 8);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    pages.push(linesFromItems(tc.items));
  }
  return normalizeWgs84(pages.join("\n\n"));
}
