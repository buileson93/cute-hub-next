-- ============================================================================
-- Staging cho import hàng loạt: import_batch + import_item.
-- Upload/parse chỉ tạo staging (chưa ghi bảng nghiệp vụ). Cho phép xem lại,
-- nhận diện file trùng theo hash, và ghi sau.
-- ============================================================================

-- ---- import_batch: một lô nhập = một lần tải file ----
CREATE TABLE public.import_batch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  file_name text NOT NULL,
  file_hash text NOT NULL,
  file_size bigint,
  schema_version text,
  source text NOT NULL DEFAULT 'allinone',
  scope text,
  status text NOT NULL DEFAULT 'staged',
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT import_batch_status_chk
    CHECK (status IN ('staged', 'reviewing', 'committed', 'discarded')),
  CONSTRAINT import_batch_source_chk
    CHECK (source IN ('allinone', 'csv'))
);

CREATE INDEX idx_import_batch_hash ON public.import_batch (file_hash);
CREATE INDEX idx_import_batch_owner ON public.import_batch (created_by, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_batch TO authenticated;
GRANT ALL ON public.import_batch TO service_role;

ALTER TABLE public.import_batch ENABLE ROW LEVEL SECURITY;

-- Người tạo xem lô của mình; admin xem tất cả.
CREATE POLICY import_batch_select ON public.import_batch
  FOR SELECT TO authenticated
  USING (
    public.is_active_user(auth.uid())
    AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  );

-- Chỉ admin tạo lô (nhập liệu hàng loạt là quyền admin); created_by phải là chính mình.
CREATE POLICY import_batch_insert ON public.import_batch
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') AND created_by = auth.uid()
  );

-- Người tạo hoặc admin cập nhật/hủy lô của mình.
CREATE POLICY import_batch_update ON public.import_batch
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY import_batch_delete ON public.import_batch
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER import_batch_set_updated_at
  BEFORE UPDATE ON public.import_batch
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- import_item: từng dòng trong lô (raw + normalized) ----
CREATE TABLE public.import_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.import_batch(id) ON DELETE CASCADE,
  sheet text,
  entity text NOT NULL,
  cat_table text,
  row_index integer NOT NULL,
  raw_row jsonb NOT NULL DEFAULT '{}'::jsonb,
  normalized_row jsonb,
  status text NOT NULL DEFAULT 'staged',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT import_item_status_chk
    CHECK (status IN ('staged', 'valid', 'error', 'committed', 'skipped'))
);

CREATE INDEX idx_import_item_batch ON public.import_item (batch_id, sheet, row_index);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_item TO authenticated;
GRANT ALL ON public.import_item TO service_role;

ALTER TABLE public.import_item ENABLE ROW LEVEL SECURITY;

-- Dòng đi theo quyền của lô cha (dùng hàm security-definer để tránh đệ quy RLS).
CREATE OR REPLACE FUNCTION public.can_view_import_batch(_batch_id uuid, _user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.import_batch b
    WHERE b.id = _batch_id
      AND (b.created_by = _user OR public.has_role(_user, 'admin'))
  )
$function$;

REVOKE EXECUTE ON FUNCTION public.can_view_import_batch(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_import_batch(uuid, uuid) TO authenticated;

CREATE POLICY import_item_select ON public.import_item
  FOR SELECT TO authenticated
  USING (
    public.is_active_user(auth.uid())
    AND public.can_view_import_batch(batch_id, auth.uid())
  );

CREATE POLICY import_item_write ON public.import_item
  FOR ALL TO authenticated
  USING (public.can_view_import_batch(batch_id, auth.uid()))
  WITH CHECK (public.can_view_import_batch(batch_id, auth.uid()));