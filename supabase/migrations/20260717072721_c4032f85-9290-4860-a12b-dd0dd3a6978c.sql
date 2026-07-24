
-- 1. Backfill snapshot đơn vị cho thành phần
UPDATE public.he_thong_thanh_phan tp
SET don_vi_id_snapshot = ht.don_vi_id
FROM public.dm_he_thong ht
WHERE tp.he_thong_id = ht.id
  AND tp.don_vi_id_snapshot IS DISTINCT FROM ht.don_vi_id;

-- 2. Trigger validate: hệ thống phải có đơn vị
CREATE OR REPLACE FUNCTION public.validate_he_thong_don_vi()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.don_vi_id IS NULL THEN
    RAISE EXCEPTION 'Đơn vị quản lý là bắt buộc khi tạo/sửa hệ thống'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_he_thong_don_vi ON public.dm_he_thong;
CREATE TRIGGER trg_validate_he_thong_don_vi
  BEFORE INSERT OR UPDATE ON public.dm_he_thong
  FOR EACH ROW EXECUTE FUNCTION public.validate_he_thong_don_vi();

-- 3. Trigger tự điền snapshot cho thành phần theo hệ thống cha
CREATE OR REPLACE FUNCTION public.sync_thanh_phan_don_vi()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT don_vi_id INTO NEW.don_vi_id_snapshot
  FROM public.dm_he_thong
  WHERE id = NEW.he_thong_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_thanh_phan_don_vi ON public.he_thong_thanh_phan;
CREATE TRIGGER trg_sync_thanh_phan_don_vi
  BEFORE INSERT OR UPDATE OF he_thong_id ON public.he_thong_thanh_phan
  FOR EACH ROW EXECUTE FUNCTION public.sync_thanh_phan_don_vi();

-- 4. Trigger cascade khi hệ thống đổi đơn vị
CREATE OR REPLACE FUNCTION public.cascade_he_thong_don_vi()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.don_vi_id IS DISTINCT FROM OLD.don_vi_id THEN
    UPDATE public.he_thong_thanh_phan
    SET don_vi_id_snapshot = NEW.don_vi_id
    WHERE he_thong_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cascade_he_thong_don_vi ON public.dm_he_thong;
CREATE TRIGGER trg_cascade_he_thong_don_vi
  AFTER UPDATE OF don_vi_id ON public.dm_he_thong
  FOR EACH ROW EXECUTE FUNCTION public.cascade_he_thong_don_vi();
