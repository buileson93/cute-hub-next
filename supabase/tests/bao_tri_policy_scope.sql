-- ============================================================================
-- Kiểm thử SCOPE chính sách bảo dưỡng + GHIM template_version vào phiếu.
--
-- Kịch bản AWOS PLK: một hệ thống AWOS có BA chính sách bảo dưỡng theo chu kỳ
--   • TUẦN   (7 ngày)   → mẫu/phiên bản riêng
--   • THÁNG  (30 ngày)  → mẫu/phiên bản riêng
--   • 6 THÁNG(180 ngày) → mẫu/phiên bản riêng
-- Tất cả cùng phạm vi (he_thong_id = AWOS). Mỗi chính sách sinh ĐÚNG một phiếu
-- và mỗi phiếu GHIM đúng template_version_id của chính sách.
--
-- Bao phủ:
--   • TEST 1 — Sinh đúng 3 phiếu (tuần/tháng/6 tháng) cho hệ thống AWOS.
--   • TEST 2 — Mỗi phiếu ghim đúng template_version_id theo chính sách.
--   • TEST 3 — Chạy scheduler LẦN HAI không sinh thêm phiếu (idempotent).
--   • TEST 4 — Scope: thiết bị hệ thống KHÁC không sinh phiếu từ policy AWOS.
--
-- Chạy: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/bao_tri_policy_scope.sql
-- Toàn bộ trong 1 giao dịch + ROLLBACK ở cuối -> KHÔNG để lại dữ liệu.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  ht_awos uuid;
  ht_khac uuid;
  ltb uuid;
  tb_awos uuid;
  tb_khac uuid;
  tpl uuid;
  ver_tuan uuid;
  ver_thang uuid;
  ver_6thang uuid;
  cs_tuan uuid;
  cs_thang uuid;
  cs_6thang uuid;
  v_first integer;
  v_second integer;
  v_total bigint;
  v_ver uuid;
BEGIN
  -- Ngữ cảnh đăng nhập = persona admin (khớp fixtures rls_cross_unit.sql)
  PERFORM set_config(
    'request.jwt.claims',
    '{"sub":"3e4602f3-a947-4fe0-81c3-bf16bf3a5da7","role":"authenticated"}',
    true
  );

  -- ---- Seed hệ thống AWOS + hệ thống khác + thiết bị ----
  INSERT INTO public.dm_he_thong(ma, ten)
    VALUES ('TST_AWOS_PLK', 'AWOS Pleiku (test)') RETURNING id INTO ht_awos;
  INSERT INTO public.dm_he_thong(ma, ten)
    VALUES ('TST_HT_KHAC', 'Hệ thống khác (test)') RETURNING id INTO ht_khac;

  INSERT INTO public.dm_loai_thiet_bi(ma, ten, thu_tu)
    VALUES ('TST_LTB_SCOPE', 'Loại TB scope', 1) RETURNING id INTO ltb;

  INSERT INTO public.thiet_bi(ma_thiet_bi, ten_thiet_bi, loai_thiet_bi_id, he_thong_id, ngay_bao_tri_ke_tiep)
    VALUES ('TST_TB_AWOS', 'Cảm biến AWOS', ltb, ht_awos, CURRENT_DATE) RETURNING id INTO tb_awos;
  INSERT INTO public.thiet_bi(ma_thiet_bi, ten_thiet_bi, loai_thiet_bi_id, he_thong_id, ngay_bao_tri_ke_tiep)
    VALUES ('TST_TB_KHAC', 'TB hệ thống khác', ltb, ht_khac, CURRENT_DATE) RETURNING id INTO tb_khac;

  -- ---- Seed mẫu biên bản + 3 phiên bản (tuần/tháng/6 tháng) ----
  INSERT INTO public.form_template(code, ten) VALUES ('TST_AWOS_FORM', 'Biên bản AWOS') RETURNING id INTO tpl;
  INSERT INTO public.form_template_version(template_id, version, status)
    VALUES (tpl, 101, 'published') RETURNING id INTO ver_tuan;
  INSERT INTO public.form_template_version(template_id, version, status)
    VALUES (tpl, 102, 'published') RETURNING id INTO ver_thang;
  INSERT INTO public.form_template_version(template_id, version, status)
    VALUES (tpl, 103, 'published') RETURNING id INTO ver_6thang;

  -- ---- Seed 3 chính sách bảo dưỡng cùng scope hệ thống AWOS ----
  INSERT INTO public.bao_tri_chinh_sach(ten, he_thong_id, template_version_id, active, chu_ky_ngay, canh_bao_truoc_ngay)
    VALUES ('AWOS - Tuần',   ht_awos, ver_tuan,   true, 7,   7) RETURNING id INTO cs_tuan;
  INSERT INTO public.bao_tri_chinh_sach(ten, he_thong_id, template_version_id, active, chu_ky_ngay, canh_bao_truoc_ngay)
    VALUES ('AWOS - Tháng',  ht_awos, ver_thang,  true, 30,  7) RETURNING id INTO cs_thang;
  INSERT INTO public.bao_tri_chinh_sach(ten, he_thong_id, template_version_id, active, chu_ky_ngay, canh_bao_truoc_ngay)
    VALUES ('AWOS - 6 tháng',ht_awos, ver_6thang, true, 180, 7) RETURNING id INTO cs_6thang;

  -- ---- TEST 1: sinh đúng 3 phiếu (tuần/tháng/6 tháng) ----
  SELECT so_phieu_tao INTO v_first FROM public.tao_cong_viec_bao_tri_dinh_ky();
  IF v_first <> 3 THEN
    RAISE EXCEPTION 'TEST1 FAIL: lần 1 tạo % phiếu, mong đợi 3 (tuần/tháng/6 tháng)', v_first;
  END IF;

  SELECT count(*) INTO v_total FROM public.cong_viec_bao_tri
    WHERE thiet_bi_id = tb_awos AND chinh_sach_id IN (cs_tuan, cs_thang, cs_6thang);
  IF v_total <> 3 THEN
    RAISE EXCEPTION 'TEST1 FAIL: tổng % phiếu cho AWOS, mong đợi 3', v_total;
  END IF;

  -- ---- TEST 2: mỗi phiếu ghim đúng template_version_id theo chính sách ----
  SELECT template_version_id INTO v_ver FROM public.cong_viec_bao_tri
    WHERE thiet_bi_id = tb_awos AND chinh_sach_id = cs_tuan;
  IF v_ver IS DISTINCT FROM ver_tuan THEN
    RAISE EXCEPTION 'TEST2 FAIL: phiếu TUẦN ghim version % , mong đợi %', v_ver, ver_tuan;
  END IF;

  SELECT template_version_id INTO v_ver FROM public.cong_viec_bao_tri
    WHERE thiet_bi_id = tb_awos AND chinh_sach_id = cs_thang;
  IF v_ver IS DISTINCT FROM ver_thang THEN
    RAISE EXCEPTION 'TEST2 FAIL: phiếu THÁNG ghim version % , mong đợi %', v_ver, ver_thang;
  END IF;

  SELECT template_version_id INTO v_ver FROM public.cong_viec_bao_tri
    WHERE thiet_bi_id = tb_awos AND chinh_sach_id = cs_6thang;
  IF v_ver IS DISTINCT FROM ver_6thang THEN
    RAISE EXCEPTION 'TEST2 FAIL: phiếu 6 THÁNG ghim version % , mong đợi %', v_ver, ver_6thang;
  END IF;

  -- ---- TEST 3: chạy lần hai không sinh thêm (idempotent) ----
  SELECT so_phieu_tao INTO v_second FROM public.tao_cong_viec_bao_tri_dinh_ky();
  IF v_second <> 0 THEN
    RAISE EXCEPTION 'TEST3 FAIL: lần 2 tạo % phiếu, mong đợi 0 (idempotent)', v_second;
  END IF;

  -- ---- TEST 4: scope — thiết bị hệ thống KHÁC không dính policy AWOS ----
  SELECT count(*) INTO v_total FROM public.cong_viec_bao_tri
    WHERE thiet_bi_id = tb_khac;
  IF v_total <> 0 THEN
    RAISE EXCEPTION 'TEST4 FAIL: thiết bị hệ thống khác tạo % phiếu, mong đợi 0 (scope sai)', v_total;
  END IF;

  RAISE NOTICE 'bao_tri_policy_scope: TẤT CẢ 4 test PASS';
END $$;

ROLLBACK;
