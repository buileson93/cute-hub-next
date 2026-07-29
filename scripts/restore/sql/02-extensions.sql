-- Extensions phải nằm trong schema `extensions` (Supabase convention), không phải public.
SELECT public.__restore_exec($x$ CREATE SCHEMA IF NOT EXISTS extensions $x$);
SELECT public.__restore_exec($x$ CREATE EXTENSION IF NOT EXISTS pg_trgm  WITH SCHEMA extensions $x$);
SELECT public.__restore_exec($x$ CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions $x$);
SELECT public.__restore_exec($x$ CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions $x$);
SELECT public.__restore_exec($x$ GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role $x$);

-- Trigger full-text tiếng Việt tham chiếu đúng tên `public.unaccent`.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_ts_dict d JOIN pg_namespace n ON n.oid = d.dictnamespace
    WHERE d.dictname = 'unaccent' AND n.nspname = 'public'
  ) THEN
    PERFORM public.__restore_exec(
      $x$ CREATE TEXT SEARCH DICTIONARY public.unaccent (TEMPLATE = extensions.unaccent) $x$
    );
  END IF;
END
$$;
