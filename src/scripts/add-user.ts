import { supabaseAdmin } from "./src/integrations/backend/admin.server";

async function addMissingUser() {
  const email = "doanhuutuan@vatm.vn";
  const hoTen = "Đoàn Hữu Tuấn";
  const password = "password123"; // Mật khẩu tạm thời
  
  console.log(`Đang tạo tài khoản cho: ${email}`);
  
  const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { full_name: hoTen },
  });

  if (authErr || !created.user) {
    console.error(`Lỗi tạo tài khoản Auth: ${authErr?.message}`);
    return;
  }

  const uid = created.user.id;
  console.log(`Tài khoản Auth đã được tạo: ${uid}`);

  // Cập nhật profile (vì trigger đã tự tạo profile, ta chỉ cập nhật ho_ten)
  const { error: profErr } = await supabaseAdmin.from("profiles").update({
    ho_ten: hoTen,
    active: true
  }).eq("id", uid);
  
  if (profErr) {
    console.error(`Lỗi cập nhật profile: ${profErr.message}`);
  } else {
    console.log("Profile đã được cập nhật.");
  }

  // Gán vai trò (giả định vai trò cho Đoàn Hữu Tuấn là 'ktv' hoặc theo yêu cầu là 'đảm bảo hoạt động')
  // Yêu cầu nói "doanhuutuan@vatm.vn đảm bảo hoạt động hiện nay đang lỗi" 
  // Tôi sẽ gán vai trò ktv làm mặc định nếu không rõ.
  const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({
    user_id: uid,
    role: "ktv"
  });

  if (roleErr) {
    console.error(`Lỗi gán vai trò: ${roleErr.message}`);
  } else {
    console.log("Vai trò đã được gán.");
  }
  
  console.log("Hoàn thành.");
}

addMissingUser();
