DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT DISTINCT tgrelid::regclass::text AS tbl
    FROM pg_trigger
    WHERE tgname = 'zz_audit_row'
      AND NOT tgisinternal
      AND tgrelid IN (
        SELECT tgrelid FROM pg_trigger WHERE tgname = 'audit_trg' AND NOT tgisinternal
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS zz_audit_row ON %s', r.tbl);
  END LOOP;
END $$;