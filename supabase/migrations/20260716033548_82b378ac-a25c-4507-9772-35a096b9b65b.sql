
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  u RECORD;
  new_id uuid;
  users_data jsonb := '[
    {"email":"buileson93@gmail.com","name":"Bùi Lê Sơn","role":"admin"},
    {"email":"admin@demo.mirats.vn","name":"Quản trị hệ thống","role":"admin"},
    {"email":"ktv.pba@demo.mirats.vn","name":"KTV PBA","role":"ktv"},
    {"email":"ktv.mkt@demo.mirats.vn","name":"KTV MKT","role":"ktv"},
    {"email":"phutrach.pba@demo.mirats.vn","name":"Phụ trách PBA","role":"phu_trach_dv"},
    {"email":"phutrach.mkt@demo.mirats.vn","name":"Phụ trách MKT","role":"phu_trach_dv"},
    {"email":"phongkt@demo.mirats.vn","name":"Phòng Kỹ thuật","role":"phong_kt"},
    {"email":"readonly@demo.mirats.vn","name":"Chỉ đọc","role":"readonly"}
  ]'::jsonb;
BEGIN
  FOR u IN SELECT * FROM jsonb_to_recordset(users_data) AS x(email text, name text, role text)
  LOOP
    new_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, is_sso_user, is_anonymous
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated','authenticated',
      u.email, crypt('Demo@1234', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('ho_ten', u.name),
      false, false, false
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id::text, 'email', u.email), 'email', now(), now(), now());

    INSERT INTO public.profiles (id, email, ho_ten, active) VALUES (new_id, u.email, u.name, true)
    ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email, ho_ten=EXCLUDED.ho_ten, active=true;
    INSERT INTO public.user_roles (user_id, role) VALUES (new_id, u.role::app_role)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
