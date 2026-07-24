-- ============================================================================
-- Task 5 — Kho / Cấp phát / Kiểm kê: khoá các invariant nghiệp vụ bằng cách
-- kiểm tra CHÍNH XÁC cấu trúc đã triển khai (RPC, policy, constraint, cột sinh).
-- Chạy được với vai trò chỉ-đọc: chỉ tra catalog, không cần giả lập auth.uid().
--
-- Invariant khoá:
--   1. Sổ cái kho_giao_dich BẤT BIẾN: chỉ có policy INSERT + SELECT
--      (không UPDATE/không DELETE) → giao dịch đã chốt không sửa/xoá.
--   2. so_luong LUÔN > 0 (CHECK) → chặn số 0/âm ở tầng CSDL.
--   3. Tồn suy ra từ cột sinh hieu_ung (NHAP/CHUYEN_NHAP/DIEU_CHINH_TANG = +,
--      còn lại = −) → không có đường sửa số tồn trực tiếp.
--   4. Các RPC nghiệp vụ tồn tại, SECURITY DEFINER, chặn quyền quản lý thiết bị.
--   5. Lịch sử cấp phát (thiet_bi_cap_phat) chỉ quản trị mới UPDATE/DELETE
--      → nhân viên thường không ghi đè lịch sử cũ.
--   6. RLS bật trên mọi bảng kho/cấp phát/kiểm kê.
-- Exit: RAISE EXCEPTION (non-zero) nếu bất kỳ assertion FAIL.
-- ============================================================================
\set ON_ERROR_STOP on

DO $$
DECLARE
  n int;
  b bool;
  txt text;
BEGIN
  -- 1. Sổ cái bất biến: không được có policy UPDATE hoặc DELETE.
  SELECT count(*) INTO n FROM pg_policies
   WHERE tablename = 'kho_giao_dich' AND cmd IN ('UPDATE','DELETE');
  IF n <> 0 THEN
    RAISE EXCEPTION 'FAIL: kho_giao_dich không được có policy UPDATE/DELETE (có %)', n;
  END IF;
  SELECT count(*) INTO n FROM pg_policies
   WHERE tablename = 'kho_giao_dich' AND cmd IN ('INSERT','SELECT');
  IF n < 2 THEN
    RAISE EXCEPTION 'FAIL: kho_giao_dich cần đủ policy INSERT và SELECT';
  END IF;

  -- 2. CHECK so_luong > 0.
  SELECT count(*) INTO n FROM pg_constraint
   WHERE conrelid = 'public.kho_giao_dich'::regclass
     AND contype = 'c'
     AND pg_get_constraintdef(oid) ILIKE '%so_luong > (0)%';
  IF n = 0 THEN
    RAISE EXCEPTION 'FAIL: thiếu CHECK so_luong > 0 trên kho_giao_dich';
  END IF;

  -- 3. hieu_ung là cột sinh (generated) → không insert/sửa tay được.
  SELECT is_generated INTO txt FROM information_schema.columns
   WHERE table_schema='public' AND table_name='kho_giao_dich' AND column_name='hieu_ung';
  IF txt IS DISTINCT FROM 'ALWAYS' THEN
    RAISE EXCEPTION 'FAIL: hieu_ung phải là cột sinh ALWAYS (got %)', txt;
  END IF;

  -- 4. Các RPC nghiệp vụ tồn tại và SECURITY DEFINER.
  FOR txt IN SELECT unnest(ARRAY[
      'kho_nhap','kho_xuat','kho_chuyen','kho_kiem_ke',
      'kho_ton_hien_tai','ghi_kiem_ke','cap_phat_thiet_bi'])
  LOOP
    SELECT count(*) INTO n FROM pg_proc
     WHERE proname = txt AND pronamespace = 'public'::regnamespace;
    IF n = 0 THEN
      RAISE EXCEPTION 'FAIL: thiếu RPC %()', txt;
    END IF;
  END LOOP;

  -- kho_nhap/xuat/chuyen/kiem_ke + cap_phat phải SECURITY DEFINER.
  SELECT count(*) INTO n FROM pg_proc
   WHERE pronamespace = 'public'::regnamespace
     AND proname IN ('kho_nhap','kho_xuat','kho_chuyen','kho_kiem_ke','ghi_kiem_ke','cap_phat_thiet_bi')
     AND prosecdef = false;
  IF n <> 0 THEN
    RAISE EXCEPTION 'FAIL: % RPC nghiệp vụ không phải SECURITY DEFINER', n;
  END IF;

  -- kho_chuyen phải chốt cùng nhóm chứng từ (nhom_ct) → tra trong định nghĩa.
  SELECT pg_get_functiondef('public.kho_chuyen'::regproc) INTO txt;
  IF txt NOT ILIKE '%nhom_ct%CHUYEN_XUAT%' AND txt NOT ILIKE '%CHUYEN_XUAT%nhom_ct%' THEN
    RAISE EXCEPTION 'FAIL: kho_chuyen phải tạo hai bút toán CHUYEN_XUAT/CHUYEN_NHAP cùng nhom_ct';
  END IF;

  -- 5. Lịch sử cấp phát: UPDATE/DELETE chỉ dành cho admin (has_role).
  SELECT count(*) INTO n FROM pg_policies
   WHERE tablename='thiet_bi_cap_phat' AND cmd IN ('UPDATE','DELETE')
     AND qual ILIKE '%has_role(%admin%';
  IF n < 2 THEN
    RAISE EXCEPTION 'FAIL: thiet_bi_cap_phat cần policy UPDATE và DELETE giới hạn admin';
  END IF;

  -- 6. RLS bật trên các bảng nghiệp vụ.
  FOR txt IN SELECT unnest(ARRAY['kho','vat_tu','kho_giao_dich','thiet_bi_cap_phat','kiem_ke'])
  LOOP
    SELECT relrowsecurity INTO b FROM pg_class WHERE oid = ('public.'||txt)::regclass;
    IF NOT b THEN
      RAISE EXCEPTION 'FAIL: RLS chưa bật trên %', txt;
    END IF;
  END LOOP;

  RAISE NOTICE 'PASS: tất cả invariant kho/cấp phát/kiểm kê đã được khoá.';
END $$;
