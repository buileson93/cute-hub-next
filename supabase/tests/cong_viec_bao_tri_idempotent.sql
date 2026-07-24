-- ============================================================================
-- Kiểm thử TÍNH BẤT BIẾN (idempotent) của scheduler sinh phiếu bảo dưỡng.
--
-- Bao phủ:
--   • TEST 1 — Chạy tao_cong_viec_bao_tri_dinh_ky() HAI LẦN cùng
--              policy/kỳ/asset chỉ tạo ĐÚNG MỘT work order.
--   • TEST 2 — Unique key (chinh_sach_id, thiet_bi_id, ky_han) chặn phiếu
--              trùng khi ghi trực tiếp (mô phỏng chạy đồng thời/race).
--   • TEST 3 — Sang KỲ MỚI (đổi ngày đến hạn) thì được tạo phiếu mới.
--
-- Chạy: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/cong_viec_bao_tri_idempotent.sql
-- Toàn bộ trong 1 giao dịch + ROLLBACK ở cuối -> KHÔNG để lại dữ liệu.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  ltb uuid;
  tb uuid;
  cs uuid;
  v_first integer;
  v_second integer;
  v_total bigint;
  v_dup_blocked boolean;
  v_msg text;
  v_ky date;
  v_wo uuid;
BEGIN
  -- Ngữ cảnh đăng nhập = persona admin (khớp fixtures rls_cross_unit.sql)
  PERFORM set_config(
    'request.jwt.claims',
    '{"sub":"3e4602f3-a947-4fe0-81c3-bf16bf3a5da7","role":"authenticated"}',
    true
  );

  -- ---- Seed loại thiết bị + thiết bị đến hạn + chính sách PM ----
  INSERT INTO public.dm_loai_thiet_bi(ma, ten, thu_tu)
    VALUES ('TST_LTB_IDEM', 'Loại TB idempotent', 1) RETURNING id INTO ltb;

  INSERT INTO public.thiet_bi(ma_thiet_bi, ten_thiet_bi, loai_thiet_bi_id, ngay_bao_tri_ke_tiep)
    VALUES ('TST_TB_IDEM', 'TB idempotent', ltb, CURRENT_DATE) RETURNING id INTO tb;

  -- canh_bao_truoc_ngay rộng để kỳ kế tiếp (sau khi RPC đẩy +chu_ky) vẫn nằm trong cửa sổ báo trước.
  INSERT INTO public.bao_tri_chinh_sach(ten, loai_thiet_bi_id, active, chu_ky_ngay, canh_bao_truoc_ngay)
    VALUES ('CS idempotent', ltb, true, 30, 400) RETURNING id INTO cs;

  -- ---- TEST 1: chạy scheduler HAI LẦN → chỉ 1 phiếu ----
  SELECT so_phieu_tao INTO v_first  FROM public.tao_cong_viec_bao_tri_dinh_ky();
  SELECT so_phieu_tao INTO v_second FROM public.tao_cong_viec_bao_tri_dinh_ky();

  IF v_first <> 1 THEN
    RAISE EXCEPTION 'TEST1 FAIL: lần 1 tạo % phiếu, mong đợi 1', v_first;
  END IF;
  IF v_second <> 0 THEN
    RAISE EXCEPTION 'TEST1 FAIL: lần 2 tạo % phiếu, mong đợi 0 (idempotent)', v_second;
  END IF;

  SELECT count(*) INTO v_total FROM public.cong_viec_bao_tri
    WHERE thiet_bi_id = tb AND chinh_sach_id = cs;
  IF v_total <> 1 THEN
    RAISE EXCEPTION 'TEST1 FAIL: tổng % phiếu cho cùng policy/kỳ/asset, mong đợi 1', v_total;
  END IF;

  -- Lấy kỳ hạn của phiếu vừa tạo để test chèn trùng
  SELECT ky_han INTO v_ky FROM public.cong_viec_bao_tri
    WHERE thiet_bi_id = tb AND chinh_sach_id = cs LIMIT 1;

  -- ---- TEST 2: unique key chặn phiếu trùng (mô phỏng chạy đồng thời) ----
  v_dup_blocked := false;
  BEGIN
    INSERT INTO public.cong_viec_bao_tri
      (thiet_bi_id, chinh_sach_id, loai, trang_thai, ngay_den_han, ky_han)
      VALUES (tb, cs, 'PM', 'MO', v_ky, v_ky);
  EXCEPTION WHEN unique_violation THEN
    v_dup_blocked := true;
    v_msg := SQLERRM;
  END;
  IF NOT v_dup_blocked THEN
    RAISE EXCEPTION 'TEST2 FAIL: chèn phiếu PM trùng (policy/kỳ/asset) KHÔNG bị chặn';
  END IF;

  -- ---- TEST 3: sang KỲ MỚI thì tạo được phiếu mới ----
  -- Hoàn thành phiếu qua RPC (một giao dịch): tự đẩy ngày đến hạn sang kỳ sau (chu_ky_ngay).
  SELECT id INTO v_wo FROM public.cong_viec_bao_tri
    WHERE thiet_bi_id = tb AND chinh_sach_id = cs AND trang_thai IN ('MO','DANG_LAM') LIMIT 1;
  PERFORM public.hoan_thanh_cong_viec_bao_tri(v_wo);

  SELECT so_phieu_tao INTO v_first FROM public.tao_cong_viec_bao_tri_dinh_ky();
  IF v_first <> 1 THEN
    RAISE EXCEPTION 'TEST3 FAIL: kỳ mới tạo % phiếu, mong đợi 1', v_first;
  END IF;

  SELECT count(*) INTO v_total FROM public.cong_viec_bao_tri
    WHERE thiet_bi_id = tb AND chinh_sach_id = cs;
  IF v_total <> 2 THEN
    RAISE EXCEPTION 'TEST3 FAIL: tổng % phiếu qua 2 kỳ, mong đợi 2', v_total;
  END IF;

  RAISE NOTICE 'cong_viec_bao_tri_idempotent: TẤT CẢ 3 test PASS';
END $$;

ROLLBACK;
