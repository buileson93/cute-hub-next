
-- Bảng theo dõi file upload trên R2 và log truy cập
CREATE TABLE IF NOT EXISTS public.r2_file (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key text NOT NULL UNIQUE,
  size bigint,
  content_type text,
  category text NOT NULL DEFAULT 'other',
  status text NOT NULL DEFAULT 'temp' CHECK (status IN ('temp','ready','failed')),
  original_name text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS r2_file_user_idx ON public.r2_file(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS r2_file_status_exp_idx ON public.r2_file(status, expires_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.r2_file TO authenticated;
GRANT ALL ON public.r2_file TO service_role;
ALTER TABLE public.r2_file ENABLE ROW LEVEL SECURITY;

CREATE POLICY "r2_file_owner_select" ON public.r2_file FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "r2_file_owner_ins" ON public.r2_file FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "r2_file_owner_upd" ON public.r2_file FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "r2_file_owner_del" ON public.r2_file FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.r2_access_log (
  id bigserial PRIMARY KEY,
  user_id uuid,
  key text NOT NULL,
  action text NOT NULL,
  category text,
  expires_in int,
  ok boolean NOT NULL DEFAULT true,
  reason text,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS r2_log_user_idx ON public.r2_access_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS r2_log_key_idx ON public.r2_access_log(key, created_at DESC);

GRANT SELECT ON public.r2_access_log TO authenticated;
GRANT ALL ON public.r2_access_log TO service_role;
ALTER TABLE public.r2_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "r2_log_admin_select" ON public.r2_access_log FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
