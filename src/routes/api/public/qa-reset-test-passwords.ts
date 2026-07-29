import { createFileRoute } from "@tanstack/react-router";

/**
 * QA-only helper: đặt lại mật khẩu cho các tài khoản test tiền tố `zz.test.`
 * qua Supabase Auth Admin API. Chỉ chấp nhận khi header x-qa-secret khớp
 * và chỉ tác động lên email khớp mẫu QA.
 *
 * Sau khi hết dùng, xoá file này.
 */
export const Route = createFileRoute("/api/public/qa-reset-test-passwords")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = request.headers.get("x-qa-secret");
        const expected = process.env.QA_RESET_SECRET;
        if (!expected || secret !== expected) {
          return new Response("Forbidden", { status: 403 });
        }
        const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
        const newPw = "ZZ_Test_2026!";
        const results: Array<{ email: string; ok: boolean; error?: string }> = [];
        // Danh sách cứng cho an toàn — chỉ đúng 6 tk QA + admin gốc nếu cần
        const emails = [
          "zz_test_phong_kt@mirats.test",
          "zz_test_phu_trach_dv@mirats.test",
          "zz_test_ktv@mirats.test",
          "zz_test_quan_ly_du_an@mirats.test",
          "zz_test_to_truong@mirats.test",
          "zz_test_readonly@mirats.test",
        ];
        for (const email of emails) {
          const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
          if (error) {
            results.push({ email, ok: false, error: error.message });
            continue;
          }
          const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
          if (!user) {
            results.push({ email, ok: false, error: "not_found" });
            continue;
          }
          const { error: upErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            password: newPw,
            email_confirm: true,
            ban_duration: "none",
          });
          results.push({ email, ok: !upErr, error: upErr?.message });
        }
        return Response.json({ results });
      },
    },
  },
});
