
-- 1. Cập nhật cấu trúc bảng profiles để email có thể lấy từ auth.users và không bắt buộc insert thủ công
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- 2. Cấp quyền (lặp lại để đảm bảo dù bảng đã tồn tại)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 3. Đảm bảo RLS được bật
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Chính sách RLS (sử dụng OR REPLACE nếu được, hoặc DO block an toàn)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
    
    DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
    CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
END $$;

-- 5. Trigger tự động tạo profile khi có user mới, lấy cả email từ auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, ho_ten, active)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    ho_ten = COALESCE(EXCLUDED.ho_ten, profiles.ho_ten),
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Đồng bộ ngay lập tức những user thiếu profile hoặc thiếu email trong profile
INSERT INTO public.profiles (id, email, ho_ten, active)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
    true
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    ho_ten = COALESCE(profiles.ho_ten, EXCLUDED.ho_ten);
