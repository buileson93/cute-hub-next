CREATE TABLE public.cay_thay_doi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loai text NOT NULL,
  he_thong_id text,
  mo_ta text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  snapshot_cu jsonb NOT NULL DEFAULT '{}'::jsonb,
  trang_thai text NOT NULL DEFAULT 'cho_duyet',
  da_ap_dung boolean NOT NULL DEFAULT false,
  da_hoan_tac boolean NOT NULL DEFAULT false,
  nguoi_tao uuid,
  nguoi_duyet uuid,
  duyet_luc timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cay_thay_doi TO authenticated;
GRANT ALL ON public.cay_thay_doi TO service_role;
ALTER TABLE public.cay_thay_doi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read cay_thay_doi" ON public.cay_thay_doi FOR SELECT TO authenticated
  USING (public.can_manage_equipment(auth.uid()) OR nguoi_tao = auth.uid());
CREATE POLICY "insert cay_thay_doi" ON public.cay_thay_doi FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_equipment(auth.uid()) AND nguoi_tao = auth.uid());
CREATE POLICY "admin update cay_thay_doi" ON public.cay_thay_doi FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_ctd_updated BEFORE UPDATE ON public.cay_thay_doi
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- migration end