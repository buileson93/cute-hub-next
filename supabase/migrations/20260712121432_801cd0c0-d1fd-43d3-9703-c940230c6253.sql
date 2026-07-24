-- =============================================================
-- T10 — HARD-DELETE & RETIREMENT THIẾT BỊ
-- =============================================================

-- 1) Đánh dấu trạng thái nào là "ngừng khai thác" (retirement lifecycle)
ALTER TABLE public.dm_trang_thai_thiet_bi
  ADD COLUMN IF NOT EXISTS la_ngung_khai_thac boolean NOT NULL DEFAULT false;

-- 2) Thêm 2 trạng thái vòng đời cuối: Ngừng khai thác & Thanh lý
INSERT INTO public.dm_trang_thai_thiet_bi (ma, ten, mo_ta, thu_tu, active, la_ngung_khai_thac)
VALUES
  ('NGUNG_KHAI_THAC', 'Ngừng khai thác', 'Thiết bị đã ngừng sử dụng nhưng vẫn lưu hồ sơ lý lịch', 90, true, true),
  ('THANH_LY',        'Thanh lý',        'Thiết bị đã thanh lý/loại biên, vẫn tra cứu được lịch sử', 99, true, true)
ON CONFLICT (ma) DO UPDATE
  SET ten = EXCLUDED.ten,
      mo_ta = EXCLUDED.mo_ta,
      la_ngung_khai_thac = true,
      active = true;

-- =============================================================
-- 3) RPC: Ngừng khai thác / Thanh lý thiết bị (retire, KHÔNG xoá dữ liệu)
--    - Ghi chuyển trạng thái vào thiet_bi_vong_doi
--    - Ghi audit_log
--    - Đồng bộ cả trang_thai_id (FK) lẫn trang_thai (text)
-- =============================================================
CREATE OR REPLACE FUNCTION public.ngung_khai_thac_thiet_bi(
  _mas text[],
  _ly_do text DEFAULT NULL,
  _thanh_ly boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _status_id uuid;
  _status_ten text;
  _status_ma text := CASE WHEN _thanh_ly THEN 'THANH_LY' ELSE 'NGUNG_KHAI_THAC' END;
  _tb record;
  _n int := 0;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Chưa đăng nhập';
  END IF;
  IF NOT public.can_manage_equipment(_uid) THEN
    RAISE EXCEPTION 'Chỉ Admin hoặc Phòng Kỹ thuật được ngừng khai thác thiết bị';
  END IF;

  SELECT id, ten INTO _status_id, _status_ten
  FROM public.dm_trang_thai_thiet_bi WHERE ma = _status_ma;

  FOR _tb IN
    SELECT id, ma_thiet_bi, trang_thai_id FROM public.thiet_bi
    WHERE ma_thiet_bi = ANY(_mas)
  LOOP
    INSERT INTO public.thiet_bi_vong_doi (thiet_bi_id, tu_trang_thai_id, den_trang_thai_id, ly_do, nguoi_thuc_hien)
    VALUES (_tb.id, _tb.trang_thai_id, _status_id, COALESCE(NULLIF(btrim(_ly_do), ''), _status_ten), _uid);

    UPDATE public.thiet_bi
    SET trang_thai_id = _status_id,
        trang_thai = _status_ten,
        updated_at = now()
    WHERE id = _tb.id;

    INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
    VALUES (_uid, 'ngung_khai_thac', 'thiet_bi', _tb.ma_thiet_bi,
            jsonb_build_object('trang_thai_moi', _status_ten, 'ly_do', _ly_do, 'thanh_ly', _thanh_ly));

    _n := _n + 1;
  END LOOP;

  RETURN jsonb_build_object('so_thiet_bi', _n, 'trang_thai', _status_ten);
END;
$$;

-- =============================================================
-- 4) RPC: Phục hồi thiết bị đã ngừng khai thác về "Đang khai thác"
-- =============================================================
CREATE OR REPLACE FUNCTION public.phuc_hoi_thiet_bi(
  _mas text[],
  _ly_do text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _status_id uuid;
  _status_ten text;
  _tb record;
  _n int := 0;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Chưa đăng nhập';
  END IF;
  IF NOT public.can_manage_equipment(_uid) THEN
    RAISE EXCEPTION 'Chỉ Admin hoặc Phòng Kỹ thuật được phục hồi thiết bị';
  END IF;

  SELECT id, ten INTO _status_id, _status_ten
  FROM public.dm_trang_thai_thiet_bi WHERE ma = 'DANG_KHAI_THAC';

  FOR _tb IN
    SELECT id, ma_thiet_bi, trang_thai_id FROM public.thiet_bi
    WHERE ma_thiet_bi = ANY(_mas)
  LOOP
    INSERT INTO public.thiet_bi_vong_doi (thiet_bi_id, tu_trang_thai_id, den_trang_thai_id, ly_do, nguoi_thuc_hien)
    VALUES (_tb.id, _tb.trang_thai_id, _status_id, COALESCE(NULLIF(btrim(_ly_do), ''), 'Phục hồi khai thác'), _uid);

    UPDATE public.thiet_bi
    SET trang_thai_id = _status_id,
        trang_thai = _status_ten,
        updated_at = now()
    WHERE id = _tb.id;

    INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
    VALUES (_uid, 'phuc_hoi', 'thiet_bi', _tb.ma_thiet_bi,
            jsonb_build_object('trang_thai_moi', _status_ten, 'ly_do', _ly_do));

    _n := _n + 1;
  END LOOP;

  RETURN jsonb_build_object('so_thiet_bi', _n, 'trang_thai', _status_ten);
END;
$$;

-- =============================================================
-- 5) RPC: Purge (xoá vĩnh viễn) - CHỈ Admin, CHỈ bản ghi nhập nhầm
--    chưa phát sinh quan hệ nghiệp vụ nào.
-- =============================================================
CREATE OR REPLACE FUNCTION public.purge_thiet_bi(
  _mas text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _tb record;
  _has_rel boolean;
  _deleted text[] := '{}';
  _skipped text[] := '{}';
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Chưa đăng nhập';
  END IF;
  IF NOT public.has_role(_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Chỉ Admin mới được xoá vĩnh viễn thiết bị';
  END IF;

  FOR _tb IN
    SELECT id, ma_thiet_bi FROM public.thiet_bi
    WHERE ma_thiet_bi = ANY(_mas)
  LOOP
    _has_rel :=
         EXISTS (SELECT 1 FROM public.su_co       WHERE thiet_bi_id = _tb.id)
      OR EXISTS (SELECT 1 FROM public.bao_tri     WHERE thiet_bi_id = _tb.id)
      OR EXISTS (SELECT 1 FROM public.hong_hoc    WHERE thiet_bi_hong_id = _tb.id OR thiet_bi_thay_the_id = _tb.id)
      OR EXISTS (SELECT 1 FROM public.ban_giao    WHERE thiet_bi_id = _tb.id)
      OR EXISTS (SELECT 1 FROM public.kiem_ke     WHERE thiet_bi_id = _tb.id)
      OR EXISTS (SELECT 1 FROM public.giay_phep   WHERE thiet_bi_id = _tb.id)
      OR EXISTS (SELECT 1 FROM public.form_submission        WHERE thiet_bi_id = _tb.id)
      OR EXISTS (SELECT 1 FROM public.form_submission_thiet_bi WHERE thiet_bi_id = _tb.id)
      OR EXISTS (SELECT 1 FROM public.thiet_bi_do_dac WHERE thiet_bi_id = _tb.id);

    IF _has_rel THEN
      _skipped := array_append(_skipped, _tb.ma_thiet_bi);
    ELSE
      INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
      VALUES (_uid, 'purge', 'thiet_bi', _tb.ma_thiet_bi,
              jsonb_build_object('ly_do', 'Xoá vĩnh viễn bản ghi nhập nhầm chưa có quan hệ'));
      DELETE FROM public.thiet_bi WHERE id = _tb.id;
      _deleted := array_append(_deleted, _tb.ma_thiet_bi);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'da_xoa', _deleted,
    'bo_qua', _skipped,
    'so_da_xoa', array_length(_deleted, 1),
    'so_bo_qua', array_length(_skipped, 1)
  );
END;
$$;

-- Khoá thực thi: chỉ user đã đăng nhập gọi được (RPC tự kiểm tra vai trò bên trong)
REVOKE ALL ON FUNCTION public.ngung_khai_thac_thiet_bi(text[], text, boolean) FROM public, anon;
REVOKE ALL ON FUNCTION public.phuc_hoi_thiet_bi(text[], text) FROM public, anon;
REVOKE ALL ON FUNCTION public.purge_thiet_bi(text[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ngung_khai_thac_thiet_bi(text[], text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.phuc_hoi_thiet_bi(text[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_thiet_bi(text[]) TO authenticated;