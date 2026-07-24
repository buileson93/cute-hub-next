-- Bug fix: trigger protect_profile_privileged_fields silently reverts don_vi/active updates
-- when caller is service_role (auth.uid() is NULL). This breaks the admin createUser/updateUser
-- flow which relies on supabaseAdmin to set don_vi. Allow through when there is no auth context
-- (i.e. service_role / migrations) — RLS still restricts direct DB writes for regular users.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- No auth context (service_role, migrations, triggers) — allow.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  -- Admins may change anything.
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  -- Non-admins cannot change their unit or active status; silently keep old values.
  NEW.don_vi := OLD.don_vi;
  NEW.active := OLD.active;
  RETURN NEW;
END;
$function$;

-- Backfill for QA test accounts
UPDATE public.profiles SET don_vi = 'CRA', active = TRUE WHERE email = 'zz_test_phong_kt@mirats.test';
UPDATE public.profiles SET don_vi = 'PLK', active = TRUE WHERE email = 'zz_test_phu_trach_dv@mirats.test';
UPDATE public.profiles SET don_vi = 'PLK', active = TRUE WHERE email = 'zz_test_ktv@mirats.test';
UPDATE public.profiles SET don_vi = 'CRA', active = TRUE WHERE email = 'zz_test_quan_ly_du_an@mirats.test';
UPDATE public.profiles SET don_vi = 'THO', active = TRUE WHERE email = 'zz_test_to_truong@mirats.test';
UPDATE public.profiles SET don_vi = 'CLA', active = TRUE WHERE email = 'zz_test_readonly@mirats.test';