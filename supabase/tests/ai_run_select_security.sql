-- ============================================================================
-- Task 7: Security tests for the AI read-only SQL gate (ai_run_select) and the
-- schema-description RPC (ai_describe_schema).
--
-- These validations are role-independent (they RAISE/return {"error": ...}
-- before any table access), so they are asserted here directly. RLS behaviour
-- per user (user A/B) is covered by supabase/tests/rls_cross_unit.sql.
--
-- Exit: RAISES an exception (non-zero) if any assertion FAILs.
-- ============================================================================
\set ON_ERROR_STOP on

DO $$
DECLARE
  pass int := 0;
  fail int := 0;
  r jsonb;
BEGIN

  -- 1) valid SELECT → rows present, no error
  r := public.ai_run_select($q$select 1 as ok$q$);
  IF r ? 'rows' AND NOT (r ? 'error') THEN pass := pass+1;
  ELSE fail := fail+1; RAISE WARNING 'FAIL c1 valid select: %', r; END IF;

  -- 2) valid WITH (CTE) → rows present
  r := public.ai_run_select($q$with x as (select 1 a) select a from x$q$);
  IF r ? 'rows' AND NOT (r ? 'error') THEN pass := pass+1;
  ELSE fail := fail+1; RAISE WARNING 'FAIL c2 valid with: %', r; END IF;

  -- 3) literal chứa từ khoá thông thường (delete/update) → KHÔNG bị chặn
  r := public.ai_run_select($q$select 42 as c where 'x' ilike '%delete%' or 'y' ilike '%update%'$q$);
  IF r ? 'rows' AND NOT (r ? 'error') THEN pass := pass+1;
  ELSE fail := fail+1; RAISE WARNING 'FAIL c3 keyword-in-literal blocked wrongly: %', r; END IF;

  -- 4) dấu ';' bên trong literal → KHÔNG bị hiểu là nhiều câu lệnh (regression)
  r := public.ai_run_select($q$select 'a;b' as v$q$);
  IF r ? 'rows' AND (r->'rows'->0->>'v') = 'a;b' THEN pass := pass+1;
  ELSE fail := fail+1; RAISE WARNING 'FAIL c4 semicolon-in-literal: %', r; END IF;

  -- 5) nhiều câu lệnh → error
  r := public.ai_run_select($q$select 1; select 2$q$);
  IF r->>'error' = 'Chỉ cho phép 1 câu lệnh duy nhất' THEN pass := pass+1;
  ELSE fail := fail+1; RAISE WARNING 'FAIL c5 multi-statement: %', r; END IF;

  -- 6) từ khoá GHI đứng đầu (không phải select/with) → chặn ở bước prefix
  r := public.ai_run_select($q$delete from thiet_bi$q$);
  IF r ? 'error' THEN pass := pass+1;
  ELSE fail := fail+1; RAISE WARNING 'FAIL c6 delete: %', r; END IF;

  -- 7) từ khoá GHI ẩn trong câu bắt đầu bằng select-like injection → chặn
  r := public.ai_run_select($q$select 1 ; drop table thiet_bi$q$);
  IF r ? 'error' THEN pass := pass+1;
  ELSE fail := fail+1; RAISE WARNING 'FAIL c7 injection drop: %', r; END IF;

  -- 8) DDL/khác không phải SELECT → chặn
  r := public.ai_run_select($q$drop table thiet_bi$q$);
  IF r->>'error' = 'Chỉ cho phép SELECT/WITH' THEN pass := pass+1;
  ELSE fail := fail+1; RAISE WARNING 'FAIL c8 drop prefix: %', r; END IF;

  -- 9) truncate (từ khoá nguy hiểm) trong câu SELECT hợp lệ về prefix → chặn keyword
  r := public.ai_run_select($q$select * from (select 1) t; truncate thiet_bi$q$);
  IF r ? 'error' THEN pass := pass+1;
  ELSE fail := fail+1; RAISE WARNING 'FAIL c9 truncate: %', r; END IF;

  -- 10) LIMIT bị cưỡng bức: yêu cầu 1000 dòng nhưng _max_rows=5 → chỉ 5 dòng
  r := public.ai_run_select($q$select g from generate_series(1,1000) g$q$, 5);
  IF (r->>'row_limit')::int = 5 AND jsonb_array_length(r->'rows') = 5 THEN pass := pass+1;
  ELSE fail := fail+1; RAISE WARNING 'FAIL c10 limit enforce small: %', jsonb_array_length(r->'rows'); END IF;

  -- 11) LIMIT trần 500: yêu cầu 99999 → kẹp còn 500
  r := public.ai_run_select($q$select g from generate_series(1,2000) g$q$, 99999);
  IF (r->>'row_limit')::int = 500 AND jsonb_array_length(r->'rows') = 500 THEN pass := pass+1;
  ELSE fail := fail+1; RAISE WARNING 'FAIL c11 limit clamp 500: %', r->>'row_limit'; END IF;

  -- 12) SQL rỗng → error (không crash)
  r := public.ai_run_select($q$   $q$);
  IF r ? 'error' THEN pass := pass+1;
  ELSE fail := fail+1; RAISE WARNING 'FAIL c12 empty sql: %', r; END IF;

  -- 13) ai_run_select phải là SECURITY INVOKER (không bypass RLS)
  IF (SELECT NOT prosecdef FROM pg_proc WHERE proname='ai_run_select' LIMIT 1) THEN pass := pass+1;
  ELSE fail := fail+1; RAISE WARNING 'FAIL c13 ai_run_select must be SECURITY INVOKER'; END IF;

  -- 14) anon KHÔNG được EXECUTE ai_run_select
  IF NOT has_function_privilege('anon', 'public.ai_run_select(text,integer)', 'EXECUTE') THEN pass := pass+1;
  ELSE fail := fail+1; RAISE WARNING 'FAIL c14 anon can execute ai_run_select'; END IF;

  -- 15) describe_schema bao phủ các bảng nghiệp vụ từng bị thiếu (đồng bộ từ điển)
  r := public.ai_describe_schema();
  IF (SELECT count(*) FROM jsonb_array_elements(r->'tables') t
       WHERE t->>'table_name' IN
         ('du_an_cong_viec','du_an_moc','so_do_tep_dinh_kem',
          'so_do_thu_vien_hinh','cay_node_edit','audit_log')) = 6
  THEN pass := pass+1;
  ELSE fail := fail+1; RAISE WARNING 'FAIL c15 describe_schema coverage'; END IF;

  RAISE NOTICE 'ai_run_select security: % passed, % failed', pass, fail;
  IF fail > 0 THEN
    RAISE EXCEPTION 'ai_run_select security tests FAILED: % failing assertions', fail;
  END IF;
END $$;
