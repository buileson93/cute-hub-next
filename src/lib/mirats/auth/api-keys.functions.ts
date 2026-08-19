import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac, timingSafeEqual, getRandomValues } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Hash a secret using HMAC-SHA256 with a pepper.
 */
async function hashSecret(secret: string, pepper: string): Promise<string> {
  return createHmac("sha256", pepper).update(secret).digest("hex");
}

export const API_KEY_SCOPES = [
  { id: 'projects:read', label: 'Xem dự án' },
  { id: 'tasks:read', label: 'Xem công việc' },
  { id: 'project_documents:write', label: 'Tải tài liệu lên' },
  { id: 'project_correspondence:write', label: 'Tạo công văn' },
  { id: 'ocr_artifacts:publish', label: 'Xuất bản kết quả OCR' },
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
      .parse(data)
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    if (!userId || !supabase) throw new Error("Unauthorized");
    
    // Validate scopes
    const validScopes = API_KEY_SCOPES.map(s => s.id);
    const filteredScopes = data.scopes.filter(s => (validScopes as readonly string[]).includes(s));

    // Generate public keyId (12 chars)
    const keyIdArray = new Uint8Array(6);
    getRandomValues(keyIdArray);
    const keyId = Buffer.from(keyIdArray).toString("hex");

    // Generate secret (32 bytes)
    const secretArray = new Uint8Array(32);
    getRandomValues(secretArray);
    const secret = Buffer.from(secretArray).toString("hex");

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
    return { success: true };
  });

/**
 * Verify an API key (Internal helper for middleware).
 */
export async function verifyApiKey(token: string): Promise<{ 
  isValid: boolean; 
  user_id?: string; 
  scopes?: string[];
  key_id?: string;
}> {
  if (!token.startsWith("mrt_ext_live_")) return { isValid: false };

  const parts = token.split("_");
  if (parts.length !== 5) return { isValid: false }; 

  const keyId = parts[3];
  const secret = parts[4];

  const { supabaseAdmin } = await import('@/integrations/backend/admin.server');
  const { data: keyData, error } = await supabaseAdmin
    .from("api_keys" as any)
    .select("secret_hash, user_id, scopes, expires_at, revoked_at")
    .eq("key_id", keyId)
    .single();

  if (error || !keyData) return { isValid: false };

  const typedKey = keyData as any;

  if (typedKey.revoked_at) return { isValid: false };
  if (typedKey.expires_at && new Date(typedKey.expires_at) < new Date()) return { isValid: false };

  const pepper = process.env["MIRATS_API_PEPPER"] || "default-pepper-change-me";
  const incomingHash = await hashSecret(secret, pepper);

  const isValid = timingSafeEqual(
    Buffer.from(typedKey.secret_hash),
    Buffer.from(incomingHash)
  );

  if (isValid) {
    supabaseAdmin
      .from("api_keys" as any)
      .update({ last_used_at: new Date().toISOString() } as any)
      .eq("key_id", keyId)
      .then();

    return { 
      isValid: true, 
      user_id: typedKey.user_id, 
      scopes: typedKey.scopes,
      key_id: keyId
    };
  }

  return { isValid: false };
}


  return { isValid: false };
}
