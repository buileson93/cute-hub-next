DO $$
DECLARE
  v_pwd text := crypt('123456', gen_salt('bf'));
  v_uid uuid;
  v_email text := 'buileson93@gmail.com';
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = v_email;
  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token, is_sso_user, is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      v_email, v_pwd, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('ho_ten', 'Bùi Lê Sơn'),
      now(), now(), '', '', '', '', false, false
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
    VALUES (gen_random_uuid(), v_uid, v_uid::text,
            jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
            'email', now(), now(), now());
  ELSE
    UPDATE auth.users SET encrypted_password = v_pwd, email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE id = v_uid;
  END IF;

  INSERT INTO public.profiles (id, email, ho_ten, active)
  VALUES (v_uid, v_email, 'Bùi Lê Sơn', true)
  ON CONFLICT (id) DO UPDATE SET active = true;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;