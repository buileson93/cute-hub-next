import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";
import { z } from "zod";

// ---------- Category & expiry policy ----------
export type R2Category = "image" | "pdf" | "office" | "video" | "other";

export function categorize(nameOrType: string, contentType?: string): R2Category {
  const ct = (contentType || "").toLowerCase();
  const ext = (nameOrType.split(".").pop() || "").toLowerCase();
  if (ct.startsWith("image/") || ["png","jpg","jpeg","webp","gif","svg","avif"].includes(ext)) return "image";
  if (ct === "application/pdf" || ext === "pdf") return "pdf";
  if (ct.startsWith("video/") || ["mp4","mov","mkv","webm"].includes(ext)) return "video";
  if (["doc","docx","xls","xlsx","ppt","pptx"].includes(ext) || ct.includes("officedocument") || ct.includes("msword") || ct.includes("ms-excel")) return "office";
  return "other";
}

/** Presigned URL TTL theo loại file (giây) */
export function ttlFor(category: R2Category, kind: "get" | "put"): number {
  if (kind === "put") return 900;
  switch (category) {
    case "image": return 300;
    case "pdf": return 900;
    case "office": return 900;
    case "video": return 1800;
    default: return 600;
  }
}

const putSchema = z.object({
  key: z.string().min(1).max(1024),
  contentType: z.string().optional(),
  size: z.number().int().nonnegative().optional(),
  originalName: z.string().max(255).optional(),
});
const getSchema = z.object({ key: z.string().min(1).max(1024) });
const delSchema = z.object({ key: z.string().min(1).max(1024) });

/** Kiểm tra xem key có thuộc vùng bảo mật không. */
export function isPrivateKey(key: string): boolean {
  return key.startsWith("private/") || key.startsWith("user/");
}


function sanitizeKey(userId: string, rawKey: string): string {
  const clean = rawKey.replace(/\\/g, "/").replace(/\.\.+/g, "").replace(/^\/+/, "");
  if (!clean) throw new Error("Key không hợp lệ");
  const allowed = /^(public|uploads|gpkt|bao-duong|dot-bao-duong|form|attachments|private|user)\//;
  if (!allowed.test(clean)) return `user/${userId}/${clean}`;
  return clean;
}

async function assertAccess(supabase: any, userId: string, key: string, action: "put" | "get" | "delete") {
  // 1. Luôn cho phép truy cập file cá nhân của chính mình
  if (key.startsWith(`user/${userId}/`)) return;

  // 2. Admin có toàn quyền
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (isAdmin) return;

  // 3. Kiểm tra quyền sở hữu hoặc quyền chia sẻ qua r2_file
  const { data: file } = await supabase
    .from("r2_file")
    .select("user_id, status")
    .eq("key", key)
    .maybeSingle();

  if (file?.user_id === userId) return;

  // 4. Cho phép PUT lên các prefix công khai đã định nghĩa (để upload mới)
  if (action === "put") {
    const publicPrefix = /^(uploads|gpkt|bao-duong|dot-bao-duong|form|attachments|public|project)\//;
    if (publicPrefix.test(key)) return;
  }

  // 5. Nếu file không thuộc sở hữu và không phải upload mới, chặn truy cập mặc định
  throw new Error("Không có quyền truy cập file này");
}


async function logAccess(entry: { user_id: string|null; key: string; action: string; category?: string|null; expires_in?: number|null; ok?: boolean; reason?: string|null }) {
  try {
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    await supabaseAdmin.from("r2_access_log").insert({
      user_id: entry.user_id, key: entry.key, action: entry.action,
      category: entry.category ?? null, expires_in: entry.expires_in ?? null,
      ok: entry.ok ?? true, reason: entry.reason ?? null,
    });
  } catch (e) { console.warn("[r2] log fail", e); }
}

export const r2GetUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => putSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { r2PresignPut } = await import("./r2.server");
    const key = sanitizeKey(context.userId, data.key);
    const category = categorize(data.originalName || key, data.contentType);
    const expiresIn = ttlFor(category, "put");
    try { await assertAccess(context.supabase, context.userId, key, "put"); }
    catch (err: any) {
      await logAccess({ user_id: context.userId, key, action: "put", category, expires_in: expiresIn, ok: false, reason: err.message });
      throw err;
    }
    const url = await r2PresignPut(key, data.contentType, expiresIn);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    await supabaseAdmin.from("r2_file").upsert({
      user_id: context.userId, key,
      size: data.size ?? null, content_type: data.contentType ?? null,
      category, original_name: data.originalName ?? null, status: "temp",
      expires_at: new Date(Date.now() + 24*3600*1000).toISOString(),
    }, { onConflict: "key" });
    await logAccess({ user_id: context.userId, key, action: "put", category, expires_in: expiresIn, ok: true });
    return { key, url, publicUrl: null, method: "PUT" as const, isPrivate: true, category, expiresIn };
  });

export const r2GetDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => getSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { r2PresignGet } = await import("./r2.server");
    const category = categorize(data.key);
    const expiresIn = ttlFor(category, "get");
    try { await assertAccess(context.supabase, context.userId, data.key, "get"); }
    catch (err: any) {
      await logAccess({ user_id: context.userId, key: data.key, action: "get", category, expires_in: expiresIn, ok: false, reason: err.message });
      throw err;
    }
    const url = await r2PresignGet(data.key, expiresIn);
    await logAccess({ user_id: context.userId, key: data.key, action: "get", category, expires_in: expiresIn, ok: true });
    return { url, expiresIn, category };
  });

export const r2DeleteObject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => delSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { r2Delete } = await import("./r2.server");
    try { await assertAccess(context.supabase, context.userId, data.key, "delete"); }
    catch (err: any) {
      await logAccess({ user_id: context.userId, key: data.key, action: "delete", ok: false, reason: err.message });
      throw err;
    }
    await r2Delete(data.key);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    await supabaseAdmin.from("r2_file").delete().eq("key", data.key).eq("user_id", context.userId);
    await logAccess({ user_id: context.userId, key: data.key, action: "delete", ok: true });
    return { ok: true };
  });

export const r2MarkReady = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ key: z.string().min(1).max(1024), size: z.number().int().nonnegative().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    await supabaseAdmin.from("r2_file")
      .update({ status: "ready", expires_at: null, size: data.size ?? null, updated_at: new Date().toISOString() })
      .eq("key", data.key).eq("user_id", context.userId);
    return { ok: true };
  });

// ---------- Multipart ----------
const mpCreateSchema = z.object({
  key: z.string().min(1).max(1024),
  contentType: z.string().optional(),
  size: z.number().int().nonnegative().optional(),
  originalName: z.string().max(255).optional(),
});
const mpSignSchema = z.object({
  key: z.string().min(1).max(1024),
  uploadId: z.string().min(1),
  partNumbers: z.array(z.number().int().min(1).max(10000)).min(1).max(50),
});
const mpCompleteSchema = z.object({
  key: z.string().min(1).max(1024),
  uploadId: z.string().min(1),
  parts: z.array(z.object({ PartNumber: z.number().int().min(1), ETag: z.string().min(1) })).min(1),
  size: z.number().int().nonnegative().optional(),
});
const mpAbortSchema = z.object({ key: z.string().min(1).max(1024), uploadId: z.string().min(1) });
const mpListSchema = z.object({ key: z.string().min(1).max(1024), uploadId: z.string().min(1) });

export const r2MultipartInit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => mpCreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { r2MultipartCreate } = await import("./r2.server");
    const key = sanitizeKey(context.userId, data.key);
    await assertAccess(context.supabase, context.userId, key, "put");
    const uploadId = await r2MultipartCreate(key, data.contentType);
    const category = categorize(data.originalName || key, data.contentType);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    await supabaseAdmin.from("r2_file").upsert({
      user_id: context.userId, key, size: data.size ?? null, content_type: data.contentType ?? null,
      category, original_name: data.originalName ?? null, status: "temp",
      meta: { multipart: true, uploadId },
      expires_at: new Date(Date.now() + 24*3600*1000).toISOString(),
    }, { onConflict: "key" });
    await logAccess({ user_id: context.userId, key, action: "mp_init", category, ok: true });
    return { key, uploadId, category };
  });

export const r2MultipartSign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => mpSignSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { r2MultipartSignPart } = await import("./r2.server");
    await assertAccess(context.supabase, context.userId, data.key, "put");
    const urls = await Promise.all(
      data.partNumbers.map(async (n) => ({ partNumber: n, url: await r2MultipartSignPart(data.key, data.uploadId, n, 900) })),
    );
    return { urls };
  });

export const r2MultipartFinish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => mpCompleteSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { r2MultipartComplete } = await import("./r2.server");
    await assertAccess(context.supabase, context.userId, data.key, "put");
    await r2MultipartComplete(data.key, data.uploadId, data.parts);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    await supabaseAdmin.from("r2_file")
      .update({ status: "ready", expires_at: null, size: data.size ?? null, updated_at: new Date().toISOString() })
      .eq("key", data.key).eq("user_id", context.userId);
    await logAccess({ user_id: context.userId, key: data.key, action: "mp_complete", ok: true });
    return { ok: true };
  });

export const r2MultipartCancel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => mpAbortSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { r2MultipartAbort } = await import("./r2.server");
    await assertAccess(context.supabase, context.userId, data.key, "delete");
    await r2MultipartAbort(data.key, data.uploadId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    await supabaseAdmin.from("r2_file").delete().eq("key", data.key).eq("user_id", context.userId);
    await logAccess({ user_id: context.userId, key: data.key, action: "mp_abort", ok: true });
    return { ok: true };
  });

export const r2MultipartListParts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => mpListSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { r2MultipartList } = await import("./r2.server");
    await assertAccess(context.supabase, context.userId, data.key, "put");
    try {
      const parts = await r2MultipartList(data.key, data.uploadId);
      return { parts, valid: true as const };
    } catch (err: any) {
      // uploadId có thể đã hết hạn hoặc bị abort
      return { parts: [] as { PartNumber: number; ETag: string; Size: number }[], valid: false as const, reason: err?.message ?? "unknown" };
    }
  });

// ---------- Dashboard listing ----------
export const r2ListMyFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("r2_file")
      .select("id, key, size, content_type, category, status, original_name, expires_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

/**
 * Kiểm tra sức khoẻ R2. KHÔNG ném lỗi: khi R2 chưa cấu hình / sai thông số,
 * trả về { ok: false, error } để giao diện hiển thị cảnh báo thay vì trắng màn hình.
 */
export const r2Ping = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    try {
      const { getR2Bucket, r2Head } = await import("./r2.server");
      const bucket = await getR2Bucket();
      const probe = await r2Head("__ping__");
      return { ok: true as const, bucket, probeExists: probe.exists };
    } catch (err: any) {
      return { ok: false as const, bucket: null, probeExists: false, error: err?.message ?? String(err) };
    }
  });

