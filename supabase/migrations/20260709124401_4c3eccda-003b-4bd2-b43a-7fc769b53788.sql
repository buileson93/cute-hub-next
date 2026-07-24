CREATE OR REPLACE FUNCTION public.ai_run_select(_sql text, _max_rows integer DEFAULT 100)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sql text := btrim(_sql);
  v_lower text;
  v_scan text;                 -- bản đã loại literal/định danh để quét từ khoá
  v_limit int := LEAST(GREATEST(COALESCE(_max_rows, 100), 1), 500);
  v_result jsonb;
BEGIN
  IF v_sql IS NULL OR length(v_sql) = 0 THEN
    RAISE EXCEPTION 'SQL trống';
  END IF;
  -- Chỉ cho phép 1 câu lệnh
  IF position(';' IN rtrim(v_sql, ';')) > 0 THEN
    RAISE EXCEPTION 'Chỉ cho phép 1 câu lệnh duy nhất';
  END IF;
  v_sql := rtrim(v_sql, ';');
  v_lower := lower(v_sql);
  -- Bắt buộc bắt đầu bằng SELECT hoặc WITH
  IF v_lower !~ '^(select|with)\s' THEN
    RAISE EXCEPTION 'Chỉ cho phép SELECT/WITH';
  END IF;
  -- Loại literal chuỗi '...' và định danh trích dẫn "..." TRƯỚC KHI quét từ khoá,
  -- để không chặn oan các từ thường nằm trong dữ liệu (vd: ILIKE '%do%').
  v_scan := regexp_replace(v_lower, '''(''''|[^''])*''', ' ', 'g');
  v_scan := regexp_replace(v_scan, '"[^"]*"', ' ', 'g');
  -- Chỉ chặn từ khoá GHI / nguy hiểm thực sự. An toàn vẫn được đảm bảo bởi:
  -- ép prefix SELECT/WITH + 1 câu lệnh + SECURITY INVOKER (RLS) + LIMIT cưỡng bức.
  IF v_scan ~* '\y(insert|update|delete|drop|alter|truncate|grant|revoke|copy|call|vacuum|reindex|refresh|lock|listen|notify|prepare|execute|deallocate|dblink|pg_sleep|pg_read_file|pg_ls_dir|pg_reload_conf)\y' THEN
    RAISE EXCEPTION 'Câu lệnh chứa từ khoá không được phép';
  END IF;
  -- Bọc LIMIT để tránh kết quả quá lớn
  EXECUTE format('SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM (SELECT * FROM (%s) _q LIMIT %s) t', v_sql, v_limit)
    INTO v_result;
  RETURN jsonb_build_object('rows', v_result, 'row_limit', v_limit);
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$function$;