CREATE TABLE public.cay_node_edit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('nhom','ht','tb')),
  ma text NOT NULL,
  don_vi_ma text,
  ten text,
  du_lieu jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, ma)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cay_node_edit TO authenticated;
GRANT ALL ON public.cay_node_edit TO service_role;

ALTER TABLE public.cay_node_edit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read node edits"
  ON public.cay_node_edit FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can insert node edits"
  ON public.cay_node_edit FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_equipment(auth.uid()));

CREATE POLICY "Managers can update node edits"
  ON public.cay_node_edit FOR UPDATE
  TO authenticated
  USING (public.can_manage_equipment(auth.uid()))
  WITH CHECK (public.can_manage_equipment(auth.uid()));

CREATE POLICY "Managers can delete node edits"
  ON public.cay_node_edit FOR DELETE
  TO authenticated
  USING (public.can_manage_equipment(auth.uid()));

CREATE TRIGGER trg_cay_node_edit_updated_at
  BEFORE UPDATE ON public.cay_node_edit
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();