
-- Storage chat-files
DROP POLICY IF EXISTS "auth_read_chat-files" ON storage.objects;
CREATE POLICY "auth_read_chat-files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chat-files' AND (owner = auth.uid() OR public.can_manage_equipment(public.current_uid())));
DROP POLICY IF EXISTS "auth_ins_chat-files" ON storage.objects;
CREATE POLICY "auth_ins_chat-files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-files' AND owner = auth.uid());

-- Storage chu-ky
DROP POLICY IF EXISTS "auth_read_chu-ky" ON storage.objects;
CREATE POLICY "auth_read_chu-ky" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chu-ky' AND (owner = auth.uid() OR public.can_manage_equipment(public.current_uid())));
DROP POLICY IF EXISTS "auth_ins_chu-ky" ON storage.objects;
CREATE POLICY "auth_ins_chu-ky" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chu-ky' AND owner = auth.uid());

-- Các bucket dùng chung: ép owner khi upload
DO $$
DECLARE b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['avatars','model-anh','model-tai-lieu','nha-san-xuat-logo','so-do-tep','so-do-thu-vien','vi-tri-media']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'auth_ins_' || b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %L AND owner = auth.uid())', 'auth_ins_' || b, b);
  END LOOP;
END $$;

-- REVOKE anon/PUBLIC EXECUTE trên mọi SECURITY DEFINER function
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon, PUBLIC', r.nspname, r.proname, r.args);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- REVOKE authenticated trên các hàm admin_* / _* nội bộ
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
      AND (p.proname LIKE 'admin\_%' ESCAPE '\' OR p.proname LIKE '\_%' ESCAPE '\')
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM authenticated', r.nspname, r.proname, r.args);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

DO $$
BEGIN
  BEGIN ALTER FUNCTION public.current_uid() SET search_path = public; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER FUNCTION public.current_jwt() SET search_path = public; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER FUNCTION public.current_role() SET search_path = public; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
