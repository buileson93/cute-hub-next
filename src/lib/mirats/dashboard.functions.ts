import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";

export interface DashboardBrief {
  su_co_khan: number;
  pm_hom_nay: number;
  pm_qua_han: number;
  han_7_ngay: number;
  sap_het_han_30: number;
  generated_at: string;
}

export function useDashboardBrief(donViIds?: string[]) {
  return useQuery({
    queryKey: ["dashboard_brief_today", donViIds],
    staleTime: 60_000,
    queryFn: async (): Promise<DashboardBrief> => {
      const { data, error } = await supabase.rpc("dashboard_brief_today" as never, { 
        p_don_vi_ids: donViIds 
      } as never);
      if (error) throw error;
      return data as unknown as DashboardBrief;
    },
  });
}

export interface ActivityFeedRow {
  at: string;
  loai: 'su_co' | 'bao_tri' | 'ban_giao' | 'kiem_ke';
  tieu_de: string;
  ref_route: string;
  ref_id: string;
}

export function useActivityFeed(donViIds?: string[], limit = 20) {
  return useQuery({
    queryKey: ["dashboard_activity_feed", donViIds, limit],
    staleTime: 30_000,
    queryFn: async (): Promise<ActivityFeedRow[]> => {
      const { data, error } = await supabase.rpc("dashboard_activity_feed" as never, {
        p_don_vi_ids: donViIds,
        p_limit: limit
      } as never);
      if (error) throw error;
      return (data ?? []) as ActivityFeedRow[];
    },
  });
}

export interface DashboardKpis {
  tong_tai_san: number;
  dang_hoat_dong: number;
  ngung_khai_thac: number;
  su_co_mo: number;
  su_co_moi: number;
  pm_den_han: number;
  pm_qua_han: number;
  sap_het_han: number;
  qua_han_giay_phep: number;
}

export function useDashboardKpis(donViIds?: string[], fromDate?: string, toDate?: string) {
  const dTo = toDate || new Date().toISOString().slice(0, 10);
  const dFrom = fromDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  })();

  return useQuery({
    queryKey: ["dashboard_kpis", donViIds, dFrom, dTo],
    staleTime: 60_000,
    queryFn: async (): Promise<DashboardKpis> => {
      const { data, error } = await supabase.rpc("dashboard_kpis", {
        p_don_vi_ids: donViIds,
        p_from: dFrom,
        p_to: dTo
      });
      if (error) throw error;
      return data as unknown as DashboardKpis;
    },
  });
}

export interface DashboardHealth {
  availability_pct: number | null;
  mtbf_h: number;
  mttr_h: number;
  mttr_prev_h: number;
  compliance_pct: number | null;
  n_closed: number;
  n_closed_prev: number;
  downtime_h: number;
  total_h: number;
  period_days: number;
}

export function useDashboardHealth(donViIds?: string[], fromDate?: string, toDate?: string) {
  const dTo = toDate || new Date().toISOString().slice(0, 10);
  const dFrom = fromDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  })();

  return useQuery({
    queryKey: ["dashboard_health", donViIds, dFrom, dTo],
    staleTime: 60_000,
    queryFn: async (): Promise<DashboardHealth> => {
      const { data, error } = await supabase.rpc("dashboard_health" as never, {
        p_don_vi_ids: donViIds,
        p_from: dFrom,
        p_to: dTo
      } as never);
      if (error) throw error;
      return data as unknown as DashboardHealth;
    },
  });
}

export interface AuditLogRow {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string;
  detail: any;
  created_at: string;
  severity: string;
}

export function useUserAuditLog(limit = 10) {
  return useQuery({
    queryKey: ["user_audit_log", limit],
    staleTime: 30_000,
    queryFn: async (): Promise<AuditLogRow[]> => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as AuditLogRow[];
    },
  });
}
