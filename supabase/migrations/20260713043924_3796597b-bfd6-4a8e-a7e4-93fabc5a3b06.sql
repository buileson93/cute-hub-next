CREATE OR REPLACE FUNCTION public.ftinc_parent_must_be_draft()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
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