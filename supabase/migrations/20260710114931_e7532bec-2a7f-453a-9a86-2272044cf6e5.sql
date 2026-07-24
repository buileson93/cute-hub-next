-- Bảng cài đặt thương hiệu/ứng dụng dạng khoá-giá trị (logo, v.v.)
CREATE TABLE public.app_cai_dat (
  khoa text PRIMARY KEY,
  gia_tri text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT ON public.app_cai_dat TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_cai_dat TO authenticated;
GRANT ALL ON public.app_cai_dat TO service_role;

ALTER TABLE public.app_cai_dat ENABLE ROW LEVEL SECURITY;

-- Ai cũng đọc được (logo hiển thị ở cả trang đăng nhập công khai)
CREATE POLICY "app_cai_dat_read_all"
  ON public.app_cai_dat FOR SELECT
  USING (true);

-- Chỉ admin được ghi
CREATE POLICY "app_cai_dat_admin_insert"
  ON public.app_cai_dat FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "app_cai_dat_admin_update"
  ON public.app_cai_dat FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "app_cai_dat_admin_delete"
  ON public.app_cai_dat FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));