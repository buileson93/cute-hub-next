import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

const ROLES = ["admin", "phong_kt", "phu_trach_dv", "ktv", "readonly", "quan_ly_du_an", "to_truong"] as const;

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: chỉ Admin");
}

// ===== My permissions & scope =====
export const getMyPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [rolesRes, permsRes, scopeRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("role_permission").select("role,module,action,allowed").eq("allowed", true),
      supabase.from("user_scope").select("to_chuc_id,don_vi_id").eq("user_id", userId),
    ]);
    const myRoles = new Set((rolesRes.data ?? []).map((r: any) => r.role));
    const allowed: Record<string, Set<string>> = {};
    for (const p of permsRes.data ?? []) {
      if (!myRoles.has(p.role)) continue;
      (allowed[p.module] ??= new Set()).add(p.action);
    }
    const permsByModule: Record<string, string[]> = {};
    for (const [m, s] of Object.entries(allowed)) permsByModule[m] = [...s];
    return {
      roles: [...myRoles],
      permissions: permsByModule,
      scope: scopeRes.data ?? [],
      isGlobal: (scopeRes.data ?? []).some((s: any) => !s.to_chuc_id && !s.don_vi_id),
    };
  });

// ===== Admin: list users with roles + scope =====
export const listUsersWithScope = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    const [{ data: profiles }, { data: roles }, { data: scopes }, { data: toChuc }, { data: donVi }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,email,ho_ten,active,created_at").order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id,role"),
      supabaseAdmin.from("user_scope").select("id,user_id,to_chuc_id,don_vi_id,note,created_at"),
      supabaseAdmin.from("dm_to_chuc").select("id,ma,ten"),
      supabaseAdmin.from("dm_don_vi").select("id,ma,ten"),
    ]);
    const rolesByUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const l = rolesByUser.get(r.user_id) ?? [];
      l.push(r.role);
      rolesByUser.set(r.user_id, l);
    }
    const scopesByUser = new Map<string, any[]>();
    for (const s of scopes ?? []) {
      const l = scopesByUser.get(s.user_id) ?? [];
      l.push(s);
      scopesByUser.set(s.user_id, l);
    }
    return {
      users: (profiles ?? []).map((p) => ({
        ...p,
        roles: rolesByUser.get(p.id) ?? [],
        scopes: scopesByUser.get(p.id) ?? [],
      })),
      toChuc: toChuc ?? [],
      donVi: donVi ?? [],
    };
  });

// ===== Admin: set user scope (replace all) =====
export const setUserScope = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      user_id: z.string().uuid(),
      scopes: z.array(z.object({
        to_chuc_id: z.string().uuid().nullable(),
        don_vi_id: z.string().uuid().nullable(),
      })),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    await supabaseAdmin.from("user_scope").delete().eq("user_id", data.user_id);
    if (data.scopes.length > 0) {
      const rows = data.scopes.map((s) => ({ user_id: data.user_id, to_chuc_id: s.to_chuc_id, don_vi_id: s.don_vi_id, created_by: context.userId }));
      const { error } = await supabaseAdmin.from("user_scope").insert(rows);
      if (error) throw new Error(error.message);
    }
    await supabaseAdmin.rpc("log_auth_event", { _event: "scope_change", _target: data.user_id, _detail: { scopes: data.scopes } as any });
    return { ok: true };
  });

// ===== Admin: role_permission matrix =====
export const getRoleMatrix = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("role_permission").select("role,module,action,allowed");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const setRolePermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      role: z.enum(ROLES),
      module: z.string().min(1),
      action: z.string().min(1),
      allowed: z.boolean(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    const { error } = await supabaseAdmin.from("role_permission").upsert({
      role: data.role, module: data.module, action: data.action, allowed: data.allowed, updated_by: context.userId, updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Access request =====
export const createAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      module: z.string(), action: z.string(), reason: z.string().max(500).optional(), ttl_minutes: z.number().min(15).max(1440).default(60),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("access_request").insert({
      user_id: context.userId, module: data.module, action: data.action, reason: data.reason, ttl_minutes: data.ttl_minutes,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAccessRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase.from("access_request").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const resolveAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), approve: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    const { data: req } = await supabaseAdmin.from("access_request").select("*").eq("id", data.id).single();
    if (!req) throw new Error("Not found");
    const expires = data.approve ? new Date(Date.now() + (req.ttl_minutes ?? 60) * 60_000).toISOString() : null;
    const { error } = await supabaseAdmin.from("access_request").update({
      status: data.approve ? "approved" : "rejected",
      approved_by: context.userId, approved_at: new Date().toISOString(), expires_at: expires,
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== Feature usage log (client fires) =====
export const logFeatureUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ feature: z.string().max(120), path: z.string().max(300).optional(), params: z.record(z.string(), z.any()).optional(), duration_ms: z.number().int().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await (context.supabase.rpc as any)("log_feature_usage", {
      _feature: data.feature,
      _path: data.path ?? "",
      _params: (data.params ?? {}) as any,
      _duration_ms: data.duration_ms ?? 0,
    });
    return { ok: true };
  });


// ===== Audit v2 =====
export const listAuditV2 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      user_id: z.string().uuid().optional(), entity: z.string().optional(), action: z.string().optional(),
      severity: z.string().optional(), from: z.string().optional(), to: z.string().optional(), limit: z.number().max(500).default(200),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    let q = supabaseAdmin.from("audit_log").select("*").order("created_at", { ascending: false }).limit(data.limit);
    if (data.user_id) q = q.eq("user_id", data.user_id);
    if (data.entity) q = q.eq("entity", data.entity);
    if (data.action) q = q.eq("action", data.action);
    if (data.severity) q = q.eq("severity", data.severity);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: any) => ({ ...r, ip: r.ip ? String(r.ip) : null }));
  });


export const listFeatureUsageAggregate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
    const { data } = await supabaseAdmin.from("feature_usage_log").select("feature,user_id,created_at").gte("created_at", since).limit(5000);
    const byFeature = new Map<string, number>();
    const byUser = new Map<string, number>();
    for (const r of data ?? []) {
      byFeature.set(r.feature, (byFeature.get(r.feature) ?? 0) + 1);
      if (r.user_id) byUser.set(r.user_id, (byUser.get(r.user_id) ?? 0) + 1);
    }
    return {
      topFeatures: [...byFeature].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([feature, count]) => ({ feature, count })),
      topUsers: [...byUser].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([user_id, count]) => ({ user_id, count })),
      total: data?.length ?? 0,
    };
  });

export const listAnomalies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("anomaly_alert").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const resolveAnomaly = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), status: z.enum(["ack", "resolved"]) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("anomaly_alert").update({
      status: data.status, resolved_by: context.userId, resolved_at: new Date().toISOString(),
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===== View as user (preview only — returns their perms/scope for admin UI) =====
export const previewAsUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    const [rolesRes, scopeRes, permsRes] = await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", data.user_id),
      supabaseAdmin.from("user_scope").select("to_chuc_id,don_vi_id").eq("user_id", data.user_id),
      supabaseAdmin.from("role_permission").select("role,module,action,allowed").eq("allowed", true),
    ]);
    await supabaseAdmin.rpc("log_auth_event", { _event: "impersonate", _target: data.user_id, _detail: {} as any });
    const myRoles = new Set((rolesRes.data ?? []).map((r: any) => r.role));
    const allowed: Record<string, string[]> = {};
    for (const p of permsRes.data ?? []) {
      if (!myRoles.has(p.role)) continue;
      (allowed[p.module] ??= []).push(p.action);
    }
    return {
      roles: [...myRoles],
      permissions: allowed,
      scope: scopeRes.data ?? [],
      isGlobal: (scopeRes.data ?? []).some((s: any) => !s.to_chuc_id && !s.don_vi_id),
    };
  });
