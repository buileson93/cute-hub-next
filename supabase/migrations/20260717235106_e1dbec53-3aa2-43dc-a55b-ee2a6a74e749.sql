GRANT INSERT, UPDATE, DELETE, SELECT ON public.search_index TO authenticated, service_role, anon;
GRANT USAGE ON SCHEMA public TO authenticated, service_role, anon;