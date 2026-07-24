
-- 1) Extend audit_log with dedicated old/new columns
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS table_name text,
  ADD COLUMN IF NOT EXISTS operation  text,
  ADD COLUMN IF NOT EXISTS old_data   jsonb,
  ADD COLUMN IF NOT EXISTS new_data   jsonb;

CREATE INDEX IF NOT EXISTS audit_log_table_created_idx
  ON public.audit_log (table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_operation_idx
  ON public.audit_log (operation);

-- 2) Generic row-change trigger function
CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_old  jsonb;
  v_new  jsonb;
  v_id   text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_old := NULL;
    v_new := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    -- Bỏ qua UPDATE không thay đổi thực chất
    IF v_old = v_new THEN
      RETURN NEW;
    END IF;
  ELSE -- DELETE
    v_old := to_jsonb(OLD);
    v_new := NULL;
  END IF;

  v_id := COALESCE(
    (COALESCE(v_new, v_old)->>'id'),
    (COALESCE(v_new, v_old)->>'ma_thiet_bi'),
    (COALESCE(v_new, v_old)->>'ma')
  );

  INSERT INTO public.audit_log (
    user_id, action, entity, entity_id, detail, severity,
    table_name, operation, old_data, new_data
  ) VALUES (
    v_user,
    'row_' || lower(TG_OP),
    TG_TABLE_NAME,
    v_id,
    jsonb_build_object('trigger', true),
    'info',
    TG_TABLE_NAME,
    TG_OP,
    v_old,
    v_new
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3) Attach triggers to key business tables (idempotent)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'thiet_bi','su_co','bao_tri','giay_phep','giay_phep_khai_thac',
    'hong_hoc','ban_giao','vat_tu','kho_giao_dich',
    'dm_he_thong','dm_don_vi','he_thong_thanh_phan',
    'user_roles','form_submission'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%1$s ON public.%1$I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_audit_%1$s
         AFTER INSERT OR UPDATE OR DELETE ON public.%1$I
         FOR EACH ROW EXECUTE FUNCTION public.audit_row_change()',
      t
    );
  END LOOP;
END $$;
