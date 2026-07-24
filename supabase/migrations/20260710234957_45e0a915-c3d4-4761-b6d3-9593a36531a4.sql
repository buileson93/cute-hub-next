CREATE TABLE public.bang_cot_tuy_chinh (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bang_key TEXT NOT NULL,
  cau_hinh JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, bang_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bang_cot_tuy_chinh TO authenticated;
GRANT ALL ON public.bang_cot_tuy_chinh TO service_role;

ALTER TABLE public.bang_cot_tuy_chinh ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own column prefs"
  ON public.bang_cot_tuy_chinh FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_bang_cot_tuy_chinh_updated_at
  BEFORE UPDATE ON public.bang_cot_tuy_chinh
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();