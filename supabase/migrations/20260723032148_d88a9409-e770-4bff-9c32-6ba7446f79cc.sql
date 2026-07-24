DO $$
DECLARE
  fn_name text;
  fn regprocedure;
BEGIN
  FOREACH fn_name IN ARRAY ARRAY[
    'public.current_uid()',
    'public.is_active_user(uuid)',
    'public.get_user_don_vi_id(uuid)',
    'public.can_manage_equipment(uuid)',
    'public.has_role(uuid,public.app_role)',
    'public.has_permission(uuid,text,text)'
  ]
  LOOP
    fn := to_regprocedure(fn_name);
    IF fn IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn);
    END IF;
  END LOOP;
END $$;