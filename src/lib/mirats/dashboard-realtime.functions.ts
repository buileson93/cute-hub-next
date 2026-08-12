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
  entity: string | null;
  user_ho_ten: string | null;
  description: string;
}

export const getAuditTimeline = createServerFn({ method: "GET" })
  .handler(async (): Promise<AuditTimelineItem[]> => {
    // 1. Fetch audit logs
    const { data: logs, error } = await supabase
      .from("audit_log")
      .select("id, created_at, action, entity, detail, user_id")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Audit log fetch error:", error);
      return [];
    }

    // 2. Fetch profiles for user names
    const userIds = Array.from(new Set(logs.map(l => l.user_id).filter(Boolean))) as string[];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, ho_ten")
      .in("id", userIds);
    
    const profileMap: Record<string, string> = {};
    profiles?.forEach(p => { profileMap[p.id] = p.ho_ten; });

    const formatAction = (item: any): string => {
      const user = profileMap[item.user_id] || "Hệ thống";
      const entityMap: Record<string, string> = {
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

      const entity = entityMap[item.entity || ""] || item.entity || "bản ghi";
      const action = actionMap[item.action] || item.action.toLowerCase();
      
      let detailStr = "";
      if (item.detail?.ten) detailStr = ` "${item.detail.ten}"`;
      else if (item.detail?.ma) detailStr = ` [${item.detail.ma}]`;

      return `${user} ${action} ${entity}${detailStr}`;
    };

    return (data || []).map(item => ({
      id: item.id,
      created_at: item.created_at,
      action: item.action,
      entity: item.entity,
      user_ho_ten: item.profiles?.ho_ten || null,
      description: formatAction(item)
    }));
  });
