-- ============================================================================
-- Task 34 — RPC hardening test
-- Chạy: psql -f supabase/tests/rpc_hardening.sql
-- ============================================================================
\set ON_ERROR_STOP on

DO $$
DECLARE
  n_missing_sp int;
  offenders text;
  n_anon_secdef int;
  n_no_guard int;
  guarded_signatures text[] := ARRAY[
    'bulk_chuyen_trang_thai_su_co',
    'bulk_chuyen_trang_thai_cong_viec',
    'bulk_gan_field_thiet_bi',
    'bulk_gan_field_vat_tu',
    'cap_nhat_field_thiet_bi',
    'cap_nhat_field_vat_tu',
    'chuyen_trang_thai_su_co',
    'dm_xoa_an_toan',
    'ghi_bao_duong_atomic',
    'ghi_hong_hoc_atomic',
    'ghi_su_co_atomic',
    'hoan_thanh_hong_hoc'
  ];
  sig text;
  body text;
BEGIN
  -- 1) Mọi SECURITY DEFINER function trong public phải có search_path=public
  SELECT count(*), string_agg(p.proname, ', ')
    INTO n_missing_sp, offenders
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.prokind = 'f' AND p.prosecdef
     AND (p.proconfig IS NULL OR NOT ('search_path=public' = ANY(p.proconfig)));
  IF n_missing_sp > 0 THEN
    RAISE EXCEPTION 'FAIL: % SECDEF function thiếu search_path=public: %',
      n_missing_sp, offenders;
  END IF;
  RAISE NOTICE 'PASS: mọi SECDEF function có search_path=public';

  -- 2) 13 RPC nghiệp vụ ghi phải KHÔNG cho anon EXECUTE
  SELECT count(*), string_agg(p.proname, ', ')
    INTO n_anon_secdef, offenders
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_roles r ON r.rolname = 'anon'
   WHERE n.nspname = 'public' AND p.prokind = 'f' AND p.prosecdef
     AND p.proname = ANY(ARRAY[
       '_bulk_audit_batch','bulk_chuyen_trang_thai_su_co','bulk_chuyen_trang_thai_cong_viec',
       'bulk_gan_field_thiet_bi','bulk_gan_field_vat_tu',
       'cap_nhat_field_thiet_bi','cap_nhat_field_vat_tu','chuyen_trang_thai_su_co',
       'dm_xoa_an_toan','ghi_bao_duong_atomic','ghi_hong_hoc_atomic',
       'ghi_su_co_atomic','hoan_thanh_hong_hoc'
     ])
     AND has_function_privilege(r.oid, p.oid, 'EXECUTE');
  IF n_anon_secdef > 0 THEN
    RAISE EXCEPTION 'FAIL: % RPC nhạy cảm còn anon EXECUTE: %',
      n_anon_secdef, offenders;
  END IF;
  RAISE NOTICE 'PASS: 13 RPC nghiệp vụ đã revoke từ anon';

  -- 3) 12 RPC ghi phải có guard has_role / can_manage_equipment / auth.uid()
  n_no_guard := 0;
  offenders := '';
  FOREACH sig IN ARRAY guarded_signatures LOOP
    SELECT pg_get_functiondef(p.oid) INTO body
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname='public' AND p.proname = sig
     LIMIT 1;
    IF body IS NULL THEN
      CONTINUE;
    END IF;
    IF body !~* '(has_role\s*\(|can_manage_equipment\s*\(|auth\.uid\s*\(\)\s*IS\s+(NOT\s+)?NULL)' THEN
      n_no_guard := n_no_guard + 1;
      offenders := offenders || sig || ', ';
    END IF;
  END LOOP;
  IF n_no_guard > 0 THEN
    RAISE EXCEPTION 'FAIL: % RPC ghi không có guard vai trò: %', n_no_guard, offenders;
  END IF;
  RAISE NOTICE 'PASS: mọi RPC ghi có guard vai trò';

  RAISE NOTICE '===== RPC_HARDENING: ALL CHECKS PASSED =====';
END $$;
