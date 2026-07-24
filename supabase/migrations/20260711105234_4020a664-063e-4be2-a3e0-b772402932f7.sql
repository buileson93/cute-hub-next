-- P/N (part number) là thuộc tính của MẪU thiết bị, không phải của cá thể.
-- Thêm cột p_n vào dm_model và cho thiet_bi kế thừa tự động qua trigger sẵn có.
ALTER TABLE public.dm_model ADD COLUMN IF NOT EXISTS p_n text;

CREATE OR REPLACE FUNCTION public.thiet_bi_inherit_model()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE m public.dm_model;
BEGIN
  IF NEW.model_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.model_id IS DISTINCT FROM OLD.model_id) THEN
    SELECT * INTO m FROM public.dm_model WHERE id = NEW.model_id;
    IF FOUND THEN
      IF m.loai_thiet_bi_id IS NOT NULL THEN NEW.loai_thiet_bi_id := m.loai_thiet_bi_id; END IF;
      IF m.nha_san_xuat_id IS NOT NULL THEN NEW.nha_san_xuat_id := m.nha_san_xuat_id; END IF;
      IF m.field_set_id IS NOT NULL THEN NEW.field_set_id := m.field_set_id; END IF;
      IF m.p_n IS NOT NULL AND m.p_n <> '' THEN NEW.p_n := m.p_n; END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;