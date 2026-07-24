// ============================================================================
// Hooks đọc thống kê tính sẵn ở database (GĐ 2).
// Không tải hết bảng về client — dùng RPC/view group by ở Postgres.
// ============================================================================
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardOverview {
  thiet_bi_total: number;
  thiet_bi_by_trang_thai: Record<string, number>;
  su_co_by_trang_thai: Record<string, number>;
  bao_tri_by_trang_thai: Record<string, number>;
  hong_hoc_by_trang_thai: Record<string, number>;
}

/** Overview dashboard: tổng tài sản + phân bố theo trạng thái (mọi bảng vận hành). */
export function useDashboardOverview() {
  return useQuery({
    queryKey: ["rpc_dashboard_overview"],
    staleTime: 30_000,
    queryFn: async (): Promise<DashboardOverview> => {
      const { data, error } = await supabase.rpc("rpc_dashboard_overview");
      if (error) throw error;
      return (data ?? {
        thiet_bi_total: 0,
        thiet_bi_by_trang_thai: {},
        su_co_by_trang_thai: {},
        bao_tri_by_trang_thai: {},
        hong_hoc_by_trang_thai: {},
      }) as DashboardOverview;
    },
  });
}

export interface MenuBadges {
  su_co_mo: number;
  bao_tri_mo: number;
  hong_hoc_mo: number;
  bao_tri_hom_nay: number;
}

/** Số badge cho menu: sự cố mở, bảo trì mở, hỏng hóc mở, bảo trì hôm nay. */
export function useMenuBadges() {
  return useQuery({
    queryKey: ["v_menu_badges"],
    staleTime: 15_000,
    queryFn: async (): Promise<MenuBadges> => {
      const { data, error } = await supabase.from("v_menu_badges").select("*").maybeSingle();
      if (error) throw error;
      return (data ?? { su_co_mo: 0, bao_tri_mo: 0, hong_hoc_mo: 0, bao_tri_hom_nay: 0 }) as MenuBadges;
    },
  });
}

export interface NsxStats { nha_san_xuat_id: string; ma: string | null; ten: string; so_model: number; so_thiet_bi: number }

/** Thống kê per Nhà sản xuất (view v_nsx_stats). */
export function useNsxStats() {
  return useQuery({
    queryKey: ["v_nsx_stats"],
    staleTime: 30_000,
    queryFn: async (): Promise<NsxStats[]> => {
      const { data, error } = await supabase.from("v_nsx_stats").select("*").order("ten");
      if (error) throw error;
      return (data ?? []) as NsxStats[];
    },
  });
}
