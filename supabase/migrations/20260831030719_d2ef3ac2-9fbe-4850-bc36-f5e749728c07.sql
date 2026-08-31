-- 1. Lean UX canvases
DROP POLICY IF EXISTS "Users can manage their own project lean ux canvases" ON public.lean_ux_canvases;
CREATE POLICY "lean_ux_canvases_select" ON public.lean_ux_canvases
  FOR SELECT TO authenticated USING (public.can_access_du_an(project_id, public.current_uid()));
CREATE POLICY "lean_ux_canvases_write" ON public.lean_ux_canvases
  FOR ALL TO authenticated
  USING (public.can_manage_du_an(project_id, public.current_uid()))
  WITH CHECK (public.can_manage_du_an(project_id, public.current_uid()));

-- 2. Pitches
DROP POLICY IF EXISTS "Users can manage their own project pitches" ON public.pitches;
CREATE POLICY "pitches_select" ON public.pitches
  FOR SELECT TO authenticated USING (public.can_access_du_an(project_id, public.current_uid()));
CREATE POLICY "pitches_write" ON public.pitches
  FOR ALL TO authenticated
  USING (public.can_manage_du_an(project_id, public.current_uid()))
  WITH CHECK (public.can_manage_du_an(project_id, public.current_uid()));

-- 3. Pitch scopes (theo pitch cha)
DROP POLICY IF EXISTS "Users can manage their own project pitch scopes" ON public.pitch_scopes;
CREATE POLICY "pitch_scopes_select" ON public.pitch_scopes
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.pitches p
            WHERE p.id = pitch_scopes.pitch_id
              AND public.can_access_du_an(p.project_id, public.current_uid()))
  );
CREATE POLICY "pitch_scopes_write" ON public.pitch_scopes
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pitches p
            WHERE p.id = pitch_scopes.pitch_id
              AND public.can_manage_du_an(p.project_id, public.current_uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.pitches p
            WHERE p.id = pitch_scopes.pitch_id
              AND public.can_manage_du_an(p.project_id, public.current_uid()))
  );

-- 4. Project dossiers
DROP POLICY IF EXISTS "Users can manage their own project dossiers" ON public.project_dossiers;
CREATE POLICY "project_dossiers_select" ON public.project_dossiers
  FOR SELECT TO authenticated USING (public.can_access_du_an(project_id, public.current_uid()));
CREATE POLICY "project_dossiers_write" ON public.project_dossiers
  FOR ALL TO authenticated
  USING (public.can_manage_du_an(project_id, public.current_uid()))
  WITH CHECK (public.can_manage_du_an(project_id, public.current_uid()));

-- 5. Dossier documents (theo hồ sơ cha)
DROP POLICY IF EXISTS "Users can manage their own project dossier documents" ON public.dossier_documents;
CREATE POLICY "dossier_documents_select" ON public.dossier_documents
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.project_dossiers d
            WHERE d.id = dossier_documents.dossier_id
              AND public.can_access_du_an(d.project_id, public.current_uid()))
  );
CREATE POLICY "dossier_documents_write" ON public.dossier_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.project_dossiers d
            WHERE d.id = dossier_documents.dossier_id
              AND public.can_manage_du_an(d.project_id, public.current_uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.project_dossiers d
            WHERE d.id = dossier_documents.dossier_id
              AND public.can_manage_du_an(d.project_id, public.current_uid()))
  );

-- GRANT kỷ luật
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON public.lean_ux_canvases, public.pitches, public.pitch_scopes, public.project_dossiers, public.dossier_documents TO authenticated;
GRANT ALL PRIVILEGES ON public.lean_ux_canvases, public.pitches, public.pitch_scopes, public.project_dossiers, public.dossier_documents TO service_role, sandbox_exec, postgres;
GRANT UPDATE ON public.lean_ux_canvases, public.pitches, public.pitch_scopes, public.project_dossiers, public.dossier_documents TO sandbox_exec, postgres;
GRANT SELECT, REFERENCES ON public.du_an TO authenticated;
GRANT ALL PRIVILEGES ON public.du_an TO sandbox_exec, postgres;
GRANT UPDATE ON public.du_an TO sandbox_exec, postgres;