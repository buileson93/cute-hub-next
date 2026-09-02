/**
 * Chính sách upload R2 — kiểm tra tại "trust boundary" (máy chủ).
 *
 * Thuần hàm, không phụ thuộc runtime nên dùng được cả ở trình duyệt (cảnh báo
 * sớm) lẫn máy chủ (chặn thật). KHÔNG tin `file.type` do client gửi: đuôi tệp
 * và MIME phải cùng thuộc allowlist thì mới cho ký URL upload.
 */

export type UploadCategory = "image" | "pdf" | "office" | "video" | "other";

/** MIME được phép theo nhóm. */
export const ALLOWED_MIME: Record<Exclude<UploadCategory, "other">, readonly string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"],
  pdf: ["application/pdf"],
  office: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/csv",
    "text/plain",
  ],
  video: ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"],
};

/** Giới hạn dung lượng theo nhóm (byte). */
export const MAX_SIZE: Record<UploadCategory, number> = {
  image: 25 * 1024 * 1024,
  pdf: 100 * 1024 * 1024,
  office: 100 * 1024 * 1024,
  video: 2 * 1024 * 1024 * 1024,
  other: 100 * 1024 * 1024,
};

/** Đuôi tệp thực thi / nguy hiểm — luôn chặn dù MIME có "sạch". */
const BLOCKED_EXT = new Set([
  "exe",
  "dll",
  "bat",
  "cmd",
  "com",
  "scr",
  "msi",
  "sh",
  "ps1",
  "jar",
  "apk",
  "vbs",
  "js",
  "mjs",
  "html",
  "htm",
  "svgz",
  "php",
]);

export function extOf(nameOrKey: string): string {
  return (nameOrKey.split("/").pop() || "").split(".").slice(1).pop()?.toLowerCase() ?? "";
}

/**
 * Kiểm tra một yêu cầu upload. Ném lỗi tiếng Việt (an toàn để hiển thị cho
 * người dùng, không chứa thông tin bí mật) nếu vi phạm.
 */
export function assertUploadAllowed(input: {
  category: UploadCategory;
  contentType?: string | null;
  size?: number | null;
  originalName?: string | null;
  key: string;
}): void {
  const name = (input.originalName || input.key || "").trim();
  if (!name) throw new Error("Tên tệp không hợp lệ");
  const ext = extOf(name);
  if (ext && BLOCKED_EXT.has(ext)) {
    throw new Error(`Không cho phép tải lên tệp .${ext}`);
  }

  const size = input.size ?? null;
  if (size !== null) {
    if (size <= 0) throw new Error("Tệp rỗng — hãy chọn tệp khác");
    const max = MAX_SIZE[input.category];
    if (size > max) {
      throw new Error(`Tệp vượt quá giới hạn ${Math.round(max / (1024 * 1024))}MB`);
    }
  }

  const ct = (input.contentType || "").toLowerCase().split(";")[0].trim();
  if (input.category !== "other" && ct) {
    const allowed = ALLOWED_MIME[input.category];
    if (!allowed.includes(ct)) {
      throw new Error(`Định dạng tệp không được hỗ trợ (${ct})`);
    }
  }
}

/** Ghép tiền tố khoá (key_prefix trong cấu hình) một cách idempotent. */
export function withKeyPrefix(prefix: string | null | undefined, key: string): string {
  const p = (prefix ?? "").replace(/^\/+/, "").replace(/\/*$/, "");
  const k = key.replace(/^\/+/, "");
  if (!p) return k;
  if (k === p || k.startsWith(`${p}/`)) return k;
  return `${p}/${k}`;
}
