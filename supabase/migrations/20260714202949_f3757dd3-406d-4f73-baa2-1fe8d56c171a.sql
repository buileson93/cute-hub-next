
-- 1) Enum trạng thái duyệt
DO $$ BEGIN
  CREATE TYPE public.trang_thai_duyet_enum AS ENUM ('nhap','cho_duyet','da_duyet','tu_choi');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Thêm cột duyệt/ký + lưu trữ vào các bảng biên bản
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['bao_tri','ban_giao','form_submission','su_co'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I
      ADD COLUMN IF NOT EXISTS trang_thai_duyet public.trang_thai_duyet_enum NOT NULL DEFAULT ''nhap'',
      ADD COLUMN IF NOT EXISTS nguoi_duyet_id uuid REFERENCES auth.users(id),
      ADD COLUMN IF NOT EXISTS thoi_diem_duyet timestamptz,
      ADD COLUMN IF NOT EXISTS chu_ky_hash text,
      ADD COLUMN IF NOT EXISTS ghi_chu_duyet text', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(trang_thai_duyet)',
      t || '_trang_thai_duyet_idx', t);
  END LOOP;
END $$;

-- 3) Cờ lưu trữ (đánh dấu thay vì xoá cứng)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['bao_tri','ban_giao','form_submission','su_co','hong_hoc','giay_phep_khai_thac'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I
      ADD COLUMN IF NOT EXISTS luu_tru boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS luu_tru_luc timestamptz,
      ADD COLUMN IF NOT EXISTS luu_tru_boi uuid REFERENCES auth.users(id),
      ADD COLUMN IF NOT EXISTS luu_tru_ly_do text', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(luu_tru) WHERE luu_tru = true',
      t || '_luu_tru_idx', t);
  END LOOP;
END $$;

-- 4) RPC duyệt biên bản (áp dụng máy trạng thái phía FE + xác thực phía DB)
CREATE OR REPLACE FUNCTION public.duyet_bien_ban(
  p_loai text,             -- 'bao_tri' | 'ban_giao' | 'form_submission' | 'su_co'
  p_id uuid,
  p_hanh_dong text,        -- 'submit' | 'duyet' | 'tu_choi' | 'thu_hoi'
  p_ghi_chu text DEFAULT NULL,
  p_chu_ky_hash text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_state text;
  v_owner uuid;
  v_next text;
  v_is_admin boolean;
  v_can_duyet boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Chưa đăng nhập';
  END IF;
  IF p_loai NOT IN ('bao_tri','ban_giao','form_submission','su_co') THEN
    RAISE EXCEPTION 'Loại biên bản không hợp lệ: %', p_loai;
  END IF;

  v_is_admin := public.has_role(v_uid, 'admin');
  v_can_duyet := v_is_admin
    OR public.has_role(v_uid, 'phong_kt')
    OR public.has_role(v_uid, 'phu_trach_dv')
    OR public.has_role(v_uid, 'to_truong');

  EXECUTE format('SELECT trang_thai_duyet::text, nguoi_tao FROM public.%I WHERE id = $1', p_loai)
    INTO v_state, v_owner USING p_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy biên bản %/%', p_loai, p_id;
  END IF;

  -- Chuyển trạng thái
  IF p_hanh_dong = 'submit' THEN
    IF v_state NOT IN ('nhap','tu_choi') THEN
      RAISE EXCEPTION 'Không thể trình duyệt từ trạng thái %', v_state;
    END IF;
    IF v_owner IS DISTINCT FROM v_uid AND NOT (v_is_admin OR public.has_role(v_uid,'phong_kt')) THEN
      RAISE EXCEPTION 'Chỉ người tạo hoặc quản trị được trình duyệt';
    END IF;
    v_next := 'cho_duyet';
  ELSIF p_hanh_dong = 'duyet' THEN
    IF v_state <> 'cho_duyet' THEN
      RAISE EXCEPTION 'Chỉ duyệt được từ trạng thái cho_duyet';
    END IF;
    IF NOT v_can_duyet THEN
      RAISE EXCEPTION 'Vai trò không có quyền duyệt';
    END IF;
    IF v_owner = v_uid AND NOT v_is_admin THEN
      RAISE EXCEPTION 'Không được tự duyệt biên bản của chính mình';
    END IF;
    v_next := 'da_duyet';
  ELSIF p_hanh_dong = 'tu_choi' THEN
    IF v_state <> 'cho_duyet' THEN
      RAISE EXCEPTION 'Chỉ từ chối được từ trạng thái cho_duyet';
    END IF;
    IF NOT v_can_duyet THEN
      RAISE EXCEPTION 'Vai trò không có quyền duyệt';
    END IF;
    v_next := 'tu_choi';
  ELSIF p_hanh_dong = 'thu_hoi' THEN
    IF v_state <> 'da_duyet' THEN
      RAISE EXCEPTION 'Chỉ thu hồi được biên bản đã duyệt';
    END IF;
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Chỉ admin được thu hồi';
    END IF;
    v_next := 'nhap';
  ELSE
    RAISE EXCEPTION 'Hành động không hợp lệ: %', p_hanh_dong;
  END IF;

  -- Ghi thay đổi
  IF v_next = 'da_duyet' THEN
    EXECUTE format('UPDATE public.%I
      SET trang_thai_duyet = $1::public.trang_thai_duyet_enum,
          nguoi_duyet_id = $2, thoi_diem_duyet = now(),
          chu_ky_hash = COALESCE($3, chu_ky_hash),
          ghi_chu_duyet = COALESCE($4, ghi_chu_duyet)
      WHERE id = $5', p_loai)
      USING v_next, v_uid, p_chu_ky_hash, p_ghi_chu, p_id;
  ELSIF v_next = 'nhap' THEN
    -- Thu hồi: xoá dữ liệu duyệt cũ
    EXECUTE format('UPDATE public.%I
      SET trang_thai_duyet = ''nhap''::public.trang_thai_duyet_enum,
          nguoi_duyet_id = NULL, thoi_diem_duyet = NULL, chu_ky_hash = NULL,
          ghi_chu_duyet = COALESCE($1, ghi_chu_duyet)
      WHERE id = $2', p_loai)
      USING p_ghi_chu, p_id;
  ELSE
    EXECUTE format('UPDATE public.%I
      SET trang_thai_duyet = $1::public.trang_thai_duyet_enum,
          ghi_chu_duyet = COALESCE($2, ghi_chu_duyet)
      WHERE id = $3', p_loai)
      USING v_next, p_ghi_chu, p_id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'loai', p_loai, 'id', p_id, 'trang_thai', v_next);
END $$;

REVOKE ALL ON FUNCTION public.duyet_bien_ban(text,uuid,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.duyet_bien_ban(text,uuid,text,text,text) TO authenticated, service_role;

-- 5) RPC đánh dấu lưu trữ (thay xoá cứng)
CREATE OR REPLACE FUNCTION public.luu_tru_ho_so(
  p_loai text, p_id uuid, p_ly_do text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập'; END IF;
  IF p_loai NOT IN ('bao_tri','ban_giao','form_submission','su_co','hong_hoc','giay_phep_khai_thac') THEN
    RAISE EXCEPTION 'Loại hồ sơ không hợp lệ: %', p_loai;
  END IF;
  IF NOT (public.has_role(v_uid,'admin') OR public.has_role(v_uid,'phong_kt')) THEN
    RAISE EXCEPTION 'Không có quyền lưu trữ hồ sơ';
  END IF;
  EXECUTE format('UPDATE public.%I
    SET luu_tru = true, luu_tru_luc = now(), luu_tru_boi = $1, luu_tru_ly_do = $2
    WHERE id = $3', p_loai)
    USING v_uid, p_ly_do, p_id;
  RETURN jsonb_build_object('ok', true, 'loai', p_loai, 'id', p_id);
END $$;

REVOKE ALL ON FUNCTION public.luu_tru_ho_so(text,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.luu_tru_ho_so(text,uuid,text) TO authenticated, service_role;

-- 6) Trigger chặn xoá cứng biên bản đã duyệt (chỉ admin)
CREATE OR REPLACE FUNCTION public.chan_xoa_bien_ban_da_duyet() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.trang_thai_duyet = 'da_duyet' AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Không được xoá cứng biên bản đã duyệt. Hãy dùng chức năng lưu trữ.';
  END IF;
  RETURN OLD;
END $$;

DO $$
DECLARE t text; tables text[] := ARRAY['bao_tri','ban_giao','form_submission','su_co'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_chan_xoa_duyet', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE DELETE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.chan_xoa_bien_ban_da_duyet()',
      t || '_chan_xoa_duyet', t);
  END LOOP;
END $$;

-- 7) Trigger khoá sửa sau khi duyệt (chỉ admin thu_hoi được đổi)
CREATE OR REPLACE FUNCTION public.khoa_bien_ban_da_duyet() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Cho phép chuyển state qua RPC (đã kiểm quyền); chặn UPDATE thường khi state vẫn = da_duyet
  IF OLD.trang_thai_duyet = 'da_duyet'
     AND NEW.trang_thai_duyet = 'da_duyet'
     AND NOT public.has_role(auth.uid(),'admin') THEN
    -- Cho phép chỉ đổi cờ lưu trữ
    IF ROW(NEW.*) IS DISTINCT FROM ROW(OLD.*) THEN
      -- Chấp nhận khi chỉ luu_tru*, updated_at thay đổi
      IF NEW.luu_tru IS DISTINCT FROM OLD.luu_tru
         OR NEW.luu_tru_luc IS DISTINCT FROM OLD.luu_tru_luc
         OR NEW.luu_tru_boi IS DISTINCT FROM OLD.luu_tru_boi
         OR NEW.luu_tru_ly_do IS DISTINCT FROM OLD.luu_tru_ly_do THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'Biên bản đã duyệt bị khoá sửa. Hãy thu hồi trước khi chỉnh.';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DO $$
DECLARE t text; tables text[] := ARRAY['bao_tri','ban_giao','form_submission','su_co'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_khoa_duyet', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.khoa_bien_ban_da_duyet()',
      t || '_khoa_duyet', t);
  END LOOP;
END $$;

COMMENT ON FUNCTION public.duyet_bien_ban IS 'Task 42 — Máy trạng thái duyệt/ký biên bản (nhap→cho_duyet→da_duyet).';
COMMENT ON FUNCTION public.luu_tru_ho_so IS 'Task 42 — Đánh dấu lưu trữ hồ sơ (retention, không xoá cứng).';
