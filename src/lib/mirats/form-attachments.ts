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
};

function safeExt(name: string): string {
  const m = /\.([a-zA-Z0-9]{1,6})$/.exec(name);
  return m ? m[1].toLowerCase() : "bin";
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

export async function uploadAttachment(
  file: File,
  opts: {
    templateCode: string;
    draftId: string;
    fieldKey: string;
    onProgress?: (pct: number) => void;
    /** Bỏ qua nén ảnh/PDF (mặc định: nén để tiết kiệm dung lượng). */
    skipCompress?: boolean;
  },
): Promise<FormAttachment> {
  if (file.size > 15 * 1024 * 1024) {
    throw new Error(`Tệp "${file.name}" vượt quá 15MB.`);
  }

  // Nén ảnh/PDF phía trình duyệt TRƯỚC khi upload để tiết kiệm dung lượng
  // (áp dụng cho ảnh bằng chứng bảo dưỡng, sự cố, hỏng hóc...).
  let payload: Blob = file;
  let contentType = file.type || "application/octet-stream";
  let outName = file.name;
  let outSize = file.size;
  if (!opts.skipCompress) {
    try {
      const { compressForUpload } = await import("@/lib/storage/compress");
      const c = await compressForUpload(file);
      if (c.blob.size < file.size) {
        payload = c.blob;
        contentType = c.contentType;
        outSize = c.blob.size;
        // Đổi đuôi tệp cho khớp định dạng đã nén (vd: .jpg -> .webp).
        if (c.contentType === "image/webp" && !/\.webp$/i.test(outName)) {
          outName = outName.replace(/\.[a-zA-Z0-9]{1,6}$/, "") + ".webp";
        }
      }
    } catch {
      // Nén lỗi → upload nguyên bản.
    }
  }
  const path = makeAttachmentPath({ ...opts, fileName: outName });

  // Ưu tiên signed-upload-URL + XHR để có tiến độ upload thật.
  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET).createSignedUploadUrl(path);
  if (signErr || !signed) {
    // Fallback: upload trực tiếp (không có progress).
    const { error } = await supabase.storage.from(BUCKET).upload(path, payload, {
      cacheControl: "3600", contentType, upsert: false,
    });
    if (error) throw new Error(error.message);
    opts.onProgress?.(100);
  } else {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signed.signedUrl, true);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.setRequestHeader("x-upsert", "false");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) opts.onProgress?.(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => xhr.status >= 200 && xhr.status < 300
        ? resolve() : reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
      xhr.onerror = () => reject(new Error("Lỗi mạng khi upload"));
      xhr.send(payload);
    });
  }

  return {
    path, name: outName, size: outSize,
    type: contentType,
    uploaded_at: new Date().toISOString(),
  };
}


export async function removeAttachment(path: string): Promise<void> {
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
