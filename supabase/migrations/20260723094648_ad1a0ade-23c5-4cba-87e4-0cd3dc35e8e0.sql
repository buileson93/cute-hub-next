
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.system_signing_key (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alg TEXT NOT NULL DEFAULT 'Ed25519',
  public_key_b64 TEXT NOT NULL,
  private_key_b64 TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at TIMESTAMPTZ
);

GRANT ALL ON public.system_signing_key TO service_role;

ALTER TABLE public.system_signing_key ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signing_key_service_role_only" ON public.system_signing_key;
CREATE POLICY "signing_key_service_role_only"
  ON public.system_signing_key
  FOR ALL
  USING (false)
  WITH CHECK (false);

INSERT INTO public.system_signing_key (public_key_b64, private_key_b64, note)
SELECT
  encode(gen_random_bytes(32), 'base64'),
  encode(gen_random_bytes(32), 'base64'),
  'placeholder — sẽ được thay khi ensureSigningKey() chạy lần đầu'
WHERE NOT EXISTS (SELECT 1 FROM public.system_signing_key WHERE active = true);

CREATE TABLE IF NOT EXISTS public.form_submission_signature (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.form_submission(id) ON DELETE CASCADE,
  signer_user_id UUID NOT NULL REFERENCES auth.users(id),
  signer_role TEXT NOT NULL CHECK (signer_role IN ('nguoi_thuc_hien','phu_trach','admin')),
  signer_name TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  content_hash TEXT NOT NULL,
  signature_b64 TEXT NOT NULL,
  key_id UUID NOT NULL REFERENCES public.system_signing_key(id),
  alg TEXT NOT NULL DEFAULT 'Ed25519',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fss_submission ON public.form_submission_signature(submission_id);
CREATE INDEX IF NOT EXISTS idx_fss_signer ON public.form_submission_signature(signer_user_id);

GRANT SELECT ON public.form_submission_signature TO authenticated;
GRANT ALL ON public.form_submission_signature TO service_role;

ALTER TABLE public.form_submission_signature ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fss_read_via_submission" ON public.form_submission_signature;
CREATE POLICY "fss_read_via_submission"
  ON public.form_submission_signature
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.form_submission s
      WHERE s.id = form_submission_signature.submission_id
    )
  );

DROP POLICY IF EXISTS "fss_write_service_only" ON public.form_submission_signature;
CREATE POLICY "fss_write_service_only"
  ON public.form_submission_signature
  FOR INSERT
  TO service_role
  WITH CHECK (true);

ALTER TABLE public.form_submission
  ADD COLUMN IF NOT EXISTS content_hash TEXT,
  ADD COLUMN IF NOT EXISTS pdf_path TEXT;

DROP POLICY IF EXISTS "form_pdf_read" ON storage.objects;
CREATE POLICY "form_pdf_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'form-pdf');

DROP POLICY IF EXISTS "form_pdf_write" ON storage.objects;
CREATE POLICY "form_pdf_write"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'form-pdf');

DROP POLICY IF EXISTS "form_pdf_delete" ON storage.objects;
CREATE POLICY "form_pdf_delete"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'form-pdf');
