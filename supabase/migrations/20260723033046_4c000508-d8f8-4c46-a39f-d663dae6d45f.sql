DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT DISTINCT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_trigger t ON t.tgfoid = p.oid
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace cn ON cn.oid = c.relnamespace
    WHERE n.nspname = 'public' AND cn.nspname = 'public' AND NOT t.tgisinternal
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.oid::regprocedure);
  END LOOP;
END $$;