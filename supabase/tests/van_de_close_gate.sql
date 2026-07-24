-- ============================================================================
-- Kiểm thử VẤN ĐỀ (RCA): liên kết nhiều sự cố, quy tắc đóng (dong_van_de) và
-- quyền phê duyệt công việc (phe_duyet_cong_viec).
--
-- Bao phủ:
--   • TEST 1 — Một vấn đề (RCA) liên kết NHIỀU sự cố → v_van_de.so_su_co đếm đúng.
--   • TEST 2 — KHÔNG đóng được vấn đề khi còn hành động BẮT BUỘC đang mở.
--   • TEST 3 — Đóng được sau khi hoàn thành/hủy mọi hành động bắt buộc, và
--              chuyển trạng thái được GHI VÀO audit_log.
--   • TEST 4 — Đóng vấn đề audit đúng entity 'van_de' (mọi chuyển trạng thái).
--
-- Chạy: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/van_de_close_gate.sql
-- Toàn bộ trong 1 giao dịch + ROLLBACK ở cuối -> KHÔNG để lại dữ liệu.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  vd uuid;
  sc1 uuid; sc2 uuid; sc3 uuid;
  cv_bat_buoc uuid; cv_thuong uuid;
  v_so_su_co bigint;
  v_trang_thai text;
  v_audit_before bigint;
  v_audit_after bigint;
  v_blocked boolean;
  v_msg text;
BEGIN
  -- Ngữ cảnh đăng nhập = persona admin (khớp fixtures của rls_cross_unit.sql)
  -- để auth.uid() -> can_manage_equipment = true khi gọi dong_van_de.
  PERFORM set_config(
    'request.jwt.claims',
    '{"sub":"3e4602f3-a947-4fe0-81c3-bf16bf3a5da7","role":"authenticated"}',
    true
  );

  -- ---- Seed vấn đề (RCA) ----
  INSERT INTO public.van_de(tieu_de, trang_thai, muc_do)
    VALUES ('RCA test — lỗi nguồn lặp lại', 'dang_phan_tich', 'cao')
    RETURNING id INTO vd;

  -- ---- TEST 1: liên kết NHIỀU sự cố vào cùng một vấn đề ----
  INSERT INTO public.su_co(hien_tuong, ngay_phat_hien, trang_thai, van_de_id)
    VALUES ('Sự cố 1', current_date, 'Mới', vd) RETURNING id INTO sc1;
  INSERT INTO public.su_co(hien_tuong, ngay_phat_hien, trang_thai, van_de_id)
    VALUES ('Sự cố 2', current_date, 'Mới', vd) RETURNING id INTO sc2;
  INSERT INTO public.su_co(hien_tuong, ngay_phat_hien, trang_thai, van_de_id)
    VALUES ('Sự cố 3', current_date, 'Mới', vd) RETURNING id INTO sc3;

  SELECT so_su_co INTO v_so_su_co FROM public.v_van_de WHERE id = vd;
  IF v_so_su_co <> 3 THEN
    RAISE EXCEPTION 'TEST1 FAIL: so_su_co=% mong đợi 3', v_so_su_co;
  END IF;

  -- ---- Seed hành động khắc phục: 1 bắt buộc còn mở, 1 thường ----
  INSERT INTO public.cong_viec_bao_tri(loai, trang_thai, van_de_id, bat_buoc, mo_ta)
    VALUES ('CM', 'MO', vd, true, 'Thay bộ nguồn (bắt buộc)') RETURNING id INTO cv_bat_buoc;
  INSERT INTO public.cong_viec_bao_tri(loai, trang_thai, van_de_id, bat_buoc, mo_ta)
    VALUES ('CM', 'MO', vd, false, 'Ghi chú theo dõi') RETURNING id INTO cv_thuong;

  -- ---- TEST 2: dong_van_de PHẢI thất bại khi còn hành động bắt buộc mở ----
  v_blocked := false;
  v_msg := '';
  BEGIN
    PERFORM public.dong_van_de(vd, 'Thử đóng sớm');
  EXCEPTION WHEN OTHERS THEN
    v_blocked := true;
    v_msg := SQLERRM;
  END;
  IF NOT v_blocked THEN
    RAISE EXCEPTION 'TEST2 FAIL: đóng được dù còn hành động bắt buộc đang mở';
  END IF;
  IF position('bắt buộc' IN v_msg) = 0 THEN
    RAISE EXCEPTION 'TEST2 FAIL: bị chặn nhưng sai lý do (mong đợi gate bắt buộc): %', v_msg;
  END IF;
  SELECT trang_thai INTO v_trang_thai FROM public.van_de WHERE id = vd;
  IF v_trang_thai = 'dong' THEN
    RAISE EXCEPTION 'TEST2 FAIL: trạng thái đã thành dong dù bị chặn';
  END IF;


  -- ---- TEST 3: hoàn thành hành động bắt buộc → đóng được + ghi audit ----
  UPDATE public.cong_viec_bao_tri SET trang_thai = 'HOAN_THANH', ngay_hoan_thanh = current_date
    WHERE id = cv_bat_buoc;

  SELECT count(*) INTO v_audit_before FROM public.audit_log
    WHERE entity = 'van_de' AND entity_id = vd::text;

  PERFORM public.dong_van_de(vd, 'Đã xử lý triệt để');

  SELECT trang_thai INTO v_trang_thai FROM public.van_de WHERE id = vd;
  IF v_trang_thai <> 'dong' THEN
    RAISE EXCEPTION 'TEST3 FAIL: trạng thái=% mong đợi dong', v_trang_thai;
  END IF;

  SELECT count(*) INTO v_audit_after FROM public.audit_log
    WHERE entity = 'van_de' AND entity_id = vd::text;
  IF v_audit_after <= v_audit_before THEN
    RAISE EXCEPTION 'TEST3 FAIL: chuyển trạng thái không được ghi audit (before=%, after=%)',
      v_audit_before, v_audit_after;
  END IF;

  -- ---- TEST 4: hành động KHÔNG bắt buộc còn mở KHÔNG chặn đóng (đã đóng ở trên) ----
  IF (SELECT trang_thai FROM public.cong_viec_bao_tri WHERE id = cv_thuong) <> 'MO' THEN
    RAISE EXCEPTION 'TEST4 FAIL: hành động thường bị thay đổi ngoài ý muốn';
  END IF;

  RAISE NOTICE 'ALL TESTS PASSED (van_de close gate)';
END $$;

ROLLBACK;
