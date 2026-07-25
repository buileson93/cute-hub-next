import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const putSchema = z.object({
  key: z.string().min(1).max(1024),
  contentType: z.string().optional(),
  expiresIn: z.number().int().min(60).max(3600).optional(),
});

const getSchema = z.object({
  key: z.string().min(1).max(1024),
  expiresIn: z.number().int().min(60).max(3600).optional(),
});

const delSchema = z.object({ key: z.string().min(1).max(1024) });

// Các prefix bắt buộc riêng tư (chỉ truy cập qua presigned URL, không public qua files.vatm.app)
const PRIVATE_PREFIXES = ["private/", "gpkt/", "bao-duong/", "dot-bao-duong/", "user/"];

export function isPrivateKey(key: string): boolean {
  return PRIVATE_PREFIXES.some((p) => key.startsWith(p));
}

function sanitizeKey(userId: string, rawKey: string): string {
  // Chống path traversal, ép prefix theo user hoặc theo namespace hợp lệ
  const clean = rawKey.replace(/\\/g, "/").replace(/\.\.+/g, "").replace(/^\/+/, "");
  if (!clean) throw new Error("Key không hợp lệ");
  // Cho phép prefix chung. "public/" = ai cũng đọc được qua files.vatm.app.
  // Các prefix còn lại là private, cần presigned URL.
  const allowed = /^(public|uploads|gpkt|bao-duong|dot-bao-duong|form|attachments|private|user)\//;
  if (!allowed.test(clean)) {
    return `user/${userId}/${clean}`;
  }
  return clean;
}

export const r2GetUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => putSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { r2PresignPut, r2PublicUrl } = await import("./r2.server");
    const key = sanitizeKey(context.userId, data.key);
    const url = await r2PresignPut(key, data.contentType, data.expiresIn ?? 900);
    // Chỉ trả publicUrl cho file "public/*". Các file khác phải xin presigned GET.
    const publicUrl = isPrivateKey(key) ? null : r2PublicUrl(key);
    return { key, url, publicUrl, method: "PUT" as const, isPrivate: isPrivateKey(key) };
  });

export const r2GetDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => getSchema.parse(d))
  .handler(async ({ data }) => {
    const { r2PresignGet } = await import("./r2.server");
    const url = await r2PresignGet(data.key, data.expiresIn ?? 900);
    return { url, expiresIn: data.expiresIn ?? 900 };
  });

export const r2DeleteObject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => delSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { r2Delete } = await import("./r2.server");
    // Chỉ cho xoá file thuộc user hoặc admin
    const isOwn = data.key.startsWith(`user/${context.userId}/`);
    if (!isOwn) {
      const { data: isAdmin } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      if (!isAdmin) throw new Error("Không có quyền xoá file này");
    }
    await r2Delete(data.key);
    return { ok: true };
  });

export const r2Ping = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { getR2Bucket, r2Head } = await import("./r2.server");
    const bucket = getR2Bucket();
    const probe = await r2Head("__ping__");
    return { ok: true, bucket, probeExists: probe.exists };
  });