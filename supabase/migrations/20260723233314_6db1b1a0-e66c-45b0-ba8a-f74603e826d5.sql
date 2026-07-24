-- 1) Baseline grants for existing public objects used by the app/Data API.
GRANT USAGE ON SCHEMA public TO authenticated, service_role, sandbox_exec, postgres;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r','p')
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLE public.%I TO authenticated', r.relname);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role, sandbox_exec, postgres', r.relname);
  END LOOP;
END $$;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'S'
  LOOP
    EXECUTE format('GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.%I TO authenticated', r.relname);
    EXECUTE format('GRANT ALL ON SEQUENCE public.%I TO service_role, sandbox_exec, postgres', r.relname);
  END LOOP;
END $$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role, sandbox_exec, postgres;

-- Keep future migrations from reintroducing the same missing-grant class.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role, sandbox_exec, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role, sandbox_exec, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role, sandbox_exec, postgres;

-- 2) Robust server-side entry point for adding a system component.
CREATE OR REPLACE FUNCTION public.khai_them_thanh_phan_he_thong(
  p_he_thong_id uuid,
  p_ma_thanh_phan text,
  p_ten text,
  p_loai_thiet_bi_yeu_cau uuid DEFAULT NULL,
  p_thanh_phan_cha uuid DEFAULT NULL,
  p_bat_buoc boolean DEFAULT true,
  p_thu_tu integer DEFAULT NULL,
  p_mo_ta text DEFAULT NULL
)
RETURNS TABLE(id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := public.current_uid();
  v_ma text := NULLIF(btrim(p_ma_thanh_phan), '');
  v_ten text := NULLIF(btrim(p_ten), '');
  v_id uuid;
BEGIN
  IF v_user IS NULL OR NOT public.is_active_user(v_user) THEN
    RAISE EXCEPTION 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn'
      USING ERRCODE = '42501';
  END IF;

  IF NOT public.can_manage_equipment(v_user) THEN
    RAISE EXCEPTION 'Tài khoản chưa có quyền khai thêm thành phần hệ thống'
      USING ERRCODE = '42501';
  END IF;

  IF p_he_thong_id IS NULL THEN
    RAISE EXCEPTION 'Chưa chọn hệ thống cha'
      USING ERRCODE = '23502';
  END IF;

  IF v_ten IS NULL THEN
    RAISE EXCEPTION 'Chưa nhập tên thành phần'
      USING ERRCODE = '23502';
  END IF;

  IF v_ma IS NULL THEN
    v_ma := 'TPHT_' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;

  -- Avoid rare random-code collision inside the database, not only in client code.
  WHILE EXISTS (
    SELECT 1 FROM public.he_thong_thanh_phan
    WHERE he_thong_id = p_he_thong_id
      AND ma_thanh_phan = v_ma
  ) LOOP
    v_ma := 'TPHT_' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END LOOP;

  INSERT INTO public.he_thong_thanh_phan (
    he_thong_id,
    ma_thanh_phan,
    ten,
    loai_thiet_bi_yeu_cau,
    thanh_phan_cha,
    bat_buoc,
    thu_tu,
    mo_ta,
    created_by
  ) VALUES (
    p_he_thong_id,
    v_ma,
    v_ten,
    p_loai_thiet_bi_yeu_cau,
    p_thanh_phan_cha,
    COALESCE(p_bat_buoc, true),
    p_thu_tu,
    NULLIF(btrim(COALESCE(p_mo_ta, '')), ''),
    v_user
  )
  RETURNING he_thong_thanh_phan.id INTO v_id;

  RETURN QUERY SELECT v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.khai_them_thanh_phan_he_thong(uuid, text, text, uuid, uuid, boolean, integer, text)
  TO authenticated, service_role, sandbox_exec, postgres;

-- Ensure helper functions referenced by RLS/policies are callable by runtime and verification roles.
GRANT EXECUTE ON FUNCTION public.current_uid() TO authenticated, service_role, sandbox_exec, postgres;
GRANT EXECUTE ON FUNCTION public.is_active_user(uuid) TO authenticated, service_role, sandbox_exec, postgres;
GRANT EXECUTE ON FUNCTION public.can_manage_equipment(uuid) TO authenticated, service_role, sandbox_exec, postgres;
GRANT EXECUTE ON FUNCTION public.get_user_don_vi_id(uuid) TO authenticated, service_role, sandbox_exec, postgres;
GRANT EXECUTE ON FUNCTION public.can_view_thiet_bi(uuid, uuid) TO authenticated, service_role, sandbox_exec, postgres;