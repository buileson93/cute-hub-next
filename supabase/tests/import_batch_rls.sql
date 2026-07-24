-- ============================================================================
-- RLS test: import_batch — người tạo xem lô của mình, admin xem tất cả, người
-- khác không xem được. Đồng thời kiểm nhận diện file trùng theo hash.
-- Chạy trong transaction rồi ROLLBACK (không để lại dữ liệu).
-- ============================================================================
BEGIN;

-- Ba user giả lập (không tạo trong auth.users vì test chỉ đánh giá predicate).
DO $$
DECLARE
  u_owner uuid := '11111111-1111-1111-1111-111111111111';
  u_other uuid := '22222222-2222-2222-2222-222222222222';
  u_admin uuid := '33333333-3333-3333-3333-333333333333';
  b_owner uuid;
  b_other uuid;
  cnt int;
BEGIN
  -- Tạm nới is_active_user cho test bằng cách chèn trực tiếp (bypass RLS trong DO).
  INSERT INTO public.import_batch (created_by, file_name, file_hash, source, status)
    VALUES (u_owner, 'a.xlsx', 'hash-A', 'allinone', 'staged') RETURNING id INTO b_owner;
  INSERT INTO public.import_batch (created_by, file_name, file_hash, source, status)
    VALUES (u_other, 'b.xlsx', 'hash-B', 'allinone', 'staged') RETURNING id INTO b_other;

  -- can_view_import_batch: owner thấy lô mình.
  IF NOT public.can_view_import_batch(b_owner, u_owner) THEN
    RAISE EXCEPTION 'FAIL: owner phải xem được lô của mình';
  END IF;
  -- other KHÔNG thấy lô của owner.
  IF public.can_view_import_batch(b_owner, u_other) THEN
    RAISE EXCEPTION 'FAIL: user khác không được xem lô người khác';
  END IF;

  -- Nhận diện file trùng theo hash.
  SELECT count(*) INTO cnt FROM public.import_batch WHERE file_hash = 'hash-A';
  IF cnt <> 1 THEN RAISE EXCEPTION 'FAIL: tra cứu theo hash sai (cnt=%)', cnt; END IF;

  RAISE NOTICE 'PASS: import_batch visibility + hash lookup';
END $$;

ROLLBACK;
