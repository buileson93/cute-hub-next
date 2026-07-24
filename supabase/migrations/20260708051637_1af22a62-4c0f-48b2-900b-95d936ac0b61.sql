
-- =========== Helpers ===========
CREATE OR REPLACE FUNCTION public._admin_check_table(_table text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _table IS NULL OR _table !~ '^[a-z_][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Tên bảng không hợp lệ: %', _table;
  END IF;
  IF NOT (_table ~ '^(dm_|thiet_bi|giay_phep|form_)') THEN
    RAISE EXCEPTION 'Bảng "%" không nằm trong nhóm bảng nghiệp vụ được phép sửa', _table;
  END IF;
  IF _table IN ('audit_log','profiles','user_roles') THEN
    RAISE EXCEPTION 'Không được sửa bảng hệ thống "%"', _table;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name=_table
  ) THEN
    RAISE EXCEPTION 'Bảng "%" không tồn tại', _table;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public._admin_check_ident(_ident text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF _ident IS NULL OR _ident !~ '^[a-z_][a-z0-9_]*$' OR length(_ident) > 63 THEN
    RAISE EXCEPTION 'Tên định danh không hợp lệ: %', _ident;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public._admin_check_type(_type text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF _type NOT IN ('text','integer','bigint','numeric','boolean','date','timestamptz','uuid','jsonb') THEN
    RAISE EXCEPTION 'Kiểu dữ liệu "%" không được phép', _type;
  END IF;
END;
$$;

-- =========== Schema introspection ===========
CREATE OR REPLACE FUNCTION public.admin_list_schema()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
      AND (c.table_name ~ '^(dm_|thiet_bi|giay_phep|form_)'
           OR c.table_name IN ('profiles','user_roles','audit_log'))
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
$$;

-- =========== ADD COLUMN ===========
CREATE OR REPLACE FUNCTION public.admin_add_column(
  _table text, _column text, _type text,
  _nullable boolean DEFAULT true, _default text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_sql text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Chỉ admin mới thêm cột được';
  END IF;
  PERFORM public._admin_check_table(_table);
  PERFORM public._admin_check_ident(_column);
  PERFORM public._admin_check_type(_type);

  v_sql := format('ALTER TABLE public.%I ADD COLUMN %I %s', _table, _column, _type);
  IF NOT _nullable THEN v_sql := v_sql || ' NOT NULL'; END IF;
  IF _default IS NOT NULL AND length(trim(_default)) > 0 THEN
    v_sql := v_sql || ' DEFAULT ' || _default;
  END IF;
  EXECUTE v_sql;

  PERFORM public.log_app_event('admin_add_column', _table, _column,
    jsonb_build_object('type', _type, 'nullable', _nullable, 'default', _default));
END;
$$;

-- =========== RENAME COLUMN ===========
CREATE OR REPLACE FUNCTION public.admin_rename_column(_table text, _old text, _new text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Chỉ admin mới đổi tên cột được';
  END IF;
  PERFORM public._admin_check_table(_table);
  PERFORM public._admin_check_ident(_old);
  PERFORM public._admin_check_ident(_new);
  IF _old IN ('id','created_at','updated_at') THEN
    RAISE EXCEPTION 'Không được đổi tên cột lõi "%"', _old;
  END IF;

  EXECUTE format('ALTER TABLE public.%I RENAME COLUMN %I TO %I', _table, _old, _new);
  PERFORM public.log_app_event('admin_rename_column', _table, _old,
    jsonb_build_object('new', _new));
END;
$$;

-- =========== DROP COLUMN ===========
CREATE OR REPLACE FUNCTION public.admin_drop_column(_table text, _column text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Chỉ admin mới xoá cột được';
  END IF;
  PERFORM public._admin_check_table(_table);
  PERFORM public._admin_check_ident(_column);
  IF _column IN ('id','created_at','updated_at') THEN
    RAISE EXCEPTION 'Không được xoá cột lõi "%"', _column;
  END IF;
  -- disallow dropping FK columns to avoid breaking relations silently
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema='public' AND tc.table_name=_table
      AND tc.constraint_type IN ('FOREIGN KEY','PRIMARY KEY','UNIQUE')
      AND kcu.column_name=_column
  ) THEN
    RAISE EXCEPTION 'Cột "%" đang tham gia khoá/ràng buộc, không thể xoá trực tiếp', _column;
  END IF;

  EXECUTE format('ALTER TABLE public.%I DROP COLUMN %I', _table, _column);
  PERFORM public.log_app_event('admin_drop_column', _table, _column, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_schema() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_column(text,text,text,boolean,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_rename_column(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_drop_column(text,text) TO authenticated;
