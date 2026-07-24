
DO $$ BEGIN
  CREATE TYPE public.bao_cao_annotation_loai AS ENUM ('bao_tri','su_co','thay_doi','ghi_chu');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.bao_cao_annotation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thoi_diem timestamptz NOT NULL,
  tieu_de text NOT NULL,
  mo_ta text,
  loai public.bao_cao_annotation_loai NOT NULL DEFAULT 'ghi_chu',
  mau text,
  he_thong_id uuid REFERENCES public.dm_he_thong(id) ON DELETE SET NULL,
  tao_boi uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tao_luc timestamptz NOT NULL DEFAULT now(),
  cap_nhat_luc timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bao_cao_annotation_thoi_diem ON public.bao_cao_annotation(thoi_diem);
CREATE INDEX IF NOT EXISTS idx_bao_cao_annotation_he_thong ON public.bao_cao_annotation(he_thong_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bao_cao_annotation TO authenticated;
GRANT ALL ON public.bao_cao_annotation TO service_role;

ALTER TABLE public.bao_cao_annotation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "annotation_select_all_auth" ON public.bao_cao_annotation;
CREATE POLICY "annotation_select_all_auth" ON public.bao_cao_annotation
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "annotation_insert_kt_admin" ON public.bao_cao_annotation;
CREATE POLICY "annotation_insert_kt_admin" ON public.bao_cao_annotation
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')
  );

DROP POLICY IF EXISTS "annotation_update_owner_or_admin" ON public.bao_cao_annotation;
CREATE POLICY "annotation_update_owner_or_admin" ON public.bao_cao_annotation
  FOR UPDATE TO authenticated
  USING (
    tao_boi = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'phong_kt')
  )
  WITH CHECK (
    tao_boi = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'phong_kt')
  );

DROP POLICY IF EXISTS "annotation_delete_owner_or_admin" ON public.bao_cao_annotation;
CREATE POLICY "annotation_delete_owner_or_admin" ON public.bao_cao_annotation
  FOR DELETE TO authenticated
  USING (
    tao_boi = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'phong_kt')
  );

CREATE OR REPLACE FUNCTION public.tg_bao_cao_annotation_updated()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.cap_nhat_luc = now();
  RETURN NEW;
END; $$;
GRANT EXECUTE ON FUNCTION public.tg_bao_cao_annotation_updated() TO authenticated;

DROP TRIGGER IF EXISTS trg_bao_cao_annotation_updated ON public.bao_cao_annotation;
CREATE TRIGGER trg_bao_cao_annotation_updated
  BEFORE UPDATE ON public.bao_cao_annotation
  FOR EACH ROW EXECUTE FUNCTION public.tg_bao_cao_annotation_updated();
