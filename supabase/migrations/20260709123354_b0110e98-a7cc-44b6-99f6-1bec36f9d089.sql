-- =========================================================
-- #1: NGUỒN TÊN HỆ THỐNG DUY NHẤT
-- Ưu tiên tên override trên sơ đồ (cay_node_edit), fallback tên gốc (dm_he_thong.ten)
-- =========================================================
CREATE OR REPLACE FUNCTION public.resolve_he_thong_ten(_he_thong_id text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    NULLIF((SELECT ce.ten FROM public.cay_node_edit ce
            WHERE ce.kind = 'ht' AND ce.ma = _he_thong_id LIMIT 1), ''),
    (SELECT h.ten FROM public.dm_he_thong h WHERE h.id::text = _he_thong_id LIMIT 1)
  );
$$;

GRANT EXECUTE ON FUNCTION public.resolve_he_thong_ten(text) TO authenticated, anon;

-- =========================================================
-- #2 + #3 base: TRIGGER VALIDATE khai trường
-- Bổ sung: chặn field_key trùng cột lõi của bảng đích
-- =========================================================
CREATE OR REPLACE FUNCTION public.he_thong_truong_validate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.pham_vi NOT IN ('he_thong','nhom','linh_vuc','toan_cuc') THEN
    RAISE EXCEPTION 'Phạm vi trường không hợp lệ: %', NEW.pham_vi;
  END IF;
  IF NEW.ap_dung_lop NOT IN ('thiet_bi','he_thong') THEN
    RAISE EXCEPTION 'Lớp áp dụng không hợp lệ: %', NEW.ap_dung_lop;
  END IF;
  IF NEW.field_key IS NULL OR NEW.field_key !~ '^[a-z_][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Khóa trường không hợp lệ (chỉ a-z, 0-9, _): %', NEW.field_key;
  END IF;

  -- MỚI: chặn khóa trường trùng cột lõi của bảng thiet_bi
  IF NEW.ap_dung_lop = 'thiet_bi' AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'thiet_bi'
      AND column_name = NEW.field_key
  ) THEN
    RAISE EXCEPTION 'Khóa trường "%" trùng cột lõi của thiet_bi. Hãy đặt tiền tố, ví dụ "x_%"', NEW.field_key, NEW.field_key;
  END IF;

  -- MỚI: chặn khóa trường trùng cột lõi của bảng dm_he_thong
  IF NEW.ap_dung_lop = 'he_thong' AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dm_he_thong'
      AND column_name = NEW.field_key
  ) THEN
    RAISE EXCEPTION 'Khóa trường "%" trùng cột lõi của dm_he_thong. Hãy đặt tiền tố, ví dụ "x_%"', NEW.field_key, NEW.field_key;
  END IF;

  -- Đồng bộ ap_dung_id với he_thong_id cho phạm vi theo hệ thống
  IF NEW.pham_vi = 'he_thong' AND NEW.ap_dung_id IS NULL THEN
    NEW.ap_dung_id := NEW.he_thong_id;
  END IF;
  IF NEW.pham_vi = 'toan_cuc' THEN
    NEW.ap_dung_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- =========================================================
-- #3: ƯU TIÊN TRƯỜNG ĐA LỚP
-- Trả về định nghĩa trường áp dụng cho 1 thiết bị theo thứ tự ưu tiên
-- Hệ thống (1) > Nhóm (2) > Lĩnh vực (3) > Toàn cục (4)
-- =========================================================
CREATE OR REPLACE FUNCTION public.resolve_field_definitions(_thiet_bi_id uuid)
RETURNS TABLE(field_key text, nhan text, kieu text, tuy_chon jsonb, pham_vi text, uu_tien integer)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH tb AS (
    SELECT he_thong_id, nhom_he_thong_id, linh_vuc_id
    FROM public.thiet_bi WHERE id = _thiet_bi_id
  ),
  matched AS (
    SELECT r.field_key, r.nhan, r.kieu, r.tuy_chon, r.pham_vi,
      CASE r.pham_vi
        WHEN 'he_thong' THEN 1
        WHEN 'nhom'     THEN 2
        WHEN 'linh_vuc' THEN 3
        WHEN 'toan_cuc' THEN 4
        ELSE 9
      END AS uu_tien
    FROM public.he_thong_truong r, tb
    WHERE r.hoat_dong = true AND r.ap_dung_lop = 'thiet_bi'
      AND (
        r.pham_vi = 'toan_cuc'
        OR (r.pham_vi = 'he_thong' AND r.ap_dung_id = tb.he_thong_id::text)
        OR (r.pham_vi = 'linh_vuc' AND r.ap_dung_id = tb.linh_vuc_id::text)
        OR (r.pham_vi = 'nhom'     AND r.ap_dung_id = tb.nhom_he_thong_id::text)
      )
  )
  SELECT DISTINCT ON (field_key)
    field_key, nhan, kieu, tuy_chon, pham_vi, uu_tien
  FROM matched
  ORDER BY field_key, uu_tien ASC;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_field_definitions(uuid) TO authenticated;

-- =========================================================
-- #4: DỌN GIÁ TRỊ "MỒ CÔI" KHI TẮT/XÓA TRƯỜNG
-- Admin gọi để xóa 1 field_key khỏi thuoc_tinh của mọi thiết bị
-- =========================================================
CREATE OR REPLACE FUNCTION public.he_thong_truong_don_gia_tri(_field_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE n integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Chỉ admin mới được dọn giá trị trường';
  END IF;
  PERFORM public._admin_check_ident(_field_key);

  UPDATE public.thiet_bi
    SET thuoc_tinh = thuoc_tinh - _field_key,
        updated_at = now()
    WHERE thuoc_tinh ? _field_key;
  GET DIAGNOSTICS n = ROW_COUNT;

  PERFORM public.log_app_event('he_thong_truong_don_gia_tri', 'thiet_bi', _field_key,
    jsonb_build_object('rows_cleaned', n));

  RETURN jsonb_build_object('ok', true, 'cleaned', n);
END;
$$;

GRANT EXECUTE ON FUNCTION public.he_thong_truong_don_gia_tri(text) TO authenticated;