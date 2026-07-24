
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'node_note_type') THEN
    CREATE TYPE public.node_note_type AS ENUM ('he_thong', 'thanh_phan');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.node_note (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_type public.node_note_type NOT NULL,
  node_id text NOT NULL,
  noi_dung text NOT NULL DEFAULT '',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (node_type, node_id)
);

CREATE INDEX IF NOT EXISTS idx_node_note_lookup ON public.node_note (node_type, node_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.node_note TO authenticated;
GRANT ALL ON public.node_note TO service_role;

ALTER TABLE public.node_note ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "node_note_select_auth" ON public.node_note;
CREATE POLICY "node_note_select_auth"
ON public.node_note FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "node_note_insert_auth" ON public.node_note;
CREATE POLICY "node_note_insert_auth"
ON public.node_note FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "node_note_update_auth" ON public.node_note;
CREATE POLICY "node_note_update_auth"
ON public.node_note FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "node_note_delete_admin" ON public.node_note;
CREATE POLICY "node_note_delete_admin"
ON public.node_note FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.tg_node_note_touch()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_node_note_touch ON public.node_note;
CREATE TRIGGER trg_node_note_touch
BEFORE UPDATE ON public.node_note
FOR EACH ROW EXECUTE FUNCTION public.tg_node_note_touch();
