-- Đồng bộ tất cả sequence sau khi COPY dữ liệu (tránh duplicate key khi app insert).
DO $$
DECLARE r record; maxid bigint;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl, a.attname AS col, pg_get_serial_sequence(quote_ident(c.relname), a.attname) AS seq
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND pg_get_serial_sequence(quote_ident(c.relname), a.attname) IS NOT NULL
  LOOP
    EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM public.%I', r.col, r.tbl) INTO maxid;
    PERFORM setval(r.seq, GREATEST(maxid, 1), maxid > 0);
    RAISE NOTICE 'sequence % -> %', r.seq, GREATEST(maxid, 1);
  END LOOP;
END
$$;
