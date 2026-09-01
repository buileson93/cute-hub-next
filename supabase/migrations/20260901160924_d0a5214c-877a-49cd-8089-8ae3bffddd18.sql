ALTER TABLE public.hong_hoc ADD COLUMN IF NOT EXISTS su_co_id uuid REFERENCES public.su_co(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_hong_hoc_su_co_id ON public.hong_hoc(su_co_id);