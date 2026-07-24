-- ============================================================================
-- grants-baseline.sql
-- Chạy sau mỗi migration để đảm bảo quyền idempotent.
-- Không phụ thuộc event trigger `mirats_auto_public_grants` (có thể timeout).
-- Chỉ dùng GRANT (không REVOKE) — không nới quyền mới, chỉ khôi phục baseline.
-- ============================================================================

-- Schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, sandbox_exec, postgres;

-- Bảng: end-user roles
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- Bảng: internal roles (chạy trigger SECURITY DEFINER)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sandbox_exec;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

-- Sequences
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role, sandbox_exec, postgres;

-- Functions (EXECUTE) — tất cả routine trong public
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public
  TO authenticated, service_role, sandbox_exec, postgres;

-- Default privileges cho object tạo mới sau này (bởi bất kỳ role nào ghi migration)
-- Đảm bảo bảng/sequence/function mới tự có baseline, không phải chờ event trigger.
DO $$
DECLARE r text;
BEGIN
  FOR r IN SELECT unnest(ARRAY['postgres','sandbox_exec','service_role']) LOOP
    EXECUTE format($f$
      ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLES TO authenticated;
      ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public
        GRANT ALL ON TABLES TO service_role, sandbox_exec, postgres;
      ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public
        GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO authenticated;
      ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public
        GRANT ALL ON SEQUENCES TO service_role, sandbox_exec, postgres;
      ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public
        GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role, sandbox_exec, postgres;
    $f$, r, r, r, r, r);
  END LOOP;
EXCEPTION WHEN insufficient_privilege THEN
  -- Nếu chạy dưới role không có quyền ALTER DEFAULT PRIVILEGES của postgres,
  -- bỏ qua — grants tường minh ở trên vẫn phủ.
  RAISE NOTICE 'skip ALTER DEFAULT PRIVILEGES for missing role';
END$$;

-- EXECUTE tường minh cho RPC nhạy cảm (anon) — chỉ khi function tồn tại
DO $$
BEGIN
  IF to_regprocedure('public.get_ai_public_config()') IS NOT NULL THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_ai_public_config() TO anon, authenticated';
  END IF;
END$$;
