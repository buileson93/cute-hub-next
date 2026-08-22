import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import type { CongVanLinkRow, CongVanRow, CongVanTepRow } from "./types";

export function useCongVanData(duAnId: string) {
  const qc = useQueryClient();

  const cvQ = useQuery({
    queryKey: ["du-an-cong-van", duAnId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("du_an_cong_van")
        .select("*")
        .eq("du_an_id", duAnId)
        .order("ngay_ban_hanh", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CongVanRow[];
    },
  });

  const ids = (cvQ.data ?? []).map((c) => c.id);

  const linkQ = useQuery({
    queryKey: ["du-an-cong-van-link", duAnId, ids.length],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("du_an_cong_van_lien_ket")
        .select("*")
        .in("tu_id", ids);
      if (error) throw error;
      return (data ?? []) as unknown as CongVanLinkRow[];
    },
  });

  const tepQ = useQuery({
    queryKey: ["du-an-cong-van-tep", duAnId, ids.length],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("du_an_cong_van_tep")
        .select("*")
        .in("cong_van_id", ids)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CongVanTepRow[];
    },
  });

  function refresh() {
    void qc.invalidateQueries({ queryKey: ["du-an-cong-van", duAnId] });
    void qc.invalidateQueries({ queryKey: ["du-an-cong-van-link", duAnId] });
    void qc.invalidateQueries({ queryKey: ["du-an-cong-van-tep", duAnId] });
  }

  return {
    congVans: cvQ.data ?? [],
    links: linkQ.data ?? [],
    teps: tepQ.data ?? [],
    isLoading: cvQ.isLoading,
    error: cvQ.error as Error | null,
    refresh,
  };
}
