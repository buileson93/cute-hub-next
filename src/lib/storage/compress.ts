/**
 * Nén tệp phía trình duyệt trước khi upload lên storage.
 *
 * - Ảnh (jpeg/png/webp/bmp/tiff): decode → resize (giữ tỉ lệ, cạnh dài ≤ maxDim)
 *   → encode WebP chất lượng ~0.82. Giữ nguyên nếu bản gốc đã nhỏ hơn, hoặc
 *   không hỗ trợ (SVG/GIF/AVIF/HEIC — trả về nguyên).
 * - PDF: dùng pdf-lib load rồi save với `useObjectStreams:true` — bỏ metadata
 *   thừa, gộp object stream. Nếu không giảm được thì trả về nguyên.
 *
 * Trả về Blob mới + contentType mới + số byte tiết kiệm. Path/tên file do
 * caller quyết định; ta KHÔNG đổi đuôi để không phá các call-site đang lưu
 * đường dẫn theo tên gốc (WebP phục vụ qua `.jpg` vẫn render đúng nhờ
 * Content-Type header).
 */

export interface CompressOptions {
  /** Cạnh dài tối đa (px) khi resize ảnh. Mặc định 3200 (giữ chất lượng). */
  maxDim?: number;
  /** Chất lượng WebP 0..1. Mặc định 0.92 (gần như không nhìn thấy khác biệt). */
  quality?: number;
  /** Bỏ qua nén (upload nguyên bản). */
  skip?: boolean;
}

export interface CompressResult {
  blob: Blob;
  contentType: string;
  originalSize: number;
  newSize: number;
  compressed: boolean;
  kind: "image" | "pdf" | "passthrough";
}

const IMAGE_COMPRESSIBLE = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/bmp", "image/tiff", "image/x-png", "image/x-ms-bmp",
]);
// Giữ nguyên: vector, GIF động, AVIF (đã tối ưu), HEIC (trình duyệt không decode được).
const IMAGE_KEEP = new Set([
  "image/svg+xml", "image/gif", "image/avif",
  "image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence",
]);

function inferType(input: Blob | File): string {
  if (input.type) return input.type;
  const name = (input as File).name?.toLowerCase() ?? "";
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".bmp")) return "image/bmp";
  if (name.endsWith(".tif") || name.endsWith(".tiff")) return "image/tiff";
  if (name.endsWith(".heic") || name.endsWith(".heif")) return "image/heic";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".avif")) return "image/avif";
  if (name.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

async function compressImage(file: Blob, maxDim: number, quality: number): Promise<Blob | null> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return null;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    // Thử WebP chất lượng cao trước; nếu trình duyệt không hỗ trợ, thử JPEG.
    const webp = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/webp", quality);
    });
    if (webp && webp.size > 0 && webp.type === "image/webp") return webp;
    const jpeg = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", Math.min(0.95, quality + 0.03));
    });
    return jpeg;
  } catch {
    return null;
  }
}

async function compressPdf(file: Blob): Promise<Blob | null> {
  try {
    const { PDFDocument } = await import("pdf-lib");
    const buf = await file.arrayBuffer();
    const doc = await PDFDocument.load(buf, { updateMetadata: false, ignoreEncryption: true });
    // Bỏ metadata tuỳ chỉnh — không cần cho file đính kèm.
    doc.setTitle(""); doc.setAuthor(""); doc.setSubject("");
    doc.setKeywords([]); doc.setProducer(""); doc.setCreator("");
    const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    return new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  } catch {
    return null;
  }
}

/**
 * Nén file cho upload. Không throw — nếu có lỗi thì trả về passthrough.
 */
export async function compressForUpload(
  file: Blob | File,
  opts: CompressOptions = {},
): Promise<CompressResult> {
  const originalSize = file.size;
  const type = inferType(file);

  if (opts.skip) {
    return { blob: file, contentType: type, originalSize, newSize: originalSize, compressed: false, kind: "passthrough" };
  }

  // Ảnh
  if (IMAGE_KEEP.has(type)) {
    return { blob: file, contentType: type, originalSize, newSize: originalSize, compressed: false, kind: "image" };
  }
  if (IMAGE_COMPRESSIBLE.has(type)) {
    const maxDim = opts.maxDim ?? 3200;
    const quality = opts.quality ?? 0.92;
    const out = await compressImage(file, maxDim, quality);
    if (out && out.size > 0 && out.size < originalSize) {
      const ct = out.type || "image/webp";
      return { blob: out, contentType: ct, originalSize, newSize: out.size, compressed: true, kind: "image" };
    }
    return { blob: file, contentType: type, originalSize, newSize: originalSize, compressed: false, kind: "image" };
  }

  // PDF
  if (type === "application/pdf") {
    const out = await compressPdf(file);
    if (out && out.size > 0 && out.size < originalSize) {
      return { blob: out, contentType: "application/pdf", originalSize, newSize: out.size, compressed: true, kind: "pdf" };
    }
    return { blob: file, contentType: "application/pdf", originalSize, newSize: originalSize, compressed: false, kind: "pdf" };
  }

  return { blob: file, contentType: type, originalSize, newSize: originalSize, compressed: false, kind: "passthrough" };
}

export function formatSavings(r: CompressResult): string {
  if (!r.compressed) return "";
  const pct = Math.round((1 - r.newSize / r.originalSize) * 100);
  const kb = (n: number) => (n / 1024).toFixed(0);
  return `${kb(r.originalSize)} KB → ${kb(r.newSize)} KB (−${pct}%)`;
}

/**
 * SHA-256 hex của một Blob — dùng để dedup nội dung (content-addressed storage).
 * Trình duyệt hiện đại đều có `crypto.subtle`. Trả về "" nếu không khả dụng.
 */
export async function sha256Hex(blob: Blob): Promise<string> {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return "";
    const buf = await blob.arrayBuffer();
    const digest = await subtle.digest("SHA-256", buf);
    const bytes = new Uint8Array(digest);
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0");
    return s;
  } catch {
    return "";
  }
}

/** Chạy tối đa `limit` job song song, giữ nguyên thứ tự kết quả. */
export async function runQueue<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const n = Math.max(1, Math.min(limit, items.length || 1));
  const runners: Promise<void>[] = [];
  for (let k = 0; k < n; k++) {
    runners.push((async () => {
      while (true) {
        const i = cursor++;
        if (i >= items.length) return;
        results[i] = await worker(items[i], i);
      }
    })());
  }
  await Promise.all(runners);
  return results;
}