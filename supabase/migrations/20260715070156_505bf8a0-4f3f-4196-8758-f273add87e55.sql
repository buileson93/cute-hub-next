
CREATE OR REPLACE FUNCTION public.trg_thiet_bi_require_model()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.model_id IS NULL THEN
    RAISE EXCEPTION 'Thiết bị bắt buộc phải chọn model (dm_model). Vui lòng gán model_id trước khi lưu.'
      USING ERRCODE = 'check_violation',
            HINT = 'Nếu model chưa có trong danh mục, tạo model mới ở /danh-muc rồi quay lại.';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.model_id IS NULL AND OLD.model_id IS NOT NULL THEN
    RAISE EXCEPTION 'Không được xoá model_id của thiết bị đã có model.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_thiet_bi_require_model_biu ON public.thiet_bi;
CREATE TRIGGER trg_thiet_bi_require_model_biu
  BEFORE INSERT OR UPDATE OF model_id ON public.thiet_bi
  FOR EACH ROW EXECUTE FUNCTION public.trg_thiet_bi_require_model();

CREATE OR REPLACE VIEW public.v_thiet_bi_thieu_model AS
SELECT
  tb.id,
  tb.ma_thiet_bi,
  tb.ten_thiet_bi,
  tb.loai_thiet_bi_id,
  lt.ten          AS ten_loai_thiet_bi,
  tb.don_vi_id,
  tb.created_at,
  tb.updated_at
FROM public.thiet_bi tb
LEFT JOIN public.dm_loai_thiet_bi lt ON lt.id = tb.loai_thiet_bi_id
WHERE tb.model_id IS NULL;

GRANT SELECT ON public.v_thiet_bi_thieu_model TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.trg_dm_model_sync_loai_thiet_bi()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r record;
BEGIN
  IF NEW.loai_thiet_bi_id IS DISTINCT FROM OLD.loai_thiet_bi_id
     AND NEW.loai_thiet_bi_id IS NOT NULL THEN

    FOR r IN
      SELECT id, loai_thiet_bi_id
      FROM public.thiet_bi
      WHERE model_id = NEW.id
        AND loai_thiet_bi_id IS DISTINCT FROM NEW.loai_thiet_bi_id
    LOOP
      BEGIN
        INSERT INTO public.audit_log (
          actor_id, action, table_name, record_id,
          field_name, old_value, new_value, ghi_chu
        ) VALUES (
          auth.uid(), 'CASCADE_FIX', 'thiet_bi', r.id,
          'loai_thiet_bi_id',
          COALESCE(r.loai_thiet_bi_id::text, 'NULL'),
          NEW.loai_thiet_bi_id::text,
          format('Cascade từ dm_model %s: loai_thiet_bi_id đổi %s → %s',
                 NEW.id,
                 COALESCE(OLD.loai_thiet_bi_id::text, 'NULL'),
                 NEW.loai_thiet_bi_id::text)
        );
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;

      UPDATE public.thiet_bi
      SET loai_thiet_bi_id = NEW.loai_thiet_bi_id
      WHERE id = r.id;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
