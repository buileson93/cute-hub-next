DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables
           WHERE table_schema='public' AND table_name LIKE 'dm\_%' ESCAPE '\'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t.table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t.table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t.table_name);
  END LOOP;
END $$;

DROP TABLE IF EXISTS public._diag_log;