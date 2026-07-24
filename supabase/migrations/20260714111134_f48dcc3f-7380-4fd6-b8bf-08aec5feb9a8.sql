
-- 1) Soft-delete columns
ALTER TABLE public.he_thong_thanh_phan
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_reason text;

CREATE INDEX IF NOT EXISTS he_thong_thanh_phan_deleted_at_idx
  ON public.he_thong_thanh_phan(deleted_at) WHERE deleted_at IS NOT NULL;

-- 2) has_permission helper (role_permission-based; admin always passes)
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _module text, _action text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.role_permission rp
        ON rp.role = ur.role
      WHERE ur.user_id = _user_id
        AND rp.module = _module
        AND rp.action = _action
        AND rp.allowed = true
    );
$$;

GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text, text) TO authenticated, service_role;

-- 3) Seed default force_delete permission (admin only)
INSERT INTO public.role_permission(role, module, action, allowed)
VALUES ('admin', 'he_thong', 'force_delete', true)
ON CONFLICT (role, module, action) DO NOTHING;

-- 4) Preview RPC — counts + sample summary of related rows
CREATE OR REPLACE FUNCTION public.xem_truoc_xoa_thanh_phan(v_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_gan int; c_su_co int; c_bao_tri int; c_hong_hoc int;
  s_gan jsonb; s_su_co jsonb; s_bao_tri jsonb; s_hong_hoc jsonb;
  info jsonb;
BEGIN
  SELECT to_jsonb(t) INTO info FROM (
    SELECT id, ma_thanh_phan, ten, he_thong_id, trang_thai, deleted_at
    FROM public.he_thong_thanh_phan WHERE id = v_id
  ) t;
  IF info IS NULL THEN RAISE EXCEPTION 'Không tìm thấy thành phần %', v_id; END IF;

  SELECT COUNT(*) INTO c_gan FROM public.gan_chuc_nang WHERE thanh_phan_id = v_id;
  SELECT COUNT(*) INTO c_su_co FROM public.su_co WHERE thanh_phan_id = v_id;
  SELECT COUNT(*) INTO c_bao_tri FROM public.bao_tri WHERE thanh_phan_id = v_id;
  SELECT COUNT(*) INTO c_hong_hoc FROM public.hong_hoc WHERE thanh_phan_id = v_id;

  SELECT COALESCE(jsonb_agg(row), '[]'::jsonb) INTO s_gan FROM (
    SELECT g.id, g.thiet_bi_id, t.ma_thiet_bi, t.ma_serial, g.tu_ngay, g.den_ngay, g.ly_do
    FROM public.gan_chuc_nang g
    LEFT JOIN public.thiet_bi t ON t.id = g.thiet_bi_id
    WHERE g.thanh_phan_id = v_id
    ORDER BY g.tu_ngay DESC NULLS LAST
    LIMIT 5
  ) row;

  SELECT COALESCE(jsonb_agg(row), '[]'::jsonb) INTO s_su_co FROM (
    SELECT id, ma_su_co, tieu_de, trang_thai, thoi_diem_phat_hien
    FROM public.su_co WHERE thanh_phan_id = v_id
    ORDER BY thoi_diem_phat_hien DESC NULLS LAST LIMIT 5
  ) row;

  SELECT COALESCE(jsonb_agg(row), '[]'::jsonb) INTO s_bao_tri FROM (
    SELECT id, ma_bao_tri, tieu_de, trang_thai, ngay_thuc_hien
    FROM public.bao_tri WHERE thanh_phan_id = v_id
    ORDER BY ngay_thuc_hien DESC NULLS LAST LIMIT 5
  ) row;

  SELECT COALESCE(jsonb_agg(row), '[]'::jsonb) INTO s_hong_hoc FROM (
    SELECT id, ma_hong_hoc, mo_ta, trang_thai, ngay_phat_hien
    FROM public.hong_hoc WHERE thanh_phan_id = v_id
    ORDER BY ngay_phat_hien DESC NULLS LAST LIMIT 5
  ) row;

  RETURN jsonb_build_object(
    'thanh_phan', info,
    'counts', jsonb_build_object('gan', c_gan, 'su_co', c_su_co, 'bao_tri', c_bao_tri, 'hong_hoc', c_hong_hoc),
    'samples', jsonb_build_object('gan', s_gan, 'su_co', s_su_co, 'bao_tri', s_bao_tri, 'hong_hoc', s_hong_hoc)
  );
END $$;

GRANT EXECUTE ON FUNCTION public.xem_truoc_xoa_thanh_phan(uuid) TO authenticated;

-- 5) Force delete (soft) + audit
CREATE OR REPLACE FUNCTION public.xoa_thanh_phan_cuong_buc(v_id uuid, v_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  info record;
  c_gan int; c_su_co int; c_bao_tri int; c_hong_hoc int;
  n_detached int := 0;
  ht_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập'; END IF;
  IF NOT public.has_permission(uid, 'he_thong', 'force_delete') THEN
    RAISE EXCEPTION 'Không có quyền xoá cưỡng bức thành phần (he_thong.force_delete)';
  END IF;

  SELECT id, ma_thanh_phan, ten, he_thong_id, deleted_at INTO info
  FROM public.he_thong_thanh_phan WHERE id = v_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy thành phần %', v_id; END IF;
  IF info.deleted_at IS NOT NULL THEN RAISE EXCEPTION 'Thành phần đã bị xoá mềm trước đó'; END IF;
  ht_id := info.he_thong_id;

  SELECT COUNT(*) INTO c_gan FROM public.gan_chuc_nang WHERE thanh_phan_id = v_id;
  SELECT COUNT(*) INTO c_su_co FROM public.su_co WHERE thanh_phan_id = v_id;
  SELECT COUNT(*) INTO c_bao_tri FROM public.bao_tri WHERE thanh_phan_id = v_id;
  SELECT COUNT(*) INTO c_hong_hoc FROM public.hong_hoc WHERE thanh_phan_id = v_id;

  -- Đóng các bản ghi lắp thiết bị đang hoạt động (giữ lịch sử, cho khôi phục sạch)
  UPDATE public.gan_chuc_nang
     SET den_ngay = now(),
         ly_do = COALESCE(ly_do, '') || ' [force-delete component]'
   WHERE thanh_phan_id = v_id AND den_ngay IS NULL;
  GET DIAGNOSTICS n_detached = ROW_COUNT;

  UPDATE public.he_thong_thanh_phan
     SET deleted_at = now(), deleted_by = uid, deleted_reason = v_reason,
         trang_thai = 'ngung'
   WHERE id = v_id;

  INSERT INTO public.audit_log(user_id, action, entity, entity_id, severity, he_thong_id, detail)
  VALUES (
    uid, 'force_delete_component', 'he_thong_thanh_phan', v_id::text, 'warning', ht_id,
    jsonb_build_object(
      'ma_thanh_phan', info.ma_thanh_phan,
      'ten', info.ten,
      'reason', v_reason,
      'affected', jsonb_build_object(
        'gan_chuc_nang', c_gan,
        'gan_chuc_nang_detached', n_detached,
        'su_co', c_su_co,
        'bao_tri', c_bao_tri,
        'hong_hoc', c_hong_hoc
      ),
      'restore_deadline', (now() + interval '30 days')
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'affected', jsonb_build_object(
      'gan_chuc_nang', c_gan,
      'gan_chuc_nang_detached', n_detached,
      'su_co', c_su_co,
      'bao_tri', c_bao_tri,
      'hong_hoc', c_hong_hoc
    )
  );
END $$;

GRANT EXECUTE ON FUNCTION public.xoa_thanh_phan_cuong_buc(uuid, text) TO authenticated;

-- 6) Restore within 30 days
CREATE OR REPLACE FUNCTION public.khoi_phuc_thanh_phan(v_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  info record;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập'; END IF;
  IF NOT public.has_permission(uid, 'he_thong', 'force_delete') THEN
    RAISE EXCEPTION 'Không có quyền khôi phục thành phần';
  END IF;

  SELECT id, he_thong_id, deleted_at, ma_thanh_phan, ten INTO info
  FROM public.he_thong_thanh_phan WHERE id = v_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy thành phần'; END IF;
  IF info.deleted_at IS NULL THEN RAISE EXCEPTION 'Thành phần này không ở trạng thái đã xoá'; END IF;
  IF info.deleted_at < now() - interval '30 days' THEN
    RAISE EXCEPTION 'Đã quá hạn 30 ngày để khôi phục';
  END IF;

  UPDATE public.he_thong_thanh_phan
     SET deleted_at = NULL, deleted_by = NULL, deleted_reason = NULL,
         trang_thai = 'hoat_dong'
   WHERE id = v_id;

  INSERT INTO public.audit_log(user_id, action, entity, entity_id, severity, he_thong_id, detail)
  VALUES (uid, 'restore_component', 'he_thong_thanh_phan', v_id::text, 'info', info.he_thong_id,
          jsonb_build_object('ma_thanh_phan', info.ma_thanh_phan, 'ten', info.ten));

  RETURN jsonb_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.khoi_phuc_thanh_phan(uuid) TO authenticated;
