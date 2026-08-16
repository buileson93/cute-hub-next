-- 1. Fix role for doanhuutuan@vatm.vn
UPDATE public.user_roles 
SET role = 'phong_kt' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'doanhuutuan@vatm.vn') 
AND role = 'ktv';

-- 2. Ensure profiles are active and have correct ho_ten if missing
UPDATE public.profiles 
SET active = true 
WHERE email IN ('tranquangvinh@vatm.vn', 'nguyenluonggiam@vatm.vn', 'trannguyenbaoanh@vatm.vn', 'vuhongson@vatm.vn', 'doanhuutuan@vatm.vn');
