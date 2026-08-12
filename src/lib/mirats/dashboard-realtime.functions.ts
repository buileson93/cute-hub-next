import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/backend/client";

export const getHeartBeatData = createServerFn({ method: "GET" })
  .handler(async () => {
    // 1. Fetch active systems with their status
    // We'll use a join to check for open incidents (su_co) and maintenance (bao_tri)
    // Note: This is an internal server function logic but must use TanStack pattern
    const { data: systems, error } = await supabase
      .from("dm_he_thong")
      .select(`
        id, 
        ma, 
        ten, 
        active,
        nhom_he_thong:nhom_he_thong_id(ma, ten),
        su_co:su_co(id, muc_do, trang_thai),
        bao_tri:bao_tri(id, loai_bao_tri, trang_thai, ngay_den_han)
      `)
      .eq("active", true)
      .order("thu_tu", { ascending: true });

    if (error) throw error;
    
    // Process status logic: 
    // đỏ = có sự cố nghiêm trọng đang mở
    // vàng = có sự cố mức thấp hơn hoặc bảo dưỡng quá hạn
    // xanh = không có gì
    // xám = ngừng khai thác (active=false, but we already filtered)
    
    return (systems || []).map(s => {
      const openIncidents = s.su_co?.filter((i: any) => i.trang_thai !== 'da_dong') || [];
      const hasCritical = openIncidents.some((i: any) => i.muc_do === 'Nghiêm trọng' || i.muc_do === 'Cao');
      const hasWarning = openIncidents.length > 0 || (s.bao_tri?.some((b: any) => b.trang_thai !== 'hoan_thanh' && new Date(b.ngay_den_han) < new Date()));
      
      let status: 'critical' | 'warning' | 'normal' | 'inactive' = 'normal';
      let reason = '';
      
      if (hasCritical) {
        status = 'critical';
        reason = 'Có sự cố nghiêm trọng';
      } else if (hasWarning) {
        status = 'warning';
        reason = 'Có sự cố hoặc bảo trì quá hạn';
      }
      
      return {
        id: s.id,
        ma: s.ma,
        ten: s.ten,
        nhom: s.nhom_he_thong?.ten,
        status,
        reason
      };
    });
  });

export const getRecentAuditLogs = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("audit_log")
      .select("id, created_at, action, table_name, record_id, user_id, user_ho_ten:profiles(ho_ten), payload")
      .order("created_at", { ascending: false })
      .limit(20);
      
    if (error) throw error;
    return data;
  });
