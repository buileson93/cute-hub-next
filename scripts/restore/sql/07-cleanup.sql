-- Dọn dẹp sau khi khôi phục xong. BẮT BUỘC chạy.
DROP TABLE IF EXISTS public._dbg_tmp;

DO $$
BEGIN
  EXECUTE format('ALTER ROLE %I NOBYPASSRLS', current_user);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'bỏ qua NOBYPASSRLS: %', SQLERRM;
END
$$;

DROP FUNCTION IF EXISTS public.__restore_exec(text);

-- Xác nhận helper đã biến mất
SELECT CASE WHEN to_regprocedure('public.__restore_exec(text)') IS NULL
            THEN 'OK: helper đã được xoá'
            ELSE 'CẢNH BÁO: helper vẫn còn!' END AS cleanup_status;
