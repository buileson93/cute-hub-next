
-- ============================================
-- Migration 2: audit_log v2 + observability
-- ============================================

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS ip inet,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS to_chuc_id uuid,
  ADD COLUMN IF NOT EXISTS don_vi_id uuid,
  ADD COLUMN IF NOT EXISTS he_thong_id uuid;

CREATE INDEX IF NOT EXISTS audit_log_user_idx ON public.audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON public.audit_log(entity, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_severity_idx ON public.audit_log(severity, created_at DESC);

-- Feature usage log
CREATE TABLE public.feature_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  feature text NOT NULL,
  path text,
  params jsonb,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX feature_usage_user_idx ON public.feature_usage_log(user_id, created_at DESC);
CREATE INDEX feature_usage_feat_idx ON public.feature_usage_log(feature, created_at DESC);
GRANT SELECT ON public.feature_usage_log TO authenticated;
GRANT ALL ON public.feature_usage_log TO service_role;
ALTER TABLE public.feature_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fu_owner_read" ON public.feature_usage_log FOR SELECT TO authenticated
  USING (user_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt'));

-- Auth event log
CREATE TABLE public.auth_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event text NOT NULL, -- login|logout|role_grant|role_revoke|scope_change|impersonate
  target_user_id uuid,
  detail jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_event_user_idx ON public.auth_event_log(user_id, created_at DESC);
GRANT SELECT ON public.auth_event_log TO authenticated;
GRANT ALL ON public.auth_event_log TO service_role;
ALTER TABLE public.auth_event_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ae_read" ON public.auth_event_log FOR SELECT TO authenticated
  USING (user_id=auth.uid() OR target_user_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt'));

-- Anomaly alert
CREATE TABLE public.anomaly_alert (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL, -- bulk_delete|off_hours|scope_breach|role_abuse
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity text,
  entity_id text,
  detail jsonb,
  severity text NOT NULL DEFAULT 'warn', -- info|warn|critical
  status text NOT NULL DEFAULT 'open',   -- open|ack|resolved
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX anomaly_status_idx ON public.anomaly_alert(status, created_at DESC);
GRANT SELECT, UPDATE ON public.anomaly_alert TO authenticated;
GRANT ALL ON public.anomaly_alert TO service_role;
ALTER TABLE public.anomaly_alert ENABLE ROW LEVEL SECURITY;
CREATE POLICY "an_read" ON public.anomaly_alert FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt'));
CREATE POLICY "an_admin_update" ON public.anomaly_alert FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Log helper (SECURITY DEFINER wrapper)
CREATE OR REPLACE FUNCTION public.log_feature_usage(_feature text, _path text, _params jsonb, _duration_ms integer)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.feature_usage_log(user_id, feature, path, params, duration_ms)
  VALUES (auth.uid(), _feature, _path, _params, _duration_ms);
END$$;
REVOKE ALL ON FUNCTION public.log_feature_usage(text,text,jsonb,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_feature_usage(text,text,jsonb,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.log_auth_event(_event text, _target uuid, _detail jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.auth_event_log(user_id, event, target_user_id, detail)
  VALUES (auth.uid(), _event, _target, _detail);
END$$;
REVOKE ALL ON FUNCTION public.log_auth_event(text,uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_auth_event(text,uuid,jsonb) TO authenticated;

-- Bulk-delete anomaly detector: trigger on audit_log inserts of DELETE actions
CREATE OR REPLACE FUNCTION public.trg_detect_bulk_delete()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  cnt integer;
  h int;
BEGIN
  IF NEW.action = 'DELETE' AND NEW.user_id IS NOT NULL THEN
    SELECT count(*) INTO cnt FROM public.audit_log
      WHERE user_id=NEW.user_id AND entity=NEW.entity
        AND action='DELETE' AND created_at > now() - interval '60 seconds';
    IF cnt >= 10 THEN
      INSERT INTO public.anomaly_alert(kind, user_id, entity, detail, severity)
      VALUES ('bulk_delete', NEW.user_id, NEW.entity,
              jsonb_build_object('count',cnt,'window_sec',60), 'critical');
    END IF;
  END IF;
  -- off-hours flag
  h := EXTRACT(HOUR FROM now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::int;
  IF (h >= 22 OR h < 5) AND NEW.severity='info' THEN
    UPDATE public.audit_log SET severity='off_hours' WHERE id=NEW.id;
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_audit_bulk_delete ON public.audit_log;
CREATE TRIGGER trg_audit_bulk_delete AFTER INSERT ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.trg_detect_bulk_delete();

-- Grant EXECUTE only to authenticated for helper functions from migration 1
REVOKE ALL ON FUNCTION public.user_can(uuid,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_can_see_he_thong(uuid,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_scope_don_vi(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_scope_to_chuc(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_see_he_thong(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_scope_don_vi(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_scope_to_chuc(uuid) TO authenticated;
