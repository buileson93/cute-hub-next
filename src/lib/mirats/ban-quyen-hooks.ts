import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";

/**
 * Hook gộp để lấy danh sách cấp phát theo Bản quyền ID hoặc Thiết bị ID.
 * Thay thế cho việc nhân bản logic.
 */
export function useCapPhatList({ 
  banQuyenId, 
  thietBiId 
}: { 
  banQuyenId?: string | null; 
  thietBiId?: string | null; 
}) {
  return useQuery({
    queryKey: ["ban_quyen", "cap-phat-list", { banQuyenId, thietBiId }],
    queryFn: async () => {
      let query = supabase
        .from("v_phan_mem_ban_quyen_chi_tiet") // Giả định có view chi tiết hoặc query join
        .select(`
          id,
          ban_quyen_id,
          thiet_bi_id,
          ngay_cai_dat,
          ngay_thu_hoi,
          nguoi_cai,
          ten_phan_mem,
          ma_ban_quyen,
          phien_ban,
          license_key,
          ngay_het_han,
          ten_thiet_bi,
          ma_thiet_bi
        `);

      if (banQuyenId) query = query.eq("ban_quyen_id", banQuyenId);
      if (thietBiId) query = query.eq("thiet_bi_id", thietBiId);

      const { data, error } = await query.order("ngay_cai_dat", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!banQuyenId || !!thietBiId,
  });
}
