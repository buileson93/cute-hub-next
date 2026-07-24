DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.trg_http_before()'::regprocedure,
    'public.trg_http_sync_device()'::regprocedure,
    'public.trg_http_touch()'::regprocedure
  ]
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
  END LOOP;

  IF to_regprocedure('public.trg_layer3_audit()') IS NOT NULL THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.trg_layer3_audit() TO authenticated';
  END IF;
END $$;