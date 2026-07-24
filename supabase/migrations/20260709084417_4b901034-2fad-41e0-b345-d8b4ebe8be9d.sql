-- Hàm cập nhật updated_at (nếu chưa có)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============ BẢNG LỊCH SỬ SAO LƯU ============
CREATE TABLE IF NOT EXISTS public.backup_lich_su (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loai text NOT NULL DEFAULT 'thu_cong',
  trang_thai text NOT NULL DEFAULT 'hoan_thanh',
  so_bang integer NOT NULL DEFAULT 0,
  so_dong integer NOT NULL DEFAULT 0,
  dung_luong bigint NOT NULL DEFAULT 0,
  file_path text,
  dich text[] NOT NULL DEFAULT '{}',
  dong_bo jsonb NOT NULL DEFAULT '{}'::jsonb,
  ghi_chu text,
  tao_boi uuid,
  tao_boi_ten text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.backup_lich_su TO authenticated;
GRANT ALL ON public.backup_lich_su TO service_role;

ALTER TABLE public.backup_lich_su ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin xem lịch sử backup"
  ON public.backup_lich_su FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin ghi lịch sử backup"
  ON public.backup_lich_su FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin sửa lịch sử backup"
  ON public.backup_lich_su FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin xoá lịch sử backup"
  ON public.backup_lich_su FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_backup_lich_su_updated
  BEFORE UPDATE ON public.backup_lich_su
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ HÀM: DANH SÁCH BẢNG ============
CREATE OR REPLACE FUNCTION public.admin_list_backup_tables()
RETURNS TABLE(table_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.relname::text
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
    AND c.relname NOT IN ('backup_lich_su')
  ORDER BY c.relname;
$$;
REVOKE ALL ON FUNCTION public.admin_list_backup_tables() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_backup_tables() TO authenticated, service_role;

-- ============ HÀM KHÔI PHỤC AN TOÀN (ADMIN) ============
CREATE OR REPLACE FUNCTION public.admin_restore_database(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  tbl text;
  rows jsonb;
  blocklist text[] := ARRAY['backup_lich_su','audit_log','user_roles','profiles',
                            'ai_config','ai_conversation','ai_message',
                            'messages','conversations','conversation_participant','notifications'];
  allowed text[];
  restored jsonb := '{}'::jsonb;
  n integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: chỉ Admin được khôi phục dữ liệu';
  END IF;

  SELECT array_agg(c.relname::text) INTO allowed
  FROM pg_class c JOIN pg_namespace nsp ON nsp.oid = c.relnamespace
  WHERE nsp.nspname = 'public' AND c.relkind = 'r';

  PERFORM set_config('session_replication_role', 'replica', true);

  FOR tbl, rows IN SELECT key, value FROM jsonb_each(payload)
  LOOP
    CONTINUE WHEN tbl = ANY(blocklist);
    CONTINUE WHEN NOT (tbl = ANY(allowed));
    CONTINUE WHEN jsonb_typeof(rows) <> 'array';

    EXECUTE format('DELETE FROM public.%I', tbl);
    EXECUTE format(
      'INSERT INTO public.%I SELECT * FROM jsonb_populate_recordset(NULL::public.%I, $1)',
      tbl, tbl
    ) USING rows;
    GET DIAGNOSTICS n = ROW_COUNT;
    restored := restored || jsonb_build_object(tbl, n);
  END LOOP;

  PERFORM set_config('session_replication_role', 'origin', true);
  RETURN jsonb_build_object('ok', true, 'restored', restored);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_restore_database(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_restore_database(jsonb) TO authenticated;