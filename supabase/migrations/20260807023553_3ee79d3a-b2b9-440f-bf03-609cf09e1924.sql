-- Helper: kiểm tra 1 object trong storage có thuộc phạm vi đơn vị của user không.
CREATE OR REPLACE FUNCTION public.storage_don_vi_allowed(_bucket text, _name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := public.current_uid();
  v_dv_id uuid;
  v_dv_ma text;
  v_found boolean := false;
  v_ok boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;
  -- Quản lý thiết bị / admin: xem toàn bộ
  IF public.can_manage_equipment(v_uid) THEN
    RETURN true;
  END IF;
  v_dv_id := public.get_user_don_vi_id(v_uid);
  v_dv_ma := public.get_user_don_vi_ma(v_uid);

  IF _bucket IN ('thiet-bi-tai-lieu', 'thiet-bi-hinh-anh') THEN
    SELECT true, bool_or(tb.don_vi_id IS NOT DISTINCT FROM v_dv_id)
      INTO v_found, v_ok
      FROM public.thiet_bi_tep_dinh_kem t
      JOIN public.thiet_bi tb ON tb.id = t.thiet_bi_id
     WHERE t.file_path = _name OR t.file_path LIKE '%' || _name;

  ELSIF _bucket = 'su-co-images' THEN
    SELECT true, bool_or(s.don_vi IS NOT DISTINCT FROM v_dv_ma)
      INTO v_found, v_ok
      FROM public.su_co s
     WHERE s.file_dinh_kem = _name OR s.file_dinh_kem LIKE '%' || _name;

  ELSIF _bucket = 'vi-tri-media' THEN
    SELECT true, bool_or(m.don_vi IS NOT DISTINCT FROM v_dv_ma)
      INTO v_found, v_ok
      FROM public.vi_tri_media m
     WHERE m.duong_dan = _name OR m.duong_dan LIKE '%' || _name;

  ELSIF _bucket IN ('form-pdf', 'form-attachments') THEN
    SELECT true, bool_or(f.don_vi_id IS NOT DISTINCT FROM v_dv_id)
      INTO v_found, v_ok
      FROM public.form_submission f
     WHERE f.pdf_path = _name OR f.pdf_path LIKE '%' || _name;

  ELSIF _bucket = 'du-an-cong-van' THEN
    SELECT true, bool_or(public.can_access_du_an(cv.du_an_id))
      INTO v_found, v_ok
      FROM public.du_an_cong_van_tep t
      JOIN public.du_an_cong_van cv ON cv.id = t.cong_van_id
     WHERE t.file_path = _name OR t.file_path LIKE '%' || _name;
  END IF;

  -- Không tìm thấy bản ghi tham chiếu (tệp mồ côi / vừa tải lên) → chỉ quản lý xem.
  IF v_found IS NOT TRUE THEN
    RETURN false;
  END IF;
  RETURN COALESCE(v_ok, false);
END;
$$;
REVOKE ALL ON FUNCTION public.storage_don_vi_allowed(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.storage_don_vi_allowed(text, text) TO authenticated;

-- === Thay chính sách SELECT rộng bằng chính sách theo đơn vị ===
DROP POLICY IF EXISTS "thiet-bi-tai-lieu_select" ON storage.objects;
CREATE POLICY "thiet-bi-tai-lieu_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'thiet-bi-tai-lieu' AND public.storage_don_vi_allowed('thiet-bi-tai-lieu', name));

DROP POLICY IF EXISTS "thiet-bi-hinh-anh_select" ON storage.objects;
CREATE POLICY "thiet-bi-hinh-anh_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'thiet-bi-hinh-anh' AND public.storage_don_vi_allowed('thiet-bi-hinh-anh', name));

DROP POLICY IF EXISTS "su-co-images_select" ON storage.objects;
CREATE POLICY "su-co-images_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'su-co-images' AND public.storage_don_vi_allowed('su-co-images', name));

DROP POLICY IF EXISTS "vi-tri-media_select" ON storage.objects;
CREATE POLICY "vi-tri-media_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vi-tri-media' AND public.storage_don_vi_allowed('vi-tri-media', name));

DROP POLICY IF EXISTS "form-pdf_select" ON storage.objects;
CREATE POLICY "form-pdf_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'form-pdf' AND public.storage_don_vi_allowed('form-pdf', name));

DROP POLICY IF EXISTS "form-attachments_select" ON storage.objects;
CREATE POLICY "form-attachments_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'form-attachments' AND public.storage_don_vi_allowed('form-attachments', name));

DROP POLICY IF EXISTS "dacv_storage_select" ON storage.objects;
CREATE POLICY "dacv_storage_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'du-an-cong-van' AND public.storage_don_vi_allowed('du-an-cong-van', name));

DROP POLICY IF EXISTS "dacv_storage_update" ON storage.objects;
CREATE POLICY "dacv_storage_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'du-an-cong-van' AND public.storage_don_vi_allowed('du-an-cong-van', name))
  WITH CHECK (bucket_id = 'du-an-cong-van');

DROP POLICY IF EXISTS "dacv_storage_delete" ON storage.objects;
CREATE POLICY "dacv_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'du-an-cong-van' AND public.storage_don_vi_allowed('du-an-cong-van', name));

-- Giấy phép khai thác: bỏ chính sách rộng, giữ gpkt_files_* đã scoped
DROP POLICY IF EXISTS "giay-phep-khai-thac_select" ON storage.objects;
DROP POLICY IF EXISTS "giay-phep-khai-thac_update" ON storage.objects;
DROP POLICY IF EXISTS "giay-phep-khai-thac_delete" ON storage.objects;
DROP POLICY IF EXISTS "giay-phep-khai-thac_insert" ON storage.objects;