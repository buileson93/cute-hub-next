// ============================================================================
// crop-image — cắt ảnh phía trình duyệt theo vùng chọn của react-easy-crop.
// Trả về Blob (mặc định WebP) đã cắt vuông/tỉ lệ để hiển thị như avatar.
// ============================================================================

export type CropPixels = { x: number; y: number; width: number; height: number };

/** Tải một ảnh (dataURL / objectURL) thành HTMLImageElement. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Không đọc được ảnh"));
    img.src = src;
  });
}

/**
 * Cắt ảnh theo vùng pixel, thu nhỏ về `outSize` (cạnh dài tối đa) và xuất Blob.
 * Dùng WebP nếu trình duyệt hỗ trợ, quality mặc định 0.9.
 */
export async function getCroppedBlob(
  imageSrc: string,
  crop: CropPixels,
  opts: { outSize?: number; mimeType?: string; quality?: number } = {},
): Promise<Blob> {
  const { outSize = 640, mimeType = "image/webp", quality = 0.9 } = opts;
  const img = await loadImage(imageSrc);

  const scale = Math.min(1, outSize / Math.max(crop.width, crop.height));
  const w = Math.max(1, Math.round(crop.width * scale));
  const h = Math.max(1, Math.round(crop.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Không tạo được canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, quality),
  );
  if (!blob) throw new Error("Không xuất được ảnh");
  return blob;
}

/** Đọc File/Blob thành dataURL để đưa vào cropper. */
export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Không đọc được tệp"));
    reader.readAsDataURL(file);
  });
}
