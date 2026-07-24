
-- Seed demo accounts for all roles
DO $$
DECLARE
  v_pwd text := crypt('Demo@12345', gen_salt('bf'));
  v_uid uuid;
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('admin@demo.mirats.vn',    'Quản trị Demo',           'admin'::app_role,        NULL::don_vi_code),
      ('phongkt@demo.mirats.vn',  'Phòng Kỹ thuật Demo',     'phong_kt'::app_role,     NULL),
      ('ptdv.cla@demo.mirats.vn', 'Phụ trách Chu Lai',       'phu_trach_dv'::app_role, 'CLA'),
      ('ptdv.cra@demo.mirats.vn', 'Phụ trách Cam Ranh',      'phu_trach_dv'::app_role, 'CRA'),
      ('ktv.cla@demo.mirats.vn',  'KTV Chu Lai',             'ktv'::app_role,          'CLA'),
      ('ktv.pba@demo.mirats.vn',  'KTV Phú Bài',             'ktv'::app_role,          'PBA'),
      ('ktv.plk@demo.mirats.vn',  'KTV Pleiku',              'ktv'::app_role,          'PLK'),
      ('readonly@demo.mirats.vn', 'Chỉ xem Demo',            'readonly'::app_role,     NULL)
    ) AS t(email, ho_ten, role, don_vi)
  LOOP
    -- Skip if already exists
    SELECT id INTO v_uid FROM auth.users WHERE email = r.email;
    IF v_uid IS NULL THEN
      v_uid := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change,
        email_change_token_new, recovery_token, is_sso_user, is_anonymous
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
        r.email, v_pwd, now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('ho_ten', r.ho_ten),
        now(), now(), '', '', '', '', false, false
      );
      INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
      VALUES (gen_random_uuid(), v_uid, v_uid::text,
              jsonb_build_object('sub', v_uid::text, 'email', r.email, 'email_verified', true),
              'email', now(), now(), now());
    END IF;

    -- Ensure profile
    INSERT INTO public.profiles (id, email, ho_ten, don_vi, active)
    VALUES (v_uid, r.email, r.ho_ten, r.don_vi, true)
    ON CONFLICT (id) DO UPDATE SET
      ho_ten = EXCLUDED.ho_ten,
      don_vi = EXCLUDED.don_vi,
      active = true;

    -- Ensure role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_uid, r.role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;
END $$;
