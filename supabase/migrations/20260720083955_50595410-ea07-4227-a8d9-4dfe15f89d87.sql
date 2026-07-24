
-- FK integrity checks (RI triggers) run FOR KEY SHARE on the referenced table,
-- which requires UPDATE privilege of the table owner. Somewhere UPDATE was
-- revoked from the owner on many public tables, causing every INSERT that
-- references another public table to fail with:
--   ERROR: permission denied for table dm_he_thong
-- Restore full ownership privileges on every public table to their owner.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname, c.relname, pg_get_userbyid(c.relowner) AS owner
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
  LOOP
    EXECUTE format('GRANT ALL ON TABLE %I.%I TO %I', r.nspname, r.relname, r.owner);
  END LOOP;
END $$;
