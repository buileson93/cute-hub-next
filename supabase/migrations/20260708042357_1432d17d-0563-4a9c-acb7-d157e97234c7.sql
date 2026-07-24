-- =====================================================================
-- FORM MODULE: template builder + submissions + approval + equipment link
-- =====================================================================

-- 1) ENUMS
CREATE TYPE public.form_field_kind AS ENUM (
  'text', 'textarea', 'number', 'date', 'datetime',
  'select', 'multiselect', 'checkbox', 'file',
  'user_ref', 'don_vi_ref', 'thiet_bi_ref'
);

CREATE TYPE public.form_thiet_bi_mode AS ENUM ('none', 'single', 'multi');

CREATE TYPE public.form_submission_status AS ENUM (
  'draft', 'submitted', 'approved', 'returned'
);

-- 2) form_template — do admin/phong_kt tạo
CREATE TABLE public.form_template (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL UNIQUE,        -- eg: bao_cao_tuan, bb_bao_duong
  ten             text NOT NULL,
  mo_ta           text,
  thiet_bi_mode   public.form_thiet_bi_mode NOT NULL DEFAULT 'none',
  active          boolean NOT NULL DEFAULT true,
  version         integer NOT NULL DEFAULT 1,
  require_signature boolean NOT NULL DEFAULT false, -- có ký số/PDF hay không
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX form_template_active_idx ON public.form_template(active, code);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_template TO authenticated;
GRANT ALL ON public.form_template TO service_role;
ALTER TABLE public.form_template ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_template_select_active" ON public.form_template
  FOR SELECT TO authenticated
  USING (public.is_active_user(auth.uid()));

CREATE POLICY "form_template_manage_kt" ON public.form_template
  FOR ALL TO authenticated
  USING (public.can_manage_equipment(auth.uid()))
  WITH CHECK (public.can_manage_equipment(auth.uid()));

CREATE TRIGGER trg_form_template_updated_at
  BEFORE UPDATE ON public.form_template
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) form_field — mô tả các trường của template
CREATE TABLE public.form_field (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id  uuid NOT NULL REFERENCES public.form_template(id) ON DELETE CASCADE,
  key          text NOT NULL,     -- key trong data jsonb
  label        text NOT NULL,
  kind         public.form_field_kind NOT NULL DEFAULT 'text',
  required     boolean NOT NULL DEFAULT false,
  options      jsonb,             -- cho select/multiselect: [{value,label}]
  help_text    text,
  placeholder  text,
  default_value jsonb,
  position     integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, key)
);
CREATE INDEX form_field_template_idx ON public.form_field(template_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_field TO authenticated;
GRANT ALL ON public.form_field TO service_role;
ALTER TABLE public.form_field ENABLE ROW LEVEL SECURITY;

CREATE POLICY "form_field_select_active" ON public.form_field
  FOR SELECT TO authenticated
  USING (public.is_active_user(auth.uid()));

CREATE POLICY "form_field_manage_kt" ON public.form_field
  FOR ALL TO authenticated
  USING (public.can_manage_equipment(auth.uid()))
  WITH CHECK (public.can_manage_equipment(auth.uid()));

CREATE TRIGGER trg_form_field_updated_at
  BEFORE UPDATE ON public.form_field
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) form_submission — mỗi lần user điền
CREATE TABLE public.form_submission (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id       uuid NOT NULL REFERENCES public.form_template(id) ON DELETE RESTRICT,
  template_code     text NOT NULL,
  template_version  integer NOT NULL DEFAULT 1,
  don_vi_id         uuid REFERENCES public.dm_don_vi(id) ON DELETE SET NULL,
  created_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status            public.form_submission_status NOT NULL DEFAULT 'draft',
  data              jsonb NOT NULL DEFAULT '{}'::jsonb,
  thiet_bi_id       uuid REFERENCES public.thiet_bi(id) ON DELETE SET NULL, -- cho mode single
  ky_bao_cao        text,                 -- eg "2026-W28" hoặc "2026-Q3"
  tieu_de           text,
  submitted_at      timestamptz,
  reviewed_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at       timestamptz,
  review_note       text,
  signed_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  signed_at         timestamptz,
  pdf_path          text,                 -- đường dẫn PDF đã export (nếu có)
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX form_submission_created_by_idx ON public.form_submission(created_by, created_at DESC);
CREATE INDEX form_submission_template_idx ON public.form_submission(template_id, status, created_at DESC);
CREATE INDEX form_submission_don_vi_idx ON public.form_submission(don_vi_id, status);
CREATE INDEX form_submission_thiet_bi_idx ON public.form_submission(thiet_bi_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_submission TO authenticated;
GRANT ALL ON public.form_submission TO service_role;
ALTER TABLE public.form_submission ENABLE ROW LEVEL SECURITY;

-- Xem: người tạo được xem bản của mình; admin/phong_kt xem hết;
--        các thành viên cùng đơn vị xem bản đã submit của đơn vị.
CREATE POLICY "form_submission_select_scope" ON public.form_submission
  FOR SELECT TO authenticated
  USING (
    public.is_active_user(auth.uid())
    AND (
      created_by = auth.uid()
      OR public.can_manage_equipment(auth.uid())
      OR (
        status <> 'draft'
        AND don_vi_id IS NOT NULL
        AND don_vi_id IN (
          SELECT dv.id FROM public.dm_don_vi dv
          JOIN public.profiles p ON p.don_vi::text = dv.ma
          WHERE p.id = auth.uid()
        )
      )
    )
  );

-- Insert: user tạo bản ghi của chính mình (created_by = auth.uid), status = draft/submitted
CREATE POLICY "form_submission_insert_own" ON public.form_submission
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_active_user(auth.uid())
    AND created_by = auth.uid()
  );

-- Update: chính chủ chỉnh khi draft/returned; phong_kt/admin duyệt (mọi trạng thái)
CREATE POLICY "form_submission_update_own_draft" ON public.form_submission
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    AND status IN ('draft', 'returned')
  )
  WITH CHECK (
    created_by = auth.uid()
    AND status IN ('draft', 'submitted', 'returned')
  );

CREATE POLICY "form_submission_update_kt" ON public.form_submission
  FOR UPDATE TO authenticated
  USING (public.can_manage_equipment(auth.uid()))
  WITH CHECK (public.can_manage_equipment(auth.uid()));

-- Delete: chính chủ khi draft, hoặc admin
CREATE POLICY "form_submission_delete_own_draft" ON public.form_submission
  FOR DELETE TO authenticated
  USING (
    (created_by = auth.uid() AND status = 'draft')
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE TRIGGER trg_form_submission_updated_at
  BEFORE UPDATE ON public.form_submission
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5) form_submission_thiet_bi — join cho mode 'multi'
CREATE TABLE public.form_submission_thiet_bi (
  submission_id  uuid NOT NULL REFERENCES public.form_submission(id) ON DELETE CASCADE,
  thiet_bi_id    uuid NOT NULL REFERENCES public.thiet_bi(id) ON DELETE CASCADE,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (submission_id, thiet_bi_id)
);
CREATE INDEX form_sub_tb_thiet_bi_idx ON public.form_submission_thiet_bi(thiet_bi_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_submission_thiet_bi TO authenticated;
GRANT ALL ON public.form_submission_thiet_bi TO service_role;
ALTER TABLE public.form_submission_thiet_bi ENABLE ROW LEVEL SECURITY;

-- Truy cập theo submission cha
CREATE POLICY "form_sub_tb_select_by_parent" ON public.form_submission_thiet_bi
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.form_submission s
      WHERE s.id = submission_id
      -- policy của form_submission tự lọc; ở đây chỉ cần join
    )
  );

CREATE POLICY "form_sub_tb_write_by_owner" ON public.form_submission_thiet_bi
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.form_submission s
      WHERE s.id = submission_id
        AND (
          (s.created_by = auth.uid() AND s.status IN ('draft','returned'))
          OR public.can_manage_equipment(auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.form_submission s
      WHERE s.id = submission_id
        AND (
          (s.created_by = auth.uid() AND s.status IN ('draft','submitted','returned'))
          OR public.can_manage_equipment(auth.uid())
        )
    )
  );