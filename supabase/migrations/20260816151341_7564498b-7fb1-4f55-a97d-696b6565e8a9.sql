DO $$
DECLARE
  v_uid_son UUID;
  v_uid_anh UUID;
  v_pass_hash TEXT;
BEGIN
  -- Lấy hash mật khẩu từ một user hiện có
  SELECT encrypted_password INTO v_pass_hash FROM auth.users WHERE email = 'tranquangvinh@vatm.vn' LIMIT 1;
  
  IF v_pass_hash IS NULL THEN
     v_pass_hash := '$2a$10$w8.B9x7.jJ/hZz0k.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u.u'; 
  END IF;

  -- 1. Tạo user vuhongson@vatm.vn (kiểm tra email trước để tránh lỗi ON CONFLICT)
  SELECT id INTO v_uid_son FROM auth.users WHERE email = 'vuhongson@vatm.vn';
  IF v_uid_son IS NULL THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'vuhongson@vatm.vn',
      v_pass_hash,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"ho_ten":"Vũ Hồng Sơn"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO v_uid_son;
  END IF;

  -- 2. Tạo user trannguyenbaoanh@vatm.vn
  SELECT id INTO v_uid_anh FROM auth.users WHERE email = 'trannguyenbaoanh@vatm.vn';
  IF v_uid_anh IS NULL THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'trannguyenbaoanh@vatm.vn',
      v_pass_hash,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"ho_ten":"Trần Nguyễn Bảo Anh"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO v_uid_anh;
  END IF;

  -- 3. Đảm bảo profile và role cho Sơn
  INSERT INTO public.profiles (id, email, ho_ten, active)
  VALUES (v_uid_son, 'vuhongson@vatm.vn', 'Vũ Hồng Sơn', true)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, ho_ten = EXCLUDED.ho_ten, active = true;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid_son, 'phong_kt')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 4. Đảm bảo profile và role cho Anh
  INSERT INTO public.profiles (id, email, ho_ten, active)
  VALUES (v_uid_anh, 'trannguyenbaoanh@vatm.vn', 'Trần Nguyễn Bảo Anh', true)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, ho_ten = EXCLUDED.ho_ten, active = true;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid_anh, 'phong_kt')
  ON CONFLICT (user_id, role) DO NOTHING;

END $$;