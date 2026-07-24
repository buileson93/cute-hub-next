-- Backfill don_vi for zz_test accounts + create missing don_vi_code values for BDKT sub-units (BUG-T0-01)

-- Set don_vi on the 5 existing test accounts
UPDATE public.profiles SET don_vi = 'CRA' WHERE email = 'zz_test_phong_kt@mirats.test';
UPDATE public.profiles SET don_vi = 'PLK' WHERE email = 'zz_test_phu_trach_dv@mirats.test';
UPDATE public.profiles SET don_vi = 'CRA' WHERE email = 'zz_test_quan_ly_du_an@mirats.test';
UPDATE public.profiles SET don_vi = 'THO' WHERE email = 'zz_test_to_truong@mirats.test';
UPDATE public.profiles SET don_vi = 'CLA' WHERE email = 'zz_test_readonly@mirats.test';