
-- 1) Fix SECURITY DEFINER view: enforce querying user's RLS
ALTER VIEW public.v_do_thi_he_thong SET (security_invoker = true);

-- 2) Revoke EXECUTE on all SECURITY DEFINER public functions from PUBLIC and anon.
-- Authenticated role keeps access; trigger functions don't need EXECUTE grants.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef
      AND n.nspname = 'public'
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon;',
                   r.nspname, r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role;',
                   r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- 3) Tighten node_note RLS: require updated_by = auth.uid()
DROP POLICY IF EXISTS node_note_insert_auth ON public.node_note;
DROP POLICY IF EXISTS node_note_update_auth ON public.node_note;

CREATE POLICY node_note_insert_auth ON public.node_note
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND updated_by = auth.uid());

CREATE POLICY node_note_update_auth ON public.node_note
FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (updated_by = auth.uid());
