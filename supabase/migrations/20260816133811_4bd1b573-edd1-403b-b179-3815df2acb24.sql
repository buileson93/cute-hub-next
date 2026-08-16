-- Bước 1: Tạo tài khoản Auth (dùng pgcrypto để hash mật khẩu 'Vatm@2026')
-- Lưu ý: id được tạo bằng gen_random_uuid()
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  created_at,
  updated_at
)
VALUES
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'tranquangvinh@vatm.vn',
  crypt('Vatm@2026', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"ho_ten":"Trần Quang Vinh"}',
  false,
  'authenticated',
  'authenticated',
  now(),
  now()
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'nguyenluonggiam@vatm.vn',
  crypt('Vatm@2026', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"ho_ten":"Nguyễn Lương Giám"}',
  false,
  'authenticated',
  'authenticated',
  now(),
  now()
);

-- Bước 2: Tạo profiles (vì trigger trên auth.users có thể không tự chạy trong migration SQL này tùy cấu hình)
-- Chúng ta dùng INSERT ON CONFLICT DO NOTHING hoặc kiểm tra id vừa tạo
-- Tuy nhiên để an toàn và chính xác, ta lồng vào CTE hoặc dùng email làm key trung gian nếu có profile trigger.
-- Ở đây ta thực hiện INSERT trực tiếp dựa trên email vừa tạo trong auth.users.

INSERT INTO public.profiles (id, email, ho_ten, active)
SELECT id, email, (raw_user_meta_data->>'ho_ten'), true
FROM auth.users
WHERE email IN ('tranquangvinh@vatm.vn', 'nguyenluonggiam@vatm.vn')
ON CONFLICT (id) DO UPDATE SET
  ho_ten = EXCLUDED.ho_ten,
  active = true;

-- Bước 3: Gán quyền Phòng kỹ thuật (role: phong_kt)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'phong_kt'
FROM auth.users
WHERE email IN ('tranquangvinh@vatm.vn', 'nguyenluonggiam@vatm.vn')
ON CONFLICT (user_id, role) DO NOTHING;
