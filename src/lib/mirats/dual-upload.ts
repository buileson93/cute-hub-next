import { supabase } from "@/integrations/backend/client";
import { fetchStorageConfig, type StorageConfig } from "./storage-config";
import { toast } from "sonner";

/**
 * Upload song song sang Supabase Storage và Cloudflare R2 theo cấu hình
 * `app_cai_dat.storage.config`.
 *
 * Trả về URL của backend PRIMARY (để consumer lưu vào database). Nếu bên còn
 * lại lỗi trong chế độ dual-write, chỉ log toast cảnh báo — không chặn luồng
 * chính, nhờ đó có thể chạy tạm hai bên cùng lúc mà không sợ hỏng nghiệp vụ.
 */
export type DualUploadInput = {
  file: File;
  /** Đường dẫn/khoá trên Supabase Storage (bucket + path). */
  supabase: { bucket: string; path: string; upsert?: boolean; contentType?: string };
  /** Khoá gợi ý trên R2 (dạng "uploads/2025-…/tên"). */
  r2: { keyHint: string };
  /** Bỏ qua nén ảnh/PDF (mặc định: nén phía trình duyệt để tiết kiệm dung lượng). */
  skipCompress?: boolean;
};

export type DualUploadResult = {
  primary: "supabase" | "r2";
  supabaseUrl: string | null;
  supabasePath: string | null;
  r2Key: string | null;
  config: StorageConfig;
  errors: { side: "supabase" | "r2"; message: string }[];
};

async function uploadToSupabase(input: DualUploadInput, body: Blob, ct: string) {
  const { bucket, path, upsert = true, contentType } = input.supabase;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, body, { upsert, contentType: contentType ?? ct });
  if (error) throw error;
  const pub = supabase.storage.from(bucket).getPublicUrl(data?.path ?? path);
  return { path: data?.path ?? path, publicUrl: pub.data.publicUrl };
}

async function uploadToR2(input: DualUploadInput, body: Blob, ct: string) {
  // Import động để tránh kéo server-fn stub vào loader không cần R2.
  const { r2GetUploadUrl, r2MarkReady } = await import("./r2.functions");
  const info = await r2GetUploadUrl({
    data: {
      key: input.r2.keyHint,
      contentType: ct,
      size: body.size,
      originalName: input.file.name,
    },
  });
  const putRes = await fetch(info.url, { method: "PUT", headers: { "Content-Type": ct }, body });
  if (!putRes.ok)
    throw new Error(
      `R2 PUT ${putRes.status}: ${await putRes.text().catch(() => putRes.statusText)}`,
    );
  await r2MarkReady({ data: { key: info.key, size: body.size } });
  return { key: info.key };
}

export async function dualUpload(input: DualUploadInput): Promise<DualUploadResult> {
  const config = await fetchStorageConfig();
  const errors: DualUploadResult["errors"] = [];
  let supabaseUrl: string | null = null;
  let supabasePath: string | null = null;
  let r2Key: string | null = null;

  const shouldUploadSupabase = config.primary === "supabase" || config.dualWrite;
  const shouldUploadR2 = config.primary === "r2" || config.dualWrite;

  // Nén ảnh/PDF MỘT LẦN, dùng chung cho cả hai backend.
  let body: Blob = input.file;
  let ct = input.file.type || "application/octet-stream";
  if (!input.skipCompress && typeof window !== "undefined") {
    try {
      const { compressForUpload } = await import("@/lib/storage/compress");
      const c = await compressForUpload(input.file);
      if (c.blob.size < input.file.size) {
        body = c.blob;
        ct = c.contentType;
      }
    } catch {
      /* upload nguyên bản nếu nén lỗi */
    }
  }

  const jobs: Promise<void>[] = [];
  if (shouldUploadSupabase) {
    jobs.push(
      uploadToSupabase(input, body, ct)
        .then((r) => {
          supabaseUrl = r.publicUrl;
          supabasePath = r.path;
        })
        .catch((e: any) => {
          errors.push({ side: "supabase", message: e?.message ?? String(e) });
        }),
    );
  }
  if (shouldUploadR2) {
    jobs.push(
      uploadToR2(input, body, ct)
        .then((r) => {
          r2Key = r.key;
        })
        .catch((e: any) => {
          errors.push({ side: "r2", message: e?.message ?? String(e) });
        }),
    );
  }
  await Promise.all(jobs);

  const okOn = (side: "supabase" | "r2") => (side === "supabase" ? !!supabaseUrl : !!r2Key);
  const label = (side: "supabase" | "r2") =>
    side === "supabase" ? "Lovable Cloud" : "Cloudflare R2";
  const other: "supabase" | "r2" = config.primary === "supabase" ? "r2" : "supabase";
  const primaryErr = errors.find((e) => e.side === config.primary);

  if (!okOn(config.primary)) {
    // Chế độ chỉ-một-backend: thử ghi tạm sang bên còn lại để KHÔNG mất tệp.
    if (!config.dualWrite && config.autoFallback) {
      try {
        if (other === "supabase") {
          const r = await uploadToSupabase(input, body, ct);
          supabaseUrl = r.publicUrl;
          supabasePath = r.path;
        } else {
          const r = await uploadToR2(input, body, ct);
          r2Key = r.key;
        }
        toast.warning(
          `${label(config.primary)} đang lỗi — tệp đã được ghi tạm sang ${label(other)}. ` +
            `Vào Quản trị → Lưu trữ tệp để tắt ${label(config.primary)} cho tới khi khắc phục.`,
        );
      } catch (e: any) {
        errors.push({ side: other, message: e?.message ?? String(e) });
      }
    }

    if (!supabaseUrl && !r2Key) {
      const detail = errors.map((e) => `${label(e.side)}: ${e.message}`).join(" | ");
      toast.error(
        `Chưa ghi được tệp vào bất kỳ kho lưu trữ nào (${detail}). ` +
          `Hãy vào Quản trị → Lưu trữ tệp và chuyển sang kho còn hoạt động để tiếp tục làm việc.`,
      );
      throw new Error(`Không ghi được tệp vào kho lưu trữ nào. ${detail}`);
    }
    if (primaryErr && config.dualWrite) {
      toast.error(
        `Backend chính (${label(config.primary)}) lỗi: ${primaryErr.message}. Đang dùng bản sao còn lại.`,
      );
    }
  } else if (errors.length) {
    for (const e of errors) toast.warning(`Ghi song song: ${label(e.side)} lỗi — ${e.message}`);
  }

  return { primary: config.primary, supabaseUrl, supabasePath, r2Key, config, errors };
}
