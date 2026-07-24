
-- Extend enum form_field_kind with new field types
ALTER TYPE public.form_field_kind ADD VALUE IF NOT EXISTS 'measure';
ALTER TYPE public.form_field_kind ADD VALUE IF NOT EXISTS 'before_after';
ALTER TYPE public.form_field_kind ADD VALUE IF NOT EXISTS 'rating';
ALTER TYPE public.form_field_kind ADD VALUE IF NOT EXISTS 'radio';
ALTER TYPE public.form_field_kind ADD VALUE IF NOT EXISTS 'photo';
ALTER TYPE public.form_field_kind ADD VALUE IF NOT EXISTS 'signature';
ALTER TYPE public.form_field_kind ADD VALUE IF NOT EXISTS 'geo';
ALTER TYPE public.form_field_kind ADD VALUE IF NOT EXISTS 'duration';
ALTER TYPE public.form_field_kind ADD VALUE IF NOT EXISTS 'table';
ALTER TYPE public.form_field_kind ADD VALUE IF NOT EXISTS 'linh_kien_ref';
ALTER TYPE public.form_field_kind ADD VALUE IF NOT EXISTS 'vat_tu_ref';
ALTER TYPE public.form_field_kind ADD VALUE IF NOT EXISTS 'he_thong_thanh_phan_ref';
ALTER TYPE public.form_field_kind ADD VALUE IF NOT EXISTS 'computed';
ALTER TYPE public.form_field_kind ADD VALUE IF NOT EXISTS 'heading';
ALTER TYPE public.form_field_kind ADD VALUE IF NOT EXISTS 'note';
ALTER TYPE public.form_field_kind ADD VALUE IF NOT EXISTS 'divider';

-- Extend form_field with layout/measurement/rule columns
ALTER TABLE public.form_field
  ADD COLUMN IF NOT EXISTS unit         text,
  ADD COLUMN IF NOT EXISTS tieu_chuan   text,
  ADD COLUMN IF NOT EXISTS min_value    numeric,
  ADD COLUMN IF NOT EXISTS max_value    numeric,
  ADD COLUMN IF NOT EXISTS col_span     smallint NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS visible_if   jsonb,
  ADD COLUMN IF NOT EXISTS columns      jsonb,
  ADD COLUMN IF NOT EXISTS ratings      jsonb,
  ADD COLUMN IF NOT EXISTS formula      text,
  ADD COLUMN IF NOT EXISTS nhom         text;

ALTER TABLE public.form_field
  DROP CONSTRAINT IF EXISTS form_field_col_span_check;
ALTER TABLE public.form_field
  ADD  CONSTRAINT form_field_col_span_check CHECK (col_span BETWEEN 1 AND 3);

-- Extend form_section with layout & repeatable flag
ALTER TABLE public.form_section
  ADD COLUMN IF NOT EXISTS col_layout smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS repeatable boolean  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visible_if jsonb;

ALTER TABLE public.form_section
  DROP CONSTRAINT IF EXISTS form_section_col_layout_check;
ALTER TABLE public.form_section
  ADD  CONSTRAINT form_section_col_layout_check CHECK (col_layout BETWEEN 1 AND 3);

-- Support multiple digital signatures per submission
ALTER TABLE public.form_submission
  ADD COLUMN IF NOT EXISTS signatures jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.form_field.col_span
  IS 'Độ rộng của trường trên lưới 3 cột (1..3).';
COMMENT ON COLUMN public.form_field.visible_if
  IS 'Điều kiện hiển thị: { field_key, op, value }';
COMMENT ON COLUMN public.form_field.columns
  IS 'Cấu hình cột cho kind=table: [{ key, label, kind, unit, options? }]';
COMMENT ON COLUMN public.form_field.ratings
  IS 'Cấu hình mức cho kind=rating: [{ value, label, color }]';
COMMENT ON COLUMN public.form_field.formula
  IS 'Biểu thức cho kind=computed, tham chiếu {key} của trường khác.';
COMMENT ON COLUMN public.form_section.col_layout
  IS 'Số cột mặc định của mục (1..3).';
COMMENT ON COLUMN public.form_section.repeatable
  IS 'Mục lặp lại theo tài sản khi lập phiếu.';
COMMENT ON COLUMN public.form_submission.signatures
  IS 'Danh sách chữ ký số: [{ path, ky_boi, ho_ten, thoi_diem, ip, ua, hash, vai_tro }]';

-- Storage RLS on the form-attachments bucket (bucket created via storage tool)
DROP POLICY IF EXISTS "form_att_read"   ON storage.objects;
DROP POLICY IF EXISTS "form_att_write"  ON storage.objects;
DROP POLICY IF EXISTS "form_att_update" ON storage.objects;
DROP POLICY IF EXISTS "form_att_delete" ON storage.objects;

CREATE POLICY "form_att_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'form-attachments' AND public.is_active_user(public.current_uid()));

CREATE POLICY "form_att_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'form-attachments' AND public.is_active_user(public.current_uid()));

CREATE POLICY "form_att_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'form-attachments' AND (owner = auth.uid() OR public.can_manage_equipment(public.current_uid())))
  WITH CHECK (bucket_id = 'form-attachments');

CREATE POLICY "form_att_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'form-attachments' AND (owner = auth.uid() OR public.can_manage_equipment(public.current_uid())));
