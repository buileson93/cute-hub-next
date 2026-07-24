CREATE OR REPLACE FUNCTION public.admin_list_schema()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tables jsonb;
  v_fks jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Chỉ admin mới xem được lược đồ';
  END IF;

  SELECT jsonb_agg(t ORDER BY t->>'table_name') INTO v_tables FROM (
    SELECT jsonb_build_object(
      'table_name', c.table_name,
      'columns', (
        SELECT jsonb_agg(jsonb_build_object(
          'name', col.column_name,
          'type', col.data_type,
          'udt', col.udt_name,
          'nullable', (col.is_nullable = 'YES'),
          'default', col.column_default,
          'position', col.ordinal_position,
          'is_pk', EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            WHERE tc.table_schema='public' AND tc.table_name=c.table_name
              AND tc.constraint_type='PRIMARY KEY' AND kcu.column_name=col.column_name
          )
        ) ORDER BY col.ordinal_position)
        FROM information_schema.columns col
        WHERE col.table_schema='public' AND col.table_name=c.table_name
      )
    ) AS t
    FROM information_schema.tables c
    WHERE c.table_schema='public'
      AND c.table_type='BASE TABLE'
  ) s;

  SELECT jsonb_agg(jsonb_build_object(
    'from_table', tc.table_name,
    'from_column', kcu.column_name,
    'to_table', ccu.table_name,
    'to_column', ccu.column_name,
    'constraint', tc.constraint_name
  )) INTO v_fks
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type='FOREIGN KEY'
    AND tc.table_schema='public';

  RETURN jsonb_build_object('tables', COALESCE(v_tables,'[]'::jsonb), 'foreign_keys', COALESCE(v_fks,'[]'::jsonb));
END;
$function$;