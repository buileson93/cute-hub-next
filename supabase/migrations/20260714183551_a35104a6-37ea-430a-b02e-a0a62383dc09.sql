
-- T18 — Khoá mã thiết bị (immutable) + bỏ cột qr_code (chuyển sang URL /q/<ma>).

-- 1) Bỏ cột qr_code (không dùng; QR nhãn dựng từ /q/<ma_thiet_bi>).
ALTER TABLE public.thiet_bi DROP COLUMN IF EXISTS qr_code;

-- 2) Trigger chặn UPDATE ma_thiet_bi.
CREATE OR REPLACE FUNCTION public.tg_thiet_bi_khoa_ma()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ma_thiet_bi IS DISTINCT FROM OLD.ma_thiet_bi THEN
    RAISE EXCEPTION 'ma_thiet_bi là bất biến sau khi tạo (cũ=%, mới=%)',
      OLD.ma_thiet_bi, NEW.ma_thiet_bi
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_thiet_bi_khoa_ma ON public.thiet_bi;
CREATE TRIGGER trg_thiet_bi_khoa_ma
BEFORE UPDATE OF ma_thiet_bi ON public.thiet_bi
FOR EACH ROW
EXECUTE FUNCTION public.tg_thiet_bi_khoa_ma();
