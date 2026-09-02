-- 1) ocr_artifact: sửa join tự tham chiếu sai
DROP POLICY IF EXISTS "Read artifact via link" ON public.ocr_artifact;
CREATE POLICY "Read artifact via link" ON public.ocr_artifact
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tai_lieu_ocr_link l
    WHERE l.artifact_id = public.ocr_artifact.id
      AND (
        (l.source_type = 'model_tai_lieu' AND EXISTS (SELECT 1 FROM public.model_tai_lieu m WHERE m.id = l.source_id))
        OR (l.source_type = 'thiet_bi_tep_dinh_kem' AND EXISTS (SELECT 1 FROM public.thiet_bi_tep_dinh_kem t WHERE t.id = l.source_id))
      )
  )
);

-- 2) storage_don_vi_allowed: can_access_du_an cần 2 tham số
CREATE OR REPLACE FUNCTION public.storage_don_vi_allowed(_bucket text, _name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
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
    SELECT true, bool_or(public.can_access_du_an(cv.du_an_id, v_uid))
      INTO v_found, v_ok
      FROM public.du_an_cong_van_tep t
      JOIN public.du_an_cong_van cv ON cv.id = t.cong_van_id
     WHERE t.file_path = _name OR t.file_path LIKE '%' || _name;
  END IF;

  IF v_found IS NOT TRUE THEN
    RETURN false;
  END IF;
  RETURN COALESCE(v_ok, false);
END;
$fn$;

-- 3) thiet_bi_he_thong_tuong_thich: siết quyền ghi
DROP POLICY IF EXISTS "Allow authenticated users to manage compatibility" ON public.thiet_bi_he_thong_tuong_thich;
CREATE POLICY "Manage compatibility (equipment managers)" ON public.thiet_bi_he_thong_tuong_thich
FOR ALL TO authenticated
USING (public.can_manage_equipment(public.current_uid()))
WITH CHECK (public.can_manage_equipment(public.current_uid()));