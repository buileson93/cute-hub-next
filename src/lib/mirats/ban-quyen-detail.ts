import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { toast } from "sonner";

export type BanQuyenTep = {
  id: string;
  created_at: string;
  ban_quyen_id: string;
  ten_tep: string;
  loai_tep: string;
  url: string;
  size_bytes: number;
  uploaded_by: string;
};

export function useBanQuyenTep(bqId: string) {
  return useQuery({
    queryKey: ["ban_quyen_tep", bqId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phan_mem_ban_quyen_tep" as any)
        .select("*")
        .eq("ban_quyen_id", bqId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[])?.map(r => ({
        id: r.id,
        created_at: r.created_at,
        ban_quyen_id: r.ban_quyen_id,
        ten_tep: r.ten_tep,
        loai_tep: r.loai_tep,
        url: r.url,
        size_bytes: r.size_bytes,
        uploaded_by: r.uploaded_by
      } as BanQuyenTep)) || [];
    },
    enabled: !!bqId,
  });
}

export function useBanQuyenAudit(bqId: string) {
  return useQuery({
    queryKey: ["ban_quyen_audit", bqId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log" as any)
        .select("*, user:user_id(email, raw_user_meta_data)")
        .eq("entity", "phan_mem_ban_quyen")
        .eq("entity_id", bqId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!bqId,
  });
}

export async function logBanQuyenAudit(bqId: string, action: string, detail: string, metadata?: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("audit_log" as any).insert({
    user_id: user.id,
    action,
    entity: "phan_mem_ban_quyen",
    entity_id: bqId,
    detail,
    metadata: metadata || {}
  });
}

export function useUploadBanQuyenTep(bqId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, loai }: { file: File; loai: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      const fileExt = file.name.split('.').pop();
      const filePath = `ban-quyen/${bqId}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("giay-phep")
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("giay-phep").getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("phan_mem_ban_quyen_tep" as any).insert({
        ban_quyen_id: bqId,
        ten_tep: file.name,
        loai_tep: loai,
        url: urlData.publicUrl,
        size_bytes: file.size,
        uploaded_by: user.id
      });

      if (dbError) throw dbError;
      
      await logBanQuyenAudit(bqId, "UPLOAD_FILE", `Tải lên tệp ${file.name} (${loai})`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ban_quyen_tep", bqId] });
      toast.success("Đã tải tệp lên");
    }
  });
}
