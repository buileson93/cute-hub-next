import * as pdfjsLib from "pdfjs-dist";
import { RawPdfItem, linesFromItems } from "../gpkt-pdf-parse";

// eslint-disable-next-line import/no-unresolved
import PdfWorker from "pdfjs-dist/build/pdf.worker.mjs?worker";

let workerInitialized = false;
function ensureWorker() {
  if (workerInitialized) return;
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = new PdfWorker();
  workerInitialized = true;
}

export interface PdfPageData {
  pageNumber: number;
  text: string;
  viewport: any;
  render: (canvas: HTMLCanvasElement, dpi: number) => Promise<void>;
}

export class PdfExtractor {
  private pdf: any = null;

  async load(file: Blob): Promise<number> {
    ensureWorker();
    const buf = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: buf });
    this.pdf = await loadingTask.promise;
    return this.pdf.numPages;
  }

  async getPage(pageNumber: number): Promise<PdfPageData> {
    if (!this.pdf) throw new Error("PDF not loaded");
    
    const page = await this.pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = linesFromItems(textContent.items as RawPdfItem[]);
    const viewport = page.getViewport({ scale: 1.0 });

    return {
      pageNumber,
      text,
      viewport,
      render: async (canvas: HTMLCanvasElement, dpi: number) => {
        const scale = dpi / 72; // PDF is 72 DPI
        const scaledViewport = page.getViewport({ scale });
        
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        
        const ctx = canvas.getContext("2d");
        await page.render({
          canvasContext: ctx,
          viewport: scaledViewport
        }).promise;
      }
    };
  }

  async close() {
    if (this.pdf) {
      await this.pdf.destroy();
      this.pdf = null;
    }
  }
}
