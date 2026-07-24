-- ============================================================================
-- Task 7: Hardened AI read-only SQL gate + schema description sync
-- ============================================================================

-- 1) ai_run_select: minimal hardening.
--    Fix: strip string literals / quoted identifiers BEFORE the single-statement
--    (semicolon) check so a legitimate SELECT whose literal contains ';' is no
--    longer rejected as multi-statement. Keyword blocklist already scanned the
--    scrubbed text; keep it. Make SECURITY INVOKER explicit (RLS as caller).
CREATE OR REPLACE FUNCTION public.ai_run_select(_sql text, _max_rows integer DEFAULT 100)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sql text := btrim(_sql);
  v_lower text;
  v_scan text;                 -- bản đã loại literal/định danh để quét từ khoá & ';'
  v_limit int := LEAST(GREATEST(COALESCE(_max_rows, 100), 1), 500);
  v_result jsonb;
BEGIN
  IF v_sql IS NULL OR length(v_sql) = 0 THEN
    RAISE EXCEPTION 'SQL trống';
  END IF;

  -- Bỏ dấu chấm phẩy ở cuối câu (một câu SELECT kết thúc bằng ';' vẫn hợp lệ)
  v_sql := rtrim(v_sql, ';');
  v_lower := lower(v_sql);

  -- Loại literal chuỗi '...' và định danh trích dẫn "..." TRƯỚC KHI quét,
  -- để không chặn oan các ký tự/từ thường nằm trong dữ liệu
  -- (vd: ILIKE '%a;b%' hay ILIKE '%delete%').
  v_scan := regexp_replace(v_lower, '''(''''|[^''])*''', ' ', 'g');
  v_scan := regexp_replace(v_scan, '"[^"]*"', ' ', 'g');

  -- Chỉ cho phép 1 câu lệnh: sau khi đã loại literal, không còn ';' nào ở giữa
  IF position(';' IN v_scan) > 0 THEN
    RAISE EXCEPTION 'Chỉ cho phép 1 câu lệnh duy nhất';
  END IF;

  -- Bắt buộc bắt đầu bằng SELECT hoặc WITH
  IF v_lower !~ '^(select|with)\s' THEN
    RAISE EXCEPTION 'Chỉ cho phép SELECT/WITH';
  END IF;

  -- Chặn từ khoá GHI / nguy hiểm thực sự. An toàn còn được đảm bảo bởi:
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

-- 2) ai_describe_schema: cover the business tables that were previously missing
--    from the IN-list so the schema description matches the curated data dictionary.
CREATE OR REPLACE FUNCTION public.ai_describe_schema()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH cols AS (
    SELECT c.table_name,
      jsonb_agg(jsonb_build_object(
        'name', c.column_name, 'type', c.data_type,
        'udt', c.udt_name, 'nullable', (c.is_nullable = 'YES')
      ) ORDER BY c.ordinal_position) AS columns
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND (c.table_name ~ '^(dm_|thiet_bi|giay_phep|form_|du_an|so_do_)'
           OR c.table_name IN ('profiles','user_roles','tickets','ticket_comment',
                               'notifications','conversations','messages',
                               'conversation_participant','su_co','bao_tri','hong_hoc',
                               'ban_giao','vat_tu','xuat_nhap_kho',
                               'so_do_he_thong','he_thong_truong',
                               'cay_node_edit','audit_log'))
    GROUP BY c.table_name
  ),
  fks AS (
    SELECT jsonb_agg(jsonb_build_object(
      'from_table', tc.table_name, 'from_column', kcu.column_name,
      'to_table', ccu.table_name, 'to_column', ccu.column_name
    )) AS list
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
  ),
  reg AS (
    SELECT jsonb_agg(jsonb_build_object(
      'field_key', field_key, 'nhan', nhan, 'kieu', kieu,
      'pham_vi', pham_vi, 'tuy_chon', tuy_chon) ORDER BY thu_tu) AS list
    FROM public.he_thong_truong WHERE hoat_dong = true AND ap_dung_lop = 'thiet_bi'
  )
  SELECT jsonb_build_object(
    'tables', COALESCE((SELECT jsonb_agg(jsonb_build_object('table_name', table_name, 'columns', columns) ORDER BY table_name) FROM cols), '[]'::jsonb),
    'foreign_keys', COALESCE((SELECT list FROM fks), '[]'::jsonb),
    'thuoc_tinh_fields', COALESCE((SELECT list FROM reg), '[]'::jsonb),
    'ghi_chu', 'Trường mở rộng của thiet_bi nằm trong cột JSONB thuoc_tinh; truy vấn bằng thuoc_tinh->>''field_key''. Tra field_key trong thuoc_tinh_fields.'
  );
$function$;