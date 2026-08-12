import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/backend/client";

export interface HeartBeatGroup {
  id: string;
  ten: string;
  status: 'critical' | 'warning' | 'normal' | 'inactive';
  systemCount: number;
  criticalCount: number;
  warningCount: number;
  reasons: string[];
}

export const getHeartBeatData = createServerFn({ method: "GET" })
  .handler(async (): Promise<HeartBeatGroup[]> => {
    // 1. Fetch groups and their active systems
    const { data: groups, error } = await supabase
      .from("dm_nhom_he_thong")
      .select(`
        id, 
        ten, 
        active,
        systems:dm_he_thong(
          id, 
          ten,
          active,
          su_co(id, muc_do, trang_thai),
          bao_tri(id, trang_thai, ngay_den_han)
        )
      `)
      .eq("active", true)
      .order("thu_tu", { ascending: true });

    if (error) throw error;

    const now = new Date();

    return (groups || []).map(g => {
      const systems = (g.systems || []) as any[];
      const activeSystems = systems.filter(s => s.active);
      
      let criticalCount = 0;
      let warningCount = 0;
      const reasons: string[] = [];

      activeSystems.forEach(s => {
        const openIncidents = s.su_co?.filter((i: any) => i.trang_thai !== 'da_dong') || [];
        const criticalIncidents = openIncidents.filter((i: any) => i.muc_do === 'Nghiêm trọng' || i.muc_do === 'Cao');
        const warningIncidents = openIncidents.filter((i: any) => i.muc_do === 'Trung bình' || i.muc_do === 'Thấp');
        
        const overduePM = s.bao_tri?.filter((b: any) => 
          b.trang_thai !== 'hoan_thanh' && b.ngay_den_han && new Date(b.ngay_den_han) < now
        ) || [];

        if (criticalIncidents.length > 0) {
          criticalCount++;
          if (reasons.length < 3) reasons.push(`${s.ten}: ${criticalIncidents.length} sự cố nghiêm trọng`);
        } else if (warningIncidents.length > 0 || overduePM.length > 0) {
          warningCount++;
          if (reasons.length < 3 && warningIncidents.length > 0) reasons.push(`${s.ten}: ${warningIncidents.length} sự cố`);
          if (reasons.length < 3 && overduePM.length > 0) reasons.push(`${s.ten}: ${overduePM.length} bảo trì quá hạn`);
        }
      });

      let status: HeartBeatGroup['status'] = 'normal';
      if (criticalCount > 0) status = 'critical';
      else if (warningCount > 0) status = 'warning';
      else if (activeSystems.length === 0) status = 'inactive';

      return {
        id: g.id,
        ten: g.ten,
        status,
        systemCount: activeSystems.length,
        criticalCount,
        warningCount,
        reasons: Array.from(new Set(reasons))
      };
    });
  });

export interface AuditTimelineItem {
  id: string;
  created_at: string;
  action: string;
  table_name: string;
  user_ho_ten: string | null;
  description: string;
}

export const getAuditTimeline = createServerFn({ method: "GET" })
  .handler(async (): Promise<AuditTimelineItem[]> => {
    const { data, error } = await supabase
      .from("audit_log")
      .select(`
        id, 
        created_at, 
        action, 
        table_name, 
        payload,
        profiles!audit_log_user_id_fkey(ho_ten)
      `)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      // If permission error, return empty or what we can see
      console.error("Audit log fetch error:", error);
      return [];
    }

    const formatAction = (item: any): string => {
      const user = item.profiles?.ho_ten || "Hệ thống";
      const tableMap: Record<string, string> = {
        su_co: "sự cố",
        bao_tri: "bảo trì",
        thiet_bi: "tài sản",
        hong_hoc: "hỏng hóc",
        ban_giao: "bàn giao",
        gan_chuc_nang: "vị trí chức năng",
        dm_he_thong: "hệ thống"
      };
      
      const actionMap: Record<string, string> = {
        INSERT: "tạo mới",
        UPDATE: "cập nhật",
        DELETE: "xóa",
        APPROVE: "phê duyệt"
      };

      const table = tableMap[item.table_name] || item.table_name;
      const action = actionMap[item.action] || item.action.toLowerCase();
      
      // Try to get more context from payload if available
      let detail = "";
      if (item.payload?.ten) detail = ` "${item.payload.ten}"`;
      else if (item.payload?.ma) detail = ` [${item.payload.ma}]`;

      return `${user} ${action} ${table}${detail}`;
    };

    return (data || []).map(item => ({
      id: item.id,
      created_at: item.created_at,
      action: item.action,
      table_name: item.table_name,
      user_ho_ten: item.profiles?.ho_ten || null,
      description: formatAction(item)
    }));
  });
