GRANT INSERT, SELECT ON public.audit_log TO authenticated, service_role;
GRANT INSERT, SELECT ON public.thiet_bi_vong_doi TO authenticated, service_role;
GRANT ALL ON public.audit_log TO PUBLIC;
GRANT ALL ON public.thiet_bi_vong_doi TO PUBLIC;