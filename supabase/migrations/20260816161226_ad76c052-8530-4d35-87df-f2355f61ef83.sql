-- Sync technician profiles and verify auth users with correct role 'phong_kt'
DO $$
DECLARE
    v_user_id UUID;
    v_emails TEXT[] := ARRAY['tranquangvinh@vatm.vn', 'nguyenluonggiam@vatm.vn', 'vuhongson@vatm.vn', 'trannguyenbaoanh@vatm.vn'];
    v_email TEXT;
BEGIN
    FOREACH v_email IN ARRAY v_emails
    LOOP
        SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
        
        IF v_user_id IS NOT NULL THEN
            -- Ensure profile exists
            INSERT INTO public.profiles (id, email, ho_ten, active)
            VALUES (
                v_user_id, 
                v_email, 
                split_part(v_email, '@', 1), 
                true
            )
            ON CONFLICT (id) DO UPDATE SET 
                email = EXCLUDED.email,
                active = true;
                
            -- Ensure role exists
            INSERT INTO public.user_roles (user_id, role)
            VALUES (v_user_id, 'phong_kt')
            ON CONFLICT (user_id, role) DO NOTHING;
        END IF;
    END LOOP;
END $$;