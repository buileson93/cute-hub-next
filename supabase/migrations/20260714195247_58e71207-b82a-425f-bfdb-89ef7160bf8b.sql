-- Task 34 — RPC hardening: REVOKE EXECUTE FROM anon, PUBLIC cho các RPC ghi
-- Các hàm này đã có guard has_role/can_manage_equipment bên trong, đây là lớp
-- phòng thủ bổ sung ("defense in depth"): chặn ngay ở PostgREST trước khi vào body.

DO $$
DECLARE
  fn_signatures text[] := ARRAY[
    'public._bulk_audit_batch(text, text, integer, jsonb)',
    'public.bulk_chuyen_trang_thai_su_co(uuid[], text, text)',
    'public.bulk_chuyen_trang_thai_cong_viec(uuid[], text, text)',
    'public.bulk_gan_field_thiet_bi(uuid[], text, text, text)',
    'public.bulk_gan_field_vat_tu(uuid[], text, text, text)',
    'public.cap_nhat_field_thiet_bi(uuid, text, text)',
    'public.cap_nhat_field_vat_tu(uuid, text, text)',
    'public.chuyen_trang_thai_su_co(uuid, text)',
    'public.dm_xoa_an_toan(text, uuid)',
    'public.ghi_bao_duong_atomic(uuid, text, date, jsonb)',
    'public.ghi_hong_hoc_atomic(uuid, text, date, jsonb)',
    'public.ghi_su_co_atomic(uuid, text, date, jsonb)',
    'public.hoan_thanh_hong_hoc(uuid)'
  ];
  s text;
BEGIN
  FOREACH s IN ARRAY fn_signatures LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', s);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', s);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', s);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', s);
  END LOOP;
END $$;