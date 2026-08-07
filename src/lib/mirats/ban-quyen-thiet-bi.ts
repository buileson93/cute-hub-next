import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { type CapPhatRow } from "./ban-quyen";

export function useThietBiBanQuyenList(thietBiId: string | null) {
  return useQuery({
    queryKey: ["thiet_bi", "ban_quyen", thietBiId],
    enabled: !!thietBiId,
    queryFn: async (): Promise<CapPhatRow[]> => {
      const { data, error } = await supabase
        .from("phan_mem_ban_quyen_cap_phat")
        .select(`
          id, 
          ban_quyen_id, 
          thiet_bi_id, 
          ngay_cai_dat, 
          nguoi_cai, 
          ngay_thu_hoi, 
          ghi_chu,
          phan_mem_ban_quyen (
            ten_phan_mem,
            license_key,
            phien_ban,
            ngay_het_han
          )
        `)
        .eq("thiet_bi_id", thietBiId!)
        .order("ngay_cai_dat", { ascending: false });

      if (error) throw error;
      
      return (data ?? []).map((r: any) => ({
        id: r.id,
        ban_quyen_id: r.ban_quyen_id,
        thiet_bi_id: r.thiet_bi_id,
        ngay_cai_dat: r.ngay_cai_dat,
        nguoi_cai: r.nguoi_cai,
        ngay_thu_hoi: r.ngay_thu_hoi,
        ghi_chu: r.ghi_chu,
        maThietBi: null, 
        tenThietBi: r.phan_mem_ban_quyen?.ten_phan_mem ?? "Phần mềm không xác định",
        licenseKey: r.phan_mem_ban_quyen?.license_key,
        phienBan: r.phan_mem_ban_quyen?.phien_ban,
        ngayHetHan: r.phan_mem_ban_quyen?.ngay_het_han,
      })) as any[];
    },
  });
}
