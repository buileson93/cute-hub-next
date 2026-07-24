
REVOKE ALL ON FUNCTION public.create_change_request(public.change_request_loai, jsonb, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_change_request(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_change_request(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.approve_change_request(uuid, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_change_request(public.change_request_loai, jsonb, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_change_request(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_change_request(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.approve_change_request(uuid, text) TO authenticated, service_role;
