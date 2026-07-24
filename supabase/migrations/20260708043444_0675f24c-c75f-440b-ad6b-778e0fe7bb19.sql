CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_entity_id text;
  v_detail jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_entity_id := (to_jsonb(OLD)->>'id');
    v_detail := jsonb_build_object('old', to_jsonb(OLD));
  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_id := (to_jsonb(NEW)->>'id');
    v_detail := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSE
    v_entity_id := (to_jsonb(NEW)->>'id');
    v_detail := jsonb_build_object('new', to_jsonb(NEW));
  END IF;

  INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
  VALUES (v_user, lower(TG_OP) || '_' || TG_TABLE_NAME, TG_TABLE_NAME, v_entity_id, v_detail);

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS audit_self_insert ON public.audit_log;
CREATE POLICY audit_system_insert ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'thiet_bi','thiet_bi_tep_dinh_kem','form_template','form_field',
    'form_submission','form_submission_thiet_bi','giay_phep','profiles','user_roles',
    'dm_don_vi','dm_he_thong','dm_nhom_he_thong','dm_loai_thiet_bi','dm_loai_giay_phep',
    'dm_nha_cung_cap','dm_nha_san_xuat','dm_noi_cap','dm_trang_thai_thiet_bi','dm_vi_tri'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_trg ON public.%I', t);
    EXECUTE format('CREATE TRIGGER audit_trg AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_row_change()', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.log_app_event(_action text, _entity text, _entity_id text, _detail jsonb)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
  VALUES (auth.uid(), _action, _entity, _entity_id, COALESCE(_detail, '{}'::jsonb));
$$;

GRANT EXECUTE ON FUNCTION public.log_app_event(text, text, text, jsonb) TO authenticated;