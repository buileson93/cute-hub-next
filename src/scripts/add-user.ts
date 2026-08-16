import { supabaseAdmin } from "../integrations/backend/admin.server";

async function addMissingUser() {
  const email = "doanhuutuan@vatm.vn";
  const hoTen = "Đoàn Hữu Tuấn";
  const password = "password123";
  
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

  const { error: profErr } = await supabaseAdmin.from("profiles").update({
    ho_ten: hoTen,
    active: true
  }).eq("id", uid);
  
  if (profErr) {
    console.error(`Lỗi cập nhật profile: ${profErr.message}`);
  }

  const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({
    user_id: uid,
    role: "ktv"
  });

  if (roleErr) {
    console.error(`Lỗi gán vai trò: ${roleErr.message}`);
  }
  
  console.log("Hoàn thành.");
}

addMissingUser();
