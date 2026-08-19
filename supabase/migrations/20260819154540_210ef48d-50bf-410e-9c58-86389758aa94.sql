-- 1. Create Audit Log table
CREATE TABLE IF NOT EXISTS public.api_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id text, -- only public key_id prefix
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    project_id uuid,
    action text NOT NULL, -- 'key_created', 'key_revoked', 'api_call', 'permission_denied'
    result text, -- 'success', 'failure', 'rate_limited'
    ip_hash text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Index for auditing
CREATE INDEX IF NOT EXISTS idx_api_audit_log_user ON public.api_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_api_audit_log_key ON public.api_audit_log(key_id);
CREATE INDEX IF NOT EXISTS idx_api_audit_log_created ON public.api_audit_log(created_at DESC);

-- Grants
GRANT INSERT ON public.api_audit_log TO authenticated;
GRANT SELECT ON public.api_audit_log TO authenticated;
GRANT ALL ON public.api_audit_log TO service_role;

-- RLS: Users can only see their own audit logs
ALTER TABLE public.api_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API audit logs"
    ON public.api_audit_log
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 2. Add last_used_ip_hash to api_keys if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='api_keys' AND column_name='last_used_ip_hash') THEN
        ALTER TABLE public.api_keys ADD COLUMN last_used_ip_hash text;
    END IF;
END $$;
