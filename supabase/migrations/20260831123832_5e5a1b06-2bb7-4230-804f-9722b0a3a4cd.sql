CREATE TABLE IF NOT EXISTS public.du_an_cong_viec_tep (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cong_viec_id uuid NOT NULL REFERENCES public.du_an_cong_viec(id) ON DELETE CASCADE,
  bucket text NOT NULL DEFAULT 'du-an-cong-viec',
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  kich_thuoc bigint,
  uploaded_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dacvt_cong_viec ON public.du_an_cong_viec_tep(cong_viec_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.du_an_cong_viec_tep TO authenticated;
GRANT ALL ON public.du_an_cong_viec_tep TO service_role;

ALTER TABLE public.du_an_cong_viec_tep ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dacvt_cv_select ON public.du_an_cong_viec_tep;
CREATE POLICY dacvt_cv_select ON public.du_an_cong_viec_tep
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.du_an_cong_viec cv
    WHERE cv.id = du_an_cong_viec_tep.cong_viec_id
      AND public.can_access_du_an(cv.du_an_id, public.current_uid())
  ));

DROP POLICY IF EXISTS dacvt_cv_write ON public.du_an_cong_viec_tep;
CREATE POLICY dacvt_cv_write ON public.du_an_cong_viec_tep
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.du_an_cong_viec cv
    WHERE cv.id = du_an_cong_viec_tep.cong_viec_id
      AND (public.can_manage_du_an(cv.du_an_id, public.current_uid())
           OR public.can_edit_cong_viec(cv.id, public.current_uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.du_an_cong_viec cv
    WHERE cv.id = du_an_cong_viec_tep.cong_viec_id
      AND (public.can_manage_du_an(cv.du_an_id, public.current_uid())
           OR public.can_edit_cong_viec(cv.id, public.current_uid()))
  ));

CREATE OR REPLACE FUNCTION public.fn_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_dacvt_touch ON public.du_an_cong_viec_tep;
CREATE TRIGGER trg_dacvt_touch BEFORE UPDATE ON public.du_an_cong_viec_tep
  FOR EACH ROW EXECUTE FUNCTION public.fn_touch_updated_at();

-- Storage: bucket du-an-cong-viec, path dạng <cong_viec_id>/<file>
DROP POLICY IF EXISTS dacv_storage_select ON storage.objects;
CREATE POLICY dacv_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'du-an-cong-viec'
    AND EXISTS (
      SELECT 1 FROM public.du_an_cong_viec cv
      WHERE cv.id::text = (storage.foldername(name))[1]
        AND public.can_access_du_an(cv.du_an_id, public.current_uid())
    )
  );

DROP POLICY IF EXISTS dacv_storage_write ON storage.objects;
CREATE POLICY dacv_storage_write ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'du-an-cong-viec'
    AND EXISTS (
      SELECT 1 FROM public.du_an_cong_viec cv
      WHERE cv.id::text = (storage.foldername(name))[1]
        AND (public.can_manage_du_an(cv.du_an_id, public.current_uid())
             OR public.can_edit_cong_viec(cv.id, public.current_uid()))
    )
  )
  WITH CHECK (
    bucket_id = 'du-an-cong-viec'
    AND EXISTS (
      SELECT 1 FROM public.du_an_cong_viec cv
      WHERE cv.id::text = (storage.foldername(name))[1]
        AND (public.can_manage_du_an(cv.du_an_id, public.current_uid())
             OR public.can_edit_cong_viec(cv.id, public.current_uid()))
    )
  );

-- Đồng bộ tiến độ khi huỷ / yêu cầu sửa báo cáo
CREATE OR REPLACE FUNCTION public.fn_du_an_bao_cao_duyet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.trang_thai IS DISTINCT FROM OLD.trang_thai THEN
    IF NOT public.can_manage_du_an(NEW.du_an_id, public.current_uid()) THEN
      RAISE EXCEPTION 'Chỉ người quản lý dự án được phê duyệt báo cáo';
    END IF;
    IF NEW.trang_thai IN ('da_duyet','yeu_cau_sua','huy') THEN
      NEW.nguoi_duyet_id := public.current_uid();
      NEW.ngay_duyet := now();
    END IF;
    IF NEW.trang_thai = 'da_duyet' AND NEW.cong_viec_id IS NOT NULL THEN
      UPDATE public.du_an_cong_viec
        SET trang_thai = 'hoan_thanh', tien_do = 100
        WHERE id = NEW.cong_viec_id;
    END IF;
    IF NEW.trang_thai IN ('yeu_cau_sua','huy')
       AND OLD.trang_thai = 'da_duyet'
       AND NEW.cong_viec_id IS NOT NULL THEN
      UPDATE public.du_an_cong_viec
        SET trang_thai = 'dang_lam', tien_do = LEAST(tien_do, 90)
        WHERE id = NEW.cong_viec_id AND trang_thai = 'hoan_thanh';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_du_an_bao_cao_duyet() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_touch_updated_at() FROM PUBLIC;