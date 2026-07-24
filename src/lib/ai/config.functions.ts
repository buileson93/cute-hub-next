import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ConfigInput = z.object({
  enabled: z.boolean(),
  provider: z.enum(["lovable", "custom"]),
  model: z.string().min(1),
  base_url: z.string().nullable().optional(),
  api_key_secret_name: z.string().nullable().optional(),
  system_prompt: z.string().min(1),
  max_tokens: z.number().int().min(128).max(16384),
  beta_label: z.string().min(1).max(20),
});

/** Config công khai cho mọi user đăng nhập (không có secret). */
export const getAiPublicConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_ai_public_config");
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    return {
      enabled: (row?.enabled as boolean) ?? false,
      model: (row?.model as string) ?? "",
      beta_label: (row?.beta_label as string) ?? "Beta",
    };
  });

/** Config đầy đủ – chỉ admin. */
export const getAiAdminConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Chỉ admin mới xem được cấu hình AI");
    const { data, error } = await context.supabase
      .from("ai_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateAiAdminConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => ConfigInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Chỉ admin mới sửa được cấu hình AI");
    const { error } = await context.supabase
      .from("ai_config")
      .update({ ...data, updated_by: context.userId })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
