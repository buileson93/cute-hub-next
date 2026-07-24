-- ============================================================================
-- MÔ HÌNH 3 LỚP THIẾT BỊ — Bất biến VỊ TRÍ CHỨC NĂNG & LỊCH SỬ LẮP ĐẶT.
-- Kiểm cả cấu trúc (index/RPC tồn tại) lẫn hành vi (trigger + partial unique).
-- Toàn bộ chạy trong 1 transaction rồi ROLLBACK -> không để lại dữ liệu.
-- Chạy:  psql -f supabase/tests/gan_chuc_nang_invariants.sql
-- ============================================================================

-- ---- (A) KIỂM CẤU TRÚC ------------------------------------------------------
DO $$
DECLARE n int;
BEGIN
  -- 2 partial unique index chống trùng dòng hiệu lực.
  SELECT count(*) INTO n FROM pg_indexes
  WHERE schemaname='public' AND tablename='gan_chuc_nang'
    AND indexdef ILIKE '%UNIQUE%' AND indexdef ILIKE '%den_ngay IS NULL%';
  IF n < 2 THEN RAISE EXCEPTION 'FAIL: thiếu partial unique index (den_ngay IS NULL), có %', n; END IF;

  -- RPC nghiệp vụ tồn tại.
  PERFORM 1 FROM pg_proc WHERE proname='lap_thiet_bi';        IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: thiếu lap_thiet_bi'; END IF;
  PERFORM 1 FROM pg_proc WHERE proname='thao_thiet_bi';       IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: thiếu thao_thiet_bi'; END IF;
  PERFORM 1 FROM pg_proc WHERE proname='thay_the_thiet_bi';   IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: thiếu thay_the_thiet_bi'; END IF;
  PERFORM 1 FROM pg_proc WHERE proname='dieu_chuyen';         IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: thiếu dieu_chuyen'; END IF;
  PERFORM 1 FROM pg_proc WHERE proname='dieu_chuyen_trao';    IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: thiếu dieu_chuyen_trao'; END IF;

  -- RLS bật trên cả 2 bảng.
  PERFORM 1 FROM pg_class WHERE relname='he_thong_thanh_phan' AND relrowsecurity;
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: he_thong_thanh_phan chưa bật RLS'; END IF;
  PERFORM 1 FROM pg_class WHERE relname='gan_chuc_nang' AND relrowsecurity;
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: gan_chuc_nang chưa bật RLS'; END IF;

  RAISE NOTICE 'PASS (A): cấu trúc index/RPC/RLS đầy đủ.';
END $$;

-- ---- (B) KIỂM HÀNH VI (dữ liệu tạm, rollback) -------------------------------
BEGIN;
DO $$
DECLARE
  v_ht    uuid;
  v_loai1 uuid;
  v_loai2 uuid;
  v_tp    uuid;
  v_tp2   uuid;
  v_tb1   uuid;
  v_tb2   uuid;
  v_gan1  uuid;
  v_cache uuid;
  v_ok    boolean;
BEGIN
  -- Dữ liệu nền.
  INSERT INTO public.dm_he_thong(ma, ten) VALUES ('T-HT-INV','HT test invariant') RETURNING id INTO v_ht;
  INSERT INTO public.dm_loai_thiet_bi(ma, ten) VALUES ('T-LOAI-A','Loại A') RETURNING id INTO v_loai1;
  INSERT INTO public.dm_loai_thiet_bi(ma, ten) VALUES ('T-LOAI-B','Loại B') RETURNING id INTO v_loai2;
  INSERT INTO public.thiet_bi(ma_thiet_bi, ten_thiet_bi, loai_thiet_bi_id) VALUES ('T-TB-1','TB1', v_loai1) RETURNING id INTO v_tb1;
  INSERT INTO public.thiet_bi(ma_thiet_bi, ten_thiet_bi, loai_thiet_bi_id) VALUES ('T-TB-2','TB2', v_loai2) RETURNING id INTO v_tb2;
  INSERT INTO public.he_thong_thanh_phan(he_thong_id, ma_thanh_phan, ten, loai_thiet_bi_yeu_cau)
    VALUES (v_ht,'VT-1','Vị trí 1', v_loai1) RETURNING id INTO v_tp;
  INSERT INTO public.he_thong_thanh_phan(he_thong_id, ma_thanh_phan, ten, loai_thiet_bi_yeu_cau)
    VALUES (v_ht,'VT-2','Vị trí 2', v_loai1) RETURNING id INTO v_tp2;

  -- Gán hợp lệ đầu tiên.
  INSERT INTO public.gan_chuc_nang(thanh_phan_id, thiet_bi_id) VALUES (v_tp, v_tb1) RETURNING id INTO v_gan1;

  -- (f) AFTER trigger đồng bộ cache: thiet_bi.he_thong_id = he_thong của vị trí.
  SELECT he_thong_id INTO v_cache FROM public.thiet_bi WHERE id = v_tb1;
  IF v_cache IS DISTINCT FROM v_ht THEN RAISE EXCEPTION 'FAIL(f-sync): cache he_thong_id không được set khi gán'; END IF;

  -- (a) 2 dòng hiệu lực cùng thanh_phan_id -> lỗi partial unique.
  v_ok := false;
  BEGIN
    INSERT INTO public.thiet_bi(ma_thiet_bi, ten_thiet_bi, loai_thiet_bi_id) VALUES ('T-TB-3','TB3', v_loai1);
    INSERT INTO public.gan_chuc_nang(thanh_phan_id, thiet_bi_id)
      SELECT v_tp, id FROM public.thiet_bi WHERE ma_thiet_bi='T-TB-3';
  EXCEPTION WHEN unique_violation THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'FAIL(a): cho phép 2 thiết bị hiệu lực cùng 1 vị trí'; END IF;

  -- (b) 1 thiết bị gán 2 vị trí cùng lúc -> lỗi partial unique.
  v_ok := false;
  BEGIN
    INSERT INTO public.gan_chuc_nang(thanh_phan_id, thiet_bi_id) VALUES (v_tp2, v_tb1);
  EXCEPTION WHEN unique_violation THEN v_ok := true; END;
  IF NOT v_ok THEN RAISE EXCEPTION 'FAIL(b): cho phép 1 thiết bị giữ 2 vị trí cùng lúc'; END IF;

  -- (c) gán sai loại -> lỗi trigger.
  v_ok := false;
  BEGIN
    INSERT INTO public.gan_chuc_nang(thanh_phan_id, thiet_bi_id) VALUES (v_tp2, v_tb2);
  EXCEPTION WHEN others THEN v_ok := (SQLERRM ILIKE '%không đúng loại%'); END;
  IF NOT v_ok THEN RAISE EXCEPTION 'FAIL(c): không chặn gán sai loại thiết bị'; END IF;

  -- (e) ngừng vị trí còn thiết bị hiệu lực -> lỗi trigger.
  v_ok := false;
  BEGIN
    UPDATE public.he_thong_thanh_phan SET trang_thai='ngung' WHERE id = v_tp;
  EXCEPTION WHEN others THEN v_ok := (SQLERRM ILIKE '%tháo thiết bị trước%'); END;
  IF NOT v_ok THEN RAISE EXCEPTION 'FAIL(e): không chặn ngừng vị trí còn thiết bị'; END IF;

  -- (d) gán vào vị trí đã ngừng -> lỗi trigger. (ngừng vị trí trống v_tp2 trước)
  UPDATE public.he_thong_thanh_phan SET trang_thai='ngung' WHERE id = v_tp2;
  v_ok := false;
  BEGIN
    INSERT INTO public.gan_chuc_nang(thanh_phan_id, thiet_bi_id)
      SELECT v_tp2, id FROM public.thiet_bi WHERE ma_thiet_bi='T-TB-3';
  EXCEPTION WHEN others THEN v_ok := (SQLERRM ILIKE '%đã ngừng%'); END;
  IF NOT v_ok THEN RAISE EXCEPTION 'FAIL(d): không chặn gán vào vị trí đã ngừng'; END IF;

  -- (f) đóng dòng gán -> cache he_thong_id về NULL.
  UPDATE public.gan_chuc_nang SET den_ngay = now() WHERE id = v_gan1;
  SELECT he_thong_id INTO v_cache FROM public.thiet_bi WHERE id = v_tb1;
  IF v_cache IS NOT NULL THEN RAISE EXCEPTION 'FAIL(f-null): cache he_thong_id không về NULL khi tháo'; END IF;

  RAISE NOTICE 'PASS (B): tất cả bất biến hành vi đúng (a..f).';
END $$;
ROLLBACK;
