export interface PreprocessOptions {
  grayscale?: boolean;
  contrast?: number; // 0 to 2
  brightness?: number; // 0 to 2
  threshold?: number; // 0 to 255, null for adaptive
  denoise?: boolean;
}

/**
 * Image preprocessing for OCR enhancement.
 */
export function preprocessImage(
  canvas: HTMLCanvasElement, 
  options: PreprocessOptions = {}
): HTMLCanvasElement {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  const {
    grayscale = true,
    contrast = 1.2,
    brightness = 1.0,
    threshold = null,
    denoise = false
  } = options;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Grayscale
    if (grayscale) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = g = b = gray;
    }

    // 2. Brightness & Contrast
    // NewColor = (OldColor - 128) * contrast + 128 + brightnessOffset
    if (contrast !== 1.0 || brightness !== 1.0) {
      const bOffset = (brightness - 1.0) * 255;
      r = Math.min(255, Math.max(0, (r - 128) * contrast + 128 + bOffset));
      g = Math.min(255, Math.max(0, (g - 128) * contrast + 128 + bOffset));
      b = Math.min(255, Math.max(0, (b - 128) * contrast + 128 + bOffset));
    }

    // 3. Simple Thresholding (if enabled)
    if (threshold !== null) {
      const val = (r + g + b) / 3 >= threshold ? 255 : 0;
      r = g = b = val;
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  // Denoising usually requires more complex filters (e.g. median), 
  // skipping for now to keep performance high unless explicitly needed.

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Safely disposes of a canvas to free memory.
 */
export function disposeCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  canvas.width = 0;
  canvas.height = 0;
}
