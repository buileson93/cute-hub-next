
CREATE TABLE IF NOT EXISTS public.weekly_report_import (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  don_vi text,
  so_van_ban text,
  ngay_ky text,
  tuan_tu_ngay text,
  tuan_den_ngay text,
  tieu_de text,
  file_name text,
  file_size int,
  n_incidents_detected int NOT NULL DEFAULT 0,
  n_hong_hoc_detected int NOT NULL DEFAULT 0,
  n_incidents_created int NOT NULL DEFAULT 0,
  n_hong_hoc_created int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_by_name text,
  don_vi_ma text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.weekly_report_import TO authenticated;
GRANT ALL ON public.weekly_report_import TO service_role;
ALTER TABLE public.weekly_report_import ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wri_insert_self" ON public.weekly_report_import
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "wri_select_scope" ON public.weekly_report_import
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'phong_kt'::app_role)
    OR (don_vi_ma IS NOT NULL AND don_vi_ma = public.get_user_don_vi_ma(auth.uid()))
  );

CREATE INDEX IF NOT EXISTS ix_wri_created_at ON public.weekly_report_import (created_at DESC);
CREATE INDEX IF NOT EXISTS ix_wri_created_by ON public.weekly_report_import (created_by);
