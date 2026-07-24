
ALTER FUNCTION public._gen_ma_thiet_bi_random(integer) SET search_path = public, pg_temp;

CREATE POLICY profiles_self_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
