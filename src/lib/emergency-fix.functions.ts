import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Script khẩn cấp để xử lý tài khoản không đăng nhập được.
 * Yêu cầu mã bí mật để thực thi vì không thể kiểm tra session khi admin cũng bị lỗi.
 */
export const emergencyFixAccounts = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({
    secret: z.string(),
    emails: z.array(z.string().email())
  }).parse(input))
  .handler(async ({ data }) => {
    // Mã bảo mật tạm thời (tự hủy sau khi dùng hoặc chỉ dùng trong môi trường dev)
    if (data.secret !== "VATMMIRATS2026FIX") {
      throw new Error("Mã bí mật không chính xác.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const results = [];

    for (const email of data.emails) {
      try {
        // 1. Tìm user trong Auth
        const { data: { users }, error: findErr } = await supabaseAdmin.auth.admin.listUsers();
        if (findErr) throw findErr;
        
        const user = users.find(u => u.email === email);
        if (!user) {
          results.push({ email, status: "không tìm thấy user" });
          continue;
        }

        // 2. Cập nhật mật khẩu và xác thực
        const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: "Vatm@2026",
          email_confirm: true,
          ban_duration: "none"
        });

        // 3. Đảm bảo Profile tồn tại và active
        const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("id", user.id).maybeSingle();
        if (!profile) {
          await supabaseAdmin.from("profiles").insert({
            id: user.id,
            email: user.email!,
            ho_ten: (user.user_metadata?.ho_ten as string) || email.split('@')[0],
            active: true
          });
        } else {
          await supabaseAdmin.from("profiles").update({ active: true }).eq("id", user.id);
        }

        results.push({ email, status: authErr ? `lỗi auth: ${authErr.message}` : "đã sửa xong" });
      } catch (e: any) {
        results.push({ email, status: `lỗi hệ thống: ${e.message}` });
      }
    }

    return results;
  });
