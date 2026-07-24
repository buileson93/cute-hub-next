
CREATE TABLE public.user_recent (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path text NOT NULL,
  label text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, path)
);
CREATE INDEX idx_user_recent_user_viewed ON public.user_recent(user_id, viewed_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_recent TO authenticated;
GRANT ALL ON public.user_recent TO service_role;
ALTER TABLE public.user_recent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recent select" ON public.user_recent FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own recent insert" ON public.user_recent FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own recent update" ON public.user_recent FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own recent delete" ON public.user_recent FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.user_pinned (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path text NOT NULL,
  label text NOT NULL,
  "order" int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, path)
);
CREATE INDEX idx_user_pinned_user_order ON public.user_pinned(user_id, "order");
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_pinned TO authenticated;
GRANT ALL ON public.user_pinned TO service_role;
ALTER TABLE public.user_pinned ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pinned select" ON public.user_pinned FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own pinned insert" ON public.user_pinned FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own pinned update" ON public.user_pinned FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own pinned delete" ON public.user_pinned FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.record_user_recent(_path text, _label text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_recent(user_id, path, label, viewed_at)
  VALUES (uid, _path, _label, now())
  ON CONFLICT (user_id, path) DO UPDATE SET viewed_at = now(), label = EXCLUDED.label;
  DELETE FROM public.user_recent
  WHERE user_id = uid
    AND path NOT IN (
      SELECT path FROM public.user_recent
      WHERE user_id = uid
      ORDER BY viewed_at DESC
      LIMIT 10
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.record_user_recent(text, text) TO authenticated;
