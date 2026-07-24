// ============================================================================
// Server functions: ÁP DỤNG (apply) và HOÀN TÁC (rollback) một lô nhập đã
// staging vào bảng nghiệp vụ. Toàn bộ logic ghi/hoàn tác nằm trong các RPC
// SECURITY DEFINER phía DB (apply_import_batch / preview_rollback_import_batch
// / rollback_import_batch) để đảm bảo giao dịch nguyên tử, idempotent và có
// nhật ký before/after. Ở đây chỉ bọc RPC thành server function cho UI.
//
// Bảo mật: mỗi RPC tự kiểm tra has_role(admin) bên trong; lớp này kiểm tra
// thêm một lần trước khi gọi để trả lỗi thân thiện.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: chỉ Admin được áp dụng/hoàn tác lô nhập");
}

const IdInput = z.object({ id: z.string().uuid() });

/**
 * Áp dụng lô nhập vào dữ liệu nghiệp vụ.
 * - Giao dịch nguyên tử: lỗi giữa chừng -> hoàn tác toàn bộ.
 * - Idempotent theo chunk: dòng đã áp dụng (applied_at) sẽ bị bỏ qua khi chạy lại.
 * - Lưu before/after snapshot + target_id cho từng dòng để phục vụ hoàn tác.
 */
export const applyImportBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof IdInput>) => IdInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: res, error } = await supabase.rpc("apply_import_batch", {
      _batch_id: data.id,
    });
    if (error) throw new Error(error.message);
    return { result: (res ?? {}) as Json };
  });

/**
 * Xem trước hoàn tác: liệt kê những dòng KHÔNG thể tự hoàn tác an toàn
 * (record đã phát sinh dữ liệu phụ thuộc — "có lịch sử"), để Admin xác nhận.
 */
export const previewRollbackImportBatch = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof IdInput>) => IdInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: res, error } = await supabase.rpc("preview_rollback_import_batch", {
      _batch_id: data.id,
    });
    if (error) throw new Error(error.message);
    return { preview: (res ?? {}) as Json };
  });

/**
 * Hoàn tác lô: xóa record đã tạo (nếu chưa có dữ liệu phụ thuộc) và khôi phục
 * before_snapshot cho update/retire. Dòng có lịch sử sẽ bị CHẶN, không xóa cứng.
 */
export const rollbackImportBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof IdInput>) => IdInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: res, error } = await supabase.rpc("rollback_import_batch", {
      _batch_id: data.id,
    });
    if (error) throw new Error(error.message);
    return { result: (res ?? {}) as Json };
  });
