// ============================================================================
// form-attachments.ts — Upload / xoá / signed URL cho bucket `form-attachments`.
// Bucket là PRIVATE, dùng signed URL (TTL 1h) để hiển thị.
// Đường dẫn: <template_code>/<yyyy>/<draftId>/<field_key>/<uuid>.<ext>
// ============================================================================
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "form-attachments";

export type FormAttachment = {
  path: string;
  name: string;
  size: number;
  type: string;
  uploaded_at: string;
  /** SHA-256 nội dung sau khi nén — dùng để dedup và kiểm tra toàn vẹn. */
  sha256?: string;
  /** true nếu tệp trùng nội dung đã tồn tại trong storage → không upload lại. */
  dedup?: boolean;
};

/** Các giai đoạn của một tệp trong queue upload. */
export type UploadPhase =
  | "queued"      // đang chờ tới lượt
  | "hashing"     // đang tính SHA-256
  | "compressing" // đang nén ảnh/PDF
  | "dedup"       // đã có bản trùng, bỏ qua upload
  | "uploading"   // đang upload, có % tiến độ
  | "done"        // hoàn tất
  | "error";      // thất bại

export interface UploadStatus {
  phase: UploadPhase;
  progress?: number;         // 0..100 cho phase "uploading"
  message?: string;          // mô tả ngắn (VD "Nén 2.4MB → 620KB")
  originalSize?: number;
  compressedSize?: number;
  contentType?: string;
}

function safeExt(name: string): string {
  const m = /\.([a-zA-Z0-9]{1,6})$/.exec(name);
  return m ? m[1].toLowerCase() : "bin";
}

function extForType(ct: string, fallback: string): string {
  if (ct === "image/webp") return "webp";
  if (ct === "image/jpeg") return "jpg";
  if (ct === "image/png") return "png";
  if (ct === "application/pdf") return "pdf";
  return fallback;
}

function randId(): string {
  // Không cần crypto mạnh — chỉ để tránh trùng path.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function makeAttachmentPath(opts: {
  templateCode: string;
  draftId: string;
  fieldKey: string;
  fileName: string;
}): string {
  const yr = new Date().getFullYear();
  const ext = safeExt(opts.fileName);
  return `${opts.templateCode}/${yr}/${opts.draftId}/${opts.fieldKey}/${randId()}.${ext}`;
}

/**
 * Đường dẫn content-addressed (CAS) trong cùng templateCode.
 * Cho phép dedup theo nội dung tệp — cùng hash → tái sử dụng path.
 */
function casPath(templateCode: string, hash: string, ext: string): string {
  return `${templateCode}/_cas/${hash.slice(0, 2)}/${hash.slice(2, 4)}/${hash}.${ext}`;
}

async function casExists(path: string): Promise<boolean> {
  const slash = path.lastIndexOf("/");
  const prefix = path.slice(0, slash);
  const name = path.slice(slash + 1);
  const { data } = await supabase.storage.from(BUCKET).list(prefix, { limit: 100, search: name });
  return !!data?.some((o) => o.name === name);
}

export async function uploadAttachment(
  file: File,
  opts: {
    templateCode: string;
    draftId: string;
    fieldKey: string;
    onProgress?: (pct: number) => void;
    /** Callback theo dõi trạng thái/phase chi tiết. */
    onStatus?: (s: UploadStatus) => void;
    /** Bỏ qua nén ảnh/PDF (mặc định: nén để tiết kiệm dung lượng). */
    skipCompress?: boolean;
    /** Bỏ qua dedup theo hash (mặc định: bật). */
    skipDedup?: boolean;
  },
): Promise<FormAttachment> {
  if (file.size > 15 * 1024 * 1024) {
    throw new Error(`Tệp "${file.name}" vượt quá 15MB.`);
  }
  const status = (s: UploadStatus) => opts.onStatus?.(s);
  status({ phase: "queued" });

  // 1) Nén ảnh/PDF phía trình duyệt TRƯỚC khi upload để tiết kiệm dung lượng
  //    (giữ chất lượng gần như không suy giảm — WebP q=0.92, cạnh dài ≤ 3200px).
  let payload: Blob = file;
  let contentType = file.type || "application/octet-stream";
  let outName = file.name;
  let outSize = file.size;
  if (!opts.skipCompress) {
    status({ phase: "compressing", originalSize: file.size });
    try {
      const { compressForUpload } = await import("@/lib/storage/compress");
      const c = await compressForUpload(file);
      if (c.blob.size < file.size) {
        payload = c.blob;
        contentType = c.contentType;
        outSize = c.blob.size;
        // Đổi đuôi tệp cho khớp định dạng đã nén (vd: .jpg -> .webp).
        const targetExt = extForType(c.contentType, safeExt(outName));
        if (!new RegExp(`\\.${targetExt}$`, "i").test(outName)) {
          outName = outName.replace(/\.[a-zA-Z0-9]{1,6}$/, "") + "." + targetExt;
        }
      }
    } catch {
      // Nén lỗi → upload nguyên bản.
    }
  }

  // 2) Tính SHA-256 nội dung đã nén → dedup nếu đã có tệp cùng nội dung.
  let hash = "";
  let path: string;
  if (!opts.skipDedup) {
    status({ phase: "hashing", compressedSize: outSize, contentType });
    try {
      const { sha256Hex } = await import("@/lib/storage/compress");
      hash = await sha256Hex(payload);
    } catch { hash = ""; }
  }
  if (hash) {
    const ext = extForType(contentType, safeExt(outName));
    path = casPath(opts.templateCode, hash, ext);
    if (await casExists(path)) {
      status({ phase: "dedup", compressedSize: outSize, contentType });
      opts.onProgress?.(100);
      status({ phase: "done", compressedSize: outSize, contentType });
      return {
        path, name: outName, size: outSize, type: contentType,
        uploaded_at: new Date().toISOString(), sha256: hash, dedup: true,
      };
    }
  } else {
    path = makeAttachmentPath({ ...opts, fileName: outName });
  }

  status({ phase: "uploading", progress: 0, compressedSize: outSize, contentType });
  // Ưu tiên signed-upload-URL + XHR để có tiến độ upload thật.
  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET).createSignedUploadUrl(path);
  if (signErr || !signed) {
    // Fallback: upload trực tiếp (không có progress).
    const { error } = await supabase.storage.from(BUCKET).upload(path, payload, {
      cacheControl: "31536000", contentType, upsert: false,
    });
    if (error) {
      status({ phase: "error", message: error.message });
      throw new Error(error.message);
    }
    opts.onProgress?.(100);
    status({ phase: "uploading", progress: 100 });
  } else {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signed.signedUrl, true);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.setRequestHeader("x-upsert", "false");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          opts.onProgress?.(pct);
          status({ phase: "uploading", progress: pct });
        }
      };
      xhr.onload = () => xhr.status >= 200 && xhr.status < 300
        ? resolve() : reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
      xhr.onerror = () => reject(new Error("Lỗi mạng khi upload"));
      xhr.send(payload);
    }).catch((e) => { status({ phase: "error", message: (e as Error).message }); throw e; });
  }

  status({ phase: "done", compressedSize: outSize, contentType });
  return {
    path, name: outName, size: outSize,
    type: contentType,
    uploaded_at: new Date().toISOString(),
    sha256: hash || undefined,
    dedup: false,
  };
}


export async function removeAttachment(path: string): Promise<void> {
  // Không xoá tệp CAS — có thể đang được tham chiếu bởi FormSubmission khác.
  if (/\/_cas\//.test(path)) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

export async function signedUrl(path: string, ttlSec = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, ttlSec);
  if (error) return null;
  return data?.signedUrl ?? null;
}

/**
 * Upload chữ ký từ dataURL (canvas) — lưu như tệp .png trong bucket.
 */
export async function uploadSignatureDataUrl(
  dataUrl: string,
  opts: { templateCode: string; draftId: string; fieldKey: string },
): Promise<FormAttachment> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], `chu-ky-${opts.fieldKey}.png`, { type: "image/png" });
  return uploadAttachment(file, opts);
}
