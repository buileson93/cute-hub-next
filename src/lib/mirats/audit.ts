import { supabase } from "@/integrations/supabase/client";
import { thongDiepLoi } from "./errors";

export type AuditAction = 
  | "bulk_delete" 
  | "export_csv" 
  | "create" 
  | "update" 
  | "delete";

export async function logAudit(args: {
  action: AuditAction;
  domain: string;
  entity_ids?: string[];
  details?: Record<string, any>;
}) {
  try {
    const { error } = await supabase.from("nhat_ky_he_thong" as any).insert({
      hanh_dong: args.action,
      doi_tuong: args.domain,
      doi_tuong_ids: args.entity_ids,
      chi_tiet: args.details,
      thoi_gian: new Date().toISOString(),
    } as any);

    if (error) {
      console.warn("[Audit] Failed to log action:", thongDiepLoi(error, "Unknown error"));
    }
  } catch (err) {
    console.error("[Audit] Fatal logging error:", err);
  }
}
