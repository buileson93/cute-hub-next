-- Loại bỏ trigger trùng lặp gây lỗi permission denied khi insert dm_he_thong.
-- trg_he_thong_sync_phan_loai (SECURITY DEFINER) đã đảm nhiệm việc đồng bộ phan_loai_id.
DROP TRIGGER IF EXISTS trg_sync_taxonomy_he_thong ON public.dm_he_thong;

-- Đồng thời, cho chắc chắn với tương lai: chuyển sync_taxonomy_he_thong sang SECURITY DEFINER
-- phòng khi nó được gắn lại ở đâu đó.
CREATE OR REPLACE FUNCTION public.sync_taxonomy_he_thong()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;