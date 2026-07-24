-- Bảng tài liệu cho mẫu thiết bị (dm_model)
CREATE TABLE public.model_tai_lieu (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id uuid NOT NULL REFERENCES public.dm_model(id) ON DELETE CASCADE,
  loai_tai_lieu text NOT NULL DEFAULT 'Khác',
  bucket text NOT NULL DEFAULT 'model-tai-lieu',
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  kich_thuoc bigint,
  mo_ta text,
  thu_tu integer NOT NULL DEFAULT 0,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_model_tai_lieu_model ON public.model_tai_lieu(model_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.model_tai_lieu TO authenticated;
GRANT ALL ON public.model_tai_lieu TO service_role;

ALTER TABLE public.model_tai_lieu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "model_tai_lieu doc doc"
  ON public.model_tai_lieu FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "model_tai_lieu quan ly"
  ON public.model_tai_lieu FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt'));

CREATE TRIGGER trg_model_tai_lieu_updated
  BEFORE UPDATE ON public.model_tai_lieu
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies cho bucket riêng "model-tai-lieu"
CREATE POLICY "model tai lieu doc"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'model-tai-lieu');

CREATE POLICY "model tai lieu them"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'model-tai-lieu' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')));

CREATE POLICY "model tai lieu xoa"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'model-tai-lieu' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')));

CREATE POLICY "model tai lieu sua"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'model-tai-lieu' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')));