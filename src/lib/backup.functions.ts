import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

const BUCKET = "database-backups";

async function assertAdmin(supabase: any, userId: string) {
  const { data: isAdmin, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden: chỉ Admin được thực hiện");
}

async function logBackupAction(supabaseAdmin: any, userId: string, action: string, detail: any) {
  await supabaseAdmin.from("audit_log").insert({
    user_id: userId,
    action,
    entity: "backup",
    detail,
    severity: "info",
  });
}

// ==================== TRẠNG THÁI CLOUD ====================
export const getCloudStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    return {
      gdrive: Boolean(process.env.LOVABLE_API_KEY && process.env.GOOGLE_DRIVE_API_KEY),
      s3: Boolean(process.env.LOVABLE_API_KEY && process.env.AWS_S3_API_KEY),
    };
  });

// ==================== TẠO BACKUP ====================
export const runBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        loai: z.enum(["thu_cong", "tu_dong"]).default("thu_cong"),
        dich: z.array(z.enum(["storage", "gdrive", "s3"])).default(["storage"]),
        ghi_chu: z.string().max(500).optional(),
        include_storage: z.boolean().default(true),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    const { performBackup } = await import("@/lib/backup.server");

    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("ho_ten,email")
      .eq("id", context.userId)
      .maybeSingle();

    // Lấy lược đồ (kiểu cột) để sinh tệp .sql chuẩn — dùng client của người dùng (admin)
    const { data: schema } = await context.supabase.rpc("admin_list_schema");

    const result = await performBackup(supabaseAdmin, {
      loai: data.loai,
      dich: data.dich,
      ghi_chu: data.ghi_chu ?? null,
      userId: context.userId,
      userName: prof?.ho_ten ?? prof?.email ?? null,
      schema: (schema as any) ?? null,
      includeStorage: data.include_storage,
    });

    await logBackupAction(supabaseAdmin, context.userId, "run_backup", {
      loai: data.loai,
      dich: data.dich,
    });
    return result;
  });

// ==================== DANH SÁCH BACKUP ====================
export const listBackups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    const { data, error } = await supabaseAdmin
      .from("backup_lich_su")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ==================== TẢI XUỐNG (SIGNED URL) ====================
export const getBackupDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    const { data: rec, error } = await supabaseAdmin
      .from("backup_lich_su")
      .select("file_path")
      .eq("id", data.id)
      .single();
    if (error || !rec?.file_path) throw new Error("Không tìm thấy tệp backup");
    const { createAdminStorage } = await import("@/lib/storage/server");
    const { data: signed, error: sErr } = await createAdminStorage(supabaseAdmin)
      .from(BUCKET)
      .createSignedUrl(rec.file_path, 300, { download: rec.file_path.split("/").pop() });
    if (sErr || !signed) throw new Error(sErr?.message ?? "Không tạo được liên kết tải");
    return { url: signed.signedUrl };
  });

// ==================== XOÁ BACKUP ====================
export const deleteBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    const { data: rec } = await supabaseAdmin
      .from("backup_lich_su")
      .select("file_path")
      .eq("id", data.id)
      .single();
    if (rec?.file_path) {
      const { createAdminStorage } = await import("@/lib/storage/server");
      await createAdminStorage(supabaseAdmin).from(BUCKET).remove([rec.file_path]);
    }
    const { error } = await supabaseAdmin.from("backup_lich_su").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logBackupAction(supabaseAdmin, context.userId, "delete_backup", { id: data.id });
    return { ok: true };
  });

// ==================== KHÔI PHỤC TỪ BACKUP ĐÃ LƯU ====================
export const restoreFromBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    const { data: rec, error } = await supabaseAdmin
      .from("backup_lich_su")
      .select("file_path")
      .eq("id", data.id)
      .single();
    if (error || !rec?.file_path) throw new Error("Không tìm thấy tệp backup");

    const { createAdminStorage } = await import("@/lib/storage/server");
    const { data: blob, error: dErr } = await createAdminStorage(supabaseAdmin)
      .from(BUCKET)
      .download(rec.file_path);
    if (dErr || !blob) throw new Error("Tải tệp backup lỗi: " + (dErr?.message ?? ""));
    const buf = new Uint8Array(await blob.arrayBuffer());
    const { extractDumpData } = await import("@/lib/backup.server");
    const dump = await extractDumpData(rec.file_path, buf);
    if (!dump?.data) throw new Error("Tệp backup không hợp lệ");

    const { data: result, error: rErr } = await context.supabase.rpc("admin_restore_database", {
      payload: dump.data,
    });
    if (rErr) throw new Error("Khôi phục lỗi: " + rErr.message);
    await logBackupAction(supabaseAdmin, context.userId, "restore_backup", { id: data.id });
    return result;
  });

// ==================== KHÔI PHỤC TỪ TỆP TẢI LÊN ====================
export const restoreFromUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        content: z.string().min(2),
        filename: z.string().max(300).optional(),
        // "text" = nội dung JSON thô; "base64" = tệp nhị phân (.zip/.gz) mã hoá base64
        encoding: z.enum(["text", "base64"]).default("text"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");

    let payload: any;
    const name = (data.filename ?? "").toLowerCase();

    if (data.encoding === "base64" || name.endsWith(".zip") || name.endsWith(".gz")) {
      // Giải nén tệp .zip (chứa data.json) hoặc .json.gz
      const buf = new Uint8Array(Buffer.from(data.content, "base64"));
      const { extractDumpData } = await import("@/lib/backup.server");
      const dump = await extractDumpData(name || "backup.zip", buf);
      payload = dump?.data ?? dump;
    } else {
      let dump: any;
      try {
        dump = JSON.parse(data.content);
      } catch {
        throw new Error("Nội dung tệp không phải JSON hợp lệ");
      }
      payload = dump?.data ?? dump;
    }

    if (!payload || typeof payload !== "object") throw new Error("Tệp backup không hợp lệ");
    const { data: result, error } = await context.supabase.rpc("admin_restore_database", {
      payload,
    });
    if (error) throw new Error("Khôi phục lỗi: " + error.message);
    await logBackupAction(supabaseAdmin, context.userId, "restore_upload", {
      filename: data.filename,
    });
    return result;
  });
