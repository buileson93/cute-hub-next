
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    JOIN pg_trigger t ON t.tgfoid = p.oid
    WHERE n.nspname='public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated;',
                   r.proname, r.args);
  END LOOP;
END $$;
