import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DailyBrief {
  expiring_gp_7d: number;
  expiring_gp_30d: number;
  open_incidents: number;
  critical_incidents: number;
  overdue_pm: number;
  due_pm_7d: number;
  my_shift_tasks: number;
  unread_notif: number;
  generated_at: string;
}

export function useDailyBrief() {
  return useQuery({
    queryKey: ["daily-brief"],
    queryFn: async (): Promise<DailyBrief> => {
      const { data, error } = await supabase.rpc("rpc_daily_brief" as never);
      if (error) throw error;
      return data as unknown as DailyBrief;
    },
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });
}
