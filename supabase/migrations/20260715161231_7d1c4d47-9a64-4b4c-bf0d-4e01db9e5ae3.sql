-- Clear banned_until for test accounts (fix accidental UI-driven ban during QA)
UPDATE auth.users
SET banned_until = NULL
WHERE email IN ('zz_test_pt_dv@mirats.test','zz_test_ql_da@mirats.test');