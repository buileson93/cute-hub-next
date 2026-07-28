CREATE OR REPLACE FUNCTION public._gen_ma_dac_tinh()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  candidate text;
  i int := 0;
BEGIN
  IF NEW.ma IS NOT NULL AND length(btrim(NEW.ma)) > 0 THEN
    RETURN NEW;
  END IF;
  LOOP
    candidate := 'DT_' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.dm_dac_tinh WHERE ma = candidate);
    i := i + 1;
    IF i > 8 THEN
      RAISE EXCEPTION 'Không sinh được mã nhãn tài sản duy nhất sau 8 lần thử';
    END IF;
  END LOOP;
  NEW.ma := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dm_dac_tinh_gen_ma ON public.dm_dac_tinh;
CREATE TRIGGER trg_dm_dac_tinh_gen_ma
BEFORE INSERT ON public.dm_dac_tinh
FOR EACH ROW EXECUTE FUNCTION public._gen_ma_dac_tinh();