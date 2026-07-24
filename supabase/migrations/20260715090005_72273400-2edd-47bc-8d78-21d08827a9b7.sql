
-- 1) Hàm sinh mã ngẫu nhiên "DT_" + 8 HEX (không mang ý nghĩa)
CREATE OR REPLACE FUNCTION public.gen_dac_tinh_ma()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate text;
  attempts int := 0;
BEGIN
  LOOP
    candidate := 'DT_' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.dm_dac_tinh WHERE ma = candidate);
    attempts := attempts + 1;
    IF attempts > 20 THEN
      RAISE EXCEPTION 'Không sinh được mã đặc tính duy nhất sau 20 lần thử';
    END IF;
  END LOOP;
  RETURN candidate;
END;
$$;

-- 2) Trigger tự gán ma khi INSERT nếu để trống
CREATE OR REPLACE FUNCTION public.tg_dac_tinh_auto_ma()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ma IS NULL OR btrim(NEW.ma) = '' THEN
    NEW.ma := public.gen_dac_tinh_ma();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dac_tinh_auto_ma ON public.dm_dac_tinh;
CREATE TRIGGER trg_dac_tinh_auto_ma
BEFORE INSERT ON public.dm_dac_tinh
FOR EACH ROW EXECUTE FUNCTION public.tg_dac_tinh_auto_ma();

-- 3) Regen mã cho toàn bộ bản ghi hiện có
UPDATE public.dm_dac_tinh
SET ma = 'DT_' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));

-- 4) Bỏ trường nhom (đã không còn cần thiết)
ALTER TABLE public.dm_dac_tinh DROP COLUMN IF EXISTS nhom;
