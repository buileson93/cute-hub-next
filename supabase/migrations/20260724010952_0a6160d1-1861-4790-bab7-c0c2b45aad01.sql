-- Baseline grants to prevent SECURITY DEFINER RPCs and FK checks from losing
-- underlying table privileges after code/schema refactors.
GRANT USAGE ON SCHEMA public TO authenticated, service_role, sandbox_exec, postgres;

GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER
ON ALL TABLES IN SCHEMA public
TO authenticated;

GRANT ALL PRIVILEGES
ON ALL TABLES IN SCHEMA public
TO service_role, sandbox_exec, postgres;

GRANT USAGE, SELECT, UPDATE
ON ALL SEQUENCES IN SCHEMA public
TO authenticated;

GRANT ALL PRIVILEGES
ON ALL SEQUENCES IN SCHEMA public
TO service_role, sandbox_exec, postgres;

GRANT EXECUTE
ON ALL FUNCTIONS IN SCHEMA public
TO authenticated, service_role, sandbox_exec, postgres;

-- Future objects created by either migration/runtime owner keep the same baseline.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO service_role, sandbox_exec, postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT ALL PRIVILEGES ON SEQUENCES TO service_role, sandbox_exec, postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role, sandbox_exec, postgres;

ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO service_role, sandbox_exec, postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
GRANT ALL PRIVILEGES ON SEQUENCES TO service_role, sandbox_exec, postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE sandbox_exec IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role, sandbox_exec, postgres;

NOTIFY pgrst, 'reload schema';