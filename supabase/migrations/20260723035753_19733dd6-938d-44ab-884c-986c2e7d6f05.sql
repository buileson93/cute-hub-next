DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname AS table_name, c.relowner::regrole::text AS owner_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
      AND c.relowner::regrole::text NOT IN ('postgres')
  LOOP
    EXECUTE format('GRANT ALL PRIVILEGES ON TABLE %I.%I TO %I', r.schema_name, r.table_name, r.owner_name);
  END LOOP;
END $$;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname AS sequence_name, c.relowner::regrole::text AS owner_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'S'
      AND c.relowner::regrole::text NOT IN ('postgres')
  LOOP
    EXECUTE format('GRANT ALL PRIVILEGES ON SEQUENCE %I.%I TO %I', r.schema_name, r.sequence_name, r.owner_name);
  END LOOP;
END $$;