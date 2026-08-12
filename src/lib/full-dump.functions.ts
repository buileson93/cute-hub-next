import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

/**
 * Dump toàn bộ CSDL + tệp (Lovable Cloud Storage & Cloudflare R2) ra MỘT THƯ MỤC
 * trên máy người dùng. Chỉ Admin. Dữ liệu được đọc theo lô ở server rồi ghi
 * trực tiếp xuống đĩa ở trình duyệt → không giới hạn RAM của server.
 */

async function assertAdmin(supabase: any, userId: string) {
  const { data: isAdmin, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden: chỉ Admin được thực hiện");
}

async function logDumpAction(supabaseAdmin: any, userId: string, action: string, detail: any) {
  await supabaseAdmin.from("audit_log").insert({
    user_id: userId,
    action,
    entity: "full_dump",
    detail,
    severity: "info"
  });
}

const SKIP_BUCKETS = new Set(["database-backups"]);

export type DumpManifest = {
  created_at: string;
  tables: { name: string; rows: number }[];
  schema: any;
  storage: { bucket: string; path: string; size: number }[];
  r2: { key: string; size: number; ten_goc: string | null }[];
  auth_users: number;
};

/** Bước 1 — kiểm kê: bảng + số dòng, lược đồ, danh sách tệp Storage & R2 */
export const fullDumpManifest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DumpManifest> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdminTyped } = await import("@/integrations/backend/admin.server");
    const supabaseAdmin = sbAdminTyped as any;
    const { createAdminStorage } = await import("@/lib/storage/server");

    const { data: tblRows, error } = await supabaseAdmin.rpc("admin_list_backup_tables");
    if (error) throw new Error("Không lấy được danh sách bảng: " + error.message);
    const names: string[] = (tblRows ?? []).map((r: any) => r.table_name);

    const tables: { name: string; rows: number }[] = [];
    for (const name of names) {
      const { count } = await supabaseAdmin.from(name).select("*", { count: "exact", head: true });
      tables.push({ name, rows: count ?? 0 });
    }

    const { data: schema } = await context.supabase.rpc("admin_list_schema");

    // --- Kiểm kê Storage (Lovable Cloud) ---
    const storage: { bucket: string; path: string; size: number }[] = [];
    const adapter = createAdminStorage(supabaseAdmin);
    const { data: buckets } = await adapter.listBuckets();
    for (const b of (buckets ?? []).filter((x: any) => !SKIP_BUCKETS.has(x.name))) {
      const walk = async (prefix: string) => {
        let offset = 0;
        const limit = 100;
        for (;;) {
          const { data: items } = await adapter
            .from(b.name)
            .list(prefix, { limit, offset, sortBy: { column: "name", order: "asc" } });
          if (!items || items.length === 0) break;
          for (const it of items as any[]) {
            const full = prefix ? `${prefix}/${it.name}` : it.name;
            if (it.id === null || it.id === undefined) await walk(full);
            else storage.push({ bucket: b.name, path: full, size: it.metadata?.size ?? 0 });
          }
          if (items.length < limit) break;
          offset += limit;
        }
      };
      await walk("");
    }

    // --- Kiểm kê R2 (theo sổ tệp r2_file) ---
    const r2: { key: string; size: number; ten_goc: string | null }[] = [];
    const { data: r2rows } = await supabaseAdmin.from("r2_file").select("r2_key,kich_thuoc,ten_goc").limit(20000);
    for (const r of (r2rows ?? []) as any[]) {
      if (r.r2_key) r2.push({ key: r.r2_key, size: r.kich_thuoc ?? 0, ten_goc: r.ten_goc ?? null });
    }

    let authUsers = 0;
    try {
      const { data: u } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
      authUsers = (u as any)?.total ?? 0;
    } catch { /* bỏ qua */ }

    return {
      created_at: new Date().toISOString(),
      tables,
      schema: schema ?? null,
      storage,
      r2,
      auth_users: authUsers,
    };
    await logDumpAction(supabaseAdmin, context.userId, "full_dump_manifest", { tableCount: tables.length, fileCount: storage.length + r2.length });
    return manifest;
  });

/** Bước 2 — đọc dữ liệu một bảng theo lô */
export const fullDumpTableChunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ table: z.string().min(1).max(120), offset: z.number().int().min(0), limit: z.number().int().min(1).max(2000) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdminTyped } = await import("@/integrations/backend/admin.server");
    const supabaseAdmin = sbAdminTyped as any;
    const { data: allowed } = await supabaseAdmin.rpc("admin_list_backup_tables");
    if (!(allowed ?? []).some((r: any) => r.table_name === data.table)) throw new Error("Bảng không hợp lệ");
    const { data: rows, error } = await (supabaseAdmin as any)
      .from(data.table)
      .select("*")
      .range(data.offset, data.offset + data.limit - 1);
    if (error) throw new Error(`Lỗi đọc bảng ${data.table}: ${error.message}`);
    return { rows: (rows ?? []) as any[] };
  });

/** Danh sách tài khoản (auth.users) — không chứa mật khẩu */
export const fullDumpAuthUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin: sbAdminTyped } = await import("@/integrations/backend/admin.server");
    const supabaseAdmin = sbAdminTyped as any;
    const out: any[] = [];
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      const users = (data as any)?.users ?? [];
      out.push(...users);
      if (users.length < 200) break;
    }
    return { users: out };
  });

/** Bước 3 — xin liên kết tải tệp (Storage hoặc R2) để trình duyệt tải thẳng */
export const fullDumpFileUrls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        source: z.enum(["storage", "r2"]),
        bucket: z.string().max(200).optional(),
        paths: z.array(z.string().min(1).max(1024)).min(1).max(50),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const urls: { path: string; url: string | null }[] = [];

    if (data.source === "storage") {
      if (!data.bucket) throw new Error("Thiếu bucket");
      const { supabaseAdmin: sbAdminTyped } = await import("@/integrations/backend/admin.server");
    const supabaseAdmin = sbAdminTyped as any;
      const { createAdminStorage } = await import("@/lib/storage/server");
      const { data: signed } = await createAdminStorage(supabaseAdmin)
        .from(data.bucket)
        .createSignedUrls(data.paths, 900);
      const map = new Map<string, string>();
      for (const s of (signed ?? []) as any[]) if (s?.path && s?.signedUrl) map.set(s.path, s.signedUrl);
      for (const p of data.paths) urls.push({ path: p, url: map.get(p) ?? null });
    } else {
      const { r2PresignGet } = await import("@/lib/mirats/r2.server");
      for (const key of data.paths) {
        try {
          urls.push({ path: key, url: await r2PresignGet(key, 900) });
        } catch {
          urls.push({ path: key, url: null });
        }
      }
    }
    return { urls };
  });
