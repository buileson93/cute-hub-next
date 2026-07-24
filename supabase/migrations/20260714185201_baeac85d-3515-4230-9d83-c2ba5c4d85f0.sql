-- RPC ghi nghiệp vụ nguyên tử: tạo bản ghi + (nếu có) kho_xuat trong cùng transaction.
-- Tất cả SECURITY DEFINER + set search_path=public. Guard: yêu cầu auth.uid().

-- ================= SU CO =================
CREATE OR REPLACE FUNCTION public.ghi_su_co_atomic(
  p_thiet_bi_id uuid,
  p_hien_tuong text,
  p_ngay_phat_hien date DEFAULT (now()::date),
  p_vat_tu jsonb DEFAULT '[]'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
  v_item jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Chưa đăng nhập' USING ERRCODE = '42501';
  END IF;
  IF p_thiet_bi_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu thiet_bi_id';
  END IF;
  IF p_hien_tuong IS NULL OR btrim(p_hien_tuong) = '' THEN
    RAISE EXCEPTION 'Thiếu hiện tượng';
  END IF;

  INSERT INTO public.su_co (thiet_bi_id, hien_tuong, ngay_phat_hien)
  VALUES (p_thiet_bi_id, p_hien_tuong, COALESCE(p_ngay_phat_hien, now()::date))
  RETURNING id INTO v_id;

  IF p_vat_tu IS NOT NULL AND jsonb_typeof(p_vat_tu) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_vat_tu) LOOP
      PERFORM public.kho_xuat(
        (v_item->>'vat_tu_id')::uuid,
        (v_item->>'kho_id')::uuid,
        (v_item->>'so_luong')::numeric,
        0,
        '[khai_form:su_co]',
        NULL,
        v_id,
        NULL,
        false
      );
    END LOOP;
  END IF;

  RETURN v_id;
END $$;

-- ================= BAO DUONG =================
CREATE OR REPLACE FUNCTION public.ghi_bao_duong_atomic(
  p_thiet_bi_id uuid,
  p_mo_ta text,
  p_ngay_bat_dau date DEFAULT (now()::date),
  p_vat_tu jsonb DEFAULT '[]'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
  v_item jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Chưa đăng nhập' USING ERRCODE = '42501';
  END IF;
  IF p_thiet_bi_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu thiet_bi_id';
  END IF;

  INSERT INTO public.bao_tri (thiet_bi_id, mo_ta_cong_viec, ngay_bat_dau)
  VALUES (p_thiet_bi_id, p_mo_ta, COALESCE(p_ngay_bat_dau, now()::date))
  RETURNING id INTO v_id;

  IF p_vat_tu IS NOT NULL AND jsonb_typeof(p_vat_tu) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_vat_tu) LOOP
      PERFORM public.kho_xuat(
        (v_item->>'vat_tu_id')::uuid,
        (v_item->>'kho_id')::uuid,
        (v_item->>'so_luong')::numeric,
        0,
        '[khai_form:bao_duong]',
        NULL,
        NULL,
        NULL,
        false
      );
    END LOOP;
  END IF;

  RETURN v_id;
END $$;

-- ================= HONG HOC =================
CREATE OR REPLACE FUNCTION public.ghi_hong_hoc_atomic(
  p_thiet_bi_id uuid,
  p_mo_ta_hong_hoc text,
  p_ngay_hong date DEFAULT (now()::date),
  p_vat_tu jsonb DEFAULT '[]'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
  v_item jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Chưa đăng nhập' USING ERRCODE = '42501';
  END IF;
  IF p_thiet_bi_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu thiet_bi_id';
  END IF;
  IF p_mo_ta_hong_hoc IS NULL OR btrim(p_mo_ta_hong_hoc) = '' THEN
    RAISE EXCEPTION 'Thiếu mô tả hỏng hóc';
  END IF;

  INSERT INTO public.hong_hoc (thiet_bi_id, mo_ta_hong_hoc, ngay_hong)
  VALUES (p_thiet_bi_id, p_mo_ta_hong_hoc, COALESCE(p_ngay_hong, now()::date))
  RETURNING id INTO v_id;

  IF p_vat_tu IS NOT NULL AND jsonb_typeof(p_vat_tu) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_vat_tu) LOOP
      PERFORM public.kho_xuat(
        (v_item->>'vat_tu_id')::uuid,
        (v_item->>'kho_id')::uuid,
        (v_item->>'so_luong')::numeric,
        0,
        '[khai_form:hong_hoc]',
        NULL,
        NULL,
        v_id,
        false
      );
    END LOOP;
  END IF;

  RETURN v_id;
END $$;

GRANT EXECUTE ON FUNCTION public.ghi_su_co_atomic(uuid, text, date, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ghi_bao_duong_atomic(uuid, text, date, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ghi_hong_hoc_atomic(uuid, text, date, jsonb) TO authenticated;