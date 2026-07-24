-- ============================================================================
-- Kiểm thử mẫu dạng BẢNG KIỂM (checklist): form_section, form_check_item,
-- form_submission_item_result.
--
-- Bao phủ:
--   • TEST 1 — item_code UNIQUE trong 1 mẫu (version) → chèn trùng bị chặn.
--   • TEST 2 — KHÔNG ĐẠT bắt buộc HÀNH ĐỘNG (CHECK chặn khi thiếu).
--   • TEST 3 — Không đạt + có hành động ⇒ chèn được.
--   • TEST 4 — gia_tri_so lưu dạng SỐ (numeric), không phải chuỗi.
--
-- Chạy: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/form_checklist.sql
-- Toàn bộ trong 1 giao dịch + ROLLBACK ở cuối → KHÔNG để lại dữ liệu.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  tpl uuid;
  sec uuid;
  sub uuid;
  v_err boolean;
  v_num numeric;
  v_type text;
BEGIN
  -- ---- Seed mẫu + section "Cảm biến" ----
  INSERT INTO public.form_template(code, ten, nhom, active, version)
    VALUES ('TEST-CHK-01', 'Mẫu kiểm thử checklist', 'bao_duong', true, 1)
    RETURNING id INTO tpl;

  INSERT INTO public.form_section(template_id, ma_section, ten, position)
    VALUES (tpl, 'CB', 'Cảm biến', 0)
    RETURNING id INTO sec;

  INSERT INTO public.form_check_item(section_id, template_id, item_code, ten, result_kind, don_vi, tieu_chuan, position)
    VALUES (sec, tpl, 'CB-DIEN-AP', 'Điện áp cảm biến', 'so', 'V', '4.5-5.5', 0);

  -- ---- TEST 1: item_code trùng trong cùng mẫu bị chặn ----
  v_err := false;
  BEGIN
    INSERT INTO public.form_check_item(section_id, template_id, item_code, ten, result_kind, position)
      VALUES (sec, tpl, 'CB-DIEN-AP', 'Trùng mã', 'text', 1);
  EXCEPTION WHEN unique_violation THEN
    v_err := true;
  END;
  IF NOT v_err THEN RAISE EXCEPTION 'TEST 1 FAIL: item_code trùng lẽ ra phải bị chặn'; END IF;
  RAISE NOTICE 'TEST 1 PASS: item_code unique trong version';

  -- ---- Seed 1 phiếu ----
  INSERT INTO public.form_submission(template_id, template_code, status, data)
    VALUES (tpl, 'TEST-CHK-01', 'submitted', '{}'::jsonb)
    RETURNING id INTO sub;

  -- ---- TEST 2: Không đạt mà thiếu hành động bị CHECK chặn ----
  v_err := false;
  BEGIN
    INSERT INTO public.form_submission_item_result(submission_id, section_code, item_code, ten, result_kind, ket_qua)
      VALUES (sub, 'CB', 'CB-DIEN-AP', 'Điện áp cảm biến', 'so', 'khong_dat');
  EXCEPTION WHEN check_violation THEN
    v_err := true;
  END;
  IF NOT v_err THEN RAISE EXCEPTION 'TEST 2 FAIL: Không đạt thiếu hành động lẽ ra bị chặn'; END IF;
  RAISE NOTICE 'TEST 2 PASS: Không đạt bắt buộc hành động';

  -- ---- TEST 3 + 4: Không đạt + hành động + giá trị số ----
  INSERT INTO public.form_submission_item_result(submission_id, section_code, item_code, ten, result_kind, gia_tri_so, don_vi, ket_qua, hanh_dong)
    VALUES (sub, 'CB', 'CB-DIEN-AP', 'Điện áp cảm biến', 'so', 5.2, 'V', 'khong_dat', 'Thay cảm biến');

  SELECT gia_tri_so INTO v_num FROM public.form_submission_item_result WHERE submission_id = sub;
  IF v_num IS DISTINCT FROM 5.2 THEN RAISE EXCEPTION 'TEST 4 FAIL: gia_tri_so sai (%).', v_num; END IF;

  SELECT data_type INTO v_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='form_submission_item_result' AND column_name='gia_tri_so';
  IF v_type <> 'numeric' THEN RAISE EXCEPTION 'TEST 4 FAIL: gia_tri_so không phải numeric (%).', v_type; END IF;
  RAISE NOTICE 'TEST 3 PASS: Không đạt + hành động chèn được';
  RAISE NOTICE 'TEST 4 PASS: gia_tri_so lưu dạng numeric = %', v_num;

  RAISE NOTICE 'ALL CHECKLIST TESTS PASSED';
END $$;

ROLLBACK;
