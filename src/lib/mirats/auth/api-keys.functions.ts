import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Hash a secret using HMAC-SHA256 with a pepper.
 */
async function hashSecret(secret: string, pepper: string): Promise<string> {
  const { createHmac } = await import("crypto");
  return createHmac("sha256", pepper).update(secret).digest("hex");
}

function hexBytes(len: number): string {
  const arr = new Uint8Array(len);
  globalThis.crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const API_KEY_SCOPES = [
  { id: "projects:read", label: "Xem dự án" },
  { id: "tasks:read", label: "Xem công việc" },
  { id: "project_documents:write", label: "Tải tài liệu lên" },
  { id: "project_correspondence:write", label: "Tạo công văn" },
  { id: "ocr_artifacts:publish", label: "Xuất bản kết quả OCR" },
] as const;

/**
 * Generate a new API key for the current user.
 */
export const createApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        name: z.string().min(1),
        scopes: z.array(z.string()).default([]),
        expiresInDays: z.number().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    if (!userId || !supabase) throw new Error("Unauthorized");

    // Validate scopes
    const validScopes = API_KEY_SCOPES.map((s) => s.id);
    const filteredScopes = data.scopes.filter((s) =>
      (validScopes as readonly string[]).includes(s),
    );

    // Generate public keyId (12 chars)
    const keyId = hexBytes(6);

    // Generate secret (32 bytes)
    const secret = hexBytes(32);

    const pepper = process.env["MIRATS_API_PEPPER"] || "default-pepper-change-me";
    const secretHash = await hashSecret(secret, pepper);

    const fullToken = `mrt_ext_live_${keyId}_${secret}`;
    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: newKey, error } = await supabase
      .from("api_keys" as any)
      .insert({
        key_id: keyId,
        secret_hash: secretHash,
        name: data.name,
        user_id: userId,
        scopes: filteredScopes,
        expires_at: expiresAt,
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Audit Log: Key Creation
    await supabase.from("api_audit_log" as any).insert({
      key_id: keyId,
      user_id: userId,
      action: "key_created",
      result: "success",
      metadata: { name: data.name },
    } as any);

    return {
      ...(newKey as object),
      fullToken,
    };
  });

/**
 * Revoke an API key.
 */
export const revokeApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    if (!userId || !supabase) throw new Error("Unauthorized");

    const { error } = await supabase
      .from("api_keys" as any)
      .update({ revoked_at: new Date().toISOString() } as any)
      .eq("id", data.id)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);

    // Audit Log: Key Revocation
    await supabase.from("api_audit_log" as any).insert({
      user_id: userId,
      action: "key_revoked",
      result: "success",
      metadata: { key_uuid: data.id },
    } as any);

    return { success: true };
  });

/**
 * Verify an API key (Internal helper for middleware).
 */
export async function verifyApiKey(
  token: string,
  ip?: string,
): Promise<{
  isValid: boolean;
  user_id?: string;
  scopes?: string[];
  key_id?: string;
}> {
  const pepper = process.env["MIRATS_API_PEPPER"];
  const isProd = process.env["NODE_ENV"] === "production";

  // Fail closed if pepper is missing or default in production
  if (!pepper || (isProd && pepper === "default-pepper-change-me")) {
    console.error("[auth] MIRATS_API_PEPPER is not configured correctly");
    return { isValid: false };
  }

  if (!token.startsWith("mrt_ext_live_")) return { isValid: false };

  const parts = token.split("_");
  if (parts.length !== 5) return { isValid: false };

  const keyId = parts[3];
  const secret = parts[4];

  // IP Hashing for privacy
  const ipHash = ip ? await hashSecret(ip, pepper) : null;

  const { supabaseAdmin } = await import("@/integrations/backend/admin.server");

  const { data: keyData, error } = await supabaseAdmin
    .from("api_keys" as any)
    .select("secret_hash, user_id, scopes, expires_at, revoked_at")
    .eq("key_id", keyId)
    .single();

  if (error || !keyData) {
    // Audit Log: Failed attempt (invalid key_id)
    await supabaseAdmin.from("api_audit_log" as any).insert({
      key_id: keyId,
      action: "api_call",
      result: "failure",
      ip_hash: ipHash,
      metadata: { reason: "invalid_key_id" },
    } as any);

    return { isValid: false };
  }

  const typedKey = keyData as any;

  if (typedKey.revoked_at || (typedKey.expires_at && new Date(typedKey.expires_at) < new Date())) {
    // Audit Log: Failed attempt (expired/revoked)
    await supabaseAdmin.from("api_audit_log" as any).insert({
      key_id: keyId,
      user_id: typedKey.user_id,
      action: "api_call",
      result: "failure",
      ip_hash: ipHash,
      metadata: { reason: typedKey.revoked_at ? "revoked" : "expired" },
    } as any);

    return { isValid: false };
  }

  const incomingHash = await hashSecret(secret, pepper);

  const isValid = timingSafeEqualHex(typedKey.secret_hash, incomingHash);

  if (isValid) {
    // Update last used info
    await supabaseAdmin
      .from("api_keys" as any)
      .update({
        last_used_at: new Date().toISOString(),
        last_used_ip_hash: ipHash,
      } as any)
      .eq("key_id", keyId);

    // Audit Log: API Call
    await supabaseAdmin.from("api_audit_log" as any).insert({
      key_id: keyId,
      user_id: typedKey.user_id,
      action: "api_call",
      result: "success",
      ip_hash: ipHash,
    } as any);

    return {
      isValid: true,
      user_id: typedKey.user_id,
      scopes: typedKey.scopes,
      key_id: keyId,
    };
  }

  // Audit Log: Failed attempt
  await supabaseAdmin.from("api_audit_log" as any).insert({
    key_id: keyId,
    action: "api_call",
    result: "failure",
    ip_hash: ipHash,
    metadata: { reason: "invalid_secret" },
  } as any);

  return { isValid: false };
}
