
CREATE OR REPLACE FUNCTION public.su_co_transition(
  _bang    text,
  _id      uuid,
  _den     text,
  _ghi_chu text DEFAULT NULL,
  _meta    jsonb DEFAULT '{}'::jsonb
)
RETURNS public.su_co_lich_su
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tu           text;
  _uid          uuid := auth.uid();
  _is_admin     boolean;
  _is_phong_kt  boolean;
  _is_ptrach    boolean;
  _buoc         int;
  _row          public.su_co_lich_su;
  _at           timestamptz := now();
  _cho_vat_at   timestamptz;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;
  IF _bang NOT IN ('su_co','hong_hoc') THEN
    RAISE EXCEPTION 'invalid_bang: %', _bang USING ERRCODE = '22023';
  END IF;

  SELECT public.has_role(_uid, 'admin'::app_role),
         public.has_role(_uid, 'phong_kt'::app_role),
         public.has_role(_uid, 'phu_trach_dv'::app_role)
    INTO _is_admin, _is_phong_kt, _is_ptrach;

  IF _bang = 'su_co' THEN
    SELECT s.trang_thai_moi INTO _tu FROM public.su_co s WHERE s.id = _id FOR UPDATE;
  ELSE
    SELECT h.trang_thai_moi INTO _tu FROM public.hong_hoc h WHERE h.id = _id FOR UPDATE;
  END IF;

  IF _tu IS NULL THEN
    RAISE EXCEPTION 'not_found: % %', _bang, _id USING ERRCODE = 'P0002';
  END IF;
  IF NOT public.su_co_check_transition(_tu, _den) THEN
    RAISE EXCEPTION 'invalid_transition: % -> %', _tu, _den USING ERRCODE = 'P0001';
  END IF;

  IF _den IN ('tiep_nhan','dang_xu_ly','cho_vat_tu','hoan_thanh') THEN
    IF NOT (_is_admin OR _is_phong_kt) THEN
      RAISE EXCEPTION 'forbidden: chỉ admin/phong_kt được chuyển sang %', _den USING ERRCODE = '42501';
    END IF;
  ELSIF _den = 'nghiem_thu' THEN
    IF NOT (_is_admin OR _is_ptrach) THEN
      RAISE EXCEPTION 'forbidden: chỉ admin/phu_trach_dv được nghiệm thu' USING ERRCODE = '42501';
    END IF;
    IF _bang='su_co' THEN
      PERFORM 1 FROM public.su_co WHERE id=_id AND nguoi_tiep_nhan_id=_uid;
      IF FOUND THEN RAISE EXCEPTION 'forbidden_self_approve' USING ERRCODE='42501'; END IF;
    ELSE
      PERFORM 1 FROM public.hong_hoc WHERE id=_id AND nguoi_tiep_nhan_id=_uid;
      IF FOUND THEN RAISE EXCEPTION 'forbidden_self_approve' USING ERRCODE='42501'; END IF;
    END IF;
  ELSIF _den = 'huy' THEN
    IF NOT _is_admin THEN
      IF _bang='su_co' THEN
        PERFORM 1 FROM public.su_co
          WHERE id=_id AND nguoi_bao_cao_id=_uid
            AND (at_bao_cao IS NULL OR at_bao_cao > now() - interval '24 hours');
      ELSE
        PERFORM 1 FROM public.hong_hoc
          WHERE id=_id AND nguoi_bao_cao_id=_uid
            AND (at_bao_cao IS NULL OR at_bao_cao > now() - interval '24 hours');
      END IF;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'forbidden: chỉ admin hoặc người báo cáo (trong 24h) được huỷ' USING ERRCODE='42501';
      END IF;
    END IF;
  END IF;

  IF _tu = 'cho_vat_tu' THEN
    IF _bang='su_co' THEN
      SELECT COALESCE((SELECT max(at) FROM public.su_co_lich_su
          WHERE doi_tuong_bang='su_co' AND doi_tuong_id=_id AND den_trang_thai='cho_vat_tu'), _at)
        INTO _cho_vat_at;
      UPDATE public.su_co
         SET tong_thoi_gian_cho_vat_tu_phut = COALESCE(tong_thoi_gian_cho_vat_tu_phut,0)
             + GREATEST(0, extract(epoch FROM (_at - _cho_vat_at))/60)::int
       WHERE id=_id;
    ELSE
      SELECT COALESCE((SELECT max(at) FROM public.su_co_lich_su
          WHERE doi_tuong_bang='hong_hoc' AND doi_tuong_id=_id AND den_trang_thai='cho_vat_tu'), _at)
        INTO _cho_vat_at;
      UPDATE public.hong_hoc
         SET tong_thoi_gian_cho_vat_tu_phut = COALESCE(tong_thoi_gian_cho_vat_tu_phut,0)
             + GREATEST(0, extract(epoch FROM (_at - _cho_vat_at))/60)::int
       WHERE id=_id;
    END IF;
  END IF;

  IF _bang = 'su_co' THEN
    UPDATE public.su_co SET
      trang_thai_moi = _den, updated_at = _at,
      at_tiep_nhan = CASE WHEN _den='tiep_nhan' AND at_tiep_nhan IS NULL THEN _at ELSE at_tiep_nhan END,
      nguoi_tiep_nhan_id = CASE WHEN _den='tiep_nhan' AND nguoi_tiep_nhan_id IS NULL THEN _uid ELSE nguoi_tiep_nhan_id END,
      at_bat_dau_xu_ly = CASE WHEN _den='dang_xu_ly' AND at_bat_dau_xu_ly IS NULL THEN _at ELSE at_bat_dau_xu_ly END,
      nguoi_xu_ly_chinh_id = CASE WHEN _den='dang_xu_ly' THEN _uid ELSE nguoi_xu_ly_chinh_id END,
      at_hoan_thanh = CASE WHEN _den='hoan_thanh' THEN _at ELSE at_hoan_thanh END,
      thoi_diem_khac_phuc = CASE WHEN _den='hoan_thanh' AND thoi_diem_khac_phuc IS NULL THEN _at ELSE thoi_diem_khac_phuc END,
      at_nghiem_thu = CASE WHEN _den='nghiem_thu' THEN _at ELSE at_nghiem_thu END,
      nguoi_nghiem_thu_id = CASE WHEN _den='nghiem_thu' THEN _uid ELSE nguoi_nghiem_thu_id END,
      at_huy = CASE WHEN _den='huy' THEN _at ELSE at_huy END,
      trang_thai = CASE
        WHEN _den='bao_cao' THEN 'Mới'
        WHEN _den IN ('tiep_nhan','dang_xu_ly','cho_vat_tu') THEN 'Đang xử lý'
        WHEN _den='hoan_thanh' THEN 'Đã khắc phục'
        WHEN _den IN ('nghiem_thu','huy') THEN 'Đóng'
        ELSE trang_thai END
    WHERE id=_id;
  ELSE
    UPDATE public.hong_hoc SET
      trang_thai_moi = _den, updated_at = _at,
      at_tiep_nhan = CASE WHEN _den='tiep_nhan' AND at_tiep_nhan IS NULL THEN _at ELSE at_tiep_nhan END,
      nguoi_tiep_nhan_id = CASE WHEN _den='tiep_nhan' AND nguoi_tiep_nhan_id IS NULL THEN _uid ELSE nguoi_tiep_nhan_id END,
      at_bat_dau_xu_ly = CASE WHEN _den='dang_xu_ly' AND at_bat_dau_xu_ly IS NULL THEN _at ELSE at_bat_dau_xu_ly END,
      nguoi_xu_ly_chinh_id = CASE WHEN _den='dang_xu_ly' THEN _uid ELSE nguoi_xu_ly_chinh_id END,
      at_hoan_thanh = CASE WHEN _den='hoan_thanh' THEN _at ELSE at_hoan_thanh END,
      ngay_hoan_thanh = CASE WHEN _den='hoan_thanh' AND ngay_hoan_thanh IS NULL THEN _at::date ELSE ngay_hoan_thanh END,
      at_nghiem_thu = CASE WHEN _den='nghiem_thu' THEN _at ELSE at_nghiem_thu END,
      nguoi_nghiem_thu_id = CASE WHEN _den='nghiem_thu' THEN _uid ELSE nguoi_nghiem_thu_id END,
      at_huy = CASE WHEN _den='huy' THEN _at ELSE at_huy END,
      trang_thai = CASE
        WHEN _den IN ('hoan_thanh','nghiem_thu','huy') THEN 'Hoàn thành'
        WHEN _den='bao_cao' THEN 'Mới' ELSE 'Đang xử lý' END
    WHERE id=_id;
  END IF;

  SELECT COALESCE(max(buoc),0)+1 INTO _buoc
    FROM public.su_co_lich_su
   WHERE doi_tuong_bang=_bang AND doi_tuong_id=_id;

  INSERT INTO public.su_co_lich_su
    (doi_tuong_bang, doi_tuong_id, buoc, tu_trang_thai, den_trang_thai, nguoi, at, ghi_chu, meta)
  VALUES (_bang, _id, _buoc, _tu, _den, _uid, _at, _ghi_chu, COALESCE(_meta,'{}'::jsonb))
  RETURNING * INTO _row;

  BEGIN
    INSERT INTO public.audit_log (source, action, entity, entity_id, detail)
    VALUES ('n6.su_co.transition', _den, _bang, _id,
            jsonb_build_object('tu', _tu, 'den', _den, 'ghi_chu', _ghi_chu, 'meta', _meta));
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN _row;
END;
$$;

REVOKE ALL ON FUNCTION public.su_co_transition(text,uuid,text,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.su_co_transition(text,uuid,text,text,jsonb) TO authenticated, service_role;
