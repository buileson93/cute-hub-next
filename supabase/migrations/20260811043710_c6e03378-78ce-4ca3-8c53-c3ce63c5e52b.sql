ALTER TABLE public.thiet_bi ADD COLUMN vai_tro text DEFAULT 'he_thong' CHECK (vai_tro IN ('he_thong', 'ccdc', 'vat_tu'));
UPDATE public.thiet_bi SET vai_tro = 'he_thong';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.thiet_bi TO authenticated;
GRANT ALL ON public.thiet_bi TO service_role;
GRANT SELECT ON public.thiet_bi TO anon;
