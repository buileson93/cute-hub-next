-- Create project_event_type if not exists
DO $$ BEGIN
    CREATE TYPE public.project_event_type AS ENUM (
        'project_created', 'project_updated', 'milestone_created', 'milestone_updated',
        'task_created', 'task_updated', 'document_uploaded', 'ocr_completed',
        'correspondence_created', 'correspondence_updated', 'api_key_created',
        'api_key_revoked', 'api_key_rotated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table for API Keys
CREATE TABLE public.api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id text UNIQUE NOT NULL,
    secret_hash text NOT NULL,
    name text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    workspace_id text,
    scopes text[] DEFAULT '{}',
    expires_at timestamptz,
    last_used_at timestamptz,
    last_used_ip_hash text,
    revoked_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Index for fast lookup by key_id
CREATE INDEX idx_api_keys_key_id ON public.api_keys(key_id);
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);

-- Optional: Table for specific project scopes
CREATE TABLE public.api_key_project_scopes (
    api_key_id uuid REFERENCES public.api_keys(id) ON DELETE CASCADE NOT NULL,
    project_id uuid NOT NULL,
    can_read boolean DEFAULT true,
    can_upload_documents boolean DEFAULT false,
    can_create_correspondence boolean DEFAULT false,
    PRIMARY KEY (api_key_id, project_id)
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_key_project_scopes TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
GRANT ALL ON public.api_key_project_scopes TO service_role;

-- RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_project_scopes ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see and manage their own API keys
CREATE POLICY "Users can manage their own API keys"
    ON public.api_keys
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own API key scopes"
    ON public.api_key_project_scopes
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.api_keys WHERE id = api_key_id AND user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.api_keys WHERE id = api_key_id AND user_id = auth.uid()
    ));
