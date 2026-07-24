-- ============================================================================
-- Kiểm thử GIAO DỊCH hoàn thành phiếu công việc bảo dưỡng.
--   hoan_thanh_cong_viec_bao_tri(_id, _bao_tri_id, _form_submission_id)
--
-- Bao phủ:
--   A — Chuyển trạng thái MO -> HOAN_THANH + ngày hoàn thành + kỳ kế tiếp.
--   B — Chặn hoàn thành LẠI phiếu đã đóng.
--   C — Liên kết biên bản (bao_tri + form_submission); biên bản sai thiết bị bị chặn.
--   D — KPI (v_kpi_bao_tri) phản ánh hoàn thành đúng hạn theo đơn vị.
--   E — Chỉ đúng vai trò (admin/phong_kt) được thao tác; ktv bị từ chối.
--   F — Lỗi giữa chừng phải ROLLBACK toàn bộ (nguyên tử một lời gọi hàm).
--
-- Chạy: psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 \
--          -f supabase/tests/cong_viec_hoan_thanh_transaction.sql
-- Toàn bộ nằm trong 1 giao dịch + ROLLBACK ở cuối -> KHÔNG để lại dữ liệu.
-- Personas khớp fixtures rls_cross_unit.sql:
--   admin 3e4602f3-...  |  ktv 89dc7793-...
-- ============================================================================
\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  admin_uid constant uuid := '3e4602f3-a947-4fe0-81c3-bf16bf3a5da7';
  ktv_uid   constant uuid := '89dc7793-8373-47db-94c0-89d721efd107';
  dv    uuid;
  ltb   uuid;
  tb    uuid;   -- thiết bị chính
  tb2   uuid;   -- thiết bị khác (cho biên bản sai)
  cs    uuid;
  cs_big uuid;
  cv    uuid;   -- phiếu test A/B/D
  cv2   uuid;   -- phiếu test C (biên bản)
  cv3   uuid;   -- phiếu test E (role)
  cv4   uuid;   -- phiếu test F (atomic)
  bt    uuid;   -- biên bản đúng thiết bị
  bt_wrong uuid; -- biên bản sai thiết bị
  ft    uuid;   -- form template
  fs    uuid;   -- form submission (biên bản)
  v_tt  text;
  v_ngay date;
  v_ketiep date;
  v_gannhat date;
  v_link uuid;
  v_fs_link uuid;
  v_done bigint;
  v_dunghan bigint;
  v_err boolean;
BEGIN
  PERFORM set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', admin_uid), true);

  -- ---------------- Seed ----------------
  INSERT INTO public.dm_don_vi(ma, ten, thu_tu) VALUES ('TST_DV_HT', 'ĐV test hoàn thành', 1)
    RETURNING id INTO dv;
  INSERT INTO public.dm_loai_thiet_bi(ma, ten, thu_tu) VALUES ('TST_LTB_HT', 'Loại TB', 1)
    RETURNING id INTO ltb;
  INSERT INTO public.thiet_bi(ma_thiet_bi, ten_thiet_bi, loai_thiet_bi_id, don_vi_quan_ly_id, ngay_bao_tri_ke_tiep)
    VALUES ('TST_TB_HT', 'TB test', ltb, dv, CURRENT_DATE) RETURNING id INTO tb;
  INSERT INTO public.thiet_bi(ma_thiet_bi, ten_thiet_bi, loai_thiet_bi_id, don_vi_quan_ly_id)
    VALUES ('TST_TB_HT2', 'TB khác', ltb, dv) RETURNING id INTO tb2;
  INSERT INTO public.bao_tri_chinh_sach(ten, loai_thiet_bi_id, active, chu_ky_ngay, canh_bao_truoc_ngay)
    VALUES ('CS test', ltb, true, 30, 7) RETURNING id INTO cs;

  INSERT INTO public.bao_tri(thiet_bi_id, trang_thai) VALUES (tb, 'Hoàn thành') RETURNING id INTO bt;
  INSERT INTO public.bao_tri(thiet_bi_id, trang_thai) VALUES (tb2, 'Hoàn thành') RETURNING id INTO bt_wrong;

  INSERT INTO public.form_template(code, ten) VALUES ('TST_FT_HT', 'Mẫu biên bản') RETURNING id INTO ft;
  INSERT INTO public.form_submission(template_id, template_code, template_version, status, data)
    VALUES (ft, 'TST_FT_HT', 1, 'submitted', '{}'::jsonb) RETURNING id INTO fs;

  -- ================= TEST A: trạng thái + ngày + kỳ kế tiếp =================
  INSERT INTO public.cong_viec_bao_tri(thiet_bi_id, chinh_sach_id, loai, trang_thai, ngay_den_han, ky_han)
    VALUES (tb, cs, 'PM', 'MO', CURRENT_DATE, CURRENT_DATE) RETURNING id INTO cv;

  PERFORM public.hoan_thanh_cong_viec_bao_tri(cv);

  SELECT trang_thai, ngay_hoan_thanh INTO v_tt, v_ngay FROM public.cong_viec_bao_tri WHERE id = cv;
  IF v_tt <> 'HOAN_THANH' THEN RAISE EXCEPTION 'A FAIL: trạng thái = %, mong HOAN_THANH', v_tt; END IF;
  IF v_ngay <> CURRENT_DATE THEN RAISE EXCEPTION 'A FAIL: ngày hoàn thành = %, mong hôm nay', v_ngay; END IF;

  SELECT ngay_bao_tri_ke_tiep, ngay_bao_tri_gan_nhat INTO v_ketiep, v_gannhat FROM public.thiet_bi WHERE id = tb;
  IF v_ketiep <> CURRENT_DATE + 30 THEN RAISE EXCEPTION 'A FAIL: kỳ kế tiếp = %, mong %', v_ketiep, CURRENT_DATE + 30; END IF;
  IF v_gannhat <> CURRENT_DATE THEN RAISE EXCEPTION 'A FAIL: ngày gần nhất = %', v_gannhat; END IF;

  -- ================= TEST B: chặn hoàn thành lại =================
  v_err := false;
  BEGIN
    PERFORM public.hoan_thanh_cong_viec_bao_tri(cv);
  EXCEPTION WHEN OTHERS THEN v_err := true;
  END;
  IF NOT v_err THEN RAISE EXCEPTION 'B FAIL: hoàn thành lại phiếu đã đóng KHÔNG bị chặn'; END IF;

  -- ================= TEST C: liên kết biên bản =================
  INSERT INTO public.cong_viec_bao_tri(thiet_bi_id, chinh_sach_id, loai, trang_thai, ngay_den_han, ky_han)
    VALUES (tb, cs, 'CM', 'DANG_LAM', CURRENT_DATE, NULL) RETURNING id INTO cv2;

  -- C1: biên bản SAI thiết bị -> lỗi + phiếu KHÔNG đổi (nguyên tử)
  v_err := false;
  BEGIN
    PERFORM public.hoan_thanh_cong_viec_bao_tri(cv2, bt_wrong);
  EXCEPTION WHEN OTHERS THEN v_err := true;
  END;
  IF NOT v_err THEN RAISE EXCEPTION 'C1 FAIL: biên bản sai thiết bị KHÔNG bị chặn'; END IF;
  SELECT trang_thai INTO v_tt FROM public.cong_viec_bao_tri WHERE id = cv2;
  IF v_tt <> 'DANG_LAM' THEN RAISE EXCEPTION 'C1 FAIL: phiếu bị đổi sang % dù lỗi (không rollback)', v_tt; END IF;

  -- C2: form_submission không tồn tại -> lỗi
  v_err := false;
  BEGIN
    PERFORM public.hoan_thanh_cong_viec_bao_tri(cv2, bt, gen_random_uuid());
  EXCEPTION WHEN OTHERS THEN v_err := true;
  END;
  IF NOT v_err THEN RAISE EXCEPTION 'C2 FAIL: form_submission không tồn tại KHÔNG bị chặn'; END IF;

  -- C3: biên bản ĐÚNG + form_submission hợp lệ -> liên kết đầy đủ
  PERFORM public.hoan_thanh_cong_viec_bao_tri(cv2, bt, fs);
  SELECT bao_tri_id INTO v_link FROM public.cong_viec_bao_tri WHERE id = cv2;
  IF v_link IS DISTINCT FROM bt THEN RAISE EXCEPTION 'C3 FAIL: bao_tri_id chưa liên kết (%), mong %', v_link, bt; END IF;
  SELECT form_submission_id INTO v_fs_link FROM public.bao_tri WHERE id = bt;
  IF v_fs_link IS DISTINCT FROM fs THEN RAISE EXCEPTION 'C3 FAIL: form_submission chưa gắn vào biên bản'; END IF;

  -- ================= TEST D: KPI theo đơn vị =================
  SELECT da_hoan_thanh, hoan_thanh_dung_han INTO v_done, v_dunghan
    FROM public.v_kpi_bao_tri WHERE don_vi_id = dv;
  IF v_done < 2 THEN RAISE EXCEPTION 'D FAIL: KPI da_hoan_thanh = %, mong >=2', v_done; END IF;
  IF v_dunghan < 2 THEN RAISE EXCEPTION 'D FAIL: KPI hoàn thành đúng hạn = %, mong >=2', v_dunghan; END IF;

  -- ================= TEST E: quyền vai trò (ktv bị từ chối) =================
  INSERT INTO public.cong_viec_bao_tri(thiet_bi_id, chinh_sach_id, loai, trang_thai, ngay_den_han, ky_han)
    VALUES (tb, cs, 'PM', 'MO', CURRENT_DATE, CURRENT_DATE + 60) RETURNING id INTO cv3;
  PERFORM set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', ktv_uid), true);
  v_err := false;
  BEGIN
    PERFORM public.hoan_thanh_cong_viec_bao_tri(cv3);
  EXCEPTION WHEN OTHERS THEN v_err := true;
  END;
  IF NOT v_err THEN RAISE EXCEPTION 'E FAIL: ktv hoàn thành phiếu KHÔNG bị từ chối'; END IF;
  SELECT trang_thai INTO v_tt FROM public.cong_viec_bao_tri WHERE id = cv3;
  IF v_tt <> 'MO' THEN RAISE EXCEPTION 'E FAIL: phiếu bị đổi sang % bởi ktv', v_tt; END IF;

  -- Trở lại admin cho test F
  PERFORM set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', admin_uid), true);

  -- ================= TEST F: lỗi giữa chừng -> ROLLBACK nguyên tử =================
  -- Dùng chính sách có chu kỳ tràn số (date out of range) để bước CUỐI của RPC
  -- (UPDATE thiet_bi.ngay_bao_tri_ke_tiep = CURRENT_DATE + chu_ky) thất bại,
  -- chứng minh UPDATE cong_viec (bước TRƯỚC đó) cũng bị hoàn tác.
  INSERT INTO public.bao_tri_chinh_sach(ten, loai_thiet_bi_id, active, chu_ky_ngay, canh_bao_truoc_ngay)
    VALUES ('CS tràn số', ltb, true, 2147483647, 7) RETURNING id INTO cs_big;
  INSERT INTO public.cong_viec_bao_tri(thiet_bi_id, chinh_sach_id, loai, trang_thai, ngay_den_han, ky_han)
    VALUES (tb, cs_big, 'PM', 'MO', CURRENT_DATE, CURRENT_DATE + 90) RETURNING id INTO cv4;

  v_err := false;
  BEGIN
    PERFORM public.hoan_thanh_cong_viec_bao_tri(cv4);
  EXCEPTION WHEN OTHERS THEN v_err := true;
  END;


  IF NOT v_err THEN RAISE EXCEPTION 'F FAIL: lỗi giữa chừng KHÔNG được kích hoạt'; END IF;
  SELECT trang_thai, ngay_hoan_thanh INTO v_tt, v_ngay FROM public.cong_viec_bao_tri WHERE id = cv4;
  IF v_tt <> 'MO' OR v_ngay IS NOT NULL THEN
    RAISE EXCEPTION 'F FAIL: phiếu KHÔNG rollback (trạng thái=%, ngày=%)', v_tt, v_ngay;
  END IF;

  RAISE NOTICE 'cong_viec_hoan_thanh_transaction: TẤT CẢ test A-F PASS';
END $$;

ROLLBACK;
