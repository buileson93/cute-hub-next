ALTER TABLE public.cay_node_edit DROP CONSTRAINT IF EXISTS cay_node_edit_kind_check;
ALTER TABLE public.cay_node_edit ADD CONSTRAINT cay_node_edit_kind_check
  CHECK (kind = ANY (ARRAY['pl'::text, 'lv'::text, 'nh'::text, 'nhom'::text, 'ht'::text, 'tb'::text, 'tp'::text]));