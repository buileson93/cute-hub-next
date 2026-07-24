-- Reset password + unban + confirm cho tài khoản QA nội bộ
UPDATE auth.users
SET encrypted_password = extensions.crypt('ZZ_Test_2026!', extensions.gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    banned_until = NULL,
    updated_at = now()
WHERE email LIKE 'zz.test.%@mirats.local';