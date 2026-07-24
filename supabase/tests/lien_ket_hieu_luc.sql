-- ============================================================================
-- LIÊN KẾT HỆ THỐNG — CHUẨN HÓA HIỆU LỰC THEO THỜI GIAN + ĐỒ THỊ CÓ HƯỚNG.
-- Kiểm cấu trúc (unique theo hieu_luc_den, cột danh mục, view, RPC) và hành vi
-- (unique cho phép lịch sử; v_canh_dieu_huong sinh đúng số dòng; phân tích tác
-- động an toàn với chu trình; DU_PHONG không lan truyền).
-- Toàn bộ trong 1 transaction rồi ROLLBACK -> không để lại dữ liệu.
-- Chạy:  psql -f supabase/tests/lien_ket_hieu_luc.sql
-- ============================================================================

-- ---- (A) KIỂM CẤU TRÚC ------------------------------------------------------
DO $$
DECLARE n int;
BEGIN
  -- Unique mới theo hieu_luc_den IS NULL (không theo trang_thai nữa).
  SELECT count(*) INTO n FROM pg_indexes
  WHERE schemaname='public' AND tablename='lien_ket_he_thong'
    AND indexdef ILIKE '%UNIQUE%' AND indexdef ILIKE '%hieu_luc_den IS NULL%';
  IF n < 1 THEN RAISE EXCEPTION 'FAIL: thiếu unique index theo hieu_luc_den IS NULL'; END IF;

  -- Cột danh mục hướng + lan truyền tồn tại.
  PERFORM 1 FROM information_schema.columns
  WHERE table_name='dm_loai_lien_ket' AND column_name='co_huong';
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: thiếu dm_loai_lien_ket.co_huong'; END IF;
  PERFORM 1 FROM information_schema.columns
  WHERE table_name='dm_loai_lien_ket' AND column_name='lan_truyen_tac_dong';
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: thiếu dm_loai_lien_ket.lan_truyen_tac_dong'; END IF;

  -- View cạnh định hướng + RPC tồn tại.
  PERFORM 1 FROM pg_views WHERE schemaname='public' AND viewname='v_canh_dieu_huong';
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: thiếu view v_canh_dieu_huong'; END IF;
  PERFORM 1 FROM pg_proc WHERE proname='phan_tich_tac_dong';
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: thiếu RPC phan_tich_tac_dong'; END IF;

  -- Index tối ưu traversal tồn tại.
  PERFORM 1 FROM pg_indexes WHERE tablename='lien_ket_he_thong' AND indexname='ix_lkht_nguon_active';
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: thiếu ix_lkht_nguon_active'; END IF;
  PERFORM 1 FROM pg_indexes WHERE tablename='lien_ket_he_thong' AND indexname='ix_lkht_dich_active';
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: thiếu ix_lkht_dich_active'; END IF;

  -- Cờ danh mục đúng quy ước.
  PERFORM 1 FROM dm_loai_lien_ket WHERE ma='PHU_THUOC_DICH_VU' AND co_huong=true AND lan_truyen_tac_dong=true;
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: PHU_THUOC_DICH_VU phải co_huong=true, lan_truyen=true'; END IF;
  PERFORM 1 FROM dm_loai_lien_ket WHERE ma='DU_PHONG' AND co_huong=false AND lan_truyen_tac_dong=false;
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: DU_PHONG phải co_huong=false, lan_truyen=false'; END IF;

  RAISE NOTICE 'PASS (A): cấu trúc unique/cột/view/RPC/index/seed đầy đủ.';
END $$;

-- ---- (B) KIỂM HÀNH VI (dữ liệu tạm, rollback) -------------------------------
BEGIN;
DO $$
DECLARE
  v_a uuid; v_b uuid; v_c uuid;
  v_luong uuid; v_phuthuoc uuid; v_duphong uuid;
  n int;
BEGIN
  SELECT id INTO v_luong    FROM dm_loai_lien_ket WHERE ma='LUONG_TIN_HIEU';
  SELECT id INTO v_phuthuoc FROM dm_loai_lien_ket WHERE ma='PHU_THUOC_DICH_VU';
  SELECT id INTO v_duphong  FROM dm_loai_lien_ket WHERE ma='DU_PHONG';

  INSERT INTO dm_he_thong (ma, ten) VALUES ('T_A_'||substr(md5(random()::text),1,6),'Test A') RETURNING id INTO v_a;
  INSERT INTO dm_he_thong (ma, ten) VALUES ('T_B_'||substr(md5(random()::text),1,6),'Test B') RETURNING id INTO v_b;
  INSERT INTO dm_he_thong (ma, ten) VALUES ('T_C_'||substr(md5(random()::text),1,6),'Test C') RETURNING id INTO v_c;

  -- (B1) UNIQUE: cạnh đang hiệu lực (hieu_luc_den IS NULL) không được trùng.
  INSERT INTO lien_ket_he_thong (he_thong_nguon_id, he_thong_dich_id, loai_lien_ket_id, lop)
    VALUES (v_a, v_b, v_luong, 'logic');
  BEGIN
    INSERT INTO lien_ket_he_thong (he_thong_nguon_id, he_thong_dich_id, loai_lien_ket_id, lop)
      VALUES (v_a, v_b, v_luong, 'logic');
    RAISE EXCEPTION 'FAIL(B1): unique không chặn trùng cạnh đang hiệu lực';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS (B1): unique chặn trùng cạnh đang hiệu lực.';
  END;

  -- (B2) LỊCH SỬ: đóng dòng cũ (set hieu_luc_den) rồi mở dòng mới -> hợp lệ.
  UPDATE lien_ket_he_thong SET hieu_luc_den = now()
    WHERE he_thong_nguon_id=v_a AND he_thong_dich_id=v_b AND loai_lien_ket_id=v_luong AND lop='logic' AND hieu_luc_den IS NULL;
  INSERT INTO lien_ket_he_thong (he_thong_nguon_id, he_thong_dich_id, loai_lien_ket_id, lop)
    VALUES (v_a, v_b, v_luong, 'logic');
  SELECT count(*) INTO n FROM lien_ket_he_thong
    WHERE he_thong_nguon_id=v_a AND he_thong_dich_id=v_b AND loai_lien_ket_id=v_luong AND lop='logic';
  IF n <> 2 THEN RAISE EXCEPTION 'FAIL(B2): kỳ vọng 2 dòng lịch sử, có %', n; END IF;
  RAISE NOTICE 'PASS (B2): cho phép nhiều dòng lịch sử (đã đóng hiệu lực).';

  -- (B3) v_canh_dieu_huong: cạnh 2 chiều (LUONG co_huong=false) -> 2 dòng.
  SELECT count(*) INTO n FROM v_canh_dieu_huong c
    WHERE (c.tu=v_a AND c.den=v_b) OR (c.tu=v_b AND c.den=v_a);
  IF n <> 2 THEN RAISE EXCEPTION 'FAIL(B3): cạnh 2 chiều kỳ vọng 2 dòng, có %', n; END IF;
  RAISE NOTICE 'PASS (B3): cạnh 2 chiều sinh đúng 2 dòng.';

  -- (B4) v_canh_dieu_huong: cạnh CÓ HƯỚNG (PHU_THUOC_DICH_VU) -> 1 dòng.
  INSERT INTO lien_ket_he_thong (he_thong_nguon_id, he_thong_dich_id, loai_lien_ket_id, lop)
    VALUES (v_b, v_c, v_phuthuoc, 'logic');
  SELECT count(*) INTO n FROM v_canh_dieu_huong c WHERE c.tu=v_b AND c.den=v_c AND c.loai_ma='PHU_THUOC_DICH_VU';
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL(B4): cạnh có hướng kỳ vọng 1 dòng, có %', n; END IF;
  SELECT count(*) INTO n FROM v_canh_dieu_huong c WHERE c.tu=v_c AND c.den=v_b AND c.loai_ma='PHU_THUOC_DICH_VU';
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL(B4): cạnh có hướng không được sinh dòng ngược, có %', n; END IF;
  RAISE NOTICE 'PASS (B4): cạnh có hướng sinh đúng 1 dòng.';

  -- (B5) CHU TRÌNH A<->B: phan_tich_tac_dong không lặp vô hạn, trả đúng tập.
  --       Từ B: B->A (2 chiều), A->? (A->B đã đóng lịch sử; A còn cạnh tới B qua dòng mới)
  --       => bị ảnh hưởng gồm A (và B->C phụ thuộc). Kiểm không lỗi + có A.
  SELECT count(*) INTO n FROM phan_tich_tac_dong(v_a);
  RAISE NOTICE 'INFO: phan_tich_tac_dong(A) trả % hệ thống (không treo).', n;
  PERFORM 1 FROM phan_tich_tac_dong(v_a) WHERE he_thong_id = v_b;
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL(B5): A hỏng phải ảnh hưởng B'; END IF;
  -- B->C là PHU_THUOC_DICH_VU (nguồn B cung cấp, đích C phụ thuộc) => C bị ảnh hưởng khi B hỏng.
  PERFORM 1 FROM phan_tich_tac_dong(v_b) WHERE he_thong_id = v_c;
  IF NOT FOUND THEN RAISE EXCEPTION 'FAIL(B5): B hỏng phải ảnh hưởng C (phụ thuộc dịch vụ)'; END IF;
  RAISE NOTICE 'PASS (B5): phân tích tác động an toàn với chu trình + đúng tập.';

  -- (B6) DU_PHONG (lan_truyen=false) không lan truyền tác động.
  INSERT INTO lien_ket_he_thong (he_thong_nguon_id, he_thong_dich_id, loai_lien_ket_id, lop)
    VALUES (v_c, v_a, v_duphong, 'logic');
  PERFORM 1 FROM phan_tich_tac_dong(v_c) WHERE he_thong_id = v_a;
  IF FOUND THEN RAISE EXCEPTION 'FAIL(B6): cạnh DU_PHONG không được lan truyền'; END IF;
  RAISE NOTICE 'PASS (B6): DU_PHONG không lan truyền tác động.';

  RAISE NOTICE 'PASS (B): toàn bộ hành vi đúng.';
END $$;
ROLLBACK;
