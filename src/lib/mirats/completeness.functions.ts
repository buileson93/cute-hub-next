import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

export const getCompletenessStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { supabase, unauthenticated } = context as any;
      if (unauthenticated || !supabase) {
        return { avg_thiet_bi: 0 }; 
      }
      const { data, error } = await supabase.rpc("get_completeness_stats");
      if (error) {
        console.warn("get_completeness_stats error:", error.message);
        return { avg_thiet_bi: 0 };
      }
      return (data || { avg_thiet_bi: 0 }) as any;
    } catch (e) {
      console.warn("get_completeness_stats exception:", e);
      return { avg_thiet_bi: 0 };
    }
  });

export const getCompletenessOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => 
    z.object({
      limit: z.number().optional().default(10)
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, unauthenticated } = context as any;
    try {
      const { supabase, unauthenticated } = context as any;
      if (unauthenticated || !supabase) {
        return { lowCompleteness: [], tasks: [] };
      }
      const [lcRes, tasksRes] = await Promise.all([
        supabase
          .from("thiet_bi")
          .select("id, ten_thiet_bi, completeness_pct, he_thong_id, don_vi_id, dm_he_thong(ten)")
          .order("completeness_pct", { ascending: true })
          .limit(data.limit),
        supabase
          .from("nhiem_vu_nhap_lieu")
          .select("*")
          .eq("trang_thai", "moi")
          .limit(10)
      ]);

      if (lcRes.error) console.warn("lcRes error:", lcRes.error.message);
      if (tasksRes.error) console.warn("tasksRes error:", tasksRes.error.message);

      return {
        lowCompleteness: (lcRes.data || []) as any[],
        tasks: (tasksRes.data || []) as any[]
      };
    } catch (e) {
      console.warn("getCompletenessOverview exception:", e);
      return { lowCompleteness: [], tasks: [] };
    }
  });
