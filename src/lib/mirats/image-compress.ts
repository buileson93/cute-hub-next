// ============================================================================
// image-compress — nén ảnh phía trình duyệt trước khi tải lên storage.
//
// Thu nhỏ ảnh về cạnh dài tối đa `maxSize` và xuất WebP (nếu trình duyệt hỗ
// trợ) để giảm dung lượng đáng kể, giữ ảnh nhẹ cho logo / hình đại diện.
// ============================================================================

export type CompressOptions = {
  /** Cạnh dài tối đa (px). Mặc định 512 — đủ nét cho logo. */
  maxSize?: number;
  /** Chất lượng nén 0..1. Mặc định 0.82. */
  quality?: number;
  /** Định dạng đầu ra. Mặc định "image/webp". */
  mimeType?: string;
};

/**
 * Nén một tệp ảnh. Trả về File mới (WebP) đã thu nhỏ.
 * Nếu vì lý do nào đó không nén được, trả về tệp gốc.
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const { maxSize = 512, quality = 0.82, mimeType = "image/webp" } = opts;

  // SVG là vector, không cần nén raster.
  if (file.type === "image/svg+xml") return file;
  if (typeof window === "undefined" || typeof document === "undefined") return file;

  try {
    const bitmap = await loadBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    if ("close" in bitmap) (bitmap as ImageBitmap).close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mimeType, quality),
    );
    if (!blob) return file;

    // Nếu nén không có lợi (ảnh đã rất nhỏ), giữ tệp gốc.
    if (blob.size >= file.size && file.type !== mimeType) return file;

    const ext = mimeType === "image/webp" ? "webp" : mimeType === "image/jpeg" ? "jpg" : "png";
    const base = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${base}.${ext}`, { type: mimeType });
  } catch {
    return file;
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* rơi về HTMLImageElement */
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không đọc được ảnh"));
    };
    img.src = url;
  });
}
