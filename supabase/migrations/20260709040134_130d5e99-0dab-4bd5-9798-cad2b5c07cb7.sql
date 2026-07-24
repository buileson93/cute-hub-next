DROP TABLE IF EXISTS public._tmp_check;
CREATE TABLE public.he_thong_truong (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  he_thong_id text NOT NULL,
  field_key text NOT NULL,
  nhan text NOT NULL,
  kieu text NOT NULL DEFAULT 'text',
  tuy_chon jsonb NOT NULL DEFAULT '[]'::jsonb,
  thu_tu integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (he_thong_id, field_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.he_thong_truong TO authenticated;
GRANT ALL ON public.he_thong_truong TO service_role;
ALTER TABLE public.he_thong_truong ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read he_thong_truong" ON public.he_thong_truong FOR SELECT TO authenticated
  USING (public.is_active_user(auth.uid()));
CREATE POLICY "admin manage he_thong_truong" ON public.he_thong_truong FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_htt_updated BEFORE UPDATE ON public.he_thong_truong
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- migration end