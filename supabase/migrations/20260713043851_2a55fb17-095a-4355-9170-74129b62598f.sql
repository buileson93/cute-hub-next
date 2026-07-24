-- ============================================================================
-- MẪU LỒNG NHAU (template include) + KHÓA VERSION khi publish
-- ============================================================================

-- 1) Bảng liên kết include: 1 version cha include 1 version con.
CREATE TABLE public.form_template_include (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_version_id uuid NOT NULL REFERENCES public.form_template_version(id) ON DELETE CASCADE,
  child_version_id  uuid NOT NULL REFERENCES public.form_template_version(id) ON DELETE RESTRICT,
  position integer NOT NULL DEFAULT 0,
  section_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  CONSTRAINT ftinc_no_self CHECK (parent_version_id <> child_version_id),
  CONSTRAINT ftinc_unique_child UNIQUE (parent_version_id, child_version_id)
);

COMMENT ON TABLE public.form_template_include IS
  'Cạnh include giữa các form_template_version. Compiler TS giải theo position, chống cycle/duplicate.';

CREATE INDEX idx_ftinc_parent ON public.form_template_include(parent_version_id, position);
CREATE INDEX idx_ftinc_child ON public.form_template_include(child_version_id);

-- 2) GRANT (bắt buộc trên public schema)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_template_include TO authenticated;
GRANT ALL ON public.form_template_include TO service_role;

-- 3) RLS
ALTER TABLE public.form_template_include ENABLE ROW LEVEL SECURITY;

CREATE POLICY ftinc_select_active ON public.form_template_include
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()));

CREATE POLICY ftinc_manage_kt ON public.form_template_include
  FOR ALL TO authenticated
  USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

-- 4) Trigger: chỉ được sửa include khi version CHA là draft (khóa khi đã publish/retired)
CREATE OR REPLACE FUNCTION public.ftinc_parent_must_be_draft()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent uuid;
  v_status form_template_version_status;
BEGIN
  v_parent := COALESCE(NEW.parent_version_id, OLD.parent_version_id);
  SELECT status INTO v_status FROM public.form_template_version WHERE id = v_parent;
  IF v_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Không thể thay đổi include: mẫu (version) không ở trạng thái draft (đang %).', v_status
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_ftinc_parent_draft
  BEFORE INSERT OR UPDATE OR DELETE ON public.form_template_include
  FOR EACH ROW EXECUTE FUNCTION public.ftinc_parent_must_be_draft();

-- 5) Trigger: KHÓA version đã publish — không cho sửa compiled_schema/version/template_id.
--    Cho phép chuyển trạng thái published -> retired (và cập nhật updated_at).
CREATE OR REPLACE FUNCTION public.ftv_lock_published()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'published' THEN
    IF NEW.compiled_schema IS DISTINCT FROM OLD.compiled_schema
       OR NEW.version IS DISTINCT FROM OLD.version
       OR NEW.template_id IS DISTINCT FROM OLD.template_id THEN
      RAISE EXCEPTION 'Version đã publish bị khóa: không thể sửa nội dung/biên bản đã biên dịch.'
        USING ERRCODE = 'check_violation';
    END IF;
    -- chỉ cho phép giữ nguyên hoặc chuyển sang retired
    IF NEW.status NOT IN ('published','retired') THEN
      RAISE EXCEPTION 'Version đã publish chỉ có thể giữ published hoặc chuyển retired.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ftv_lock_published
  BEFORE UPDATE ON public.form_template_version
  FOR EACH ROW EXECUTE FUNCTION public.ftv_lock_published();