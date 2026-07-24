CREATE OR REPLACE FUNCTION public.__bootstrap_exec_sql(sql text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog
AS $$ BEGIN EXECUTE sql; END; $$;
GRANT EXECUTE ON FUNCTION public.__bootstrap_exec_sql(text) TO sandbox_exec;