// ============================================================================
// Server functions: từ điển alias nhập liệu. Đọc để đối chiếu, và LƯU alias
// khi admin xác nhận một ánh xạ (văn bản gõ khác → bản ghi chuẩn).
// Chỉ Admin được lưu/xóa; audit người xác nhận qua confirmed_by/confirmed_at.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";
import { noAccent } from "@/lib/mirats/import-config";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: chỉ Admin được quản lý alias nhập liệu");
}

/** Lấy alias theo entity (+scope tùy chọn) để đối chiếu phía client. */
export const listImportAliases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { entity: string; scope?: string | null }) =>
    z.object({ entity: z.string().min(1), scope: z.string().nullable().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("import_alias")
      .select("id, entity, scope, source, alias, alias_norm, canonical_id, canonical_key, confirmed_by, confirmed_at")
      .eq("entity", data.entity)
      .limit(20000);
    if (data.scope != null) q = q.eq("scope", data.scope);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { aliases: rows ?? [] };
  });

const SaveAliasInput = z.object({
  entity: z.string().min(1),
  scope: z.string().nullable().optional(),
  source: z.enum(["manual", "import", "ai"]).default("manual"),
  alias: z.string().min(1),
  canonicalId: z.string().uuid(),
  canonicalKey: z.string().nullable().optional(),
});

/** Lưu (upsert) một alias đã xác nhận. Ghi đè đích nếu alias đã tồn tại. */
export const saveImportAlias = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof SaveAliasInput>) => SaveAliasInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const alias_norm = noAccent(data.alias);
    if (!alias_norm) throw new Error("Alias rỗng sau khi chuẩn hoá");

    // Upsert thủ công theo (entity, scope, alias_norm) — chỉ mục unique dùng
    // biểu thức COALESCE(scope,'') nên ON CONFLICT theo cột không khớp được.
    const payload = {
      entity: data.entity,
      scope: data.scope ?? null,
      source: data.source,
      alias: data.alias,
      alias_norm,
      canonical_id: data.canonicalId,
      canonical_key: data.canonicalKey ?? null,
      confirmed_by: userId,
      confirmed_at: new Date().toISOString(),
    };

    let existingQ = supabase
      .from("import_alias")
      .select("id")
      .eq("entity", data.entity)
      .eq("alias_norm", alias_norm);
    existingQ = data.scope == null ? existingQ.is("scope", null) : existingQ.eq("scope", data.scope);
    const { data: found, error: findErr } = await existingQ.maybeSingle();
    if (findErr) throw new Error(findErr.message);

    if (found) {
      const { error } = await supabase.from("import_alias").update(payload as never).eq("id", (found as any).id);
      if (error) throw new Error(error.message);
      return { id: (found as any).id as string };
    }
    const { data: row, error } = await supabase
      .from("import_alias")
      .insert(payload as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: (row as any).id as string };
  });

/** Xóa một alias. */
export const deleteImportAlias = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("import_alias").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
