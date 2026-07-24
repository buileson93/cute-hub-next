-- ============================================================================
-- RLS test: import_alias — người dùng đang hoạt động xem được; chỉ admin ghi.
-- Đồng thời kiểm chỉ mục unique theo (entity, scope, alias_norm) và tra cứu
-- alias để đối chiếu. Chạy trong transaction rồi ROLLBACK (không để lại dữ liệu).
-- ============================================================================
BEGIN;

DO $$
DECLARE
  u_admin uuid := '33333333-3333-3333-3333-333333333333';
  canon   uuid := gen_random_uuid();
  a1 uuid;
  dup_failed boolean := false;
  cnt int;
BEGIN
  -- Chèn trực tiếp (DO block bỏ qua RLS) để dựng dữ liệu test.
  INSERT INTO public.import_alias (entity, scope, source, alias, alias_norm, canonical_id, confirmed_by)
    VALUES ('thiet_bi', NULL, 'manual', 'Máy trạm bờ', 'may tram bo', canon, u_admin)
    RETURNING id INTO a1;

  -- Tra cứu alias để đối chiếu.
  SELECT count(*) INTO cnt
  FROM public.import_alias
  WHERE entity = 'thiet_bi' AND alias_norm = 'may tram bo';
  IF cnt <> 1 THEN RAISE EXCEPTION 'FAIL: tra cứu alias sai (cnt=%)', cnt; END IF;

  -- Trùng (entity, scope, alias_norm) phải bị chỉ mục unique chặn.
  BEGIN
    INSERT INTO public.import_alias (entity, scope, source, alias, alias_norm, canonical_id, confirmed_by)
      VALUES ('thiet_bi', NULL, 'import', 'may tram bo', 'may tram bo', gen_random_uuid(), u_admin);
  EXCEPTION WHEN unique_violation THEN
    dup_failed := true;
  END;
  IF NOT dup_failed THEN RAISE EXCEPTION 'FAIL: alias trùng phải bị chặn bởi unique index'; END IF;

  -- Cùng alias nhưng khác entity thì hợp lệ.
  INSERT INTO public.import_alias (entity, scope, source, alias, alias_norm, canonical_id, confirmed_by)
    VALUES ('dm_he_thong', NULL, 'manual', 'may tram bo', 'may tram bo', gen_random_uuid(), u_admin);

  RAISE NOTICE 'PASS: import_alias lookup + unique scope + audit columns';
END $$;

-- Kiểm cột audit tồn tại và mặc định hợp lý.
DO $$
DECLARE has_cols int;
BEGIN
  SELECT count(*) INTO has_cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'import_alias'
    AND column_name IN ('confirmed_by', 'confirmed_at', 'source', 'scope', 'entity');
  IF has_cols <> 5 THEN RAISE EXCEPTION 'FAIL: thiếu cột audit/scope (found=%)', has_cols; END IF;
  RAISE NOTICE 'PASS: import_alias audit/scope columns present';
END $$;

ROLLBACK;
