DROP FUNCTION IF EXISTS public._build_exec(text);
REVOKE USAGE ON SCHEMA auth FROM sandbox_exec;
REVOKE ALL ON auth.users FROM sandbox_exec;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA auth FROM sandbox_exec;
REVOKE ALL ON SCHEMA public FROM sandbox_exec;