-- MIRATS baseline permission hardening / anti-regression layer
-- Goal: prevent recurring permission denied errors after migrations/refactors.

-- 1) Baseline schema access
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, sandbox_exec, postgres;
GRANT CREATE ON SCHEMA public TO sandbox_exec, postgres;

-- 2) Baseline privileges for all existing public objects
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sandbox_exec;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sandbox_exec;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO sandbox_exec;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- 3) Default privileges for objects created by common migration owners.
-- These statements are intentionally repeated for both postgres and sandbox_exec because
-- migrations/refactors may run under either owner in this project.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO sandbox_exec;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL PRIVILEGES ON SEQUENCES TO sandbox_exec;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL PRIVILEGES ON SEQUENCES TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO sandbox_exec;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO sandbox_exec;
ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
  GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
  GRANT ALL PRIVILEGES ON SEQUENCES TO sandbox_exec;
ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
  GRANT ALL PRIVILEGES ON SEQUENCES TO postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO sandbox_exec;
ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO postgres;

-- 4) Explicitly stabilize ownership + execution for the high-risk RPCs used by UI writes.
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'khai_them_thanh_phan_he_thong',
        'gan_tai_san_vao_thanh_phan',
        'thao_tai_san_khoi_thanh_phan',
        'merge_danh_muc',
        'rpc_thanh_phan_toan_cuc'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO postgres', fn.signature);
    EXECUTE format('ALTER FUNCTION %s SECURITY DEFINER', fn.signature);
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO sandbox_exec', fn.signature);
  END LOOP;
END $$;

-- 5) Reusable idempotent grant function. This can be called manually by migrations
-- and by the event trigger below after future DDL changes.
CREATE OR REPLACE FUNCTION public.mirats_apply_public_grants()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  obj record;
BEGIN
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, sandbox_exec, postgres;
  GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public TO authenticated;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sandbox_exec;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

  GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sandbox_exec;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO sandbox_exec;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;

  FOR obj IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'khai_them_thanh_phan_he_thong',
        'gan_tai_san_vao_thanh_phan',
        'thao_tai_san_khoi_thanh_phan',
        'merge_danh_muc',
        'rpc_thanh_phan_toan_cuc'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO postgres', obj.signature);
    EXECUTE format('ALTER FUNCTION %s SECURITY DEFINER', obj.signature);
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', obj.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', obj.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', obj.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO sandbox_exec', obj.signature);
  END LOOP;
END;
$$;

ALTER FUNCTION public.mirats_apply_public_grants() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.mirats_apply_public_grants() TO postgres, sandbox_exec, service_role;

DROP EVENT TRIGGER IF EXISTS mirats_auto_public_grants;
CREATE EVENT TRIGGER mirats_auto_public_grants
  ON ddl_command_end
  WHEN TAG IN (
    'CREATE TABLE',
    'CREATE TABLE AS',
    'ALTER TABLE',
    'CREATE FUNCTION',
    'ALTER FUNCTION',
    'CREATE SEQUENCE',
    'ALTER SEQUENCE',
    'CREATE VIEW',
    'ALTER VIEW',
    'CREATE MATERIALIZED VIEW',
    'ALTER MATERIALIZED VIEW'
  )
  EXECUTE FUNCTION public.mirats_apply_public_grants();

ALTER EVENT TRIGGER mirats_auto_public_grants ENABLE ALWAYS;

-- 6) Apply once immediately after installing the trigger.
DO $$
BEGIN
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, sandbox_exec, postgres;
  GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public TO authenticated;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sandbox_exec;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
  GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sandbox_exec;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO sandbox_exec;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;
END $$;