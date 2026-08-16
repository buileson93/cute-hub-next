
-- 1. Sửa hàm handle_new_user: an toàn hơn với metadata rỗng và email NULL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _ho_ten text;
    _email text;
BEGIN
    -- Lấy email từ auth.users
    _email := COALESCE(NEW.email, '');
    
    -- Ưu tiên lấy full_name từ metadata, nếu không có thì lấy phần trước dấu @ của email
    _ho_ten := COALESCE(
        NEW.raw_user_meta_data->>'full_name', 
        CASE 
            WHEN _email LIKE '%@%' THEN split_part(_email, '@', 1)
            ELSE 'Người dùng mới'
        END
    );

    -- Insert vào profiles, dùng ON CONFLICT để tránh lỗi nếu đã tồn tại
    INSERT INTO public.profiles (id, email, ho_ten, active)
    VALUES (NEW.id, _email, _ho_ten, true)
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        ho_ten = EXCLUDED.ho_ten;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Ghi log lỗi vào bảng audit_log nếu có thể
    -- Lưu ý: Phải cẩn thận để không gây lỗi vòng lặp
    RETURN NEW;
END;
$$;

-- 2. Đảm bảo trigger gắn đúng
-- Xoá trigger cũ nếu có để tránh trùng
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Tạo lại trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Đồng bộ ngay lập tức cho các user còn thiếu profile
INSERT INTO public.profiles (id, email, ho_ten, active)
SELECT 
    u.id, 
    COALESCE(u.email, ''), 
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'Người dùng mới'),
    true
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 4. Cấp quyền truy cập (Quan trọng)
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;
