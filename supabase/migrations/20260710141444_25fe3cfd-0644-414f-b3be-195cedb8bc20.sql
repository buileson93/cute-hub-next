-- 1) Ánh xạ mã cũ -> mã mới (TB-000001 .. TB-00XXXX), giữ thứ tự theo mã cũ.
CREATE TEMP TABLE _ma_map ON COMMIT DROP AS
SELECT
  id,
  ma_thiet_bi AS old_ma,
  'TB-' || lpad((row_number() OVER (ORDER BY ma_thiet_bi))::text, 6, '0') AS new_ma
FROM public.thiet_bi;

-- 2) Đổi mã trên bảng gốc (định dạng mới khác hẳn cũ nên không đụng ràng buộc UNIQUE).
UPDATE public.thiet_bi t
SET ma_thiet_bi = m.new_ma
FROM _ma_map m
WHERE t.id = m.id;

-- 3) Cập nhật các cột "ảnh chụp" text lịch sử theo thiet_bi_id.
UPDATE public.su_co s   SET thiet_bi = m.new_ma          FROM _ma_map m WHERE s.thiet_bi_id = m.id;
UPDATE public.bao_tri b SET thiet_bi = m.new_ma          FROM _ma_map m WHERE b.thiet_bi_id = m.id;
UPDATE public.ban_giao g SET thiet_bi = m.new_ma         FROM _ma_map m WHERE g.thiet_bi_id = m.id;
UPDATE public.hong_hoc h SET thiet_bi_hong = m.new_ma    FROM _ma_map m WHERE h.thiet_bi_hong_id = m.id;
UPDATE public.hong_hoc h SET thiet_bi_thay_the = m.new_ma FROM _ma_map m WHERE h.thiet_bi_thay_the_id = m.id;

-- 4) Với dòng snapshot không có id nhưng khớp mã cũ dạng text.
UPDATE public.su_co s   SET thiet_bi = m.new_ma FROM _ma_map m WHERE s.thiet_bi_id IS NULL AND s.thiet_bi = m.old_ma;
UPDATE public.bao_tri b SET thiet_bi = m.new_ma FROM _ma_map m WHERE b.thiet_bi_id IS NULL AND b.thiet_bi = m.old_ma;
UPDATE public.ban_giao g SET thiet_bi = m.new_ma FROM _ma_map m WHERE g.thiet_bi_id IS NULL AND g.thiet_bi = m.old_ma;
UPDATE public.hong_hoc h SET thiet_bi_hong = m.new_ma FROM _ma_map m WHERE h.thiet_bi_hong_id IS NULL AND h.thiet_bi_hong = m.old_ma;
UPDATE public.hong_hoc h SET thiet_bi_thay_the = m.new_ma FROM _ma_map m WHERE h.thiet_bi_thay_the_id IS NULL AND h.thiet_bi_thay_the = m.old_ma;

-- 5) Bộ đếm + hàm sinh mã tuần tự cho thiết bị MỚI.
CREATE SEQUENCE IF NOT EXISTS public.thiet_bi_ma_seq;
SELECT setval('public.thiet_bi_ma_seq', (SELECT count(*) FROM public.thiet_bi));

CREATE OR REPLACE FUNCTION public.gen_ma_thiet_bi()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ma_thiet_bi IS NULL OR btrim(NEW.ma_thiet_bi) = '' THEN
    NEW.ma_thiet_bi := 'TB-' || lpad(nextval('public.thiet_bi_ma_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gen_ma_thiet_bi ON public.thiet_bi;
CREATE TRIGGER trg_gen_ma_thiet_bi
BEFORE INSERT ON public.thiet_bi
FOR EACH ROW
EXECUTE FUNCTION public.gen_ma_thiet_bi();