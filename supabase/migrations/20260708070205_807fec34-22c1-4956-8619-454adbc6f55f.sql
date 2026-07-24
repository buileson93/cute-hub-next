CREATE OR REPLACE FUNCTION public._build_exec(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth, pg_catalog
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
GRANT EXECUTE ON FUNCTION public._build_exec(text) TO sandbox_exec;