-- 1. Thêm unique constraint cho idempotency_key có phạm vi project
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idx_cong_van_idempotency_scoped') THEN
        ALTER TABLE public.du_an_cong_van 
        ADD CONSTRAINT idx_cong_van_idempotency_scoped UNIQUE (du_an_id, idempotency_key);
    END IF;
END $$;

-- 2. Cập nhật RLS cho api_keys để bảo vệ secret_hash
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.api_keys;

CREATE POLICY "Users can view and delete their own keys"
    ON public.api_keys
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own keys"
    ON public.api_keys
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can revoke their own keys"
    ON public.api_keys
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Đảm bảo API Audit Log có RLS
ALTER TABLE public.api_audit_log ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.api_audit_log TO authenticated;
GRANT ALL ON public.api_audit_log TO service_role;

CREATE POLICY "Users can view their own audit logs"
    ON public.api_audit_log
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
    ON public.api_audit_log
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
