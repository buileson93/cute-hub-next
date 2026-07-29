import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

/**
 * Phục hồi CSDL từ gói dump .zip: nạp lại DỮ LIỆU THEO TỪNG BẢNG, theo lô nhỏ
 * để không vượt giới hạn kích thước request. Trình duyệt giải nén tệp .zip rồi
 * gọi hàm này lần lượt cho từng lô.
 *
 * Quyền: chỉ Admin (kiểm tra 2 lớp — ở đây và trong hàm CSDL admin_restore_table,
 * hàm này cũng bỏ qua các bảng nhạy cảm: tài khoản, phân quyền, nhật ký…).
 */

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: chỉ Admin được thực hiện");
}

/** Ghi nhật ký kiểm toán (ai — làm gì — lúc nào) cho thao tác phục hồi CSDL. */
async function ghiAudit(
  supabase: any,
  userId: string,
  action: string,
  detail: Record<string, unknown>,
  severity: "info" | "warning" | "critical" = "info",
) {
  try {
    await supabase.from("audit_log").insert({
      user_id: userId,
      action,
      entity: "database",
      entity_id: (detail.run_id as string) ?? null,
      detail,
      severity,
    });
  } catch {
    /* không chặn thao tác phục hồi nếu ghi nhật ký lỗi */
  }
}

/** Kiểm tra quyền trước khi mở luồng phục hồi + mở phiên phục hồi có nhật ký. */
export const restoreDumpBegin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        filename: z.string().min(1).max(255),
        tables: z.number().int().nonnegative(),
        rows: z.number().int().nonnegative(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const runId = crypto.randomUUID();
    await ghiAudit(
      context.supabase,
      context.userId,
      "db.restore.begin",
      { run_id: runId, filename: data.filename, tables: data.tables, rows: data.rows },
      "critical",
    );
    return { runId };
  });

/** Đóng phiên phục hồi: ghi kết quả (thành công/thất bại) vào nhật ký. */
export const restoreDumpFinish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        runId: z.string().min(1).max(64),
        ok: z.boolean(),
        filename: z.string().max(255).default(""),
        tables: z.number().int().nonnegative().default(0),
        rows: z.number().int().nonnegative().default(0),
        skipped: z.array(z.string()).max(500).default([]),
        error: z.string().max(1000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    await ghiAudit(
      context.supabase,
      context.userId,
      data.ok ? "db.restore.success" : "db.restore.failed",
      {
        run_id: data.runId,
        filename: data.filename,
        tables: data.tables,
        rows: data.rows,
        skipped: data.skipped,
        error: data.error ?? null,
      },
      data.ok ? "critical" : "warning",
    );
    return { ok: true };
  });

/** Cho UI biết người dùng hiện tại có được phép phục hồi CSDL hay không. */
export const canRestoreDump = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { allowed: !!data };
  });


/** Danh sách bảng hợp lệ để đối chiếu với nội dung gói dump. */
export const restoreDumpTables = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase.rpc("admin_list_backup_tables");
    if (error) throw new Error(error.message);
    return { tables: ((data ?? []) as any[]).map((r) => r.table_name as string) };
  });

/** Nạp một lô dữ liệu vào một bảng. `truncate` = true ở lô ĐẦU TIÊN của bảng. */
export const restoreDumpChunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        table: z.string().min(1).max(120),
        rows: z.array(z.record(z.string(), z.unknown())).max(1000),
        truncate: z.boolean().default(false),
        runId: z.string().max(64).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: result, error } = await (context.supabase as any).rpc("admin_restore_table", {
      p_table: data.table,
      p_rows: data.rows,
      p_truncate: data.truncate,
    });
    if (error) throw new Error(`Bảng ${data.table}: ${error.message}`);
    if (data.truncate) {
      await ghiAudit(
        context.supabase,
        context.userId,
        "db.restore.table",
        { run_id: data.runId ?? null, table: data.table, truncate: true },
        "warning",
      );
    }
    return result as { ok: boolean; table?: string; rows?: number; skipped?: boolean; reason?: string };
  });

