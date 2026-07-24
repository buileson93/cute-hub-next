-- T09: Database-level hierarchy invariant
-- Canonical chain: dm_phan_loai -> dm_nhom_he_thong -> dm_he_thong -> thiet_bi
-- Denormalized columns (phan_loai_id, nhom_he_thong_id, linh_vuc_id) must be
-- derived from the parent so no conflicting FK combination can ever be written.

-- 1) System derives its classification from its group
CREATE OR REPLACE FUNCTION public.he_thong_sync_phan_loai()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_pl uuid;
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

DROP TRIGGER IF EXISTS trg_he_thong_sync_phan_loai ON public.dm_he_thong;
CREATE TRIGGER trg_he_thong_sync_phan_loai
BEFORE INSERT OR UPDATE OF nhom_he_thong_id, phan_loai_id ON public.dm_he_thong
FOR EACH ROW EXECUTE FUNCTION public.he_thong_sync_phan_loai();

-- 2) Device derives its full hierarchy from its system
CREATE OR REPLACE FUNCTION public.thiet_bi_sync_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r record;
BEGIN
  IF NEW.he_thong_id IS NOT NULL THEN
    SELECT phan_loai_id, nhom_he_thong_id, linh_vuc_id
      INTO r
      FROM public.dm_he_thong WHERE id = NEW.he_thong_id;
    IF FOUND THEN
      NEW.phan_loai_id     := r.phan_loai_id;
      NEW.nhom_he_thong_id := r.nhom_he_thong_id;
      NEW.linh_vuc_id      := r.linh_vuc_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_thiet_bi_sync_hierarchy ON public.thiet_bi;
CREATE TRIGGER trg_thiet_bi_sync_hierarchy
BEFORE INSERT OR UPDATE OF he_thong_id, phan_loai_id, nhom_he_thong_id, linh_vuc_id ON public.thiet_bi
FOR EACH ROW EXECUTE FUNCTION public.thiet_bi_sync_hierarchy();

-- 3) Cascade: when a group's classification changes, propagate to its systems
CREATE OR REPLACE FUNCTION public.nhom_cascade_phan_loai()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.phan_loai_id IS DISTINCT FROM OLD.phan_loai_id AND NEW.phan_loai_id IS NOT NULL THEN
    UPDATE public.dm_he_thong SET phan_loai_id = NEW.phan_loai_id
    WHERE nhom_he_thong_id = NEW.id AND phan_loai_id IS DISTINCT FROM NEW.phan_loai_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nhom_cascade_phan_loai ON public.dm_nhom_he_thong;
CREATE TRIGGER trg_nhom_cascade_phan_loai
AFTER UPDATE OF phan_loai_id ON public.dm_nhom_he_thong
FOR EACH ROW EXECUTE FUNCTION public.nhom_cascade_phan_loai();

-- 4) Cascade: when a system's hierarchy changes, propagate to its devices
CREATE OR REPLACE FUNCTION public.he_thong_cascade_thiet_bi()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.phan_loai_id IS DISTINCT FROM OLD.phan_loai_id
     OR NEW.nhom_he_thong_id IS DISTINCT FROM OLD.nhom_he_thong_id
     OR NEW.linh_vuc_id IS DISTINCT FROM OLD.linh_vuc_id THEN
    UPDATE public.thiet_bi
      SET phan_loai_id = NEW.phan_loai_id,
          nhom_he_thong_id = NEW.nhom_he_thong_id,
          linh_vuc_id = NEW.linh_vuc_id
    WHERE he_thong_id = NEW.id
      AND (phan_loai_id IS DISTINCT FROM NEW.phan_loai_id
        OR nhom_he_thong_id IS DISTINCT FROM NEW.nhom_he_thong_id
        OR linh_vuc_id IS DISTINCT FROM NEW.linh_vuc_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_he_thong_cascade_thiet_bi ON public.dm_he_thong;
CREATE TRIGGER trg_he_thong_cascade_thiet_bi
AFTER UPDATE OF phan_loai_id, nhom_he_thong_id, linh_vuc_id ON public.dm_he_thong
FOR EACH ROW EXECUTE FUNCTION public.he_thong_cascade_thiet_bi();