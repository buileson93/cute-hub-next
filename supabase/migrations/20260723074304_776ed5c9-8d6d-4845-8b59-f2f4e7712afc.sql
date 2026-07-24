
REVOKE EXECUTE ON FUNCTION public.pm_next_due_date(uuid, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.pm_sinh_cong_viec(date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.pm_hoan_thanh_cong_viec(uuid, date, uuid, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.pm_bo_qua_cong_viec(uuid, text) FROM PUBLIC, anon;
