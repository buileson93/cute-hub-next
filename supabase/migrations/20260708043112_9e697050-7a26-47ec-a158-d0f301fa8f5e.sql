
-- Enum loại tệp
DO $$ BEGIN
  CREATE TYPE public.thiet_bi_tep_loai AS ENUM ('hinh_anh','tai_lieu');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Bảng đính kèm
CREATE TABLE public.thiet_bi_tep_dinh_kem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thiet_bi_id uuid NOT NULL REFERENCES public.thiet_bi(id) ON DELETE CASCADE,
  loai public.thiet_bi_tep_loai NOT NULL,
  bucket text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  kich_thuoc bigint,
  mo_ta text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_thiet_bi_tep_thiet_bi ON public.thiet_bi_tep_dinh_kem(thiet_bi_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.thiet_bi_tep_dinh_kem TO authenticated;
GRANT ALL ON public.thiet_bi_tep_dinh_kem TO service_role;

ALTER TABLE public.thiet_bi_tep_dinh_kem ENABLE ROW LEVEL SECURITY;

-- SELECT: đơn vị thấy tệp của thiết bị thuộc đơn vị mình; phòng KT/admin thấy tất cả
CREATE POLICY tep_select_scope ON public.thiet_bi_tep_dinh_kem
FOR SELECT USING (
  is_active_user(auth.uid()) AND (
    can_manage_equipment(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.thiet_bi tb
      WHERE tb.id = thiet_bi_tep_dinh_kem.thiet_bi_id
        AND tb.don_vi_quan_ly_id IS NOT DISTINCT FROM public.get_user_don_vi_id(auth.uid())
    )
  )
);

CREATE POLICY tep_write_manager ON public.thiet_bi_tep_dinh_kem
FOR ALL USING (can_manage_equipment(auth.uid()))
WITH CHECK (can_manage_equipment(auth.uid()));

CREATE TRIGGER trg_tep_updated
BEFORE UPDATE ON public.thiet_bi_tep_dinh_kem
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage RLS: SELECT scoped theo đơn vị thiết bị (thư mục đầu tiên = thiet_bi_id)
CREATE POLICY "tep_storage_select_scope"
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('thiet-bi-hinh-anh','thiet-bi-tai-lieu')
  AND is_active_user(auth.uid())
  AND (
    can_manage_equipment(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.thiet_bi tb
      WHERE tb.id::text = split_part(name, '/', 1)
        AND tb.don_vi_quan_ly_id IS NOT DISTINCT FROM public.get_user_don_vi_id(auth.uid())
    )
  )
);

CREATE POLICY "tep_storage_write_manager"
ON storage.objects FOR ALL
USING (
  bucket_id IN ('thiet-bi-hinh-anh','thiet-bi-tai-lieu')
  AND can_manage_equipment(auth.uid())
)
WITH CHECK (
  bucket_id IN ('thiet-bi-hinh-anh','thiet-bi-tai-lieu')
  AND can_manage_equipment(auth.uid())
);
