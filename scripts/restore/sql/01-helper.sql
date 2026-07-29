-- Helper SECURITY DEFINER tạm để chạy SQL đặc quyền trong quá trình khôi phục.
-- BẮT BUỘC xoá lại bằng scripts/restore/sql/07-cleanup.sql sau khi xong.
CREATE OR REPLACE FUNCTION public.__restore_exec(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

REVOKE ALL ON FUNCTION public.__restore_exec(text) FROM PUBLIC, anon, authenticated;
