-- RPC to update user profile and roles atomically
CREATE OR REPLACE FUNCTION public.update_user_full(
    target_uid uuid,
    new_ho_ten text,
    new_don_vi text,
    new_roles text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    role_name text;
BEGIN
    -- 1. Check if caller is admin (redundant but safe)
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Forbidden: only admins can update users';
    END IF;

    -- 2. Update profile
    UPDATE public.profiles
    SET 
        ho_ten = new_ho_ten,
        don_vi = new_don_vi,
        updated_at = now()
    WHERE id = target_uid;

    -- 3. Update roles: delete old, insert new
    DELETE FROM public.user_roles WHERE user_id = target_uid;
    
    FOREACH role_name IN ARRAY new_roles
    LOOP
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_uid, role_name::public.app_role);
    END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_full TO authenticated;

-- Prevent removing the last admin
CREATE OR REPLACE FUNCTION public.check_last_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'DELETE' AND OLD.role = 'admin') OR (TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role != 'admin') THEN
        IF (SELECT count(*) FROM public.user_roles WHERE role = 'admin') <= 1 THEN
            RAISE EXCEPTION 'Cannot remove the last admin user';
        END IF;
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS tr_prevent_last_admin_removal ON public.user_roles;
CREATE TRIGGER tr_prevent_last_admin_removal
BEFORE DELETE OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.check_last_admin();
