// ============================================================================
// Tiện ích xử lý chữ ký (canvas → ảnh) cho luồng cấp phát / bàn giao tài sản.
// Chỉ chứa hàm THUẦN, dễ test: chuyển dataURL sang Blob, dựng đường dẫn storage,
// kiểm tra hợp lệ. Việc upload storage do phía gọi thực hiện.
// ============================================================================

/** Bucket lưu ảnh chữ ký (private). */
export const CHU_KY_BUCKET = "chu-ky";

/** Kiểm tra một chuỗi có phải dataURL ảnh hợp lệ (PNG/JPEG) hay không. */
export function isValidSignatureDataUrl(s: string | null | undefined): boolean {
  if (!s) return false;
  return /^data:image\/(png|jpeg|jpg);base64,[A-Za-z0-9+/]+=*$/.test(s.trim());
}

/**
 * Chuyển dataURL (từ canvas.toDataURL) sang Blob để upload lên storage.
 * Ném lỗi nếu dataURL không hợp lệ.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const m = /^data:([^;]+);base64,(.*)$/.exec((dataUrl ?? "").trim());
  if (!m) throw new Error("dataURL không hợp lệ");
  const mime = m[1];
  const base64 = m[2];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Dựng đường dẫn lưu ảnh chữ ký trong bucket: "<thietBiId>/<uuid>.png".
 * Gom theo thư mục tài sản để dễ phân quyền / dọn dẹp.
 */
export function buildChuKyPath(thietBiId: string, ext = "png"): string {
  const id = (thietBiId ?? "").trim() || "unknown";
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${id}/${uuid}.${ext}`;
}
