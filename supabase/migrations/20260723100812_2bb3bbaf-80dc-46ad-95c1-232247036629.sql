-- Mở rộng form_field: required_if (điều kiện bắt buộc), constraint_formula/message (kiểm tra chéo), và kiểu section_repeat.
ALTER TABLE public.form_field
  ADD COLUMN IF NOT EXISTS required_if jsonb NULL,
  ADD COLUMN IF NOT EXISTS constraint_formula text NULL,
  ADD COLUMN IF NOT EXISTS constraint_message text NULL;

-- Bổ sung giá trị enum cho kiểu lặp block. Bỏ qua nếu enum không tồn tại (schema cũ dùng text).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'form_field_kind') THEN
    BEGIN
      ALTER TYPE public.form_field_kind ADD VALUE IF NOT EXISTS 'section_repeat';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
