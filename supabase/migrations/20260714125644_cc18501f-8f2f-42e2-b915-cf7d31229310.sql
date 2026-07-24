
-- 1) Cột lưu mã cũ để rollback / tra ngược
ALTER TABLE public.thiet_bi ADD COLUMN IF NOT EXISTS ma_thiet_bi_cu TEXT;
COMMENT ON COLUMN public.thiet_bi.ma_thiet_bi_cu IS 'Mã thiết bị trước khi chuẩn hoá sang TB_XXXXXXXX. Chỉ dùng để tra ngược.';

-- 2) Hàm sinh mã ngẫu nhiên trong DB (idempotent) — Crockford base32, bỏ I/O/U/L
CREATE OR REPLACE FUNCTION public._gen_ma_thiet_bi_random(len int DEFAULT 8)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  s text := '';
  i int;
BEGIN
  FOR i IN 1..len LOOP
    s := s || substr(alphabet, 1 + (floor(random() * length(alphabet)))::int, 1);
  END LOOP;
  RETURN 'TB_' || s;
END $$;

-- 3) Snapshot mã cũ vào ma_thiet_bi_cu (chỉ lần đầu, cho các bản ghi chưa đúng định dạng)
UPDATE public.thiet_bi
   SET ma_thiet_bi_cu = ma_thiet_bi
 WHERE ma_thiet_bi_cu IS NULL
   AND ma_thiet_bi !~ '^TB_[0-9A-HJKMNP-TV-Z]{8}$';

-- 4) Regen mã cho từng dòng chưa đúng định dạng, đảm bảo unique
DO $$
DECLARE
  r RECORD;
  new_ma text;
  attempt int;
BEGIN
  FOR r IN
    SELECT id FROM public.thiet_bi
     WHERE ma_thiet_bi !~ '^TB_[0-9A-HJKMNP-TV-Z]{8}$'
  LOOP
    attempt := 0;
    LOOP
      new_ma := public._gen_ma_thiet_bi_random(8);
      -- Kiểm tra trùng trước khi update để tránh vướng unique_violation
      IF NOT EXISTS (SELECT 1 FROM public.thiet_bi WHERE ma_thiet_bi = new_ma) THEN
        UPDATE public.thiet_bi SET ma_thiet_bi = new_ma WHERE id = r.id;
        EXIT;
      END IF;
      attempt := attempt + 1;
      IF attempt > 30 THEN
        RAISE EXCEPTION 'Không sinh được mã duy nhất cho id=%', r.id;
      END IF;
    END LOOP;
  END LOOP;
END $$;
