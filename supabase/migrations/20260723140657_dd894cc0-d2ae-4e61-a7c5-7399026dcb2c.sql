
CREATE TABLE IF NOT EXISTS public.user_layout_prefs (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_layout_prefs TO authenticated;
GRANT ALL ON public.user_layout_prefs TO service_role;

ALTER TABLE public.user_layout_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own prefs select" ON public.user_layout_prefs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own prefs insert" ON public.user_layout_prefs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own prefs update" ON public.user_layout_prefs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own prefs delete" ON public.user_layout_prefs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_user_layout_prefs()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_touch_user_layout_prefs ON public.user_layout_prefs;
CREATE TRIGGER trg_touch_user_layout_prefs
BEFORE UPDATE ON public.user_layout_prefs
FOR EACH ROW EXECUTE FUNCTION public.touch_user_layout_prefs();

-- RPC reset toàn bộ prefs của user hiện tại
CREATE OR REPLACE FUNCTION public.reset_user_layout_prefs()
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  DELETE FROM public.user_layout_prefs WHERE user_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.reset_user_layout_prefs() TO authenticated;
