DROP FUNCTION IF EXISTS public.update_user_full(uuid, text, text, text[]);

CREATE OR REPLACE FUNCTION public.update_user_full(
  target_uid UUID,
  new_ho_ten TEXT,
  new_don_vi TEXT,
  new_roles app_role[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Update profile
  UPDATE public.profiles
  SET 
    ho_ten = new_ho_ten,
    don_vi = new_don_vi,
    updated_at = now()
  WHERE id = target_uid;

  -- 2. Replace roles: delete old, insert new
  DELETE FROM public.user_roles WHERE user_id = target_uid;
  
  IF array_length(new_roles, 1) > 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT target_uid, unnest(new_roles);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_full TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_full TO service_role;

-- Safety Trigger: Prevent removing the last admin
CREATE OR REPLACE FUNCTION public.check_last_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Count active admins
  SELECT COUNT(DISTINCT user_id)
  INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';

  -- If we are deleting or updating an admin role
  IF (TG_OP = 'DELETE' AND OLD.role = 'admin') OR (TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role != 'admin') THEN
    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Không thể xóa hoặc tước quyền Admin cuối cùng của hệ thống.';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tr_prevent_last_admin_removal ON public.user_roles;
CREATE TRIGGER tr_prevent_last_admin_removal
BEFORE DELETE OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.check_last_admin();
