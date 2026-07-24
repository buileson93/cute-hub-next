DO $$
DECLARE
  v_err text;
BEGIN
  BEGIN
    SET LOCAL role authenticated;
    INSERT INTO public.dm_he_thong (ma, ten, nhom_he_thong_id, phan_loai_id, don_vi_id)
    VALUES ('TEST_DIAG_' || extract(epoch from now())::text, 'diag',
            '67a95071-c65d-45cf-831d-95da247fad20',
            'f024c88e-8702-49c8-a302-15b93f6acb3c',
            'd8d935d5-1545-4139-836d-8dc8a7cc54e0');
    RAISE NOTICE 'INSERT SUCCESS';
    RAISE EXCEPTION 'rollback for diagnostic';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
    RAISE NOTICE 'DIAG ERROR: %', v_err;
  END;
END $$;