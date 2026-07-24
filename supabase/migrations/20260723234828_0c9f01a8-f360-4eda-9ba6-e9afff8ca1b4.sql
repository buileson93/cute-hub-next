ALTER FUNCTION public.khai_them_thanh_phan_he_thong(uuid, text, text, uuid, uuid, boolean, integer, text) OWNER TO sandbox_exec;
ALTER FUNCTION public.sync_thanh_phan_don_vi() OWNER TO sandbox_exec;

GRANT EXECUTE ON FUNCTION public.khai_them_thanh_phan_he_thong(uuid, text, text, uuid, uuid, boolean, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.khai_them_thanh_phan_he_thong(uuid, text, text, uuid, uuid, boolean, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.khai_them_thanh_phan_he_thong(uuid, text, text, uuid, uuid, boolean, integer, text) TO sandbox_exec;
GRANT EXECUTE ON FUNCTION public.khai_them_thanh_phan_he_thong(uuid, text, text, uuid, uuid, boolean, integer, text) TO postgres;

GRANT EXECUTE ON FUNCTION public.sync_thanh_phan_don_vi() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_thanh_phan_don_vi() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_thanh_phan_don_vi() TO sandbox_exec;
GRANT EXECUTE ON FUNCTION public.sync_thanh_phan_don_vi() TO postgres;

NOTIFY pgrst, 'reload schema';