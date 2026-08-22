import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

export const getCompletenessStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, unauthenticated } = context as any;
    if (unauthenticated || !supabase) {
      return { avg_thiet_bi: 0 }; // Return safe default for SSR
    }
    const { data, error } = await supabase.rpc("get_completeness_stats");
    if (error) throw new Error(error.message);
    return (data || {}) as any;
  });

export const getCompletenessOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        limit: z.number().optional().default(10),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, unauthenticated } = context as any;
    if (unauthenticated || !supabase) {
      return { lowCompleteness: [], tasks: [] };
    }
    const { data: lowCompleteness, error: err1 } = await supabase
      .from("thiet_bi")
      .select("id, ten_thiet_bi, completeness_pct, he_thong_id, don_vi_id, dm_he_thong(ten)")
      .order("completeness_pct", { ascending: true })
      .limit(data.limit);

    if (err1) throw new Error(err1.message);

    // Lấy danh sách nhiệm vụ còn lại
    const { data: tasks, error: err2 } = await supabase
      .from("nhiem_vu_nhap_lieu")
      .select("*")
      .eq("trang_thai", "moi")
      .limit(10);

    if (err2) throw new Error(err2.message);

    return {
      lowCompleteness: (lowCompleteness || []) as any[],
      tasks: (tasks || []) as any[],
    };
  });
