
REVOKE ALL ON FUNCTION public.su_co_transition(text,uuid,text,text,jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.su_co_check_transition(text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public._n6_normalize(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.su_co_transition(text,uuid,text,text,jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.su_co_check_transition(text,text) TO authenticated, service_role;
