/**
 * Nhân bản tệp sang Cloudflare R2 cho MỌI luồng upload đang dùng
 * `storage.from(bucket).upload(...)` — không phải sửa từng call-site.
 *
 * Nguyên tắc an toàn:
 * - Lovable Cloud vẫn là bản chính (URL công khai đang lưu trong CSDL không đổi),
 *   nên nếu R2 lỗi thì nghiệp vụ KHÔNG bị ảnh hưởng.
 * - Chỉ chạy khi admin bật chế độ có R2 (`r2` hoặc `dual`) VÀ R2 đã cấu hình đủ.
 * - Không bao giờ ném lỗi ra ngoài; chỉ log cảnh báo (không chứa secret).
 */
import type { StorageConfig } from "@/lib/mirats/storage-config";

let readyCache: { at: number; ready: boolean } | null = null;
const READY_TTL = 60_000;

export function shouldMirror(cfg: StorageConfig): boolean {
  return cfg.primary === "r2" || cfg.dualWrite;
}

/** Khoá R2 tương ứng một object của Lovable Cloud Storage. */
export function mirrorKey(bucket: string, path: string): string {
  const clean = path.replace(/\\/g, "/").replace(/\.\.+/g, "").replace(/^\/+/, "");
  return `attachments/${bucket}/${clean}`;
}

async function isR2Ready(): Promise<boolean> {
  const now = Date.now();
  if (readyCache && now - readyCache.at < READY_TTL) return readyCache.ready;
  try {
    const { r2IsReady } = await import("@/lib/mirats/r2-config.functions");
    const r = await r2IsReady();
    readyCache = { at: now, ready: !!r.ready };
  } catch {
    readyCache = { at: now, ready: false };
  }
  return readyCache.ready;
}

/** Chạy nền: không await ở call-site nghiệp vụ. */
export async function mirrorToR2(bucket: string, path: string, body: Blob): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { fetchStorageConfig } = await import("@/lib/mirats/storage-config");
    const cfg = await fetchStorageConfig();
    if (!shouldMirror(cfg)) return;
    if (!(await isR2Ready())) return;

    const key = mirrorKey(bucket, path);
    const contentType = body.type || "application/octet-stream";
    const { r2GetUploadUrl, r2MarkReady } = await import("@/lib/mirats/r2.functions");
    const info = await r2GetUploadUrl({
      data: { key, contentType, size: body.size, originalName: path.split("/").pop() || key },
    });
    const res = await fetch(info.url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await r2MarkReady({ data: { key: info.key, size: body.size } });
  } catch (e) {
    console.warn("[storage] không nhân bản được sang R2:", (e as Error)?.message);
  }
}
