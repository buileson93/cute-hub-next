DO $$
DECLARE
  fn_name text;
  fn regprocedure;
BEGIN
  FOREACH fn_name IN ARRAY ARRAY[
    'public.trg_http_before()',
    'public.trg_http_sync_device()',
    'public.trg_http_touch()',
    'public.trg_layer3_audit()',
    'public.sync_thanh_phan_don_vi()',
    'public.trg_cascade_thanh_phan_vi_tri()',
    'public.trg_gcn_before()',
    'public.trg_gcn_after()',
    'public.trg_sync_thiet_bi_from_thanh_phan()',
    'public.sync_thiet_bi_he_thong_cache(uuid)',
    'public.validate_he_thong_don_vi()',
    'public.cascade_he_thong_don_vi()',
    'public.trg_cascade_he_thong_don_vi_to_tai_san()',
    'public.lap_tai_san_vao_thanh_phan(uuid,uuid,text,text)',
    'public.thao_tai_san_khoi_thanh_phan(uuid,uuid,text,text)'
  ]
  LOOP
    fn := to_regprocedure(fn_name);
    IF fn IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn);
    END IF;
  END LOOP;
END $$;