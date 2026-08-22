import { createFileRoute } from "@tanstack/react-router";
import { verifyApiSecret, auditPublicApiCall } from "@/lib/api-security.server";

export const Route = createFileRoute("/api/public/hooks/test-email-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const endpoint = "test-email-alerts";
        const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

        try {
          // 1. Bảo mật: Yêu cầu TEST_EMAIL_SECRET
          const { authorized, errorStatus } = await verifyApiSecret(request, "TEST_EMAIL_SECRET", "x-test-secret");
          if (!authorized) {
            await auditPublicApiCall(endpoint, "unauthorized", { requestId, status: errorStatus });
            return new Response(JSON.stringify({ error: "Unauthorized" }), { 
              status: errorStatus || 401,
              headers: { "Content-Type": "application/json" }
            });
          }

          // 2. Kiểm tra chế độ test (chỉ chạy nếu ENABLE_TEST_EMAIL=true hoặc không phải production)
          const isProd = process.env.NODE_ENV === "production";
          const enabled = process.env.ENABLE_TEST_EMAIL === "true";
          if (isProd && !enabled) {
            await auditPublicApiCall(endpoint, "disabled_in_prod", { requestId });
            return new Response(JSON.stringify({ error: "Service disabled in production" }), { status: 403 });
          }

          const body = await request.json().catch(() => ({}));
          const to = (body?.to as string) || "buileson93@gmail.com";

          // 3. Allowlist email: Không gửi đến email tùy ý
          const allowlist = ["buileson93@gmail.com"];
          const extraAllow = process.env.TEST_EMAIL_ALLOWLIST?.split(",").map(e => e.trim()) || [];
          const fullAllowlist = [...allowlist, ...extraAllow];

          if (!fullAllowlist.includes(to)) {
             await auditPublicApiCall(endpoint, "email_not_in_allowlist", { requestId, target: to });
             return new Response(JSON.stringify({ error: "Recipient not in allowlist" }), { status: 400 });
          }

          const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
          const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");

          const items: Array<{
            loai: string;
            tieu_de: string;
            chi_tiet?: string;
            ngay?: string;
            so_ngay_con_lai?: number | null;
          }> = [];

          // Giấy phép sắp hết hạn (≤ 90 ngày)
          const { data: gps } = await supabaseAdmin
            .from("v_giay_phep")
            .select("so_giay_phep,ten_doi_tuong,don_vi_ten,ngay_het_han,so_ngay_con_lai,trang_thai,bi_thay_the")
            .in("trang_thai", ["valid", "expiring"])
            .lte("so_ngay_con_lai", 90)
            .gte("so_ngay_con_lai", 0)
            .order("so_ngay_con_lai", { ascending: true })
            .limit(20);

          for (const g of (gps ?? []) as any[]) {
            if (g.bi_thay_the) continue;
            items.push({
              loai: "Giấy phép",
              tieu_de: `${g.so_giay_phep ?? "—"} · ${g.ten_doi_tuong ?? "—"}`,
              chi_tiet: `Đơn vị: ${g.don_vi_ten ?? "—"}`,
              ngay: g.ngay_het_han ?? undefined,
              so_ngay_con_lai: g.so_ngay_con_lai,
            });
          }

          // Sự cố mở gần đây
          const { data: sucos } = await supabaseAdmin
            .from("su_co")
            .select("ma_su_co,hien_tuong,muc_do,trang_thai,snapshot_ten_thiet_bi,snapshot_don_vi,ngay_phat_hien")
            .order("created_at", { ascending: false })
            .limit(10);

          for (const s of (sucos ?? []) as any[]) {
            items.push({
              loai: `Sự cố · ${s.muc_do ?? "—"}`,
              tieu_de: `${s.ma_su_co ?? "—"} — ${s.snapshot_ten_thiet_bi ?? "—"}`,
              chi_tiet: `${s.trang_thai ?? ""}${s.hien_tuong ? " · " + String(s.hien_tuong).slice(0, 200) : ""}`,
              ngay: s.ngay_phat_hien ?? undefined,
            });
          }

          // Bảo dưỡng đến hạn (≤ 7 ngày)
          const in7 = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
          const { data: bts } = await supabaseAdmin
            .from("bao_tri")
            .select("ma_bao_tri,ke_hoach,snapshot_ten_thiet_bi,snapshot_don_vi")
            .not("ke_hoach", "is", null)
            .lte("ke_hoach", in7)
            .is("ngay_hoan_thanh", null)
            .order("ke_hoach", { ascending: true })
            .limit(15);

          for (const b of (bts ?? []) as any[]) {
            items.push({
              loai: "Bảo dưỡng",
              tieu_de: `${b.ma_bao_tri ?? "—"} — ${b.snapshot_ten_thiet_bi ?? "—"}`,
              chi_tiet: `Đơn vị: ${b.snapshot_don_vi ?? "—"}`,
              ngay: b.ke_hoach ?? undefined,
            });
          }

          const idempotencyKey = request.headers.get("x-idempotency-key") || `test-alerts-${to}-${Date.now()}`;
          const result = await sendTemplateEmail("alerts-summary", to, {
            templateData: {
              siteName: "VATM",
              generatedAt: new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
              items,
            },
            idempotencyKey,
          });

          await auditPublicApiCall(endpoint, "success", { requestId, recipient: to, items_count: items.length });

          return Response.json({
            success: true,
            recipient: to,
            items_count: items.length,
            send: result,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[test-email-alerts]", msg);
          await auditPublicApiCall(endpoint, "error", { requestId, error: msg });
          return Response.json({ success: false, error: "Internal Server Error" }, { status: 500 });
        }
      },
    },
  },
});
