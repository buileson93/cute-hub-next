-- P10 — Track C: Danh mục dùng chung + FK guard mở rộng + kế thừa Model.
--
-- 1) Trigger propagate: khi sửa dm_model → cập nhật thiet_bi có model_id đó,
--    ghi đè các trường kế thừa (loai_thiet_bi_id, nha_san_xuat_id,
--    field_set_id, p_n) đúng như trigger `thiet_bi_inherit_model` khi
--    NEW.model_id thay đổi. Chỉ ghi đè khi giá trị mới ≠ NULL (p_n phải ≠ '').
--
-- 2) Mở rộng RPC dm_xoa_an_toan cho các danh mục: dm_don_vi, dm_vi_tri.
--    (dm_nsx/dm_ncc/dm_loai/dm_model đã hỗ trợ.)

-- 1) Propagate sửa dm_model xuống thiet_bi -----------------------------------
CREATE OR REPLACE FUNCTION public.dm_model_propagate_to_thiet_bi()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- loai_thiet_bi_id
  IF NEW.loai_thiet_bi_id IS NOT NULL
     AND NEW.loai_thiet_bi_id IS DISTINCT FROM OLD.loai_thiet_bi_id THEN
    UPDATE public.thiet_bi
       SET loai_thiet_bi_id = NEW.loai_thiet_bi_id
     WHERE model_id = NEW.id
       AND loai_thiet_bi_id IS DISTINCT FROM NEW.loai_thiet_bi_id;
  END IF;

  -- nha_san_xuat_id
  IF NEW.nha_san_xuat_id IS NOT NULL
     AND NEW.nha_san_xuat_id IS DISTINCT FROM OLD.nha_san_xuat_id THEN
    UPDATE public.thiet_bi
       SET nha_san_xuat_id = NEW.nha_san_xuat_id
     WHERE model_id = NEW.id
       AND nha_san_xuat_id IS DISTINCT FROM NEW.nha_san_xuat_id;
  END IF;

  -- field_set_id
  IF NEW.field_set_id IS NOT NULL
     AND NEW.field_set_id IS DISTINCT FROM OLD.field_set_id THEN
    UPDATE public.thiet_bi
       SET field_set_id = NEW.field_set_id
     WHERE model_id = NEW.id
       AND field_set_id IS DISTINCT FROM NEW.field_set_id;
  END IF;

  -- p_n (ghi đè khi ≠ '')
  IF NEW.p_n IS NOT NULL AND NEW.p_n <> ''
     AND NEW.p_n IS DISTINCT FROM OLD.p_n THEN
    UPDATE public.thiet_bi
       SET p_n = NEW.p_n
     WHERE model_id = NEW.id
       AND p_n IS DISTINCT FROM NEW.p_n;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dm_model_propagate ON public.dm_model;
CREATE TRIGGER trg_dm_model_propagate
  AFTER UPDATE ON public.dm_model
  FOR EACH ROW EXECUTE FUNCTION public.dm_model_propagate_to_thiet_bi();

-- 2) Mở rộng dm_xoa_an_toan ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.dm_xoa_an_toan(_bang text, _id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_col text;
  v_count integer;
  v_extra_check jsonb := '[]'::jsonb;
  v_rec record;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Forbidden: cần quyền admin hoặc phong_kt' USING ERRCODE = '42501';
  END IF;

  v_col := CASE _bang
    WHEN 'dm_nha_san_xuat'  THEN 'nha_san_xuat_id'
    WHEN 'dm_nha_cung_cap'  THEN 'nha_cung_cap_id'
    WHEN 'dm_loai_thiet_bi' THEN 'loai_thiet_bi_id'
    WHEN 'dm_model'         THEN 'model_id'
    WHEN 'dm_don_vi'        THEN 'don_vi_id'
    WHEN 'dm_vi_tri'        THEN 'vi_tri_id'
    ELSE NULL
  END;

  IF v_col IS NULL THEN
    RAISE EXCEPTION 'Bảng danh mục không hỗ trợ xoá qua RPC: %', _bang USING ERRCODE = '22023';
  END IF;

  EXECUTE format('SELECT count(*) FROM public.thiet_bi WHERE %I = $1', v_col)
    INTO v_count USING _id;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Không thể xoá: còn % tài sản đang tham chiếu.', v_count
      USING ERRCODE = '23503';
  END IF;

  -- Với dm_don_vi: chặn thêm nếu còn hệ thống (dm_he_thong.don_vi_id) đang trỏ tới.
  IF _bang = 'dm_don_vi' THEN
    SELECT count(*) INTO v_count FROM public.dm_he_thong WHERE don_vi_id = _id;
    IF v_count > 0 THEN
      RAISE EXCEPTION 'Không thể xoá: còn % hệ thống đang trực thuộc đơn vị.', v_count
        USING ERRCODE = '23503';
    END IF;
  END IF;

  EXECUTE format('DELETE FROM public.%I WHERE id = $1', _bang) USING _id;

  RETURN jsonb_build_object('deleted', 1, 'bang', _bang, 'id', _id);
END;
$$;

REVOKE ALL ON FUNCTION public.dm_xoa_an_toan(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dm_xoa_an_toan(text, uuid) TO authenticated;