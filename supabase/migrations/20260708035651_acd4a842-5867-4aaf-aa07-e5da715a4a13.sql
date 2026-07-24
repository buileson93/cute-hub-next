ALTER TABLE public.profiles ALTER COLUMN active SET DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_bootstrap boolean := (NEW.email = 'buileson93@gmail.com');
  v_display text := COALESCE(
    NEW.raw_user_meta_data->>'ho_ten',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
BEGIN
  INSERT INTO public.profiles (id, email, ho_ten, active)
  VALUES (NEW.id, NEW.email, v_display, v_is_bootstrap)
  ON CONFLICT (id) DO NOTHING;

  IF v_is_bootstrap
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;