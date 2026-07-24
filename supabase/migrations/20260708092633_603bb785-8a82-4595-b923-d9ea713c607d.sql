-- 1) Bổ sung cột gắn hệ thống/đơn vị (theo mã danh mục) cho sơ đồ
ALTER TABLE public.so_do_he_thong
  ADD COLUMN IF NOT EXISTS don_vi_ma text,
  ADD COLUMN IF NOT EXISTS he_thong_ma text,
  ADD COLUMN IF NOT EXISTS he_thong_ten text;

-- 2) Hàm lấy mã đơn vị của người dùng (từ hồ sơ)
CREATE OR REPLACE FUNCTION public.get_user_don_vi_ma(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (p.don_vi)::text FROM public.profiles p WHERE p.id = _user_id LIMIT 1
$$;

-- 3) Cập nhật RLS của so_do_he_thong theo mã đơn vị + người tạo
DROP POLICY IF EXISTS so_do_read_scope ON public.so_do_he_thong;
DROP POLICY IF EXISTS so_do_insert_scope ON public.so_do_he_thong;
DROP POLICY IF EXISTS so_do_update_scope ON public.so_do_he_thong;
DROP POLICY IF EXISTS so_do_delete_scope ON public.so_do_he_thong;

CREATE POLICY so_do_read_scope ON public.so_do_he_thong
  FOR SELECT TO authenticated
  USING (
    public.is_active_user(auth.uid())
    AND (
      public.can_manage_equipment(auth.uid())
      OR created_by = auth.uid()
      OR (don_vi_ma IS NOT NULL AND don_vi_ma = public.get_user_don_vi_ma(auth.uid()))
    )
  );

CREATE POLICY so_do_insert_scope ON public.so_do_he_thong
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_active_user(auth.uid())
    AND created_by = auth.uid()
    AND (
      public.can_manage_equipment(auth.uid())
      OR (don_vi_ma IS NOT NULL AND don_vi_ma = public.get_user_don_vi_ma(auth.uid()))
    )
  );

CREATE POLICY so_do_update_scope ON public.so_do_he_thong
  FOR UPDATE TO authenticated
  USING (
    public.can_manage_equipment(auth.uid())
    OR created_by = auth.uid()
    OR (don_vi_ma IS NOT NULL AND don_vi_ma = public.get_user_don_vi_ma(auth.uid()))
  )
  WITH CHECK (
    public.can_manage_equipment(auth.uid())
    OR created_by = auth.uid()
    OR (don_vi_ma IS NOT NULL AND don_vi_ma = public.get_user_don_vi_ma(auth.uid()))
  );

CREATE POLICY so_do_delete_scope ON public.so_do_he_thong
  FOR DELETE TO authenticated
  USING (
    public.can_manage_equipment(auth.uid())
    OR created_by = auth.uid()
    OR (don_vi_ma IS NOT NULL AND don_vi_ma = public.get_user_don_vi_ma(auth.uid()))
  );

-- 4) Hàm kiểm tra quyền truy cập một sơ đồ (dùng cho bảng tệp đính kèm & storage)
CREATE OR REPLACE FUNCTION public.can_access_so_do(_so_do_id uuid, _user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.so_do_he_thong s
    WHERE s.id = _so_do_id
      AND (
        public.can_manage_equipment(_user)
        OR s.created_by = _user
        OR (s.don_vi_ma IS NOT NULL AND s.don_vi_ma = public.get_user_don_vi_ma(_user))
      )
  )
$$;

-- 5) Bảng tệp đính kèm của sơ đồ
CREATE TABLE public.so_do_tep_dinh_kem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  so_do_id uuid NOT NULL REFERENCES public.so_do_he_thong(id) ON DELETE CASCADE,
  ten_tep text NOT NULL,
  duong_dan text NOT NULL,
  loai text,
  kich_thuoc bigint,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.so_do_tep_dinh_kem TO authenticated;
GRANT ALL ON public.so_do_tep_dinh_kem TO service_role;

ALTER TABLE public.so_do_tep_dinh_kem ENABLE ROW LEVEL SECURITY;

CREATE POLICY so_do_tep_read ON public.so_do_tep_dinh_kem
  FOR SELECT TO authenticated
  USING (public.is_active_user(auth.uid()) AND public.can_access_so_do(so_do_id, auth.uid()));

CREATE POLICY so_do_tep_insert ON public.so_do_tep_dinh_kem
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.can_access_so_do(so_do_id, auth.uid()));

CREATE POLICY so_do_tep_delete ON public.so_do_tep_dinh_kem
  FOR DELETE TO authenticated
  USING (public.can_access_so_do(so_do_id, auth.uid()));

CREATE INDEX so_do_tep_so_do_id_idx ON public.so_do_tep_dinh_kem(so_do_id);

-- 6) RLS cho tệp trên storage (bucket so-do-tep); đường dẫn dạng {so_do_id}/{file}
CREATE POLICY "so_do_tep_storage_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'so-do-tep'
    AND public.can_access_so_do(((storage.foldername(name))[1])::uuid, auth.uid())
  );

CREATE POLICY "so_do_tep_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'so-do-tep'
    AND public.can_access_so_do(((storage.foldername(name))[1])::uuid, auth.uid())
  );

CREATE POLICY "so_do_tep_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'so-do-tep'
    AND public.can_access_so_do(((storage.foldername(name))[1])::uuid, auth.uid())
  );