-- ============================================================================
-- Kiểm thử trigger đồng bộ taxonomy: Phân loại → Nhóm → Hệ thống → Thiết bị.
--
-- Bao phủ:
--   • Cây chuẩn: ghi đúng khóa cha → giữ nguyên.
--   • Tổ hợp FK sai (dm_he_thong.phan_loai_id lệch nhóm) → trigger sửa theo nhóm.
--   • Tổ hợp FK sai (thiet_bi.nhom/phan_loai lệch hệ thống) → trigger sửa theo hệ thống.
--   • Legacy: thiết bị chưa gán hệ thống → không bị đụng khóa hiện có.
--
-- Chạy: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/taxonomy_invariant.sql
-- Toàn bộ trong 1 giao dịch + ROLLBACK ở cuối -> KHÔNG để lại dữ liệu.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  pl_a uuid; pl_b uuid;
  nh_1 uuid; nh_2 uuid;
  ht_1 uuid; ht_bad uuid;
  tb_ok uuid; tb_bad uuid; tb_legacy uuid;
  v_pl uuid; v_nh uuid;
BEGIN
  -- ---- Seed phân loại + nhóm (cây chuẩn PL_A ⊃ NH_1, PL_B ⊃ NH_2) ----
  INSERT INTO public.dm_phan_loai(ma,ten,thu_tu) VALUES ('TST_PLA','PL A',1) RETURNING id INTO pl_a;
  INSERT INTO public.dm_phan_loai(ma,ten,thu_tu) VALUES ('TST_PLB','PL B',2) RETURNING id INTO pl_b;
  INSERT INTO public.dm_nhom_he_thong(ma,ten,phan_loai_id,thu_tu) VALUES ('TST_NH1','NH 1',pl_a,1) RETURNING id INTO nh_1;
  INSERT INTO public.dm_nhom_he_thong(ma,ten,phan_loai_id,thu_tu) VALUES ('TST_NH2','NH 2',pl_b,2) RETURNING id INTO nh_2;

  -- ---- TEST 1: dm_he_thong gán phan_loai_id LỆCH nhóm → trigger sửa theo nhóm ----
  INSERT INTO public.dm_he_thong(ma,ten,thu_tu,nhom_he_thong_id,phan_loai_id)
    VALUES ('TST_HTBAD','HT sai',1,nh_1,pl_b) RETURNING id INTO ht_bad;
  SELECT phan_loai_id INTO v_pl FROM public.dm_he_thong WHERE id = ht_bad;
  IF v_pl <> pl_a THEN
    RAISE EXCEPTION 'TEST1 FAIL: dm_he_thong.phan_loai_id=% mong đợi % (theo nhóm)', v_pl, pl_a;
  END IF;

  -- ---- TEST 2: cây chuẩn giữ nguyên ----
  INSERT INTO public.dm_he_thong(ma,ten,thu_tu,nhom_he_thong_id,phan_loai_id)
    VALUES ('TST_HT1','HT 1',1,nh_1,pl_a) RETURNING id INTO ht_1;
  SELECT phan_loai_id INTO v_pl FROM public.dm_he_thong WHERE id = ht_1;
  IF v_pl <> pl_a THEN RAISE EXCEPTION 'TEST2 FAIL: cây chuẩn bị đổi phan_loai_id=%', v_pl; END IF;

  -- ---- TEST 3: thiet_bi gán nhom/phan_loai LỆCH hệ thống → trigger sửa theo hệ thống ----
  INSERT INTO public.thiet_bi(ma_thiet_bi,ten_thiet_bi,he_thong_id,nhom_he_thong_id,phan_loai_id)
    VALUES ('TST_TBBAD','TB sai',ht_1,nh_2,pl_b) RETURNING id INTO tb_bad;
  SELECT nhom_he_thong_id, phan_loai_id INTO v_nh, v_pl FROM public.thiet_bi WHERE id = tb_bad;
  IF v_nh <> nh_1 THEN RAISE EXCEPTION 'TEST3 FAIL: thiet_bi.nhom=% mong đợi %', v_nh, nh_1; END IF;
  IF v_pl <> pl_a THEN RAISE EXCEPTION 'TEST3 FAIL: thiet_bi.phan_loai=% mong đợi %', v_pl, pl_a; END IF;

  -- ---- TEST 4: thiet_bi chưa gán khóa → trigger tự điền từ hệ thống ----
  INSERT INTO public.thiet_bi(ma_thiet_bi,ten_thiet_bi,he_thong_id)
    VALUES ('TST_TBOK','TB ok',ht_1) RETURNING id INTO tb_ok;
  SELECT nhom_he_thong_id, phan_loai_id INTO v_nh, v_pl FROM public.thiet_bi WHERE id = tb_ok;
  IF v_nh <> nh_1 OR v_pl <> pl_a THEN
    RAISE EXCEPTION 'TEST4 FAIL: TB chưa gán khóa không được điền (nhom=%, pl=%)', v_nh, v_pl;
  END IF;

  -- ---- TEST 5: legacy — thiết bị KHÔNG gán hệ thống → giữ nguyên khóa tự khai ----
  INSERT INTO public.thiet_bi(ma_thiet_bi,ten_thiet_bi,he_thong_id,nhom_he_thong_id,phan_loai_id)
    VALUES ('TST_TBLEG','TB legacy',NULL,nh_2,pl_b) RETURNING id INTO tb_legacy;
  SELECT nhom_he_thong_id, phan_loai_id INTO v_nh, v_pl FROM public.thiet_bi WHERE id = tb_legacy;
  IF v_nh <> nh_2 OR v_pl <> pl_b THEN
    RAISE EXCEPTION 'TEST5 FAIL: legacy bị đụng khóa (nhom=%, pl=%)', v_nh, v_pl;
  END IF;

  -- ---- TEST 6: UPDATE he_thong_id → khóa dẫn xuất theo hệ thống mới ----
  INSERT INTO public.dm_he_thong(ma,ten,thu_tu,nhom_he_thong_id,phan_loai_id)
    VALUES ('TST_HT2','HT 2',2,nh_2,pl_b) RETURNING id INTO ht_bad; -- tái dùng biến
  UPDATE public.thiet_bi SET he_thong_id = ht_bad WHERE id = tb_ok;
  SELECT nhom_he_thong_id, phan_loai_id INTO v_nh, v_pl FROM public.thiet_bi WHERE id = tb_ok;
  IF v_nh <> nh_2 OR v_pl <> pl_b THEN
    RAISE EXCEPTION 'TEST6 FAIL: đổi hệ thống nhưng khóa không đồng bộ (nhom=%, pl=%)', v_nh, v_pl;
  END IF;

  RAISE NOTICE 'taxonomy_invariant: TẤT CẢ 6 test PASS';
END $$;

ROLLBACK;
