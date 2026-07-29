import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

const NodeTypeEnum = z.enum(["he_thong", "thanh_phan"]);

// -----------------------------------------------------------------------------
// getNodeNote — lấy ghi chú (nếu có) cho 1 node cụ thể
// -----------------------------------------------------------------------------
export const getNodeNote = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ node_type: NodeTypeEnum, node_id: z.string().min(1) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("node_note")
      .select("id, node_type, node_id, noi_dung, updated_by, created_at, updated_at")
      .eq("node_type", data.node_type)
      .eq("node_id", data.node_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ?? null;
  });

// -----------------------------------------------------------------------------
// upsertNodeNote — tạo mới hoặc cập nhật nội dung ghi chú
// -----------------------------------------------------------------------------
export const upsertNodeNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        node_type: NodeTypeEnum,
        node_id: z.string().min(1),
        noi_dung: z.string().max(200_000),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("node_note")
      .upsert(
        {
          node_type: data.node_type,
          node_id: data.node_id,
          noi_dung: data.noi_dung,
          updated_by: context.userId,
        },
        { onConflict: "node_type,node_id" },
      )
      .select("id, node_type, node_id, noi_dung, updated_by, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// -----------------------------------------------------------------------------
// listNotedNodeIds — trả về mảng key "type:id" của mọi node đã có ghi chú
// Dùng để hiển thị chấm nhỏ báo hiệu trên sơ đồ tổng quan mạng.
// -----------------------------------------------------------------------------
export const listNotedNodeIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("node_note")
      .select("node_type, node_id, updated_at");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      key: `${r.node_type}:${r.node_id}`,
      updated_at: r.updated_at as string,
    }));
  });

// -----------------------------------------------------------------------------
// searchNotes — full-text (ILIKE) trên nội dung ghi chú; kèm tên node để hiển
// thị kết quả tra cứu dạng "ô tìm kiếm ghi chú" trong drawer.
// -----------------------------------------------------------------------------
export const searchNotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ q: z.string().max(200) }).parse(i))
  .handler(async ({ data, context }) => {
    const q = data.q.trim();
    if (!q) return [] as Array<{ node_type: "he_thong" | "thanh_phan"; node_id: string; ten: string; snippet: string; updated_at: string }>;
    const like = `%${q.replace(/[%_]/g, (s) => `\\${s}`)}%`;
    const { data: rows, error } = await context.supabase
      .from("node_note")
      .select("node_type, node_id, noi_dung, updated_at")
      .ilike("noi_dung", like)
      .order("updated_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    const items = (rows ?? []) as Array<{ node_type: "he_thong" | "thanh_phan"; node_id: string; noi_dung: string; updated_at: string }>;
    // Nạp tên các node kèm theo (2 truy vấn nhỏ, batch id).
    const htIds = items.filter((r) => r.node_type === "he_thong").map((r) => r.node_id);
    const tpIds = items.filter((r) => r.node_type === "thanh_phan").map((r) => r.node_id);
    const tenMap = new Map<string, string>();
    if (htIds.length) {
      const { data: hts } = await context.supabase.from("dm_he_thong").select("id, ten").in("id", htIds);
      for (const r of hts ?? []) tenMap.set(`he_thong:${r.id}`, r.ten as string);
    }
    if (tpIds.length) {
      const { data: tps } = await context.supabase.from("he_thong_thanh_phan").select("id, ten").in("id", tpIds);
      for (const r of tps ?? []) tenMap.set(`thanh_phan:${r.id}`, r.ten as string);
    }
    // Tạo snippet ~140 ký tự xung quanh vị trí khớp đầu tiên.
    const lower = q.toLowerCase();
    return items.map((r) => {
      const idx = r.noi_dung.toLowerCase().indexOf(lower);
      const start = Math.max(0, idx - 40);
      const end = Math.min(r.noi_dung.length, (idx >= 0 ? idx : 0) + 100);
      const snippet = (start > 0 ? "…" : "") + r.noi_dung.slice(start, end).replace(/\s+/g, " ") + (end < r.noi_dung.length ? "…" : "");
      return {
        node_type: r.node_type,
        node_id: r.node_id,
        ten: tenMap.get(`${r.node_type}:${r.node_id}`) ?? r.node_id,
        snippet,
        updated_at: r.updated_at,
      };
    });
  });


// -----------------------------------------------------------------------------
// deleteNodeNote — xoá (chỉ admin, RLS đảm nhiệm)
// -----------------------------------------------------------------------------
export const deleteNodeNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ node_type: NodeTypeEnum, node_id: z.string().min(1) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("node_note")
      .delete()
      .eq("node_type", data.node_type)
      .eq("node_id", data.node_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
