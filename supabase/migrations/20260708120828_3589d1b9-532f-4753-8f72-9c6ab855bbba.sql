-- Thư viện hình khối cho sơ đồ hệ thống
CREATE TABLE public.so_do_thu_vien_hinh (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ten text NOT NULL,
  nhom text,
  duong_dan text NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.so_do_thu_vien_hinh TO authenticated;
GRANT ALL ON public.so_do_thu_vien_hinh TO service_role;

ALTER TABLE public.so_do_thu_vien_hinh ENABLE ROW LEVEL SECURITY;

CREATE POLICY "thu_vien_read" ON public.so_do_thu_vien_hinh
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()));

CREATE POLICY "thu_vien_insert" ON public.so_do_thu_vien_hinh
  FOR INSERT TO authenticated
  WITH CHECK (is_active_user(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "thu_vien_delete" ON public.so_do_thu_vien_hinh
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR can_manage_equipment(auth.uid()));

-- Storage policies cho bucket so-do-thu-vien
CREATE POLICY "so_do_thu_vien_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'so-do-thu-vien' AND is_active_user(auth.uid()));

CREATE POLICY "so_do_thu_vien_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'so-do-thu-vien' AND owner = auth.uid());

CREATE POLICY "so_do_thu_vien_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'so-do-thu-vien' AND (owner = auth.uid() OR can_manage_equipment(auth.uid())));