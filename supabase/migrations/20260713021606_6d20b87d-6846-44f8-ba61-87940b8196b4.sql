
-- ============================================================================
-- INVARIANT taxonomy (khóa ngoại là nguồn chân lý duy nhất, KHÔNG suy từ tên):
--   Phân loại (dm_phan_loai)
--     └─ Nhóm hệ thống (dm_nhom_he_thong.phan_loai_id)
--          └─ Hệ thống (dm_he_thong.nhom_he_thong_id, .phan_loai_id)
--               └─ Thiết bị (thiet_bi.he_thong_id, .nhom_he_thong_id, .phan_loai_id)
--
-- Trigger đồng bộ khóa dẫn xuất theo cha khi INSERT/UPDATE. Chỉ ghi đè khi cha
-- có giá trị (non-null) để không xóa dữ liệu legacy khi cha còn thiếu thông tin.
-- ============================================================================

-- Hệ thống: phan_loai_id dẫn xuất từ nhóm hệ thống cha.
CREATE OR REPLACE FUNCTION public.sync_taxonomy_he_thong()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_pl uuid;
BEGIN
  IF NEW.nhom_he_thong_id IS NOT NULL THEN
    SELECT phan_loai_id INTO v_pl FROM public.dm_nhom_he_thong WHERE id = NEW.nhom_he_thong_id;
    IF v_pl IS NOT NULL THEN
      NEW.phan_loai_id := v_pl;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Thiết bị: nhom_he_thong_id + phan_loai_id dẫn xuất từ hệ thống cha.
CREATE OR REPLACE FUNCTION public.sync_taxonomy_thiet_bi()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_nhom uuid;
  v_pl uuid;
BEGIN
  IF NEW.he_thong_id IS NOT NULL THEN
    SELECT nhom_he_thong_id, phan_loai_id INTO v_nhom, v_pl
    FROM public.dm_he_thong WHERE id = NEW.he_thong_id;
    IF v_nhom IS NOT NULL THEN
      NEW.nhom_he_thong_id := v_nhom;
    END IF;
    IF v_pl IS NOT NULL THEN
      NEW.phan_loai_id := v_pl;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_taxonomy_he_thong ON public.dm_he_thong;
CREATE TRIGGER trg_sync_taxonomy_he_thong
  BEFORE INSERT OR UPDATE OF nhom_he_thong_id, phan_loai_id ON public.dm_he_thong
  FOR EACH ROW EXECUTE FUNCTION public.sync_taxonomy_he_thong();

DROP TRIGGER IF EXISTS trg_sync_taxonomy_thiet_bi ON public.thiet_bi;
CREATE TRIGGER trg_sync_taxonomy_thiet_bi
  BEFORE INSERT OR UPDATE OF he_thong_id, nhom_he_thong_id, phan_loai_id ON public.thiet_bi
  FOR EACH ROW EXECUTE FUNCTION public.sync_taxonomy_thiet_bi();
