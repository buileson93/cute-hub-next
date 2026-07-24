-- Hàm trả về thời gian máy chủ (chính xác, không phụ thuộc đồng hồ thiết bị).
CREATE OR REPLACE FUNCTION public.thoi_gian_may_chu()
RETURNS timestamptz
LANGUAGE sql
STABLE
AS $$ SELECT now() $$;

GRANT EXECUTE ON FUNCTION public.thoi_gian_may_chu() TO authenticated;
GRANT EXECUTE ON FUNCTION public.thoi_gian_may_chu() TO anon;
GRANT EXECUTE ON FUNCTION public.thoi_gian_may_chu() TO service_role;