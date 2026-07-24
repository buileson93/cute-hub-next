
-- =====================================================================
-- Root cause fix: thiet_bi.loai_thiet_bi_id must always mirror
-- dm_model.loai_thiet_bi_id when a model is set.
-- =====================================================================

-- 1) Invariant trigger: BEFORE INSERT/UPDATE on thiet_bi
CREATE OR REPLACE FUNCTION public.trg_thiet_bi_loai_theo_model()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_model_loai uuid;
BEGIN
  IF NEW.model_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT loai_thiet_bi_id INTO v_model_loai
  FROM public.dm_model
  WHERE id = NEW.model_id;

  -- Only enforce when model actually declares a type.
  IF v_model_loai IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.loai_thiet_bi_id IS DISTINCT FROM v_model_loai THEN
    -- Auto-correct silently; log for traceability.
    BEGIN
      INSERT INTO public.audit_log (
        actor_id, action, table_name, record_id,
        field_name, old_value, new_value, ghi_chu
      ) VALUES (
        auth.uid(), 'AUTO_FIX', 'thiet_bi', NEW.id,
        'loai_thiet_bi_id',
        COALESCE(NEW.loai_thiet_bi_id::text, 'NULL'),
        v_model_loai::text,
        'Invariant: loai_thiet_bi_id đồng bộ theo dm_model.loai_thiet_bi_id'
      );
    EXCEPTION WHEN OTHERS THEN
      -- Never block writes on audit failure.
      NULL;
    END;
    NEW.loai_thiet_bi_id := v_model_loai;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_thiet_bi_loai_theo_model_biu ON public.thiet_bi;
CREATE TRIGGER trg_thiet_bi_loai_theo_model_biu
BEFORE INSERT OR UPDATE OF model_id, loai_thiet_bi_id
ON public.thiet_bi
FOR EACH ROW
EXECUTE FUNCTION public.trg_thiet_bi_loai_theo_model();

-- 2) Backfill: fix 23 mismatched + 9 rows missing loai (only where model has one).
UPDATE public.thiet_bi tb
SET loai_thiet_bi_id = m.loai_thiet_bi_id
FROM public.dm_model m
WHERE tb.model_id = m.id
  AND m.loai_thiet_bi_id IS NOT NULL
  AND tb.loai_thiet_bi_id IS DISTINCT FROM m.loai_thiet_bi_id;

-- 3) Trigger tương tự cho dm_model: khi loai_thiet_bi_id của model đổi,
--    tự đồng bộ mọi thiết bị đang gắn model đó.
CREATE OR REPLACE FUNCTION public.trg_dm_model_sync_loai_thiet_bi()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.loai_thiet_bi_id IS DISTINCT FROM OLD.loai_thiet_bi_id
     AND NEW.loai_thiet_bi_id IS NOT NULL THEN
    UPDATE public.thiet_bi
    SET loai_thiet_bi_id = NEW.loai_thiet_bi_id
    WHERE model_id = NEW.id
      AND loai_thiet_bi_id IS DISTINCT FROM NEW.loai_thiet_bi_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dm_model_sync_loai_thiet_bi_au ON public.dm_model;
CREATE TRIGGER trg_dm_model_sync_loai_thiet_bi_au
AFTER UPDATE OF loai_thiet_bi_id ON public.dm_model
FOR EACH ROW
EXECUTE FUNCTION public.trg_dm_model_sync_loai_thiet_bi();
