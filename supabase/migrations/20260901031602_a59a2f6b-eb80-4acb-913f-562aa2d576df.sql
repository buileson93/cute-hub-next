CREATE OR REPLACE FUNCTION public.admin_export_ddl()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_enums text; v_tables text; v_cons text; v_idx text; v_views text; v_funcs text; v_trg text;
  v_rls text; v_pol text; v_grants text; v_seq_grants text;
BEGIN
  IF NOT public.has_role(public.current_uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Chỉ admin mới xuất được lược đồ';
  END IF;

  SELECT string_agg(format('CREATE TYPE public.%I AS ENUM (%s);', t.typname,
    (SELECT string_agg(quote_literal(e.enumlabel), ', ' ORDER BY e.enumsortorder)
       FROM pg_enum e WHERE e.enumtypid = t.oid)), E'\n' ORDER BY t.typname)
  INTO v_enums
  FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public' AND t.typtype = 'e';

  SELECT string_agg(stmt, E'\n\n' ORDER BY tbl) INTO v_tables FROM (
    SELECT c.relname AS tbl,
      format('CREATE TABLE IF NOT EXISTS public.%I (%s%s);', c.relname,
        E'\n  ',
        (SELECT string_agg(
            format('%I %s%s%s', a.attname, pg_catalog.format_type(a.atttypid, a.atttypmod),
              CASE WHEN ad.adbin IS NOT NULL THEN ' DEFAULT ' || pg_get_expr(ad.adbin, ad.adrelid) ELSE '' END,
              CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END),
            E',\n  ' ORDER BY a.attnum)
          FROM pg_attribute a
          LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
          WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped)) AS stmt
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  ) s;

  SELECT string_agg(format('ALTER TABLE public.%I ADD CONSTRAINT %I %s;',
      cl.relname, con.conname, pg_get_constraintdef(con.oid)), E'\n' ORDER BY cl.relname, con.conname)
  INTO v_cons
  FROM pg_constraint con JOIN pg_class cl ON cl.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = cl.relnamespace
  WHERE n.nspname = 'public' AND cl.relkind = 'r';

  SELECT string_agg(i.indexdef || ';', E'\n' ORDER BY i.tablename, i.indexname) INTO v_idx
  FROM pg_indexes i
  WHERE i.schemaname = 'public'
    AND NOT EXISTS (SELECT 1 FROM pg_constraint c2
                    WHERE c2.conname = i.indexname AND c2.connamespace = 'public'::regnamespace);

  SELECT string_agg(format('CREATE OR REPLACE VIEW public.%I AS %s', c.relname, pg_get_viewdef(c.oid, true)),
    E'\n\n' ORDER BY c.relname) INTO v_views
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'v';

  SELECT string_agg(pg_get_functiondef(p.oid) || E';\n', E'\n' ORDER BY p.proname) INTO v_funcs
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p');

  SELECT string_agg(pg_get_triggerdef(t.oid) || ';', E'\n' ORDER BY t.tgname) INTO v_trg
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND NOT t.tgisinternal;

  SELECT string_agg(format('ALTER TABLE public.%I %s ROW LEVEL SECURITY;', c.relname,
      CASE WHEN c.relrowsecurity THEN 'ENABLE' ELSE 'DISABLE' END), E'\n' ORDER BY c.relname)
  INTO v_rls
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r';

  SELECT string_agg(format('CREATE POLICY %I ON public.%I AS %s FOR %s TO %s%s%s;',
      p.policyname, p.tablename, p.permissive, p.cmd, array_to_string(p.roles, ', '),
      CASE WHEN p.qual IS NOT NULL THEN E'\n  USING (' || p.qual || ')' ELSE '' END,
      CASE WHEN p.with_check IS NOT NULL THEN E'\n  WITH CHECK (' || p.with_check || ')' ELSE '' END),
    E'\n' ORDER BY p.tablename, p.policyname)
  INTO v_pol
  FROM pg_policies p WHERE p.schemaname = 'public';

  SELECT string_agg(format('GRANT %s ON public.%I TO %I;', privs, table_name, grantee), E'\n' ORDER BY table_name, grantee)
  INTO v_grants
  FROM (
    SELECT g.table_name, g.grantee, string_agg(DISTINCT g.privilege_type, ', ') AS privs
    FROM information_schema.role_table_grants g
    WHERE g.table_schema = 'public' AND g.grantee IN ('anon', 'authenticated', 'service_role')
    GROUP BY g.table_name, g.grantee
  ) t;

  SELECT string_agg(format('GRANT %s ON SEQUENCE public.%I TO %I;', privs, object_name, grantee), E'\n' ORDER BY object_name, grantee)
  INTO v_seq_grants
  FROM (
    SELECT u.object_name, u.grantee, string_agg(DISTINCT u.privilege_type, ', ') AS privs
    FROM information_schema.usage_privileges u
    WHERE u.object_schema = 'public' AND u.object_type = 'SEQUENCE'
      AND u.grantee IN ('anon', 'authenticated', 'service_role')
    GROUP BY u.object_name, u.grantee
  ) t;

  RETURN jsonb_build_object(
    'generated_at', now(),
    'enums', COALESCE(v_enums, ''),
    'tables', COALESCE(v_tables, ''),
    'constraints', COALESCE(v_cons, ''),
    'indexes', COALESCE(v_idx, ''),
    'views', COALESCE(v_views, ''),
    'functions', COALESCE(v_funcs, ''),
    'triggers', COALESCE(v_trg, ''),
    'rls', COALESCE(v_rls, ''),
    'policies', COALESCE(v_pol, ''),
    'grants', COALESCE(v_grants, ''),
    'sequence_grants', COALESCE(v_seq_grants, ''),
    'counts', jsonb_build_object(
      'tables', (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r'),
      'views', (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='v'),
      'policies', (SELECT count(*) FROM pg_policies WHERE schemaname='public'),
      'functions', (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'),
      'triggers', (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal)
    )
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_export_ddl() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_export_ddl() TO authenticated, service_role;