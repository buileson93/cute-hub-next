-- ============================================================================
-- Task 6 — Bất biến TOPOLOGY & CẢNH BÁO HẾT HẠN (kiểm bằng catalog, không tạo dữ liệu giả).
--   1. Xóa node/edge (thiet_bi_ket_noi) KHÔNG được xóa thiet_bi:
--      FK phải đi từ thiet_bi_ket_noi -> thiet_bi (ON DELETE CASCADE theo chiều
--      xóa THIẾT BỊ mới xóa kết nối), KHÔNG có chiều ngược lại.
--   2. Import topology lặp KHÔNG tạo trùng: cần unique index chống cạnh trùng.
--   3. Cảnh báo hết hạn tính theo giờ VN + có bảng log chống trùng notification.
-- Chạy:  psql -f supabase/tests/topology_expiry_invariants.sql
-- ============================================================================
DO $$
DECLARE
  n int;
BEGIN
  -- (1) FK từ thiet_bi_ket_noi tới thiet_bi tồn tại (cả hai đầu) → xóa cạnh
  --     chỉ đụng bảng kết nối, không thể xóa thiết bị.
  SELECT count(*) INTO n
  FROM pg_constraint
  WHERE conrelid = 'public.thiet_bi_ket_noi'::regclass
    AND contype = 'f'
    AND confrelid = 'public.thiet_bi'::regclass;
  IF n < 2 THEN
    RAISE EXCEPTION 'FAIL: thiet_bi_ket_noi phải tham chiếu thiet_bi ở cả hai đầu (có %)', n;
  END IF;

  -- Không có FK nào từ thiet_bi trỏ ngược về thiet_bi_ket_noi (không thể cascade
  -- xóa thiết bị khi xóa cạnh).
  SELECT count(*) INTO n
  FROM pg_constraint
  WHERE conrelid = 'public.thiet_bi'::regclass
    AND contype = 'f'
    AND confrelid = 'public.thiet_bi_ket_noi'::regclass;
  IF n <> 0 THEN
    RAISE EXCEPTION 'FAIL: thiet_bi KHÔNG được có FK trỏ về thiet_bi_ket_noi (có %)', n;
  END IF;

  -- (2) Unique index chống cạnh trùng (import lặp không tạo trùng ngay cả khi
  --     chạy song song). Khoá theo (tu, den, loai, tu_cong, den_cong).
  SELECT count(*) INTO n
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'thiet_bi_ket_noi'
    AND indexdef ILIKE '%UNIQUE%'
    AND indexdef ILIKE '%tu_thiet_bi_id%'
    AND indexdef ILIKE '%den_thiet_bi_id%';
  IF n = 0 THEN
    RAISE EXCEPTION 'FAIL: thiếu unique index chống cạnh topology trùng';
  END IF;

  -- (3a) View sắp hết hạn tính số ngày theo giờ VN (không dùng CURRENT_DATE trần).
  SELECT count(*) INTO n
  FROM pg_views
  WHERE schemaname = 'public' AND viewname = 'v_sap_het_han'
    AND definition ILIKE '%Asia/Ho_Chi_Minh%';
  IF n = 0 THEN
    RAISE EXCEPTION 'FAIL: v_sap_het_han phải tính ngày theo Asia/Ho_Chi_Minh';
  END IF;

  -- (3b) Bảng log chống trùng notification hết hạn + unique khoá.
  SELECT count(*) INTO n FROM pg_class WHERE oid = 'public.canh_bao_het_han_log'::regclass;
  IF n = 0 THEN
    RAISE EXCEPTION 'FAIL: thiếu bảng canh_bao_het_han_log';
  END IF;

  SELECT count(*) INTO n
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'canh_bao_het_han_log'
    AND indexdef ILIKE '%UNIQUE%' AND indexdef ILIKE '%khoa%';
  IF n = 0 THEN
    RAISE EXCEPTION 'FAIL: canh_bao_het_han_log cần unique index trên khoa chống trùng';
  END IF;

  -- (3c) RPC sinh cảnh báo idempotent tồn tại.
  SELECT count(*) INTO n FROM pg_proc WHERE proname = 'sinh_canh_bao_het_han';
  IF n = 0 THEN
    RAISE EXCEPTION 'FAIL: thiếu RPC sinh_canh_bao_het_han()';
  END IF;

  RAISE NOTICE 'PASS: topology & cảnh báo hết hạn — invariant đã được khoá.';
END $$;
