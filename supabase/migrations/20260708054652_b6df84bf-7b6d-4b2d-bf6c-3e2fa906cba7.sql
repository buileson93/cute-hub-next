
-- 1) Schema description for AI (business tables only)
CREATE OR REPLACE FUNCTION public.ai_describe_schema()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH cols AS (
    SELECT
      c.table_name,
      jsonb_agg(jsonb_build_object(
        'name', c.column_name,
        'type', c.data_type,
        'udt', c.udt_name,
        'nullable', (c.is_nullable = 'YES')
      ) ORDER BY c.ordinal_position) AS columns
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND (c.table_name ~ '^(dm_|thiet_bi|giay_phep|form_)'
           OR c.table_name IN ('profiles','user_roles','tickets','ticket_comment',
                               'notifications','conversations','messages',
                               'conversation_participant'))
    GROUP BY c.table_name
  ),
  fks AS (
    SELECT jsonb_agg(jsonb_build_object(
      'from_table', tc.table_name,
      'from_column', kcu.column_name,
      'to_table', ccu.table_name,
      'to_column', ccu.column_name
    )) AS list
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
  )
  SELECT jsonb_build_object(
    'tables', COALESCE((SELECT jsonb_agg(jsonb_build_object('table_name', table_name, 'columns', columns) ORDER BY table_name) FROM cols), '[]'::jsonb),
    'foreign_keys', COALESCE((SELECT list FROM fks), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.ai_describe_schema() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ai_describe_schema() TO authenticated;

-- 2) Safe read-only SELECT executor for AI (RLS applies — SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.ai_run_select(_sql text, _max_rows integer DEFAULT 100)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_sql text := btrim(_sql);
  v_lower text;
  v_limit int := LEAST(GREATEST(COALESCE(_max_rows, 100), 1), 500);
  v_result jsonb;
BEGIN
  IF v_sql IS NULL OR length(v_sql) = 0 THEN
    RAISE EXCEPTION 'SQL trống';
  END IF;
  -- Only a single statement
  IF position(';' IN rtrim(v_sql, ';')) > 0 THEN
    RAISE EXCEPTION 'Chỉ cho phép 1 câu lệnh duy nhất';
  END IF;
  v_sql := rtrim(v_sql, ';');
  v_lower := lower(v_sql);
  -- Must start with SELECT or WITH
  IF v_lower !~ '^(select|with)\s' THEN
    RAISE EXCEPTION 'Chỉ cho phép SELECT/WITH';
  END IF;
  -- Block dangerous keywords
  IF v_lower ~* '\y(insert|update|delete|drop|alter|create|truncate|grant|revoke|comment|copy|call|do|vacuum|analyze|reindex|refresh|lock|set|reset|begin|commit|rollback|savepoint|listen|notify|prepare|execute|deallocate|security\s+definer|pg_sleep|pg_read_file|pg_ls_dir|dblink|copy_from)\y' THEN
    RAISE EXCEPTION 'Câu lệnh chứa từ khoá không được phép';
  END IF;
  -- Wrap with LIMIT to prevent huge result
  EXECUTE format('SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM (SELECT * FROM (%s) _q LIMIT %s) t', v_sql, v_limit)
    INTO v_result;
  RETURN jsonb_build_object('rows', v_result, 'row_limit', v_limit);
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.ai_run_select(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ai_run_select(text, integer) TO authenticated;
