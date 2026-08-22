import { useEffect } from "react";
import { supabase } from "@/integrations/backend/client";

/**
 * Hook giả lập tiến trình quét nền để cảnh báo hết hạn bản quyền.
 */
export function useBanQuyenAlertScanner() {
  useEffect(() => {
    const scan = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const isAdmin = roles?.some((r) => r.role === "admin" || r.role === "phong_kt");
      if (!isAdmin) return;

      const { data: expiring } = await supabase
        .from("phan_mem_ban_quyen")
        .select("id, ten_phan_mem, ngay_het_han")
        .not("ngay_het_han", "is", null)
        .lte("ngay_het_han", new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString())
        .gt("ngay_het_han", new Date().toISOString());

      if (expiring && expiring.length > 0) {
        for (const bq of expiring) {
          const { count } = await supabase
            .from("audit_log" as any)
            .select("*", { count: "exact", head: true })
            .eq("entity", "phan_mem_ban_quyen")
            .eq("entity_id", bq.id)
            .eq("action", "EXPIRY_ALERT")
            .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

          if (count === 0) {
            const daysLeft = Math.ceil(
              (new Date(bq.ngay_het_han!).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
            );
            await supabase.from("audit_log" as any).insert({
              user_id: user.id,
              action: "EXPIRY_ALERT",
              entity: "phan_mem_ban_quyen",
              entity_id: bq.id,
              detail: `Cảnh báo: Bản quyền "${bq.ten_phan_mem}" sẽ hết hạn sau ${daysLeft} ngày (${bq.ngay_het_han})`,
              metadata: { daysLeft, type: "warning" },
            });
          }
        }
      }
    };

    const timer = setTimeout(scan, 5000);
    return () => clearTimeout(timer);
  }, []);
}
