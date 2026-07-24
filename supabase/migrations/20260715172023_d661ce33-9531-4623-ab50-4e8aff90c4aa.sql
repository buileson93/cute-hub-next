-- Reset password cho toàn bộ tk zz.test.* sử dụng bcrypt qua pgcrypto trong schema extensions
DO $$
DECLARE
  v_hash text;
BEGIN
  SELECT extensions.crypt('ZZ_Test_2026!', extensions.gen_salt('bf', 10)) INTO v_hash;
  UPDATE auth.users
  SET encrypted_password = v_hash,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      banned_until = NULL,
      updated_at = now(),
      raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('provider','email','providers', jsonb_build_array('email'))
  WHERE email LIKE 'zz.test.%@mirats.local';
END $$;

-- Đảm bảo không còn identity kẹt cho các tk này
UPDATE auth.identities i
SET updated_at = now()
FROM auth.users u
WHERE i.user_id = u.id AND u.email LIKE 'zz.test.%@mirats.local';