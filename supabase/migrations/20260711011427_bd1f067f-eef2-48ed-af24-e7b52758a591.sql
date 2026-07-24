CREATE TABLE public.vi_tri_media (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vi_tri_ma text NOT NULL,
  don_vi text,
  loai text NOT NULL DEFAULT 'anh' CHECK (loai IN ('anh','pano360','model3d')),
  ten_tep text NOT NULL,
  duong_dan text NOT NULL,
  mo_ta text,
  kich_thuoc bigint,
  content_type text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vi_tri_media TO authenticated;
GRANT ALL ON public.vi_tri_media TO service_role;

ALTER TABLE public.vi_tri_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY vi_tri_media_read ON public.vi_tri_media
  FOR SELECT TO authenticated
  USING (public.is_active_user(auth.uid()));

CREATE POLICY vi_tri_media_insert ON public.vi_tri_media
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_active_user(auth.uid()));

CREATE POLICY vi_tri_media_update ON public.vi_tri_media
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.can_manage_equipment(auth.uid()));

CREATE POLICY vi_tri_media_delete ON public.vi_tri_media
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.can_manage_equipment(auth.uid()));

CREATE INDEX vi_tri_media_vi_tri_ma_idx ON public.vi_tri_media(vi_tri_ma);

-- Storage RLS cho bucket vi-tri-media (nội bộ: người dùng đang hoạt động được đọc/ghi)
CREATE POLICY "vi_tri_media_storage_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'vi-tri-media' AND public.is_active_user(auth.uid()));

CREATE POLICY "vi_tri_media_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vi-tri-media' AND public.is_active_user(auth.uid()));

CREATE POLICY "vi_tri_media_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'vi-tri-media' AND (public.is_active_user(auth.uid())));