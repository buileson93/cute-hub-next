// ============================================================================
// Server functions: khu vực nhập liệu tạm (staging) cho import hàng loạt.
// Upload/parse CHỈ tạo staging (import_batch + import_item), chưa ghi bảng
// nghiệp vụ. Cho phép: nhận diện file trùng theo hash, xem lại lịch sử lô,
// mở lại review, và hủy/xóa lô. Chỉ Admin được tạo/ghi lô.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: chỉ Admin được nhập liệu hàng loạt");
}

const StagedItem = z.object({
  sheet: z.string().optional(),
  entity: z.string(),
  catTable: z.string().optional(),
  rowIndex: z.number().int(),
  rawRow: z.record(z.string(), z.unknown()).default({}),
  normalizedRow: z.record(z.string(), z.unknown()).nullable().optional(),
  status: z.enum(["staged", "valid", "error", "committed", "skipped"]).default("staged"),
  messages: z.array(z.unknown()).default([]),
});

const CreateBatchInput = z.object({
  fileName: z.string().min(1),
  fileHash: z.string().min(1),
  fileSize: z.number().int().nonnegative().optional(),
  schemaVersion: z.string().optional(),
  source: z.enum(["allinone", "csv"]).default("allinone"),
  scope: z.string().optional(),
  summary: z.record(z.string(), z.unknown()).default({}),
  items: z.array(StagedItem).max(20000),
});

/** Tạo một lô nhập ở trạng thái tạm (staged) cùng toàn bộ dòng của nó. */
export const createImportBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof CreateBatchInput>) => CreateBatchInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    // Nhận diện file trùng theo hash (lô gần nhất cùng hash).
    const { data: dup } = await supabase
      .from("import_batch")
      .select("id, file_name, status, created_at, summary")
      .eq("file_hash", data.fileHash)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: batch, error: bErr } = await supabase
      .from("import_batch")
      .insert({
        created_by: userId,
        file_name: data.fileName,
        file_hash: data.fileHash,
        file_size: data.fileSize ?? null,
        schema_version: data.schemaVersion ?? null,
        source: data.source,
        scope: data.scope ?? null,
        status: "staged",
        summary: data.summary as never,
      })
      .select("id")
      .single();
    if (bErr) throw new Error(bErr.message);

    if (data.items.length) {
      const rows = data.items.map((it) => ({
        batch_id: batch.id,
        sheet: it.sheet ?? null,
        entity: it.entity,
        cat_table: it.catTable ?? null,
        row_index: it.rowIndex,
        raw_row: it.rawRow as never,
        normalized_row: (it.normalizedRow ?? null) as never,
        status: it.status,
        messages: it.messages as never,
      }));
      // Chèn theo lô nhỏ để tránh payload quá lớn.
      const CHUNK = 1000;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const { error: iErr } = await supabase.from("import_item").insert(rows.slice(i, i + CHUNK));
        if (iErr) throw new Error(iErr.message);
      }
    }

    return {
      batchId: batch.id as string,
      duplicate: dup ? { id: dup.id, fileName: dup.file_name, status: dup.status, createdAt: dup.created_at } : null,
    };
  });

/** Kiểm tra file đã từng nhập chưa (theo hash) trước khi upload. */
export const checkImportFileHash = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { hash: string }) => z.object({ hash: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: rows, error } = await supabase
      .from("import_batch")
      .select("id, file_name, status, created_at, summary")
      .eq("file_hash", data.hash)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw new Error(error.message);
    return { matches: rows ?? [] };
  });

/** Danh sách lô nhập (RLS: người tạo thấy lô của mình, admin thấy tất cả). */
export const listImportBatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("import_batch")
      .select("id, file_name, file_hash, source, scope, status, summary, created_at, created_by")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { batches: data ?? [] };
  });

/** Mở lại một lô để review: trả về lô + toàn bộ dòng. */
export const getImportBatch = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: batch, error: bErr } = await supabase
      .from("import_batch")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (bErr) throw new Error(bErr.message);
    if (!batch) throw new Error("Không tìm thấy lô nhập (hoặc không có quyền xem)");

    const { data: items, error: iErr } = await supabase
      .from("import_item")
      .select("*")
      .eq("batch_id", data.id)
      .order("sheet", { ascending: true })
      .order("row_index", { ascending: true });
    if (iErr) throw new Error(iErr.message);

    return { batch, items: items ?? [] };
  });

/** Cập nhật trạng thái lô (reviewing/committed/discarded). */
export const updateImportBatchStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string; summary?: Record<string, unknown> }) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["staged", "reviewing", "committed", "discarded"]),
        summary: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const patch: Record<string, unknown> = { status: data.status };
    if (data.summary) patch.summary = data.summary;
    const { error } = await supabase.from("import_batch").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Xóa hẳn một lô staging (rollback: các dòng cascade theo). */
export const deleteImportBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from("import_batch").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
