import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

/**
 * Lệnh khẩn cấp để đồng bộ hóa danh sách auth.users với public.profiles.
 * Giải quyết vấn đề trigger Database không hoạt động hoặc Database error querying schema 
 * dẫn đến profile không được tạo tự động khi tạo user qua admin dashboard.
 */
export const fixTriggerAndSync = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({}).optional().parse(input))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    
    // Kiểm tra quyền Admin (sử dụng context.supabase vì session đã có role qua hook/middleware)
    const { data: isAdmin } = await context.supabase.rpc("has_role", { 
      _user_id: context.userId, 
      _role: "admin" 
    });
    
    if (!isAdmin) throw new Error("Chỉ quản trị viên mới có quyền thực hiện đồng bộ.");

    // Lấy toàn bộ danh sách người dùng từ hệ thống Auth
    const { data: authUsers, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    if (listErr) throw new Error(`Lỗi lấy danh sách user: ${listErr.message}`);
    
    const results = [];
    
    for (const user of authUsers.users) {
      // Kiểm tra xem profile đã tồn tại chưa
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        // Nếu chưa có profile, tạo mới
        const email = user.email || "";
        const ho_ten = (user.user_metadata?.ho_ten as string) || email.split('@')[0] || "User";
        
        const { error: insErr } = await supabaseAdmin.from("profiles").insert({
          id: user.id,
          email: email,
          ho_ten: ho_ten,
          active: true
        });

        results.push({ 
          email: user.email, 
          status: insErr ? "lỗi" : "đã đồng bộ", 
          error: insErr?.message 
        });
      }
    }
    
    return {
      message: `Đã xử lý ${authUsers.users.length} tài khoản.`,
      synced: results.filter(r => r.status === "đã đồng bộ"),
      errors: results.filter(r => r.status === "lỗi")
    };
  });
