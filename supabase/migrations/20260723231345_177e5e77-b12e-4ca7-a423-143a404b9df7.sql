
CREATE TABLE public.form_sign_otp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.form_submission(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('telegram','email')),
  code_hash text NOT NULL,
  signer_role text NOT NULL DEFAULT 'phu_trach',
  note text,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_sign_otp_user ON public.form_sign_otp (user_id, submission_id, created_at DESC);
CREATE INDEX idx_form_sign_otp_active ON public.form_sign_otp (submission_id, user_id) WHERE consumed_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_sign_otp TO authenticated;
GRANT ALL ON public.form_sign_otp TO service_role;

ALTER TABLE public.form_sign_otp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "otp_own_select" ON public.form_sign_otp
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "otp_own_insert" ON public.form_sign_otp
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "otp_own_update" ON public.form_sign_otp
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
