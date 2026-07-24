CREATE TABLE IF NOT EXISTS public._diag_log (id serial primary key, msg text, ts timestamptz default now());
GRANT ALL ON public._diag_log TO service_role;
DO $$
DECLARE v_err text; v_ctx text; v_state text;
BEGIN
  BEGIN
    SET LOCAL role authenticated;
    SET LOCAL "request.jwt.claim.sub" = '9b39d7ca-6a4c-4c07-8e3e-b0f3f61b8f3e'; -- placeholder, will fail is_active_user maybe
    INSERT INTO public.dm_he_thong (ma, ten, nhom_he_thong_id, phan_loai_id, don_vi_id)
    VALUES ('TEST_DIAG_'||floor(random()*1e9)::text, 'diag',
            '67a95071-c65d-45cf-831d-95da247fad20',
            'f024c88e-8702-49c8-a302-15b93f6acb3c',
            'd8d935d5-1545-4139-836d-8dc8a7cc54e0');
    INSERT INTO public._diag_log(msg) VALUES ('INSERT SUCCESS');
    RAISE EXCEPTION 'rollback';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT, v_ctx = PG_EXCEPTION_CONTEXT, v_state = RETURNED_SQLSTATE;
    RESET role;
    INSERT INTO public._diag_log(msg) VALUES ('STATE='||v_state||' MSG='||v_err||' CTX='||coalesce(v_ctx,''));
  END;
END $$;
SELECT 1;