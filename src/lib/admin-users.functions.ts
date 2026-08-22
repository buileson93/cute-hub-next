import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

const ROLES = [
  "admin",
  "phong_kt",
  "phu_trach_dv",
  "ktv",
  "readonly",
  "quan_ly_du_an",
  "to_truong",
] as const;
const DON_VI = ["CRA", "CLA", "THO", "PCA", "PBA", "PLK"] as const;

async function assertAdmin(supabase: any, userId: string) {
  const { data: isAdmin, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden: chỉ Admin được thực hiện");
}

async function logAdminAction(
  supabaseAdmin: any,
  actorId: string,
  action: string,
  entity: string,
  entityId: string | null,
  detail: any,
) {
  await supabaseAdmin.from("audit_log").insert({
    user_id: actorId,
    action,
    entity,
    entity_id: entityId,
    detail,
    severity: "info",
  });
}

// ==================== LIST USERS ====================
export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");

    // Fetch full list from Auth Admin (handling pagination if needed, though listUsers perPage=1000 is usually enough for most projects)
    // For extreme case, we loop.
    let allAuthUsers: any[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const { data: authList, error: authListErr } = await supabaseAdmin.auth.admin.listUsers({ 
        page, 
        perPage: 1000 
      });
      if (authListErr) throw authListErr;
      allAuthUsers = [...allAuthUsers, ...authList.users];
      hasMore = authList.users.length === 1000;
      page++;
    }

    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id,email,ho_ten,don_vi,active,created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);

    const rolesByUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role);
      rolesByUser.set(r.user_id, list);
    }
    
    const authDataByUser = new Map<string, { banned_until: string | null }>();
    for (const u of allAuthUsers) {
      authDataByUser.set(u.id, {
        banned_until: (u as any).banned_until ?? null,
      });
    }

    return (profiles ?? []).map((p) => {
      const auth = authDataByUser.get(p.id);
      return {
        ...p,
        roles: rolesByUser.get(p.id) ?? [],
        banned_until: auth?.banned_until ?? null,
      };
    });
  });

// ==================== CREATE USER ====================
export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        password: z.string().min(8).max(72),
        ho_ten: z.string().trim().min(1).max(100),
        don_vi: z.enum(DON_VI).nullable(),
        roles: z.array(z.enum(ROLES)).min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");

    // Phase 1: Create Auth User
    const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.ho_ten,
        ho_ten: data.ho_ten,
      },
    });
    if (authErr || !created.user) throw new Error(authErr?.message ?? "Không tạo được user");
    const uid = created.user.id;

    try {
      // Phase 2: Update Profile and Roles via transactional RPC
      const { error: rpcErr } = await supabaseAdmin.rpc("update_user_full", {
        target_uid: uid,
        new_ho_ten: data.ho_ten,
        new_don_vi: data.don_vi || "",
        new_roles: data.roles,
      });

      if (rpcErr) throw rpcErr;

      // Phase 3: Audit Log
      await supabaseAdmin.from("audit_log").insert({
        user_id: context.userId,
        action: "create_user",
        entity: "user",
        entity_id: uid,
        detail: { email: data.email, roles: data.roles, don_vi: data.don_vi },
      });

      return { id: uid };
    } catch (err: any) {
      // SAGA/COMPENSATION: Cleanup auth user on DB failure
      console.error("Partial failure in createUser, cleaning up auth user:", uid, err);
      await supabaseAdmin.auth.admin.deleteUser(uid);
      throw new Error(`Lỗi khởi tạo dữ liệu: ${err.message || "Unknown error"}`);
    }
  });

// ==================== UPDATE USER ====================
export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        user_id: z.string().uuid(),
        ho_ten: z.string().trim().min(1).max(100),
        don_vi: z.enum(DON_VI).nullable(),
        roles: z.array(z.enum(ROLES)).min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");

    // Atomic update via RPC
    const { error: rpcErr } = await supabaseAdmin.rpc("update_user_full", {
      target_uid: data.user_id,
      new_ho_ten: data.ho_ten,
      new_don_vi: data.don_vi || "",
      new_roles: data.roles,
    });

    if (rpcErr) throw rpcErr;

    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "update_user",
      entity: "user",
      entity_id: data.user_id,
      detail: { roles: data.roles, don_vi: data.don_vi },
    });

    return { ok: true };
  });

// ==================== TOGGLE ACTIVE / BAN ====================
export const setUserActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        user_id: z.string().uuid(),
        active: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.user_id === context.userId)
      throw new Error("Không thể tự khoá tài khoản của chính mình");
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");

    await supabaseAdmin.from("profiles").update({ active: data.active }).eq("id", data.user_id);
    await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      ban_duration: data.active ? "none" : "876000h", // ~100 năm
    });

    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: data.active ? "unban_user" : "ban_user",
      entity: "user",
      entity_id: data.user_id,
    });
    return { ok: true };
  });

// ==================== RESET PASSWORD ====================
export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        user_id: z.string().uuid(),
        password: z.string().min(8).max(72),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "reset_password",
      entity: "user",
      entity_id: data.user_id,
    });
    return { ok: true };
  });

// ==================== AUDIT LOG ====================
export const listAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");

    const { data } = await supabaseAdmin
      .from("audit_log")
      .select("id,user_id,action,entity,entity_id,detail,created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    const uids = Array.from(
      new Set((data ?? []).map((r) => r.user_id).filter(Boolean)),
    ) as string[];
    const { data: profiles } = uids.length
      ? await supabaseAdmin.from("profiles").select("id,email,ho_ten").in("id", uids)
      : { data: [] as { id: string; email: string; ho_ten: string | null }[] };
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));

    return (data ?? []).map((r) => ({
      ...r,
      actor_email: r.user_id ? (map.get(r.user_id)?.email ?? null) : null,
      actor_ho_ten: r.user_id ? (map.get(r.user_id)?.ho_ten ?? null) : null,
    }));
  });
