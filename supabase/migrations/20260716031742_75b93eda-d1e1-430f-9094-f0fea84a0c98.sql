
ALTER TABLE public.bao_tri ADD COLUMN IF NOT EXISTS luu_tru boolean NOT NULL DEFAULT false;
ALTER TABLE public.su_co  ADD COLUMN IF NOT EXISTS luu_tru boolean NOT NULL DEFAULT false;
