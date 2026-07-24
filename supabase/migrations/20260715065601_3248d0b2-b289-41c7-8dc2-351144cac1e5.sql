
-- Backfill 17 slots: sync yeu cau theo loai của thiết bị đang lắp qua gan_chuc_nang
WITH slot_dev AS (
  SELECT tp.id AS slot_id, tb.loai_thiet_bi_id AS loai_dev
  FROM public.he_thong_thanh_phan tp
  JOIN public.gan_chuc_nang gc ON gc.thanh_phan_id = tp.id
  JOIN public.thiet_bi tb ON tb.id = gc.thiet_bi_id
  WHERE tp.loai_thiet_bi_yeu_cau IS NOT NULL
    AND tb.loai_thiet_bi_id IS NOT NULL
    AND tp.loai_thiet_bi_yeu_cau IS DISTINCT FROM tb.loai_thiet_bi_id
)
UPDATE public.he_thong_thanh_phan tp
SET loai_thiet_bi_yeu_cau = sd.loai_dev
FROM slot_dev sd
WHERE tp.id = sd.slot_id;

-- Trigger: khi INSERT/UPDATE gan_chuc_nang, nếu khe chưa có loai_thiet_bi_yeu_cau
-- thì tự điền theo loại của thiết bị lắp vào. Không ghi đè khai thủ công.
CREATE OR REPLACE FUNCTION public.trg_gan_chuc_nang_sync_loai_khe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dev_loai uuid;
  v_slot_loai uuid;
BEGIN
  IF NEW.thiet_bi_id IS NULL OR NEW.thanh_phan_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT loai_thiet_bi_id INTO v_dev_loai FROM public.thiet_bi WHERE id = NEW.thiet_bi_id;
  IF v_dev_loai IS NULL THEN RETURN NEW; END IF;

  SELECT loai_thiet_bi_yeu_cau INTO v_slot_loai
  FROM public.he_thong_thanh_phan WHERE id = NEW.thanh_phan_id;

  IF v_slot_loai IS NULL THEN
    UPDATE public.he_thong_thanh_phan
    SET loai_thiet_bi_yeu_cau = v_dev_loai
    WHERE id = NEW.thanh_phan_id;

    BEGIN
      INSERT INTO public.audit_log (actor_id, action, table_name, record_id, field_name, old_value, new_value, ghi_chu)
      VALUES (auth.uid(), 'AUTO_FIX', 'he_thong_thanh_phan', NEW.thanh_phan_id,
              'loai_thiet_bi_yeu_cau', 'NULL', v_dev_loai::text,
              'Invariant: tự điền loại yêu cầu theo thiết bị lắp vào khe');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gan_chuc_nang_sync_loai_khe_aiu ON public.gan_chuc_nang;
CREATE TRIGGER trg_gan_chuc_nang_sync_loai_khe_aiu
AFTER INSERT OR UPDATE OF thiet_bi_id, thanh_phan_id
ON public.gan_chuc_nang
FOR EACH ROW
EXECUTE FUNCTION public.trg_gan_chuc_nang_sync_loai_khe();
