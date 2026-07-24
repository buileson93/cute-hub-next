-- Fix: FK RI trigger cần UPDATE quyền trên bảng cha để lock FOR KEY SHARE.
-- Grant đầy đủ cho authenticated, service_role, và owner-role trên toàn public schema.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace
      AND c.relkind IN ('r','p')
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON public.%I TO authenticated', r.relname);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', r.relname);
    EXECUTE format('GRANT ALL ON public.%I TO postgres', r.relname);
    EXECUTE format('GRANT ALL ON public.%I TO sandbox_exec', r.relname);
  END LOOP;

  FOR r IN
    SELECT c.relname FROM pg_class c
    WHERE c.relnamespace='public'::regnamespace AND c.relkind IN ('S')
  LOOP
    EXECUTE format('GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.%I TO authenticated, service_role, postgres, sandbox_exec', r.relname);
  END LOOP;
END $$;

-- Đảm bảo default privileges cho tương lai
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO authenticated, service_role;