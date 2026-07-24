-- ============================================================================
-- Task 33 — RLS hoàn thiện: kiểm định coverage & shape
-- Chạy: psql -f supabase/tests/rls_hoan_thien.sql
-- Raises exception (non-zero exit) nếu bất kỳ điều kiện nào fail.
-- ============================================================================
\set ON_ERROR_STOP on

DO $$
DECLARE
  n_missing_rls int;
  n_anon_policies int;
  n_update_missing_check int;
  n_broad_business int;
  offenders text;
BEGIN
  -- 1) Mọi bảng public phải bật RLS
  SELECT count(*), string_agg(c.relname, ', ')
    INTO n_missing_rls, offenders
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relkind = 'r'
     AND c.relrowsecurity = false;
  IF n_missing_rls > 0 THEN
    RAISE EXCEPTION 'FAIL: % bảng public chưa bật RLS: %', n_missing_rls, offenders;
  END IF;
  RAISE NOTICE 'PASS: mọi bảng public đã bật RLS';

  -- 2) Không có policy cấp cho anon (đóng cửa Data API ẩn danh)
  SELECT count(*), string_agg(tablename || '.' || policyname, ', ')
    INTO n_anon_policies, offenders
    FROM pg_policies
   WHERE schemaname = 'public' AND 'anon' = ANY(roles);
  IF n_anon_policies > 0 THEN
    RAISE EXCEPTION 'FAIL: % policy cấp cho anon: %', n_anon_policies, offenders;
  END IF;
  RAISE NOTICE 'PASS: không có policy anon';

  -- 3) Mọi UPDATE policy có WITH CHECK tường minh
  SELECT count(*), string_agg(tablename || '.' || policyname, ', ')
    INTO n_update_missing_check, offenders
    FROM pg_policies
   WHERE schemaname = 'public' AND cmd = 'UPDATE'
     AND with_check IS NULL;
  IF n_update_missing_check > 0 THEN
    RAISE EXCEPTION 'FAIL: % UPDATE policy thiếu WITH CHECK: %',
      n_update_missing_check, offenders;
  END IF;
  RAISE NOTICE 'PASS: mọi UPDATE policy có WITH CHECK';

  -- 4) Bảng nghiệp vụ scoped-by-unit KHÔNG được có policy qual='true'
  SELECT count(*), string_agg(tablename || '.' || policyname, ', ')
    INTO n_broad_business, offenders
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN (
       'thiet_bi','su_co','bao_tri','hong_hoc','cong_viec_bao_tri',
       'ban_giao','kiem_ke','kho','kho_giao_dich','vat_tu',
       'form_submission','form_submission_item_result','form_submission_thiet_bi',
       'thiet_bi_tep_dinh_kem','thiet_bi_ket_noi','thiet_bi_khe_linh_kien',
       'thiet_bi_vong_doi','thiet_bi_do_dac','thiet_bi_cap_phat',
       'giay_phep','giay_phep_khai_thac','audit_log','auth_event_log',
       'backup_lich_su','profiles','user_roles','user_scope',
       'ai_conversation','ai_message','webauthn_credentials',
       'notifications','tickets','ticket_comment','van_de',
       'anomaly_alert','bao_tri_chinh_sach','canh_bao_het_han_log',
       'import_batch','import_item','import_alias','feature_usage_log',
       'telegram_subscriber','telegram_da_gui'
     )
     AND (qual = 'true' OR with_check = 'true');
  IF n_broad_business > 0 THEN
    RAISE EXCEPTION 'FAIL: % policy quá rộng trên bảng nghiệp vụ: %',
      n_broad_business, offenders;
  END IF;
  RAISE NOTICE 'PASS: không có policy qual=true trên bảng nghiệp vụ';

  RAISE NOTICE '===== RLS_HOAN_THIEN: ALL CHECKS PASSED =====';
END $$;
