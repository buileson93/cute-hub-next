SET search_path = public, pg_catalog;
--
-- Name: khai_them_thanh_phan_he_thong(uuid, text, text, uuid, uuid, boolean, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.khai_them_thanh_phan_he_thong(p_he_thong_id uuid, p_ma_thanh_phan text, p_ten text, p_loai_thiet_bi_yeu_cau uuid DEFAULT NULL::uuid, p_thanh_phan_cha uuid DEFAULT NULL::uuid, p_bat_buoc boolean DEFAULT true, p_thu_tu integer DEFAULT NULL::integer, p_mo_ta text DEFAULT NULL::text) RETURNS TABLE(id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_user uuid := public.current_uid();
  v_ma text := NULLIF(btrim(p_ma_thanh_phan), '');
  v_ten text := NULLIF(btrim(p_ten), '');
  v_id uuid;
  v_he_thong public.dm_he_thong%ROWTYPE;
  v_stage text := 'start';
BEGIN
  v_stage := 'is_active_user';
  IF v_user IS NULL OR NOT public.is_active_user(v_user) THEN
    RAISE EXCEPTION 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn'
      USING ERRCODE = '42501';
  END IF;

  v_stage := 'can_manage_equipment';
  IF NOT public.can_manage_equipment(v_user) THEN
    RAISE EXCEPTION 'Tài khoản chưa có quyền khai thêm thành phần hệ thống'
      USING ERRCODE = '42501';
  END IF;

  v_stage := 'validate_system_id';
  IF p_he_thong_id IS NULL THEN
    RAISE EXCEPTION 'Chưa chọn hệ thống cha'
      USING ERRCODE = '23502';
  END IF;

  v_stage := 'select_dm_he_thong';
  SELECT *
    INTO v_he_thong
    FROM public.dm_he_thong
   WHERE dm_he_thong.id = p_he_thong_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy hệ thống cha'
      USING ERRCODE = '23503';
  END IF;

  v_stage := 'validate_don_vi';
  IF v_he_thong.don_vi_id IS NULL THEN
    RAISE EXCEPTION 'Hệ thống cha chưa có đơn vị quản lý'
      USING ERRCODE = '23502';
  END IF;

  v_stage := 'validate_name';
  IF v_ten IS NULL THEN
    RAISE EXCEPTION 'Chưa nhập tên thành phần'
      USING ERRCODE = '23502';
  END IF;

  v_stage := 'validate_parent';
  IF p_thanh_phan_cha IS NOT NULL AND NOT EXISTS (
    SELECT 1
      FROM public.he_thong_thanh_phan tp
     WHERE tp.id = p_thanh_phan_cha
       AND tp.he_thong_id = p_he_thong_id
  ) THEN
    RAISE EXCEPTION 'Thành phần cha không thuộc hệ thống đã chọn'
      USING ERRCODE = '23503';
  END IF;

  v_stage := 'validate_loai';
  IF p_loai_thiet_bi_yeu_cau IS NOT NULL AND NOT EXISTS (
    SELECT 1
      FROM public.dm_loai_thiet_bi ltb
     WHERE ltb.id = p_loai_thiet_bi_yeu_cau
  ) THEN
    RAISE EXCEPTION 'Chủng loại yêu cầu không tồn tại'
      USING ERRCODE = '23503';
  END IF;

  v_stage := 'generate_code';
  IF v_ma IS NULL THEN
    v_ma := 'TPHT_' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;

  WHILE EXISTS (
    SELECT 1
      FROM public.he_thong_thanh_phan tp
     WHERE tp.he_thong_id = p_he_thong_id
       AND tp.ma_thanh_phan = v_ma
  ) LOOP
    v_ma := 'TPHT_' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END LOOP;

  v_stage := 'insert_he_thong_thanh_phan';
  INSERT INTO public.he_thong_thanh_phan (
    he_thong_id,
    ma_thanh_phan,
    ten,
    loai_thiet_bi_yeu_cau,
    thanh_phan_cha,
    bat_buoc,
    thu_tu,
    mo_ta,
    don_vi_id_snapshot,
    created_by
  ) VALUES (
    v_he_thong.id,
    v_ma,
    v_ten,
    p_loai_thiet_bi_yeu_cau,
    p_thanh_phan_cha,
    COALESCE(p_bat_buoc, true),
    p_thu_tu,
    NULLIF(btrim(COALESCE(p_mo_ta, '')), ''),
    v_he_thong.don_vi_id,
    v_user
  )
  RETURNING he_thong_thanh_phan.id INTO v_id;

  RETURN QUERY SELECT v_id;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'khai_them_thanh_phan_he_thong[%]: %', v_stage, SQLERRM
    USING ERRCODE = SQLSTATE;
END;
$$;


--
-- Name: kho_chuyen(uuid, uuid, uuid, numeric, text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kho_chuyen(_vat_tu_id uuid, _kho_nguon_id uuid, _kho_dich_id uuid, _so_luong numeric, _ghi_chu text DEFAULT NULL::text, _cho_phep_am boolean DEFAULT false) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE _nhom uuid := gen_random_uuid(); _ton numeric;
BEGIN
  IF NOT can_manage_equipment(public.current_uid()) THEN RAISE EXCEPTION 'Không có quyền chuyển kho'; END IF;
  IF _so_luong <= 0 THEN RAISE EXCEPTION 'Số lượng phải > 0'; END IF;
  IF _kho_nguon_id = _kho_dich_id THEN RAISE EXCEPTION 'Kho nguồn và kho đích phải khác nhau'; END IF;
  _ton := public.kho_ton_hien_tai(_vat_tu_id, _kho_nguon_id);
  IF _ton < _so_luong AND NOT _cho_phep_am THEN
    RAISE EXCEPTION 'Không đủ tồn kho nguồn: hiện có %, cần chuyển %', _ton, _so_luong;
  END IF;
  INSERT INTO public.kho_giao_dich(nhom_ct, vat_tu_id, kho_id, loai, so_luong, ghi_chu)
  VALUES (_nhom, _vat_tu_id, _kho_nguon_id, 'CHUYEN_XUAT', _so_luong, _ghi_chu);
  INSERT INTO public.kho_giao_dich(nhom_ct, vat_tu_id, kho_id, loai, so_luong, ghi_chu)
  VALUES (_nhom, _vat_tu_id, _kho_dich_id, 'CHUYEN_NHAP', _so_luong, _ghi_chu);
  RETURN _nhom;
END;
$$;


--
-- Name: kho_kiem_ke(uuid, uuid, numeric, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kho_kiem_ke(_vat_tu_id uuid, _kho_id uuid, _so_luong_thuc_te numeric, _ghi_chu text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE _id uuid; _ton numeric; _delta numeric;
BEGIN
  IF NOT can_manage_equipment(public.current_uid()) THEN RAISE EXCEPTION 'Không có quyền kiểm kê kho'; END IF;
  IF _so_luong_thuc_te < 0 THEN RAISE EXCEPTION 'Số lượng thực tế không âm'; END IF;
  _ton := public.kho_ton_hien_tai(_vat_tu_id, _kho_id);
  _delta := _so_luong_thuc_te - _ton;
  IF _delta = 0 THEN RETURN NULL; END IF;
  INSERT INTO public.kho_giao_dich(vat_tu_id, kho_id, loai, so_luong, ghi_chu)
  VALUES (_vat_tu_id, _kho_id,
    CASE WHEN _delta > 0 THEN 'DIEU_CHINH_TANG' ELSE 'DIEU_CHINH_GIAM' END,
    abs(_delta), COALESCE(_ghi_chu, 'Kiểm kê: điều chỉnh từ ' || _ton || ' → ' || _so_luong_thuc_te))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;


--
-- Name: kho_nhap(uuid, uuid, numeric, numeric, text, uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kho_nhap(_vat_tu_id uuid, _kho_id uuid, _so_luong numeric, _don_gia numeric DEFAULT 0, _ghi_chu text DEFAULT NULL::text, _cong_viec_id uuid DEFAULT NULL::uuid, _su_co_id uuid DEFAULT NULL::uuid, _hong_hoc_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE _id uuid;
BEGIN
  IF NOT can_manage_equipment(public.current_uid()) THEN RAISE EXCEPTION 'Không có quyền nhập kho'; END IF;
  IF _so_luong <= 0 THEN RAISE EXCEPTION 'Số lượng phải > 0'; END IF;
  INSERT INTO public.kho_giao_dich(vat_tu_id, kho_id, loai, so_luong, don_gia, ghi_chu,
    lien_ket_cong_viec_id, lien_ket_su_co_id, lien_ket_hong_hoc_id)
  VALUES (_vat_tu_id, _kho_id, 'NHAP', _so_luong, _don_gia, _ghi_chu,
    _cong_viec_id, _su_co_id, _hong_hoc_id)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;


--
-- Name: kho_ton_hien_tai(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kho_ton_hien_tai(_vat_tu_id uuid, _kho_id uuid) RETURNS numeric
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(SUM(hieu_ung), 0) FROM public.kho_giao_dich
  WHERE vat_tu_id = _vat_tu_id AND kho_id = _kho_id;
$$;


--
-- Name: kho_xuat(uuid, uuid, numeric, numeric, text, uuid, uuid, uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kho_xuat(_vat_tu_id uuid, _kho_id uuid, _so_luong numeric, _don_gia numeric DEFAULT 0, _ghi_chu text DEFAULT NULL::text, _cong_viec_id uuid DEFAULT NULL::uuid, _su_co_id uuid DEFAULT NULL::uuid, _hong_hoc_id uuid DEFAULT NULL::uuid, _cho_phep_am boolean DEFAULT false) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE _id uuid; _ton numeric;
BEGIN
  IF NOT can_manage_equipment(public.current_uid()) THEN RAISE EXCEPTION 'Không có quyền xuất kho'; END IF;
  IF _so_luong <= 0 THEN RAISE EXCEPTION 'Số lượng phải > 0'; END IF;
  _ton := public.kho_ton_hien_tai(_vat_tu_id, _kho_id);
  IF _ton < _so_luong AND NOT _cho_phep_am THEN
    RAISE EXCEPTION 'Không đủ tồn kho: hiện có %, cần xuất %', _ton, _so_luong;
  END IF;
  INSERT INTO public.kho_giao_dich(vat_tu_id, kho_id, loai, so_luong, don_gia, ghi_chu,
    lien_ket_cong_viec_id, lien_ket_su_co_id, lien_ket_hong_hoc_id)
  VALUES (_vat_tu_id, _kho_id, 'XUAT', _so_luong, _don_gia, _ghi_chu,
    _cong_viec_id, _su_co_id, _hong_hoc_id)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;


--
-- Name: khoi_phuc_thanh_phan(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.khoi_phuc_thanh_phan(v_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  uid uuid := public.current_uid();
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


--
-- Name: lap_linh_kien(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.lap_linh_kien(p_khe_id uuid, p_linh_kien_id uuid, p_ghi_chu text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_tt text; v_id uuid;
BEGIN
  IF NOT can_manage_equipment(public.current_uid()) THEN RAISE EXCEPTION 'Không có quyền quản lý thiết bị'; END IF;
  SELECT trang_thai INTO v_tt FROM public.thiet_bi_khe_linh_kien WHERE id = p_khe_id FOR UPDATE;
  IF v_tt IS NULL THEN RAISE EXCEPTION 'Khe linh kiện không tồn tại'; END IF;
  IF v_tt <> 'hoat_dong' THEN RAISE EXCEPTION 'Khe linh kiện đã ngừng'; END IF;
  IF EXISTS (SELECT 1 FROM public.gan_linh_kien WHERE khe_id = p_khe_id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Khe đang có linh kiện, hãy dùng Thay thế/Điều chuyển';
  END IF;
  IF EXISTS (SELECT 1 FROM public.gan_linh_kien WHERE linh_kien_id = p_linh_kien_id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Linh kiện đang được lắp ở khe khác';
  END IF;
  v_id := public._mo_gan_lk(p_khe_id, p_linh_kien_id, 'lắp mới', NULL, p_ghi_chu);
  RETURN v_id;
END;
$$;


--
-- Name: lap_tai_san_vao_thanh_phan(uuid, uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.lap_tai_san_vao_thanh_phan(p_thiet_bi_id uuid, p_thanh_phan_id uuid, p_ly_do text DEFAULT 'lắp mới'::text, p_ghi_chu text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_id uuid;
BEGIN
  -- Chỉ chặn trùng ở CÙNG một thành phần (đã có partial unique uq_gcn_thanh_phan_active).
  INSERT INTO public.gan_chuc_nang (thanh_phan_id, thiet_bi_id, ly_do, ghi_chu, nguoi_thuc_hien)
  VALUES (p_thanh_phan_id, p_thiet_bi_id, p_ly_do, p_ghi_chu, current_uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;


--
-- Name: lap_thiet_bi(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.lap_thiet_bi(p_thanh_phan_id uuid, p_thiet_bi_id uuid, p_ghi_chu text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_tt text; v_id uuid;
BEGIN
  IF NOT can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Không có quyền quản lý thiết bị';
  END IF;
  SELECT trang_thai INTO v_tt FROM public.he_thong_thanh_phan WHERE id = p_thanh_phan_id FOR UPDATE;
  IF v_tt IS NULL THEN RAISE EXCEPTION 'Vị trí chức năng không tồn tại'; END IF;
  IF v_tt <> 'hoat_dong' THEN RAISE EXCEPTION 'Vị trí chức năng đã ngừng, không thể gán thiết bị'; END IF;
  IF EXISTS (SELECT 1 FROM public.gan_chuc_nang WHERE thanh_phan_id = p_thanh_phan_id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Vị trí chức năng đang có thiết bị, hãy dùng Thay thế/Điều chuyển';
  END IF;
  -- KHÔNG chặn thiết bị đang lắp ở vị trí khác: 1 thiết bị được phép phục vụ nhiều thành phần.
  IF EXISTS (SELECT 1 FROM public.gan_chuc_nang WHERE thanh_phan_id = p_thanh_phan_id AND thiet_bi_id = p_thiet_bi_id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Thiết bị này đã được lắp tại chính vị trí chức năng này';
  END IF;
  v_id := public._mo_gan_va_vong_doi(p_thanh_phan_id, p_thiet_bi_id, 'lắp mới', NULL, p_ghi_chu);
  RETURN v_id;
END;
$$;


--
-- Name: lkht_snapshot_don_vi(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.lkht_snapshot_don_vi() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.don_vi_id_snapshot IS NULL THEN
    SELECT don_vi_id INTO NEW.don_vi_id_snapshot
    FROM public.dm_he_thong WHERE id = NEW.he_thong_nguon_id;
  END IF;
  IF NEW.created_by IS NULL THEN
    NEW.created_by := public.current_uid();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: lkk_snapshot_don_vi(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.lkk_snapshot_don_vi() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.don_vi_id_snapshot IS NULL THEN
    SELECT h.don_vi_id INTO NEW.don_vi_id_snapshot
    FROM public.he_thong_thanh_phan tp
    JOIN public.dm_he_thong h ON h.id = tp.he_thong_id
    WHERE tp.id = NEW.khe_nguon_id;
  END IF;
  IF NEW.created_by IS NULL THEN
    NEW.created_by := public.current_uid();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: log_app_event(text, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_app_event(_action text, _entity text, _entity_id text, _detail jsonb) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
  VALUES (public.current_uid(), _action, _entity, _entity_id, COALESCE(_detail, '{}'::jsonb));
$$;


--
-- Name: log_auth_event(text, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_auth_event(_event text, _target uuid, _detail jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF public.current_uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.auth_event_log(user_id, event, target_user_id, detail)
  VALUES (public.current_uid(), _event, _target, _detail);
END$$;


--
-- Name: log_feature_usage(text, text, jsonb, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_feature_usage(_feature text, _path text, _params jsonb, _duration_ms integer) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF public.current_uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.feature_usage_log(user_id, feature, path, params, duration_ms)
  VALUES (public.current_uid(), _feature, _path, _params, _duration_ms);
END$$;


--
-- Name: log_thiet_bi_vong_doi(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_thiet_bi_vong_doi() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.trang_thai_id IS DISTINCT FROM OLD.trang_thai_id THEN
    INSERT INTO public.thiet_bi_vong_doi (thiet_bi_id, tu_trang_thai_id, den_trang_thai_id, nguoi_thuc_hien)
    VALUES (NEW.id, OLD.trang_thai_id, NEW.trang_thai_id, public.current_uid());
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: merge_danh_muc(text, uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.merge_danh_muc(p_entity text, p_keep_id uuid, p_drop_id uuid, p_ly_do text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_uid uuid := auth.uid();
  v_map jsonb;
  v_refs jsonb;
  v_ref jsonb;
  v_tbl text;
  v_col text;
  v_reassigned jsonb := '[]'::jsonb;
  v_rows_updated integer;
  v_reassigned_ids jsonb;
  v_keep_exists boolean;
  v_drop_exists boolean;
  v_audit_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF NOT (public.has_role(v_uid, 'admin'::app_role)
       OR public.has_role(v_uid, 'phong_kt'::app_role)) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;
  IF p_keep_id = p_drop_id THEN
    RAISE EXCEPTION 'keep_id must differ from drop_id' USING ERRCODE = '22023';
  END IF;

  v_map := public._danh_muc_merge_ref_map();
  IF NOT (v_map ? p_entity) THEN
    RAISE EXCEPTION 'entity % is not mergeable', p_entity USING ERRCODE = '22023';
  END IF;

  -- Kiểm tra cả 2 bản ghi tồn tại
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE id = $1)', p_entity)
    INTO v_keep_exists USING p_keep_id;
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE id = $1)', p_entity)
    INTO v_drop_exists USING p_drop_id;
  IF NOT v_keep_exists OR NOT v_drop_exists THEN
    RAISE EXCEPTION 'record_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_refs := v_map -> p_entity;

  -- Lặp qua từng bảng tham chiếu: snapshot ID rồi UPDATE FK
  FOR v_ref IN SELECT * FROM jsonb_array_elements(v_refs) LOOP
    v_tbl := v_ref ->> 'table';
    v_col := v_ref ->> 'column';

    EXECUTE format(
      'SELECT COALESCE(jsonb_agg(id), ''[]''::jsonb) FROM public.%I WHERE %I = $1',
      v_tbl, v_col
    ) INTO v_reassigned_ids USING p_drop_id;

    EXECUTE format(
      'UPDATE public.%I SET %I = $1 WHERE %I = $2',
      v_tbl, v_col, v_col
    ) USING p_keep_id, p_drop_id;
    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

    v_reassigned := v_reassigned || jsonb_build_object(
      'table', v_tbl,
      'column', v_col,
      'rows', v_rows_updated,
      'ids', v_reassigned_ids
    );
  END LOOP;

  -- Vô hiệu hoá bản ghi drop
  EXECUTE format(
    'UPDATE public.%I
       SET active = false,
           merged_into = $1,
           deactivated_at = now(),
           updated_at = now()
     WHERE id = $2',
    p_entity
  ) USING p_keep_id, p_drop_id;

  -- Ghi audit
  INSERT INTO public.audit_log(user_id, action, entity, entity_id, detail, severity)
  VALUES (
    v_uid,
    'merge_danh_muc',
    p_entity,
    p_drop_id::text,
    jsonb_build_object(
      'keep_id', p_keep_id,
      'drop_id', p_drop_id,
      'ly_do', p_ly_do,
      'reassigned', v_reassigned
    ),
    'warning'
  )
  RETURNING id INTO v_audit_id;

  RETURN jsonb_build_object(
    'ok', true,
    'audit_id', v_audit_id,
    'keep_id', p_keep_id,
    'drop_id', p_drop_id,
    'reassigned', v_reassigned
  );
END;
$_$;


--
-- Name: mirats_apply_public_grants(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mirats_apply_public_grants() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_catalog'
    AS $$
DECLARE
  obj record;
BEGIN
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, sandbox_exec, postgres;
  GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public TO authenticated;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sandbox_exec;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

  GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sandbox_exec;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO sandbox_exec;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;

  FOR obj IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'khai_them_thanh_phan_he_thong',
        'gan_tai_san_vao_thanh_phan',
        'thao_tai_san_khoi_thanh_phan',
        'merge_danh_muc',
        'rpc_thanh_phan_toan_cuc'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO postgres', obj.signature);
    EXECUTE format('ALTER FUNCTION %s SECURITY DEFINER', obj.signature);
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', obj.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', obj.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', obj.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO sandbox_exec', obj.signature);
  END LOOP;
END;
$$;


--
-- Name: ngung_khai_thac_thiet_bi(text[], text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ngung_khai_thac_thiet_bi(_mas text[], _ly_do text DEFAULT NULL::text, _thanh_ly boolean DEFAULT false) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _uid uuid := public.current_uid();
  _status_id uuid;
  _status_ten text;
  _status_ma text := CASE WHEN _thanh_ly THEN 'THANH_LY' ELSE 'NGUNG_KHAI_THAC' END;
  _tb record;
  _n int := 0;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Chưa đăng nhập';
  END IF;
  IF NOT public.can_manage_equipment(_uid) THEN
    RAISE EXCEPTION 'Chỉ Admin hoặc Phòng Kỹ thuật được ngừng khai thác thiết bị';
  END IF;

  SELECT id, ten INTO _status_id, _status_ten
  FROM public.dm_trang_thai_thiet_bi WHERE ma = _status_ma;

  FOR _tb IN
    SELECT id, ma_thiet_bi, trang_thai_id FROM public.thiet_bi
    WHERE ma_thiet_bi = ANY(_mas)
  LOOP
    INSERT INTO public.thiet_bi_vong_doi (thiet_bi_id, tu_trang_thai_id, den_trang_thai_id, ly_do, nguoi_thuc_hien)
    VALUES (_tb.id, _tb.trang_thai_id, _status_id, COALESCE(NULLIF(btrim(_ly_do), ''), _status_ten), _uid);

    UPDATE public.thiet_bi
    SET trang_thai_id = _status_id,
        trang_thai = _status_ten,
        updated_at = now()
    WHERE id = _tb.id;

    INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
    VALUES (_uid, 'ngung_khai_thac', 'thiet_bi', _tb.ma_thiet_bi,
            jsonb_build_object('trang_thai_moi', _status_ten, 'ly_do', _ly_do, 'thanh_ly', _thanh_ly));

    _n := _n + 1;
  END LOOP;

  RETURN jsonb_build_object('so_thiet_bi', _n, 'trang_thai', _status_ten);
END;
$$;


--
-- Name: nhom_cascade_phan_loai(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.nhom_cascade_phan_loai() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.phan_loai_id IS DISTINCT FROM OLD.phan_loai_id AND NEW.phan_loai_id IS NOT NULL THEN
    UPDATE public.dm_he_thong SET phan_loai_id = NEW.phan_loai_id
    WHERE nhom_he_thong_id = NEW.id AND phan_loai_id IS DISTINCT FROM NEW.phan_loai_id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: notify_cong_viec_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_cong_viec_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_du_an public.du_an;
  v_actor uuid := public.current_uid();
BEGIN
  SELECT * INTO v_du_an FROM public.du_an WHERE id = NEW.du_an_id;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, loai, tieu_de, noi_dung, link, ref_type, ref_id)
    SELECT u, 'cv_moi', 'Công việc mới: ' || NEW.ten,
           'Trong dự án ' || v_du_an.ten,
           '/du-an/' || v_du_an.id::text, 'du_an_cong_viec', NEW.id
    FROM unnest(ARRAY[v_du_an.quan_ly_id, NEW.nguoi_xu_ly_chinh]) u
    WHERE u IS NOT NULL AND u <> COALESCE(v_actor, '00000000-0000-0000-0000-000000000000'::uuid);
  ELSIF TG_OP = 'UPDATE' AND (
      NEW.trang_thai IS DISTINCT FROM OLD.trang_thai
      OR NEW.nguoi_xu_ly_chinh IS DISTINCT FROM OLD.nguoi_xu_ly_chinh
      OR NEW.tien_do IS DISTINCT FROM OLD.tien_do
  ) THEN
    INSERT INTO public.notifications (user_id, loai, tieu_de, noi_dung, link, ref_type, ref_id)
    SELECT u, 'cv_cap_nhat', 'Cập nhật công việc: ' || NEW.ten,
           'Trạng thái: ' || NEW.trang_thai::text || ' · Tiến độ: ' || NEW.tien_do || '%',
           '/du-an/' || v_du_an.id::text, 'du_an_cong_viec', NEW.id
    FROM unnest(ARRAY[v_du_an.quan_ly_id, v_du_an.nguoi_tao_id, NEW.nguoi_xu_ly_chinh, NEW.created_by]) u
    WHERE u IS NOT NULL AND u <> COALESCE(v_actor, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  RETURN NEW;
END; $$;


--
-- Name: notify_message(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_message() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_sender_name text;
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  SELECT COALESCE(ho_ten, email) INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, loai, tieu_de, noi_dung, link, ref_type, ref_id)
  SELECT cp.user_id, 'tin_nhan_moi', COALESCE(v_sender_name, 'Tin nhắn mới'),
         COALESCE(left(NEW.noi_dung, 200), CASE WHEN NEW.file_name IS NOT NULL THEN '[Tệp] ' || NEW.file_name ELSE '' END),
         '/messages/' || NEW.conversation_id::text, 'message', NEW.id
  FROM public.conversation_participant cp
  WHERE cp.conversation_id = NEW.conversation_id AND cp.user_id <> NEW.sender_id;
  RETURN NEW;
END; $$;


--
-- Name: notify_ticket_comment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_ticket_comment() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_ticket public.tickets;
BEGIN
  SELECT * INTO v_ticket FROM public.tickets WHERE id = NEW.ticket_id;
  INSERT INTO public.notifications (user_id, loai, tieu_de, noi_dung, link, ref_type, ref_id)
  SELECT u, 'ticket_binh_luan', 'Bình luận mới: ' || v_ticket.tieu_de, left(NEW.noi_dung, 200),
         '/tickets/' || v_ticket.id::text, 'ticket', v_ticket.id
  FROM (SELECT unnest(ARRAY[v_ticket.created_by, v_ticket.assigned_to]) AS u) x
  WHERE x.u IS NOT NULL AND x.u <> NEW.user_id;
  RETURN NEW;
END; $$;


--
-- Name: notify_ticket_new(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_ticket_new() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.notifications (user_id, loai, tieu_de, noi_dung, link, ref_type, ref_id)
  SELECT ur.user_id, 'ticket_moi', 'Ticket mới: ' || NEW.tieu_de, COALESCE(NEW.mo_ta,''), '/tickets/' || NEW.id::text, 'ticket', NEW.id
  FROM public.user_roles ur
  WHERE ur.role = 'admin' AND ur.user_id <> NEW.created_by;
  RETURN NEW;
END; $$;


--
-- Name: notify_ticket_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_ticket_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_actor uuid := public.current_uid();
BEGIN
  IF NEW.trang_thai IS DISTINCT FROM OLD.trang_thai OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    INSERT INTO public.notifications (user_id, loai, tieu_de, noi_dung, link, ref_type, ref_id)
    SELECT u, 'ticket_cap_nhat', 'Ticket cập nhật: ' || NEW.tieu_de,
           'Trạng thái: ' || NEW.trang_thai::text, '/tickets/' || NEW.id::text, 'ticket', NEW.id
    FROM (SELECT unnest(ARRAY[NEW.created_by, NEW.assigned_to]) AS u) x
    WHERE x.u IS NOT NULL AND x.u <> COALESCE(v_actor, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  RETURN NEW;
END; $$;


--
-- Name: op_resolve_links_hong_hoc(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.op_resolve_links_hong_hoc() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.thiet_bi_hong_id IS NULL AND NULLIF(NEW.thiet_bi_hong,'') IS NOT NULL THEN
    SELECT t.id INTO NEW.thiet_bi_hong_id FROM public.thiet_bi t WHERE t.ma_thiet_bi = NEW.thiet_bi_hong LIMIT 1;
  END IF;
  IF NEW.thiet_bi_thay_the_id IS NULL AND NULLIF(NEW.thiet_bi_thay_the,'') IS NOT NULL THEN
    SELECT t.id INTO NEW.thiet_bi_thay_the_id FROM public.thiet_bi t WHERE t.ma_thiet_bi = NEW.thiet_bi_thay_the LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: op_resolve_links_ht_tb(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.op_resolve_links_ht_tb() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $_$
BEGIN
  -- Thiết bị: điền id từ mã thiết bị nếu chưa có
  IF NEW.thiet_bi_id IS NULL AND NULLIF(NEW.thiet_bi,'') IS NOT NULL THEN
    SELECT t.id INTO NEW.thiet_bi_id FROM public.thiet_bi t WHERE t.ma_thiet_bi = NEW.thiet_bi LIMIT 1;
  END IF;
  -- Hệ thống: từ chuỗi UUID trong cột he_thong
  IF NEW.he_thong_id IS NULL AND NEW.he_thong ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    IF EXISTS (SELECT 1 FROM public.dm_he_thong h WHERE h.id = NEW.he_thong::uuid) THEN
      NEW.he_thong_id := NEW.he_thong::uuid;
    END IF;
  END IF;
  -- Hệ thống: suy ra từ thiết bị nếu vẫn chưa có
  IF NEW.he_thong_id IS NULL AND NEW.thiet_bi_id IS NOT NULL THEN
    SELECT t.he_thong_id INTO NEW.he_thong_id FROM public.thiet_bi t WHERE t.id = NEW.thiet_bi_id;
  END IF;
  RETURN NEW;
END;
$_$;


--
-- Name: op_resolve_links_tb_only(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.op_resolve_links_tb_only() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.thiet_bi_id IS NULL AND NULLIF(NEW.thiet_bi,'') IS NOT NULL THEN
    SELECT t.id INTO NEW.thiet_bi_id FROM public.thiet_bi t WHERE t.ma_thiet_bi = NEW.thiet_bi LIMIT 1;
  END IF;
  IF NEW.he_thong_id IS NULL AND NEW.thiet_bi_id IS NOT NULL THEN
    SELECT t.he_thong_id INTO NEW.he_thong_id FROM public.thiet_bi t WHERE t.id = NEW.thiet_bi_id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: parse_vn_date(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.parse_vn_date(t text) RETURNS date
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $_$
  SELECT CASE
    WHEN t IS NULL OR btrim(t) = '' THEN NULL
    WHEN btrim(t) ~ '^\d{4}-\d{2}-\d{2}' THEN substr(btrim(t), 1, 10)::date
    WHEN btrim(t) ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN to_date(btrim(t), 'DD/MM/YYYY')
    WHEN btrim(t) ~ '^\d{4}$' THEN to_date(btrim(t) || '-12-31', 'YYYY-MM-DD')
    ELSE NULL
  END;
$_$;


--
-- Name: phan_quyen_thong_ke(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.phan_quyen_thong_ke() RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT jsonb_build_object(
    'total_accounts', (SELECT count(*) FROM profiles),
    'active_accounts', (SELECT count(*) FROM profiles WHERE active),
    'roles', COALESCE((
      SELECT jsonb_object_agg(role, jsonb_build_object('total', total, 'active', active))
      FROM (
        SELECT ur.role::text AS role,
               count(*) AS total,
               count(*) FILTER (WHERE p.active) AS active
        FROM user_roles ur
        LEFT JOIN profiles p ON p.id = ur.user_id
        GROUP BY ur.role
      ) r
    ), '{}'::jsonb),
    'units', COALESCE((
      SELECT jsonb_agg(u)
      FROM (
        SELECT jsonb_build_object(
          'don_vi', don_vi::text,
          'accounts', count(*),
          'active', count(*) FILTER (WHERE active)
        ) AS u
        FROM profiles
        WHERE don_vi IS NOT NULL
        GROUP BY don_vi
        ORDER BY count(*) DESC
      ) x
    ), '[]'::jsonb),
    'entities', jsonb_build_object(
      'thiet_bi', (SELECT count(*) FROM thiet_bi),
      'giay_phep', (SELECT count(*) FROM giay_phep),
      'tickets', (SELECT count(*) FROM tickets),
      'du_an', (SELECT count(*) FROM du_an),
      'so_do', (SELECT count(*) FROM so_do_he_thong),
      'forms', (SELECT count(*) FROM form_submission),
      'audit', (SELECT count(*) FROM audit_log)
    )
  );
$$;


--
-- Name: phan_tich_tac_dong(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.phan_tich_tac_dong(p_he_thong_id uuid) RETURNS TABLE(he_thong_id uuid, ma text, ten text, do_sau integer, duong_dan uuid[])
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  WITH RECURSIVE duyet AS (
    SELECT c.den AS he_thong_id, 1 AS do_sau, ARRAY[p_he_thong_id, c.den] AS duong_dan
    FROM public.v_canh_dieu_huong c
    WHERE c.tu = p_he_thong_id AND c.lan_truyen_tac_dong = true
    UNION
    SELECT c.den, d.do_sau + 1, d.duong_dan || c.den
    FROM public.v_canh_dieu_huong c
    JOIN duyet d ON c.tu = d.he_thong_id
    WHERE c.lan_truyen_tac_dong = true
      AND c.den <> ALL(d.duong_dan)
  )
  SELECT DISTINCT ON (d.he_thong_id)
    d.he_thong_id, ht.ma, ht.ten, d.do_sau, d.duong_dan
  FROM duyet d
  JOIN public.dm_he_thong ht ON ht.id = d.he_thong_id
  WHERE d.he_thong_id <> p_he_thong_id
  ORDER BY d.he_thong_id, d.do_sau ASC;
$$;


--
-- Name: phe_duyet_cong_viec(uuid, boolean, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.phe_duyet_cong_viec(p_id uuid, p_approve boolean, p_ghi_chu text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Không có quyền phê duyệt';
  END IF;
  UPDATE public.cong_viec_bao_tri
  SET trang_thai_phe_duyet = CASE WHEN p_approve THEN 'da_duyet' ELSE 'tu_choi' END,
      nguoi_phe_duyet = public.current_uid(),
      phe_duyet_at = now(),
      ghi_chu = COALESCE(ghi_chu, '') ||
        CASE WHEN p_ghi_chu IS NOT NULL AND btrim(p_ghi_chu) <> ''
             THEN E'\n[' || CASE WHEN p_approve THEN 'Duyệt' ELSE 'Từ chối' END || '] ' || p_ghi_chu
             ELSE '' END,
      updated_at = now()
  WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy công việc'; END IF;
END; $$;


--
-- Name: phuc_hoi_thiet_bi(text[], text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.phuc_hoi_thiet_bi(_mas text[], _ly_do text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _uid uuid := public.current_uid();
  _status_id uuid;
  _status_ten text;
  _tb record;
  _n int := 0;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Chưa đăng nhập';
  END IF;
  IF NOT public.can_manage_equipment(_uid) THEN
    RAISE EXCEPTION 'Chỉ Admin hoặc Phòng Kỹ thuật được phục hồi thiết bị';
  END IF;

  SELECT id, ten INTO _status_id, _status_ten
  FROM public.dm_trang_thai_thiet_bi WHERE ma = 'DANG_KHAI_THAC';

  FOR _tb IN
    SELECT id, ma_thiet_bi, trang_thai_id FROM public.thiet_bi
    WHERE ma_thiet_bi = ANY(_mas)
  LOOP
    INSERT INTO public.thiet_bi_vong_doi (thiet_bi_id, tu_trang_thai_id, den_trang_thai_id, ly_do, nguoi_thuc_hien)
    VALUES (_tb.id, _tb.trang_thai_id, _status_id, COALESCE(NULLIF(btrim(_ly_do), ''), 'Phục hồi khai thác'), _uid);

    UPDATE public.thiet_bi
    SET trang_thai_id = _status_id,
        trang_thai = _status_ten,
        updated_at = now()
    WHERE id = _tb.id;

    INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
    VALUES (_uid, 'phuc_hoi', 'thiet_bi', _tb.ma_thiet_bi,
            jsonb_build_object('trang_thai_moi', _status_ten, 'ly_do', _ly_do));

    _n := _n + 1;
  END LOOP;

  RETURN jsonb_build_object('so_thiet_bi', _n, 'trang_thai', _status_ten);
END;
$$;


--
-- Name: pm_bo_qua_cong_viec(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pm_bo_qua_cong_viec(_task_id uuid, _ly_do text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE cv record;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt')) THEN
    RAISE EXCEPTION 'Chỉ admin hoặc phòng kỹ thuật được bỏ qua công việc PM';
  END IF;
  SELECT * INTO cv FROM public.pm_cong_viec WHERE id = _task_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy công việc %', _task_id; END IF;
  UPDATE public.pm_cong_viec
  SET trang_thai = 'bo_qua', bo_qua_ly_do = _ly_do, hoan_thanh_at = now()
  WHERE id = _task_id;
  UPDATE public.bao_tri_chinh_sach
  SET lan_gan_nhat_at = now(), updated_at = now()
  WHERE id = cv.chinh_sach_id;
  RETURN jsonb_build_object('ok', true);
END $$;


--
-- Name: pm_hoan_thanh_cong_viec(uuid, date, uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pm_hoan_thanh_cong_viec(_task_id uuid, _thuc_hien_at date, _nguoi_thuc_hien_id uuid, _ket_qua text, _van_de text DEFAULT NULL::text, _ghi_chu text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  cv record; policy record; new_bao_tri_id uuid; next_han date; ky text; next_pm_id uuid;
BEGIN
  SELECT * INTO cv FROM public.pm_cong_viec WHERE id = _task_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy công việc PM %', _task_id; END IF;
  IF cv.trang_thai NOT IN ('sap_den_han','den_han','qua_han','dang_thuc_hien') THEN
    RAISE EXCEPTION 'Công việc đã ở trạng thái %', cv.trang_thai;
  END IF;
  SELECT * INTO policy FROM public.bao_tri_chinh_sach WHERE id = cv.chinh_sach_id;

  INSERT INTO public.bao_tri (
    ma_bao_tri, thiet_bi, thiet_bi_id, he_thong_id,
    loai_bao_tri, ke_hoach, ngay_bat_dau, ngay_hoan_thanh,
    mo_ta_cong_viec, ket_qua, nguoi_thuc_hien, trang_thai
  ) VALUES (
    'BT-PM-' || to_char(now(), 'YYMMDDHH24MISS') || '-' || substr(_task_id::text,1,4),
    COALESCE((SELECT ma_thiet_bi FROM public.thiet_bi WHERE id = cv.doi_tuong_id), ''),
    CASE WHEN cv.doi_tuong_type = 'thiet_bi' THEN cv.doi_tuong_id END,
    CASE WHEN cv.doi_tuong_type = 'he_thong' THEN cv.doi_tuong_id END,
    'PM', policy.ten, _thuc_hien_at, _thuc_hien_at,
    COALESCE(policy.noi_dung, policy.mo_ta), _ket_qua,
    ARRAY[COALESCE(_nguoi_thuc_hien_id::text, auth.uid()::text)],
    'Hoàn thành'
  ) RETURNING id INTO new_bao_tri_id;

  UPDATE public.pm_cong_viec
  SET trang_thai = 'hoan_thanh', bao_tri_id = new_bao_tri_id,
      hoan_thanh_at = now(), ghi_chu = COALESCE(_ghi_chu, ghi_chu)
  WHERE id = _task_id;

  UPDATE public.bao_tri_chinh_sach
  SET lan_gan_nhat_at = _thuc_hien_at::timestamptz, updated_at = now()
  WHERE id = cv.chinh_sach_id;

  next_han := public.pm_next_due_date(cv.chinh_sach_id, _thuc_hien_at::timestamptz);
  IF next_han IS NOT NULL THEN
    ky := policy.chu_ky_loai || '-' || to_char(next_han, 'YYYYMMDD');
    INSERT INTO public.pm_cong_viec (
      chinh_sach_id, doi_tuong_type, doi_tuong_id, don_vi_id,
      han, ky_hieu_han, trang_thai, nguoi_phu_trach_id
    ) VALUES (
      cv.chinh_sach_id, cv.doi_tuong_type, cv.doi_tuong_id, cv.don_vi_id,
      next_han, ky, 'sap_den_han', policy.nguoi_phu_trach_id
    )
    ON CONFLICT (chinh_sach_id, doi_tuong_id, ky_hieu_han) DO NOTHING
    RETURNING id INTO next_pm_id;
  END IF;

  RETURN jsonb_build_object('bao_tri_id', new_bao_tri_id, 'next_pm_id', next_pm_id);
END $$;


--
-- Name: pm_next_due_date(uuid, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pm_next_due_date(_policy_id uuid, _last_done timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS date
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE p record; base_date timestamptz;
BEGIN
  SELECT * INTO p FROM public.bao_tri_chinh_sach WHERE id = _policy_id;
  IF NOT FOUND OR NOT p.active THEN RETURN NULL; END IF;
  IF p.chu_ky_gia_tri IS NULL OR p.chu_ky_gia_tri <= 0 THEN RETURN NULL; END IF;
  IF p.chu_ky_loai = 'time' THEN
    base_date := COALESCE(_last_done, p.lan_gan_nhat_at, p.created_at);
    RETURN (base_date + (p.chu_ky_gia_tri || ' days')::interval)::date;
  ELSE
    RETURN (now() + (COALESCE(p.advance_days,7) || ' days')::interval)::date;
  END IF;
END $$;


--
-- Name: pm_sinh_cong_viec(date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pm_sinh_cong_viec(_as_of date DEFAULT CURRENT_DATE) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  created_count int := 0; updated_count int := 0;
  p record; t record; han_date date; ky text;
BEGIN
  FOR p IN
    SELECT * FROM public.bao_tri_chinh_sach
    WHERE active = true AND chu_ky_gia_tri IS NOT NULL AND chu_ky_gia_tri > 0
  LOOP
    FOR t IN
      SELECT 'thiet_bi'::text AS typ, tb.id AS id,
             (SELECT ht.don_vi_id FROM public.he_thong_thanh_phan tp
                JOIN public.dm_he_thong ht ON ht.id = tp.he_thong_id
                WHERE tp.thiet_bi_id = tb.id LIMIT 1) AS don_vi_id
      FROM public.thiet_bi tb
      WHERE (p.thiet_bi_id IS NOT NULL AND tb.id = p.thiet_bi_id)
         OR (p.thiet_bi_id IS NULL AND p.model_id IS NOT NULL AND tb.model_id = p.model_id)
         OR (p.thiet_bi_id IS NULL AND p.model_id IS NULL AND p.loai_thiet_bi_id IS NOT NULL AND tb.loai_thiet_bi_id = p.loai_thiet_bi_id)
      UNION ALL
      SELECT 'he_thong'::text, ht.id, ht.don_vi_id
      FROM public.dm_he_thong ht
      WHERE p.thiet_bi_id IS NULL AND p.model_id IS NULL AND p.loai_thiet_bi_id IS NULL
        AND p.he_thong_id IS NOT NULL AND ht.id = p.he_thong_id
    LOOP
      han_date := public.pm_next_due_date(p.id, p.lan_gan_nhat_at);
      IF han_date IS NULL THEN CONTINUE; END IF;
      IF han_date > _as_of + (p.advance_days || ' days')::interval THEN CONTINUE; END IF;

      ky := p.chu_ky_loai || '-' || to_char(han_date, 'YYYYMMDD');

      INSERT INTO public.pm_cong_viec (
        chinh_sach_id, doi_tuong_type, doi_tuong_id, don_vi_id,
        han, ky_hieu_han, trang_thai, nguoi_phu_trach_id, estimated
      ) VALUES (
        p.id, t.typ, t.id, t.don_vi_id, han_date, ky,
        CASE WHEN han_date < _as_of - 3 THEN 'qua_han'
             WHEN han_date <= _as_of THEN 'den_han'
             ELSE 'sap_den_han' END,
        p.nguoi_phu_trach_id, (p.chu_ky_loai = 'metric')
      )
      ON CONFLICT (chinh_sach_id, doi_tuong_id, ky_hieu_han) DO NOTHING;
      IF FOUND THEN created_count := created_count + 1; END IF;
    END LOOP;
  END LOOP;

  UPDATE public.pm_cong_viec
  SET trang_thai = CASE
      WHEN han < _as_of - 3 THEN 'qua_han'
      WHEN han <= _as_of THEN 'den_han'
      ELSE 'sap_den_han' END
  WHERE trang_thai IN ('sap_den_han','den_han','qua_han')
    AND trang_thai <> CASE
      WHEN han < _as_of - 3 THEN 'qua_han'
      WHEN han <= _as_of THEN 'den_han'
      ELSE 'sap_den_han' END;
  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RETURN jsonb_build_object('created', created_count, 'updated', updated_count, 'as_of', _as_of);
END $$;


--
-- Name: preview_rollback_import_batch(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.preview_rollback_import_batch(_batch_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  _uid uuid := public.current_uid();
  it RECORD;
  _tbl text;
  _can int := 0; _cannot int := 0;
  _items jsonb := '[]'::jsonb;
  _ok boolean; _reason text;
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden: chỉ Admin';
  END IF;

  FOR it IN
    SELECT * FROM public.import_item
    WHERE batch_id = _batch_id AND applied_at IS NOT NULL
      AND rolled_back_at IS NULL AND status = 'committed'
    ORDER BY sheet NULLS LAST, row_index DESC
  LOOP
    _tbl := it.target_table; _ok := true; _reason := NULL;

    IF it.action = 'keep' OR it.target_id IS NULL THEN
      _ok := true;
    ELSIF it.action = 'create' THEN
      IF public._import_has_dependents(_tbl, it.target_id) THEN
        _ok := false; _reason := 'Đã có dữ liệu tham chiếu/lịch sử — không thể tự xóa';
      END IF;
    ELSE  -- update / retire
      IF it.before_snapshot IS NULL THEN
        _ok := false; _reason := 'Thiếu ảnh chụp trước (before_snapshot)';
      ELSE
        EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE id = $1)', _tbl)
          INTO _ok USING it.target_id;
        IF NOT _ok THEN _reason := 'Bản ghi đích không còn tồn tại'; END IF;
      END IF;
    END IF;

    IF _ok THEN _can := _can + 1; ELSE _cannot := _cannot + 1; END IF;
    _items := _items || jsonb_build_object(
      'item_id', it.id, 'row_index', it.row_index, 'action', it.action,
      'target_table', _tbl, 'target_id', it.target_id,
      'can_rollback', _ok, 'reason', _reason);
  END LOOP;

  RETURN jsonb_build_object('total', _can + _cannot, 'can', _can, 'cannot', _cannot, 'items', _items);
END;
$_$;


--
-- Name: promote_ticket_to_su_co(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.promote_ticket_to_su_co(p_ticket_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_t public.tickets;
  v_su_co uuid;
BEGIN
  SELECT * INTO v_t FROM public.tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy yêu cầu hỗ trợ'; END IF;

  IF NOT (v_t.created_by = public.current_uid() OR v_t.assigned_to = public.current_uid() OR has_role(public.current_uid(),'admin')) THEN
    RAISE EXCEPTION 'Không có quyền với yêu cầu này';
  END IF;
  IF NOT can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Cần quyền quản lý thiết bị để tạo sự cố';
  END IF;

  -- idempotent: đã promote thì trả về sự cố cũ, không tạo trùng
  IF v_t.su_co_id IS NOT NULL THEN RETURN v_t.su_co_id; END IF;

  INSERT INTO public.su_co(hien_tuong, thiet_bi_id, he_thong_id, ngay_phat_hien, trang_thai, ticket_id)
  VALUES (
    v_t.tieu_de || COALESCE(E'\n' || v_t.mo_ta, ''),
    v_t.thiet_bi_id, v_t.he_thong_id, current_date, 'moi', v_t.id
  )
  RETURNING id INTO v_su_co;

  UPDATE public.tickets SET su_co_id = v_su_co, updated_at = now() WHERE id = p_ticket_id;

  RETURN v_su_co;
END; $$;


--
-- Name: protect_profile_privileged_fields(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_profile_privileged_fields() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Admins may change anything.
  IF public.has_role(public.current_uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  -- Non-admins cannot change their unit or active status; silently keep old values.
  NEW.don_vi := OLD.don_vi;
  NEW.active := OLD.active;
  RETURN NEW;
END;
$$;


--
-- Name: purge_thiet_bi(text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.purge_thiet_bi(_mas text[]) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _uid uuid := public.current_uid();
  _tb record;
  _has_rel boolean;
  _deleted text[] := '{}';
  _skipped text[] := '{}';
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Chưa đăng nhập';
  END IF;
  IF NOT public.has_role(_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Chỉ Admin mới được xoá vĩnh viễn thiết bị';
  END IF;

  FOR _tb IN
    SELECT id, ma_thiet_bi FROM public.thiet_bi
    WHERE ma_thiet_bi = ANY(_mas)
  LOOP
    _has_rel :=
         EXISTS (SELECT 1 FROM public.su_co       WHERE thiet_bi_id = _tb.id)
      OR EXISTS (SELECT 1 FROM public.bao_tri     WHERE thiet_bi_id = _tb.id)
      OR EXISTS (SELECT 1 FROM public.hong_hoc    WHERE thiet_bi_hong_id = _tb.id OR thiet_bi_thay_the_id = _tb.id)
      OR EXISTS (SELECT 1 FROM public.ban_giao    WHERE thiet_bi_id = _tb.id)
      OR EXISTS (SELECT 1 FROM public.kiem_ke     WHERE thiet_bi_id = _tb.id)
      OR EXISTS (SELECT 1 FROM public.giay_phep   WHERE thiet_bi_id = _tb.id)
      OR EXISTS (SELECT 1 FROM public.form_submission        WHERE thiet_bi_id = _tb.id)
      OR EXISTS (SELECT 1 FROM public.form_submission_thiet_bi WHERE thiet_bi_id = _tb.id)
      OR EXISTS (SELECT 1 FROM public.thiet_bi_do_dac WHERE thiet_bi_id = _tb.id);

    IF _has_rel THEN
      _skipped := array_append(_skipped, _tb.ma_thiet_bi);
    ELSE
      INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
      VALUES (_uid, 'purge', 'thiet_bi', _tb.ma_thiet_bi,
              jsonb_build_object('ly_do', 'Xoá vĩnh viễn bản ghi nhập nhầm chưa có quan hệ'));
      DELETE FROM public.thiet_bi WHERE id = _tb.id;
      _deleted := array_append(_deleted, _tb.ma_thiet_bi);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'da_xoa', _deleted,
    'bo_qua', _skipped,
    'so_da_xoa', array_length(_deleted, 1),
    'so_bo_qua', array_length(_skipped, 1)
  );
END;
$$;


--
-- Name: rebuild_search_index(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rebuild_search_index() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  n int := 0;
BEGIN
  DELETE FROM public.search_index;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'thiet_bi', t.id::text, t.ma_thiet_bi,
         coalesce(t.ten_thiet_bi, t.ma_thiet_bi),
         concat_ws(' ', t.ma_serial, t.model, t.nha_san_xuat, t.vi_tri, t.ghi_chu),
         '/thiet-bi/' || coalesce(t.ma_thiet_bi, t.id::text),
         public._search_tsv(coalesce(t.ma_thiet_bi,'') || ' ' || coalesce(t.ten_thiet_bi, t.ma_thiet_bi,''),
                            concat_ws(' ', t.ma_serial, t.model, t.nha_san_xuat, t.vi_tri, t.ghi_chu))
  FROM public.thiet_bi t;
  GET DIAGNOSTICS n = ROW_COUNT;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'su_co', s.id::text, s.ma_su_co,
         coalesce(s.ma_su_co,'Sự cố'),
         concat_ws(' ', s.snapshot_ma_thiet_bi, s.snapshot_ten_thiet_bi, s.ghi_chu_duyet),
         '/su-co/' || s.id::text,
         public._search_tsv(coalesce(s.ma_su_co,''), concat_ws(' ', s.snapshot_ma_thiet_bi, s.snapshot_ten_thiet_bi, s.ghi_chu_duyet))
  FROM public.su_co s;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'van_de', v.id::text, v.ma_van_de,
         coalesce(v.tieu_de, v.ma_van_de),
         v.mo_ta,
         '/van-de/' || v.id::text,
         public._search_tsv(coalesce(v.ma_van_de,'') || ' ' || coalesce(v.tieu_de,''), v.mo_ta)
  FROM public.van_de v;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'cong_viec_bao_tri', c.id::text, c.ma_cong_viec,
         coalesce(c.ma_cong_viec,'Công việc bảo dưỡng'),
         concat_ws(' ', c.mo_ta, c.ghi_chu),
         '/bao-duong/cong-viec/' || c.id::text,
         public._search_tsv(coalesce(c.ma_cong_viec,''), concat_ws(' ', c.mo_ta, c.ghi_chu))
  FROM public.cong_viec_bao_tri c;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'bao_tri', b.id::text, b.ma_bao_tri,
         coalesce(b.ma_bao_tri,'Bảo dưỡng'),
         concat_ws(' ', b.snapshot_ma_thiet_bi, b.snapshot_ten_thiet_bi, b.mo_ta_cong_viec, b.ghi_chu_duyet),
         '/bao-duong/' || b.id::text,
         public._search_tsv(coalesce(b.ma_bao_tri,''), concat_ws(' ', b.snapshot_ma_thiet_bi, b.snapshot_ten_thiet_bi, b.mo_ta_cong_viec))
  FROM public.bao_tri b;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'hong_hoc', h.id::text, h.ma_hong_hoc,
         coalesce(h.ma_hong_hoc,'Hỏng hóc'),
         concat_ws(' ', h.snapshot_ma_thiet_bi, h.snapshot_ten_thiet_bi, h.mo_ta_hong_hoc),
         '/hong-hoc/' || h.id::text,
         public._search_tsv(coalesce(h.ma_hong_hoc,''), concat_ws(' ', h.snapshot_ma_thiet_bi, h.snapshot_ten_thiet_bi, h.mo_ta_hong_hoc))
  FROM public.hong_hoc h;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'ban_giao', bg.id::text, bg.ma_ban_giao,
         coalesce(bg.ma_ban_giao,'Bàn giao'),
         concat_ws(' ', bg.snapshot_ma_thiet_bi, bg.snapshot_ten_thiet_bi, bg.ghi_chu),
         '/ban-giao/' || bg.id::text,
         public._search_tsv(coalesce(bg.ma_ban_giao,''), concat_ws(' ', bg.snapshot_ma_thiet_bi, bg.snapshot_ten_thiet_bi, bg.ghi_chu))
  FROM public.ban_giao bg;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'giay_phep_khai_thac', g.id::text, g.so_san_xuat,
         coalesce(g.ten_he_thong_theo_gp, g.so_san_xuat, 'Giấy phép'),
         g.ma_dia_chi,
         '/giay-phep/' || g.id::text,
         public._search_tsv(coalesce(g.so_san_xuat,'') || ' ' || coalesce(g.ten_he_thong_theo_gp,''), g.ma_dia_chi)
  FROM public.giay_phep_khai_thac g;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'vat_tu', vt.id::text, vt.ma_vat_tu,
         coalesce(vt.ten, vt.ma_vat_tu),
         vt.ghi_chu,
         '/kho/vat-tu/' || vt.id::text,
         public._search_tsv(coalesce(vt.ma_vat_tu,'') || ' ' || coalesce(vt.ten,''), vt.ghi_chu)
  FROM public.vat_tu vt;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv)
  SELECT 'dm_he_thong', d.id::text, d.so_san_xuat_gp,
         coalesce(d.ten,'Hệ thống'),
         concat_ws(' ', d.mo_ta, d.ten_he_thong_theo_gp, d.ma_dia_chi_kt_gp, d.ma_tai_san_bravo),
         '/he-thong/' || d.id::text,
         public._search_tsv(coalesce(d.ten,''), concat_ws(' ', d.mo_ta, d.ten_he_thong_theo_gp, d.ma_dia_chi_kt_gp))
  FROM public.dm_he_thong d;

  -- Nội dung tĩnh website (trang chức năng)
  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv) VALUES
    ('trang','dashboard',      NULL,'Tổng quan','Overview KPI cảnh báo','/', public._search_tsv('Tổng quan Overview','KPI cảnh báo dashboard')),
    ('trang','he-thong',       NULL,'Hệ thống','Cây hệ thống danh sách','/he-thong', public._search_tsv('Hệ thống','cây hệ thống danh sách thiết bị')),
    ('trang','thiet-bi',       NULL,'Thiết bị','Danh sách thiết bị','/thiet-bi', public._search_tsv('Thiết bị danh mục','danh sách thiết bị')),
    ('trang','giay-phep',      NULL,'Giấy phép khai thác','Quản lý giấy phép','/giay-phep', public._search_tsv('Giấy phép khai thác','giấy phép sắp hết hạn')),
    ('trang','bao-duong',      NULL,'Bảo dưỡng','Kế hoạch phiếu bảo dưỡng','/bao-duong', public._search_tsv('Bảo dưỡng','kế hoạch phiếu bảo dưỡng công việc')),
    ('trang','su-co',          NULL,'Sự cố','Danh sách sự cố báo cáo ban đầu','/su-co', public._search_tsv('Sự cố','báo cáo ban đầu sự cố')),
    ('trang','van-de',         NULL,'Vấn đề','Danh sách vấn đề RCA','/van-de', public._search_tsv('Vấn đề','RCA phân tích nguyên nhân')),
    ('trang','kho',            NULL,'Kho','Vật tư giao dịch tồn kho','/kho', public._search_tsv('Kho vật tư','giao dịch tồn kho xuất nhập')),
    ('trang','so-ly-lich',     NULL,'Sổ lý lịch','Lịch sử thiết bị hệ thống','/so-ly-lich', public._search_tsv('Sổ lý lịch','lịch sử thiết bị hệ thống')),
    ('trang','quan-tri',       NULL,'Quản trị','Người dùng phân quyền','/quan-tri', public._search_tsv('Quản trị','người dùng phân quyền vai trò')),
    ('trang','so-do-he-thong', NULL,'Sơ đồ hệ thống','Network overview FigJam','/so-do', public._search_tsv('Sơ đồ hệ thống','network overview figjam mindmap')),
    ('trang','kiem-ke',        NULL,'Kiểm kê','Kiểm kê định kỳ QR','/kiem-ke', public._search_tsv('Kiểm kê','kiểm kê định kỳ mã QR'))
  ON CONFLICT (loai, id) DO UPDATE SET
    tieu_de = EXCLUDED.tieu_de, noi_dung = EXCLUDED.noi_dung, route = EXCLUDED.route, tsv = EXCLUDED.tsv, updated_at = now();

  RETURN n;
END;
$$;


--
-- Name: record_user_recent(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_user_recent(_path text, _label text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_recent(user_id, path, label, viewed_at)
  VALUES (uid, _path, _label, now())
  ON CONFLICT (user_id, path) DO UPDATE SET viewed_at = now(), label = EXCLUDED.label;
  DELETE FROM public.user_recent
  WHERE user_id = uid
    AND path NOT IN (
      SELECT path FROM public.user_recent
      WHERE user_id = uid
      ORDER BY viewed_at DESC
      LIMIT 10
    );
END;
$$;


--
-- Name: refresh_mv_asset_anomaly(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_mv_asset_anomaly() RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_asset_anomaly;
$$;


--
-- Name: reject_change_request(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reject_change_request(p_id uuid, p_ly_do text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.change_request%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE='28000'; END IF;
  IF NOT public.has_role(v_uid,'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE='42501';
  END IF;
  IF length(coalesce(btrim(p_ly_do),'')) < 5 THEN
    RAISE EXCEPTION 'ly_do_required (min 5 chars)' USING ERRCODE='22023';
  END IF;

  SELECT * INTO v_row FROM public.change_request WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  IF v_row.nguoi_tao = v_uid THEN RAISE EXCEPTION 'self_action_forbidden' USING ERRCODE='42501'; END IF;
  IF v_row.trang_thai <> 'pending' THEN RAISE EXCEPTION 'invalid_state' USING ERRCODE='22023'; END IF;

  UPDATE public.change_request
     SET trang_thai='rejected', ly_do=btrim(p_ly_do), resolved_by=v_uid, resolved_at=now()
   WHERE id = p_id;
END $$;


--
-- Name: reliability_by_scope(text, uuid[], timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reliability_by_scope(p_scope text, p_scope_ids uuid[], p_from timestamp with time zone DEFAULT (now() - '90 days'::interval), p_to timestamp with time zone DEFAULT now()) RETURNS TABLE(scope_id uuid, downtime_s bigint, failures integer, failures_closed integer, operational_s bigint, mtbf_h numeric, mttr_h numeric, availability numeric)
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
BEGIN
  IF p_scope NOT IN ('thiet_bi','thanh_phan','he_thong','don_vi') THEN
    RAISE EXCEPTION 'p_scope không hợp lệ: %', p_scope;
  END IF;

  RETURN QUERY
  WITH
  device_scope AS (
    SELECT
      t.id AS thiet_bi_id,
      CASE p_scope
        WHEN 'thiet_bi'   THEN t.id
        WHEN 'thanh_phan' THEN gcn.thanh_phan_id
        WHEN 'he_thong'   THEN htp.he_thong_id
        WHEN 'don_vi'     THEN t.don_vi_id
      END AS scope_id
    FROM thiet_bi t
    LEFT JOIN gan_chuc_nang gcn
      ON p_scope IN ('thanh_phan','he_thong') AND gcn.thiet_bi_id = t.id AND gcn.den_ngay IS NULL
    LEFT JOIN he_thong_thanh_phan htp
      ON p_scope = 'he_thong' AND htp.id = gcn.thanh_phan_id
  ),
  device_scope_filt AS (
    SELECT DISTINCT thiet_bi_id, scope_id
    FROM device_scope
    WHERE scope_id IS NOT NULL
      AND (p_scope_ids IS NULL OR scope_id = ANY(p_scope_ids))
  ),
  events AS (
    SELECT DISTINCT
      dsf.scope_id,
      s.id                                                       AS su_co_id,
      s.at_bat_dau_xu_ly                                         AS d_start,
      s.at_hoan_thanh                                            AS d_end
    FROM su_co s
    JOIN device_scope_filt dsf ON dsf.thiet_bi_id = s.thiet_bi_id
    WHERE s.at_bat_dau_xu_ly IS NOT NULL
      AND s.at_bat_dau_xu_ly <= p_to
      AND (s.at_hoan_thanh IS NULL OR s.at_hoan_thanh >= p_from)
  ),
  clipped AS (
    SELECT
      scope_id,
      su_co_id,
      d_start, d_end,
      GREATEST(
        0,
        EXTRACT(EPOCH FROM (
          LEAST(COALESCE(d_end, p_to), p_to) - GREATEST(d_start, p_from)
        ))
      )::bigint AS downtime_s_i
    FROM events
  ),
  agg AS (
    SELECT
      c.scope_id,
      SUM(c.downtime_s_i)::bigint                                                     AS downtime_s,
      SUM(CASE WHEN c.d_start BETWEEN p_from AND p_to THEN 1 ELSE 0 END)::int          AS failures,
      SUM(CASE WHEN c.d_end IS NOT NULL AND c.d_end BETWEEN p_from AND p_to THEN 1 ELSE 0 END)::int AS failures_closed
    FROM clipped c
    GROUP BY c.scope_id
  ),
  device_count AS (
    SELECT scope_id, COUNT(DISTINCT thiet_bi_id)::bigint AS n_dev
    FROM device_scope_filt
    GROUP BY scope_id
  )
  SELECT
    dc.scope_id,
    COALESCE(a.downtime_s, 0)                                       AS downtime_s,
    COALESCE(a.failures, 0)                                         AS failures,
    COALESCE(a.failures_closed, 0)                                  AS failures_closed,
    (EXTRACT(EPOCH FROM (p_to - p_from))::bigint * dc.n_dev)        AS operational_s,
    CASE WHEN COALESCE(a.failures,0) = 0 THEN NULL
         ELSE ROUND(
           GREATEST(0, (EXTRACT(EPOCH FROM (p_to - p_from))::numeric * dc.n_dev) - COALESCE(a.downtime_s,0))
           / (COALESCE(a.failures,1)::numeric * 3600), 2)
    END                                                             AS mtbf_h,
    CASE WHEN COALESCE(a.failures_closed,0) = 0 THEN NULL
         ELSE ROUND(COALESCE(a.downtime_s,0)::numeric / (a.failures_closed::numeric * 3600), 2)
    END                                                             AS mttr_h,
    CASE WHEN dc.n_dev = 0 OR (p_to <= p_from) THEN NULL
         ELSE ROUND(GREATEST(0,
           1 - COALESCE(a.downtime_s,0)::numeric
             / (EXTRACT(EPOCH FROM (p_to - p_from))::numeric * dc.n_dev)
         ), 4)
    END                                                             AS availability
  FROM device_count dc
  LEFT JOIN agg a USING (scope_id);
END;
$$;


--
-- Name: reliability_top_worst(uuid[], timestamp with time zone, timestamp with time zone, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reliability_top_worst(p_don_vi_ids uuid[] DEFAULT NULL::uuid[], p_from timestamp with time zone DEFAULT (now() - '90 days'::interval), p_to timestamp with time zone DEFAULT now(), p_limit integer DEFAULT 5) RETURNS TABLE(thiet_bi_id uuid, ma_thiet_bi text, ten_thiet_bi text, downtime_s bigint, failures integer, mttr_h numeric, availability numeric)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  WITH scope_ids AS (
    SELECT t.id
    FROM thiet_bi t
    WHERE (p_don_vi_ids IS NULL OR t.don_vi_id = ANY(p_don_vi_ids))
  ),
  r AS (
    SELECT * FROM public.reliability_by_scope(
      'thiet_bi',
      (SELECT array_agg(id) FROM scope_ids),
      p_from, p_to
    )
  )
  SELECT
    t.id                                     AS thiet_bi_id,
    t.ma_thiet_bi,
    COALESCE(NULLIF(t.ten_thiet_bi,''), t.ma_thiet_bi) AS ten_thiet_bi,
    r.downtime_s,
    r.failures,
    r.mttr_h,
    r.availability
  FROM r
  JOIN thiet_bi t ON t.id = r.scope_id
  WHERE r.failures > 0
  ORDER BY r.availability NULLS LAST, r.mttr_h DESC NULLS LAST
  LIMIT GREATEST(p_limit, 1);
$$;


--
-- Name: reset_user_layout_prefs(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reset_user_layout_prefs() RETURNS void
    LANGUAGE sql
    SET search_path TO 'public'
    AS $$
  DELETE FROM public.user_layout_prefs WHERE user_id = auth.uid();
$$;


--
-- Name: resolve_he_thong_ten(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.resolve_he_thong_ten(_he_thong_id text) RETURNS text
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    NULLIF((SELECT ce.ten FROM public.cay_node_edit ce
            WHERE ce.kind = 'ht' AND ce.ma = _he_thong_id LIMIT 1), ''),
    (SELECT h.ten FROM public.dm_he_thong h WHERE h.id::text = _he_thong_id LIMIT 1)
  );
$$;


--
-- Name: rollback_import_batch(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rollback_import_batch(_batch_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  _uid uuid := public.current_uid();
  it RECORD;
  _tbl text; _assigns text;
  _rolled int := 0; _blocked int := 0;
  _blocked_list jsonb := '[]'::jsonb;
  _reason text;
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden: chỉ Admin được hoàn tác lô nhập';
  END IF;

  FOR it IN
    SELECT * FROM public.import_item
    WHERE batch_id = _batch_id AND applied_at IS NOT NULL
      AND rolled_back_at IS NULL AND status = 'committed'
    ORDER BY sheet NULLS LAST, row_index DESC
  LOOP
    _tbl := it.target_table;

    IF it.action = 'keep' OR it.target_id IS NULL THEN
      UPDATE public.import_item SET rolled_back_at = now(), status = 'rolled_back' WHERE id = it.id;
      _rolled := _rolled + 1;
      CONTINUE;
    END IF;

    IF it.action = 'create' THEN
      IF public._import_has_dependents(_tbl, it.target_id) THEN
        _reason := 'Bản ghi đã có dữ liệu tham chiếu/lịch sử — không thể tự xóa';
        _blocked := _blocked + 1;
        _blocked_list := _blocked_list || jsonb_build_object(
          'item_id', it.id, 'target_table', _tbl, 'target_id', it.target_id,
          'action', it.action, 'reason', _reason);
        UPDATE public.import_item
          SET messages = messages || jsonb_build_array(
            jsonb_build_object('type','rollback_blocked','text',_reason))
          WHERE id = it.id;
        CONTINUE;
      END IF;
      BEGIN
        EXECUTE format('DELETE FROM public.%I WHERE id = $1', _tbl) USING it.target_id;
        UPDATE public.import_item SET rolled_back_at = now(), status = 'rolled_back' WHERE id = it.id;
        INSERT INTO public.audit_log(user_id, action, entity, entity_id, detail)
          VALUES (_uid, 'import_rollback_delete', _tbl, it.target_id::text,
                  jsonb_build_object('batch_id', _batch_id, 'item_id', it.id));
        _rolled := _rolled + 1;
      EXCEPTION WHEN OTHERS THEN
        _reason := 'Không thể xóa: ' || SQLERRM;
        _blocked := _blocked + 1;
        _blocked_list := _blocked_list || jsonb_build_object(
          'item_id', it.id, 'target_table', _tbl, 'target_id', it.target_id,
          'action', it.action, 'reason', _reason);
      END;

    ELSE  -- update / retire → khôi phục ảnh chụp trước
      IF it.before_snapshot IS NULL THEN
        _reason := 'Thiếu ảnh chụp trước — không thể khôi phục';
        _blocked := _blocked + 1;
        _blocked_list := _blocked_list || jsonb_build_object(
          'item_id', it.id, 'target_table', _tbl, 'target_id', it.target_id,
          'action', it.action, 'reason', _reason);
        CONTINUE;
      END IF;
      SELECT string_agg(quote_ident(k) || ' = s.' || quote_ident(k), ', ') INTO _assigns
      FROM jsonb_object_keys(it.before_snapshot) k
      WHERE k NOT IN ('id')
        AND EXISTS (SELECT 1 FROM information_schema.columns c
                    WHERE c.table_schema='public' AND c.table_name=_tbl AND c.column_name=k);
      BEGIN
        EXECUTE format(
          'UPDATE public.%1$I AS t SET %2$s FROM jsonb_populate_record(null::public.%1$I, $1) s WHERE t.id = $2',
          _tbl, _assigns
        ) USING it.before_snapshot, it.target_id;
        UPDATE public.import_item SET rolled_back_at = now(), status = 'rolled_back' WHERE id = it.id;
        INSERT INTO public.audit_log(user_id, action, entity, entity_id, detail)
          VALUES (_uid, 'import_rollback_restore', _tbl, it.target_id::text,
                  jsonb_build_object('batch_id', _batch_id, 'item_id', it.id));
        _rolled := _rolled + 1;
      EXCEPTION WHEN OTHERS THEN
        _reason := 'Khôi phục lỗi: ' || SQLERRM;
        _blocked := _blocked + 1;
        _blocked_list := _blocked_list || jsonb_build_object(
          'item_id', it.id, 'target_table', _tbl, 'target_id', it.target_id,
          'action', it.action, 'reason', _reason);
      END;
    END IF;
  END LOOP;

  UPDATE public.import_batch
    SET status = CASE WHEN _blocked = 0 THEN 'rolled_back' ELSE 'partially_rolled_back' END,
        rolled_back_at = now(),
        summary = summary || jsonb_build_object(
          'rollback', jsonb_build_object('rolled',_rolled,'blocked',_blocked))
    WHERE id = _batch_id;

  RETURN jsonb_build_object('ok', _blocked = 0, 'rolled', _rolled, 'blocked', _blocked, 'blocked_list', _blocked_list);
END;
$_$;


--
-- Name: rpc_count_thiet_bi_by_trang_thai(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_count_thiet_bi_by_trang_thai() RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM public.thiet_bi),
    'by_trang_thai', coalesce(
      (SELECT jsonb_object_agg(coalesce(trang_thai_id::text, 'chua_gan'), n)
       FROM (
         SELECT trang_thai_id, count(*) AS n
         FROM public.thiet_bi
         GROUP BY trang_thai_id
       ) t),
      '{}'::jsonb
    )
  );
$$;


--
-- Name: rpc_daily_brief(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_daily_brief(p_user_id uuid DEFAULT auth.uid()) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_result jsonb;
  v_today date := CURRENT_DATE;
BEGIN
  SELECT jsonb_build_object(
    'expiring_gp_7d', (SELECT count(*) FROM public.giay_phep WHERE ngay_het_han BETWEEN v_today AND v_today + INTERVAL '7 days'),
    'expiring_gp_30d', (SELECT count(*) FROM public.giay_phep WHERE ngay_het_han BETWEEN v_today AND v_today + INTERVAL '30 days'),
    'open_incidents', (SELECT count(*) FROM public.su_co WHERE trang_thai IS DISTINCT FROM 'da_dong' AND COALESCE(luu_tru,false)=false),
    'critical_incidents', (SELECT count(*) FROM public.su_co WHERE trang_thai IS DISTINCT FROM 'da_dong' AND muc_do IN ('nghiem_trong','cao') AND COALESCE(luu_tru,false)=false),
    'overdue_pm', (SELECT count(*) FROM public.pm_cong_viec WHERE trang_thai IN ('cho','dang_lam') AND han < v_today),
    'due_pm_7d', (SELECT count(*) FROM public.pm_cong_viec WHERE trang_thai IN ('cho','dang_lam') AND han BETWEEN v_today AND v_today + INTERVAL '7 days'),
    'my_shift_tasks', (SELECT count(*) FROM public.pm_cong_viec WHERE nguoi_phu_trach_id = p_user_id AND trang_thai IN ('cho','dang_lam')),
    'unread_notif', (SELECT count(*) FROM public.notifications WHERE user_id = p_user_id AND read_at IS NULL),
    'generated_at', now()
  ) INTO v_result;
  RETURN v_result;
END;
$$;


--
-- Name: rpc_dashboard_overview(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_dashboard_overview() RETURNS jsonb
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  v jsonb;
BEGIN
  SELECT payload INTO v FROM public.mv_dashboard_overview LIMIT 1;
  IF v IS NOT NULL THEN
    RETURN v;
  END IF;
  RETURN jsonb_build_object(
    'thiet_bi_total', (SELECT count(*) FROM public.thiet_bi),
    'thiet_bi_by_trang_thai', COALESCE((
      SELECT jsonb_object_agg(COALESCE(trang_thai_id::text,'null'), c)
      FROM (SELECT trang_thai_id, count(*) c FROM public.thiet_bi GROUP BY trang_thai_id) s
    ), '{}'::jsonb),
    'su_co_by_trang_thai', COALESCE((
      SELECT jsonb_object_agg(COALESCE(trang_thai::text,'null'), c)
      FROM (SELECT trang_thai, count(*) c FROM public.su_co GROUP BY trang_thai) s
    ), '{}'::jsonb),
    'bao_tri_by_trang_thai', COALESCE((
      SELECT jsonb_object_agg(COALESCE(trang_thai::text,'null'), c)
      FROM (SELECT trang_thai, count(*) c FROM public.bao_tri GROUP BY trang_thai) s
    ), '{}'::jsonb),
    'hong_hoc_by_trang_thai', COALESCE((
      SELECT jsonb_object_agg(COALESCE(trang_thai::text,'null'), c)
      FROM (SELECT trang_thai, count(*) c FROM public.hong_hoc GROUP BY trang_thai) s
    ), '{}'::jsonb),
    'refreshed_at', now()
  );
END;
$$;


--
-- Name: rpc_incident_by_severity(timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_incident_by_severity(_from timestamp with time zone DEFAULT (now() - '90 days'::interval), _to timestamp with time zone DEFAULT now()) RETURNS TABLE(muc_do text, so_su_co integer, so_dong integer)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  select
    coalesce(nullif(trim(s.muc_do), ''), '(không rõ)') as muc_do,
    count(*)::int as so_su_co,
    count(s.at_hoan_thanh)::int as so_dong
  from public.su_co s
  where s.at_bao_cao is not null
    and s.at_bao_cao >= _from
    and s.at_bao_cao <  _to
  group by 1
  order by so_su_co desc;
$$;


--
-- Name: rpc_incident_heatmap(timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_incident_heatmap(_from timestamp with time zone DEFAULT (now() - '90 days'::interval), _to timestamp with time zone DEFAULT now()) RETURNS TABLE(dow integer, hour integer, so_su_co integer)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  select
    extract(dow  from s.at_bao_cao at time zone 'Asia/Ho_Chi_Minh')::int as dow,
    extract(hour from s.at_bao_cao at time zone 'Asia/Ho_Chi_Minh')::int as hour,
    count(*)::int as so_su_co
  from public.su_co s
  where s.at_bao_cao is not null
    and s.at_bao_cao >= _from
    and s.at_bao_cao <  _to
  group by 1, 2
  order by 1, 2;
$$;


--
-- Name: rpc_reliability_by_system(timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_reliability_by_system(_from timestamp with time zone DEFAULT (now() - '90 days'::interval), _to timestamp with time zone DEFAULT now()) RETURNS TABLE(he_thong_id uuid, ma text, ten text, so_su_co integer, so_dong integer, mttr_phut numeric, mtbf_gio numeric)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  with base as (
    select
      s.he_thong_id,
      s.at_bao_cao,
      s.at_hoan_thanh
    from public.su_co s
    where s.at_bao_cao is not null
      and s.at_bao_cao >= _from
      and s.at_bao_cao <  _to
      and s.he_thong_id is not null
  ),
  agg as (
    select
      b.he_thong_id,
      count(*)::int as so_su_co,
      count(b.at_hoan_thanh)::int as so_dong,
      avg(extract(epoch from (b.at_hoan_thanh - b.at_bao_cao)) / 60.0)
        filter (where b.at_hoan_thanh is not null and b.at_hoan_thanh > b.at_bao_cao) as mttr_phut
    from base b
    group by b.he_thong_id
  )
  select
    a.he_thong_id,
    h.ma,
    h.ten,
    a.so_su_co,
    a.so_dong,
    round(a.mttr_phut::numeric, 1) as mttr_phut,
    case
      when a.so_su_co > 0 then
        round((extract(epoch from (_to - _from)) / 3600.0 / a.so_su_co)::numeric, 1)
      else null
    end as mtbf_gio
  from agg a
  left join public.dm_he_thong h on h.id = a.he_thong_id
  order by a.so_su_co desc, h.ten;
$$;


--
-- Name: rpc_reliability_trend(timestamp with time zone, timestamp with time zone, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_reliability_trend(_from timestamp with time zone DEFAULT (now() - '90 days'::interval), _to timestamp with time zone DEFAULT now(), _bucket text DEFAULT 'day'::text) RETURNS TABLE(bucket_start timestamp with time zone, so_su_co integer, so_dong integer, mttr_phut numeric)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  with base as (
    select
      date_trunc(
        case lower(_bucket)
          when 'week' then 'week'
          when 'month' then 'month'
          else 'day'
        end,
        s.at_bao_cao
      ) as bucket_start,
      s.at_bao_cao,
      s.at_hoan_thanh
    from public.su_co s
    where s.at_bao_cao is not null
      and s.at_bao_cao >= _from
      and s.at_bao_cao <  _to
  )
  select
    b.bucket_start,
    count(*)::int as so_su_co,
    count(b.at_hoan_thanh)::int as so_dong,
    round(
      avg(extract(epoch from (b.at_hoan_thanh - b.at_bao_cao)) / 60.0)
        filter (where b.at_hoan_thanh is not null and b.at_hoan_thanh > b.at_bao_cao)
      ::numeric, 1
    ) as mttr_phut
  from base b
  group by b.bucket_start
  order by b.bucket_start;
$$;


--
-- Name: rpc_tai_san_toan_cuc(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_tai_san_toan_cuc() RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  WITH mounts AS (
    SELECT g.thiet_bi_id,
           COALESCE(ht.ten,'') AS ht,
           COALESCE(tp.ten,'') AS tp
    FROM public.gan_chuc_nang g
    JOIN public.he_thong_thanh_phan tp ON tp.id = g.thanh_phan_id
    LEFT JOIN public.dm_he_thong ht ON ht.id = tp.he_thong_id
    WHERE g.den_ngay IS NULL
  ),
  agg AS (
    SELECT thiet_bi_id,
           count(*)::int AS so_tp,
           string_agg(NULLIF(trim(ht || ' · ' || tp),'· '), E'\n') AS ds_tp,
           string_agg(DISTINCT NULLIF(ht,''), ', ') AS ds_ht
    FROM mounts GROUP BY thiet_bi_id
  ),
  rows AS (
    SELECT jsonb_build_object(
      'id', tb.id,
      'ma', COALESCE(tb.ma_thiet_bi,''),
      'ten', COALESCE(tb.ten_thiet_bi,''),
      'serial', COALESCE(tb.ma_serial,''),
      'model', COALESCE(mdl.ten, tb.model, ''),
      'chungLoai', COALESCE(loai_tb.ten,''),
      'nhaSanXuat', COALESCE(nsx.ten,''),
      'nhaCungCap', COALESCE(ncc.ten,''),
      'donViQuanLy', COALESCE(dv.ten,''),
      'trangThai', COALESCE(tt.ten,''),
      'viTri', COALESCE(vt.ten,''),
      'soThanhPhanDangGan', COALESCE(a.so_tp, 0),
      'danhSachThanhPhan', COALESCE(a.ds_tp,''),
      'danhSachHeThong', COALESCE(a.ds_ht,''),
      'pN', COALESCE(tb.p_n,''),
      'maTaiSanBravo', COALESCE(tb.ma_tai_san_bravo,''),
      'namSanXuat', COALESCE(tb.nam_san_xuat::text,''),
      'namKhaiThac', COALESCE(tb.nam_dua_vao_khai_thac::text,''),
      'ngayMua', to_char(tb.ngay_mua, 'DD/MM/YYYY'),
      'hanBaoHanh', to_char(tb.han_bao_hanh, 'DD/MM/YYYY'),
      'tyLeTuoiTho', CASE WHEN tb.ty_le_tuoi_tho IS NOT NULL THEN round(tb.ty_le_tuoi_tho)::text || '%' ELSE '' END,
      'tinhTrangKyThuat', COALESCE(tb.tinh_trang_ky_thuat,''),
      'cheDoKdHc', COALESCE(tb.che_do_kd_hc,''),
      'ngayBaoTriGanNhat', to_char(tb.ngay_bao_tri_gan_nhat, 'DD/MM/YYYY'),
      'ngayBaoTriKeTiep', to_char(tb.ngay_bao_tri_ke_tiep, 'DD/MM/YYYY'),
      'soSuCo90n', COALESCE(an.incident_count_90d, 0),
      'anomalyScore', COALESCE(an.z_score, 0)
    ) AS r
    FROM public.thiet_bi tb
    LEFT JOIN public.dm_model mdl ON mdl.id = tb.model_id
    LEFT JOIN public.dm_loai_thiet_bi loai_tb ON loai_tb.id = tb.loai_thiet_bi_id
    LEFT JOIN public.dm_nha_san_xuat nsx ON nsx.id = tb.nha_san_xuat_id
    LEFT JOIN public.dm_nha_cung_cap ncc ON ncc.id = tb.nha_cung_cap_id
    LEFT JOIN public.dm_don_vi dv ON dv.id = tb.don_vi_quan_ly_id
    LEFT JOIN public.dm_trang_thai_thiet_bi tt ON tt.id = tb.trang_thai_id
    LEFT JOIN public.dm_vi_tri vt ON vt.id = tb.vi_tri_id
    LEFT JOIN agg a ON a.thiet_bi_id = tb.id
    LEFT JOIN public.mv_asset_anomaly an ON an.asset_id = tb.id
    ORDER BY tb.ma_thiet_bi
  )
  SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) FROM rows;
$$;


--
-- Name: rpc_thanh_phan_toan_cuc(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_thanh_phan_toan_cuc() RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH mount_active AS (
    SELECT g.thanh_phan_id, g.thiet_bi_id
    FROM public.gan_chuc_nang g
    WHERE g.den_ngay IS NULL
  ),
  cnt_by_tb AS (
    SELECT thiet_bi_id, count(*)::int AS n
    FROM mount_active GROUP BY thiet_bi_id
  ),
  rows AS (
    SELECT jsonb_build_object(
      'id', tp.id,
      'ma', COALESCE(tp.ma_thanh_phan,''),
      'ten', COALESCE(tp.ten,''),
      'nhomHeThong', COALESCE(nh.ten,''),
      'phanLoai', COALESCE(pl.ten,''),
      'heThong', COALESCE(ht.ten,'—'),
      'heThongId', COALESCE(tp.he_thong_id::text,''),
      'viTriId', tp.vi_tri_id,
      'loaiYeuCau', COALESCE(loai_req.ten,''),
      'viTri', COALESCE(vt.ten,''),
      'trangThai', CASE tp.trang_thai WHEN 'hoat_dong' THEN 'Hoạt động' WHEN 'ngung' THEN 'Đã ngừng' ELSE COALESCE(tp.trang_thai,'') END,
      'thietBiMa', COALESCE(tb.ma_thiet_bi,''),
      'thietBiTen', COALESCE(tb.ten_thiet_bi,''),
      'thietBiSerial', COALESCE(tb.ma_serial,''),
      'model', COALESCE(mdl.ten, tb.model, ''),
      'chungLoai', COALESCE(loai_tb.ten,''),
      'nhaSanXuat', COALESCE(nsx.ten,''),
      'nhaCungCap', COALESCE(ncc.ten,''),
      'daLap', tb.id IS NOT NULL,
      'soThanhPhanCuaTaiSan', COALESCE(cnt.n, 0),
      'taiSanTrangThai', COALESCE(tb_tt.ten,''),
      'namSanXuat', COALESCE(tb.nam_san_xuat::text,''),
      'namKhaiThac', COALESCE(tb.nam_dua_vao_khai_thac::text,''),
      'ngayMua', to_char(tb.ngay_mua, 'DD/MM/YYYY'),
      'hanBaoHanh', to_char(tb.han_bao_hanh, 'DD/MM/YYYY'),
      'pN', COALESCE(tb.p_n,''),
      'maTaiSanBravo', COALESCE(tb.ma_tai_san_bravo,''),
      'tyLeTuoiTho', CASE WHEN tb.ty_le_tuoi_tho IS NOT NULL THEN round(tb.ty_le_tuoi_tho)::text || '%' ELSE '' END,
      'tinhTrangKyThuat', COALESCE(tb.tinh_trang_ky_thuat,''),
      'ngayBaoTriGanNhat', to_char(tb.ngay_bao_tri_gan_nhat, 'DD/MM/YYYY'),
      'ngayBaoTriKeTiep', to_char(tb.ngay_bao_tri_ke_tiep, 'DD/MM/YYYY'),
      'cheDoKdHc', COALESCE(tb.che_do_kd_hc,''),
      'taiSanViTri', COALESCE(tb_vt.ten,''),
      'taiSanDonViQuanLy', COALESCE(tb_dv.ten,'')
    ) AS r
    FROM public.he_thong_thanh_phan tp
    LEFT JOIN public.dm_he_thong ht ON ht.id = tp.he_thong_id
    LEFT JOIN public.dm_nhom_he_thong nh ON nh.id = ht.nhom_he_thong_id
    LEFT JOIN public.dm_phan_loai pl ON pl.id = ht.phan_loai_id
    LEFT JOIN public.dm_loai_thiet_bi loai_req ON loai_req.id = tp.loai_thiet_bi_yeu_cau
    LEFT JOIN public.dm_vi_tri vt ON vt.id = tp.vi_tri_id
    LEFT JOIN mount_active ma ON ma.thanh_phan_id = tp.id
    LEFT JOIN public.thiet_bi tb ON tb.id = ma.thiet_bi_id
    LEFT JOIN cnt_by_tb cnt ON cnt.thiet_bi_id = tb.id
    LEFT JOIN public.dm_model mdl ON mdl.id = tb.model_id
    LEFT JOIN public.dm_loai_thiet_bi loai_tb ON loai_tb.id = tb.loai_thiet_bi_id
    LEFT JOIN public.dm_nha_san_xuat nsx ON nsx.id = tb.nha_san_xuat_id
    LEFT JOIN public.dm_nha_cung_cap ncc ON ncc.id = tb.nha_cung_cap_id
    LEFT JOIN public.dm_trang_thai_thiet_bi tb_tt ON tb_tt.id = tb.trang_thai_id
    LEFT JOIN public.dm_vi_tri tb_vt ON tb_vt.id = tb.vi_tri_id
    LEFT JOIN public.dm_don_vi tb_dv ON tb_dv.id = tb.don_vi_quan_ly_id
    WHERE tp.deleted_at IS NULL
    ORDER BY tp.ma_thanh_phan
  )
  SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) FROM rows;
$$;


--
-- Name: run_audit_daily_digest(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.run_audit_daily_digest() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_from timestamptz := now() - interval '24 hours';
  v_total int;
  v_users int;
  v_top text;
  v_body text;
  v_count int := 0;
  v_admin record;
begin
  select count(*), count(distinct user_id)
    into v_total, v_users
  from public.audit_log
  where created_at >= v_from;

  if v_total = 0 then
    return 0;
  end if;

  select string_agg(entity || ': ' || c, E'\n' order by c desc)
    into v_top
  from (
    select entity, count(*)::int as c
    from public.audit_log
    where created_at >= v_from and entity is not null
    group by entity
    order by count(*) desc
    limit 5
  ) t;

  v_body := format(
    'Trong 24 giờ qua có %s hành động từ %s người dùng.%s%s',
    v_total, v_users,
    case when v_top is not null then E'\n\nTop bảng:\n' else '' end,
    coalesce(v_top, '')
  );

  for v_admin in
    select ur.user_id from public.user_roles ur where ur.role = 'admin'
  loop
    insert into public.notifications(user_id, loai, tieu_de, noi_dung, link, ref_type)
    values (
      v_admin.user_id,
      'he_thong',
      format('Nhật ký 24h: %s hành động', v_total),
      v_body,
      '/admin/audit',
      'audit_digest'
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;


--
-- Name: run_audit_retention(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.run_audit_retention() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_days integer; v_deleted integer;
BEGIN
  SELECT COALESCE(NULLIF(gia_tri, '')::int, 365) INTO v_days
  FROM public.app_cai_dat WHERE khoa = 'audit_retention_days';
  IF v_days IS NULL THEN v_days := 365; END IF;

  WITH d AS (
    DELETE FROM public.audit_log
    WHERE created_at < now() - (v_days || ' days')::interval
    RETURNING 1
  )
  SELECT count(*) INTO v_deleted FROM d;

  RETURN v_deleted;
END;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: sinh_canh_bao_het_han(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sinh_canh_bao_het_han() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_today  date := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  r        record;
  v_nguong int;
  v_khoa   text;
  v_tao    int := 0;
  v_notif  int := 0;
  v_recips int;
BEGIN
  -- Cho phép cron/service_role (public.current_uid() null) hoặc người quản lý thiết bị.
  IF public.current_uid() IS NOT NULL AND NOT public.can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Không có quyền sinh cảnh báo hết hạn';
  END IF;

  FOR r IN
    SELECT loai, thiet_bi_id, ten, ngay_het_han,
           (ngay_het_han - v_today) AS so_ngay
    FROM public.v_sap_het_han
    WHERE (ngay_het_han - v_today) BETWEEN 0 AND 90
  LOOP
    v_nguong := CASE WHEN r.so_ngay <= 30 THEN 30
                     WHEN r.so_ngay <= 60 THEN 60
                     ELSE 90 END;
    v_khoa := r.loai || '|' || COALESCE(r.thiet_bi_id::text, '-') || '|'
              || to_char(r.ngay_het_han, 'YYYY-MM-DD') || '|' || v_nguong;

    INSERT INTO public.canh_bao_het_han_log(khoa, loai, thiet_bi_id, ngay_het_han, nguong)
    VALUES (v_khoa, r.loai, r.thiet_bi_id, r.ngay_het_han, v_nguong)
    ON CONFLICT (khoa) DO NOTHING;

    IF NOT FOUND THEN
      CONTINUE;  -- đã báo ngưỡng này trước đó → không tạo trùng
    END IF;
    v_tao := v_tao + 1;

    INSERT INTO public.notifications(user_id, loai, tieu_de, noi_dung, link, ref_type, ref_id)
    SELECT p.id,
           'he_thong'::notification_loai,
           CASE r.loai WHEN 'bao_hanh' THEN 'Sắp hết hạn bảo hành'
                       ELSE 'Sắp hết hạn giấy phép' END,
           COALESCE(r.ten, '(không tên)') || ' còn ' || r.so_ngay
             || ' ngày (hạn ' || to_char(r.ngay_het_han, 'DD/MM/YYYY') || ')',
           '/sap-het-han',
           'sap_het_han',
           r.thiet_bi_id
    FROM public.profiles p
    WHERE p.active = true
      AND public.can_manage_equipment(p.id);
    GET DIAGNOSTICS v_recips = ROW_COUNT;
    v_notif := v_notif + v_recips;

    UPDATE public.canh_bao_het_han_log SET so_nguoi_nhan = v_recips WHERE khoa = v_khoa;
  END LOOP;

  RETURN jsonb_build_object('log_moi', v_tao, 'notification', v_notif,
                            'ngay', to_char(v_today, 'YYYY-MM-DD'));
END $$;


--
-- Name: su_co_check_transition(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.su_co_check_transition(_tu text, _den text) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT CASE
    WHEN _tu IS NULL OR _den IS NULL OR _tu = _den THEN false
    WHEN (_tu,_den) IN (
      ('bao_cao','tiep_nhan'), ('bao_cao','huy'),
      ('tiep_nhan','dang_xu_ly'), ('tiep_nhan','huy'),
      ('dang_xu_ly','cho_vat_tu'), ('dang_xu_ly','hoan_thanh'),
      ('cho_vat_tu','dang_xu_ly'), ('cho_vat_tu','hoan_thanh'),
      ('hoan_thanh','nghiem_thu'), ('hoan_thanh','dang_xu_ly'),
      ('nghiem_thu','dang_xu_ly')
    ) THEN true
    ELSE false
  END;
$$;


--
-- Name: su_co_downtime_minutes(date, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.su_co_downtime_minutes(p_ngay_phat_hien date, p_thoi_diem_khac_phuc timestamp with time zone) RETURNS integer
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT CASE
    WHEN p_ngay_phat_hien IS NULL OR p_thoi_diem_khac_phuc IS NULL THEN NULL
    ELSE GREATEST(
      0,
      (EXTRACT(EPOCH FROM (p_thoi_diem_khac_phuc - p_ngay_phat_hien::timestamptz)) / 60)::int
    )
  END
$$;


--
-- Name: su_co_lich_su; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.su_co_lich_su (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    doi_tuong_bang text NOT NULL,
    doi_tuong_id uuid NOT NULL,
    buoc integer NOT NULL,
    tu_trang_thai text,
    den_trang_thai text NOT NULL,
    nguoi uuid,
    at timestamp with time zone DEFAULT now() NOT NULL,
    ghi_chu text,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT su_co_lich_su_doi_tuong_bang_check CHECK ((doi_tuong_bang = ANY (ARRAY['su_co'::text, 'hong_hoc'::text])))
);


--
-- Name: su_co_transition(text, uuid, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.su_co_transition(_bang text, _id uuid, _den text, _ghi_chu text DEFAULT NULL::text, _meta jsonb DEFAULT '{}'::jsonb) RETURNS public.su_co_lich_su
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _tu           text;
  _uid          uuid := auth.uid();
  _is_admin     boolean;
  _is_phong_kt  boolean;
  _is_ptrach    boolean;
  _buoc         int;
  _row          public.su_co_lich_su;
  _at           timestamptz := now();
  _cho_vat_at   timestamptz;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;
  IF _bang NOT IN ('su_co','hong_hoc') THEN
    RAISE EXCEPTION 'invalid_bang: %', _bang USING ERRCODE = '22023';
  END IF;

  SELECT public.has_role(_uid, 'admin'::app_role),
         public.has_role(_uid, 'phong_kt'::app_role),
         public.has_role(_uid, 'phu_trach_dv'::app_role)
    INTO _is_admin, _is_phong_kt, _is_ptrach;

  IF _bang = 'su_co' THEN
    SELECT s.trang_thai_moi INTO _tu FROM public.su_co s WHERE s.id = _id FOR UPDATE;
  ELSE
    SELECT h.trang_thai_moi INTO _tu FROM public.hong_hoc h WHERE h.id = _id FOR UPDATE;
  END IF;

  IF _tu IS NULL THEN
    RAISE EXCEPTION 'not_found: % %', _bang, _id USING ERRCODE = 'P0002';
  END IF;
  IF NOT public.su_co_check_transition(_tu, _den) THEN
    RAISE EXCEPTION 'invalid_transition: % -> %', _tu, _den USING ERRCODE = 'P0001';
  END IF;

  IF _den IN ('tiep_nhan','dang_xu_ly','cho_vat_tu','hoan_thanh') THEN
    IF NOT (_is_admin OR _is_phong_kt) THEN
      RAISE EXCEPTION 'forbidden: chỉ admin/phong_kt được chuyển sang %', _den USING ERRCODE = '42501';
    END IF;
  ELSIF _den = 'nghiem_thu' THEN
    IF NOT (_is_admin OR _is_ptrach) THEN
      RAISE EXCEPTION 'forbidden: chỉ admin/phu_trach_dv được nghiệm thu' USING ERRCODE = '42501';
    END IF;
    IF _bang='su_co' THEN
      PERFORM 1 FROM public.su_co WHERE id=_id AND nguoi_tiep_nhan_id=_uid;
      IF FOUND THEN RAISE EXCEPTION 'forbidden_self_approve' USING ERRCODE='42501'; END IF;
    ELSE
      PERFORM 1 FROM public.hong_hoc WHERE id=_id AND nguoi_tiep_nhan_id=_uid;
      IF FOUND THEN RAISE EXCEPTION 'forbidden_self_approve' USING ERRCODE='42501'; END IF;
    END IF;
  ELSIF _den = 'huy' THEN
    IF NOT _is_admin THEN
      IF _bang='su_co' THEN
        PERFORM 1 FROM public.su_co
          WHERE id=_id AND nguoi_bao_cao_id=_uid
            AND (at_bao_cao IS NULL OR at_bao_cao > now() - interval '24 hours');
      ELSE
        PERFORM 1 FROM public.hong_hoc
          WHERE id=_id AND nguoi_bao_cao_id=_uid
            AND (at_bao_cao IS NULL OR at_bao_cao > now() - interval '24 hours');
      END IF;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'forbidden: chỉ admin hoặc người báo cáo (trong 24h) được huỷ' USING ERRCODE='42501';
      END IF;
    END IF;
  END IF;

  IF _tu = 'cho_vat_tu' THEN
    IF _bang='su_co' THEN
      SELECT COALESCE((SELECT max(at) FROM public.su_co_lich_su
          WHERE doi_tuong_bang='su_co' AND doi_tuong_id=_id AND den_trang_thai='cho_vat_tu'), _at)
        INTO _cho_vat_at;
      UPDATE public.su_co
         SET tong_thoi_gian_cho_vat_tu_phut = COALESCE(tong_thoi_gian_cho_vat_tu_phut,0)
             + GREATEST(0, extract(epoch FROM (_at - _cho_vat_at))/60)::int
       WHERE id=_id;
    ELSE
      SELECT COALESCE((SELECT max(at) FROM public.su_co_lich_su
          WHERE doi_tuong_bang='hong_hoc' AND doi_tuong_id=_id AND den_trang_thai='cho_vat_tu'), _at)
        INTO _cho_vat_at;
      UPDATE public.hong_hoc
         SET tong_thoi_gian_cho_vat_tu_phut = COALESCE(tong_thoi_gian_cho_vat_tu_phut,0)
             + GREATEST(0, extract(epoch FROM (_at - _cho_vat_at))/60)::int
       WHERE id=_id;
    END IF;
  END IF;

  IF _bang = 'su_co' THEN
    UPDATE public.su_co SET
      trang_thai_moi = _den, updated_at = _at,
      at_tiep_nhan = CASE WHEN _den='tiep_nhan' AND at_tiep_nhan IS NULL THEN _at ELSE at_tiep_nhan END,
      nguoi_tiep_nhan_id = CASE WHEN _den='tiep_nhan' AND nguoi_tiep_nhan_id IS NULL THEN _uid ELSE nguoi_tiep_nhan_id END,
      at_bat_dau_xu_ly = CASE WHEN _den='dang_xu_ly' AND at_bat_dau_xu_ly IS NULL THEN _at ELSE at_bat_dau_xu_ly END,
      nguoi_xu_ly_chinh_id = CASE WHEN _den='dang_xu_ly' THEN _uid ELSE nguoi_xu_ly_chinh_id END,
      at_hoan_thanh = CASE WHEN _den='hoan_thanh' THEN _at ELSE at_hoan_thanh END,
      thoi_diem_khac_phuc = CASE WHEN _den='hoan_thanh' AND thoi_diem_khac_phuc IS NULL THEN _at ELSE thoi_diem_khac_phuc END,
      at_nghiem_thu = CASE WHEN _den='nghiem_thu' THEN _at ELSE at_nghiem_thu END,
      nguoi_nghiem_thu_id = CASE WHEN _den='nghiem_thu' THEN _uid ELSE nguoi_nghiem_thu_id END,
      at_huy = CASE WHEN _den='huy' THEN _at ELSE at_huy END,
      trang_thai = CASE
        WHEN _den='bao_cao' THEN 'Mới'
        WHEN _den IN ('tiep_nhan','dang_xu_ly','cho_vat_tu') THEN 'Đang xử lý'
        WHEN _den='hoan_thanh' THEN 'Đã khắc phục'
        WHEN _den IN ('nghiem_thu','huy') THEN 'Đóng'
        ELSE trang_thai END
    WHERE id=_id;
  ELSE
    UPDATE public.hong_hoc SET
      trang_thai_moi = _den, updated_at = _at,
      at_tiep_nhan = CASE WHEN _den='tiep_nhan' AND at_tiep_nhan IS NULL THEN _at ELSE at_tiep_nhan END,
      nguoi_tiep_nhan_id = CASE WHEN _den='tiep_nhan' AND nguoi_tiep_nhan_id IS NULL THEN _uid ELSE nguoi_tiep_nhan_id END,
      at_bat_dau_xu_ly = CASE WHEN _den='dang_xu_ly' AND at_bat_dau_xu_ly IS NULL THEN _at ELSE at_bat_dau_xu_ly END,
      nguoi_xu_ly_chinh_id = CASE WHEN _den='dang_xu_ly' THEN _uid ELSE nguoi_xu_ly_chinh_id END,
      at_hoan_thanh = CASE WHEN _den='hoan_thanh' THEN _at ELSE at_hoan_thanh END,
      ngay_hoan_thanh = CASE WHEN _den='hoan_thanh' AND ngay_hoan_thanh IS NULL THEN _at::date ELSE ngay_hoan_thanh END,
      at_nghiem_thu = CASE WHEN _den='nghiem_thu' THEN _at ELSE at_nghiem_thu END,
      nguoi_nghiem_thu_id = CASE WHEN _den='nghiem_thu' THEN _uid ELSE nguoi_nghiem_thu_id END,
      at_huy = CASE WHEN _den='huy' THEN _at ELSE at_huy END,
      trang_thai = CASE
        WHEN _den IN ('hoan_thanh','nghiem_thu','huy') THEN 'Hoàn thành'
        WHEN _den='bao_cao' THEN 'Mới' ELSE 'Đang xử lý' END
    WHERE id=_id;
  END IF;

  SELECT COALESCE(max(buoc),0)+1 INTO _buoc
    FROM public.su_co_lich_su
   WHERE doi_tuong_bang=_bang AND doi_tuong_id=_id;

  INSERT INTO public.su_co_lich_su
    (doi_tuong_bang, doi_tuong_id, buoc, tu_trang_thai, den_trang_thai, nguoi, at, ghi_chu, meta)
  VALUES (_bang, _id, _buoc, _tu, _den, _uid, _at, _ghi_chu, COALESCE(_meta,'{}'::jsonb))
  RETURNING * INTO _row;

  BEGIN
    INSERT INTO public.audit_log (source, action, entity, entity_id, detail)
    VALUES ('n6.su_co.transition', _den, _bang, _id,
            jsonb_build_object('tu', _tu, 'den', _den, 'ghi_chu', _ghi_chu, 'meta', _meta));
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN _row;
END;
$$;


--
-- Name: sua_ngay_lap(uuid, timestamp with time zone, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sua_ngay_lap(p_gan_id uuid, p_tu_ngay timestamp with time zone, p_ghi_chu text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_cu timestamptz;
  v_den timestamptz;
  v_tb uuid;
  v_tp uuid;
BEGIN
  IF NOT can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Không có quyền quản lý thiết bị';
  END IF;
  IF p_tu_ngay IS NULL THEN
    RAISE EXCEPTION 'Ngày lắp không được để trống';
  END IF;
  IF p_tu_ngay > now() THEN
    RAISE EXCEPTION 'Ngày lắp không được ở tương lai';
  END IF;

  SELECT tu_ngay, den_ngay, thiet_bi_id, thanh_phan_id
    INTO v_cu, v_den, v_tb, v_tp
  FROM public.gan_chuc_nang WHERE id = p_gan_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy lần lắp thiết bị';
  END IF;
  IF v_den IS NOT NULL AND p_tu_ngay > v_den THEN
    RAISE EXCEPTION 'Ngày lắp không được muộn hơn ngày tháo';
  END IF;

  UPDATE public.gan_chuc_nang
     SET tu_ngay = p_tu_ngay,
         ghi_chu = COALESCE(p_ghi_chu, ghi_chu)
   WHERE id = p_gan_id;

  INSERT INTO public.audit_log(user_id, action, entity, entity_id, detail)
  VALUES (
    public.current_uid(),
    'sua_ngay_lap',
    'gan_chuc_nang',
    p_gan_id::text,
    jsonb_build_object(
      'thiet_bi_id', v_tb,
      'thanh_phan_id', v_tp,
      'tu_ngay_cu', v_cu,
      'tu_ngay_moi', p_tu_ngay,
      'ghi_chu', p_ghi_chu
    )
  );
END;
$$;


--
-- Name: sync_search_index(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_search_index() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_loai text := TG_ARGV[0];
  v_id   text;
  v_ma   text;
  v_tieu text;
  v_noi  text;
  v_route text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.search_index WHERE loai = v_loai AND id = OLD.id::text;
    RETURN OLD;
  END IF;

  v_id := NEW.id::text;

  CASE v_loai
    WHEN 'thiet_bi' THEN
      v_ma   := NEW.ma_thiet_bi;
      v_tieu := coalesce(NEW.ten_thiet_bi, NEW.ma_thiet_bi);
      v_noi  := concat_ws(' ', NEW.ma_serial, NEW.model, NEW.nha_san_xuat, NEW.vi_tri, NEW.ghi_chu);
      v_route := '/thiet-bi/' || coalesce(NEW.ma_thiet_bi, v_id);
    WHEN 'su_co' THEN
      v_ma   := NEW.ma_su_co;
      v_tieu := coalesce(NEW.ma_su_co, 'Sự cố');
      v_noi  := concat_ws(' ', NEW.snapshot_ma_thiet_bi, NEW.snapshot_ten_thiet_bi, NEW.ghi_chu_duyet);
      v_route := '/su-co/' || v_id;
    WHEN 'van_de' THEN
      v_ma   := NEW.ma_van_de;
      v_tieu := coalesce(NEW.tieu_de, NEW.ma_van_de);
      v_noi  := NEW.mo_ta;
      v_route := '/van-de/' || v_id;
    WHEN 'cong_viec_bao_tri' THEN
      v_ma   := NEW.ma_cong_viec;
      v_tieu := coalesce(NEW.ma_cong_viec, 'Công việc bảo dưỡng');
      v_noi  := concat_ws(' ', NEW.mo_ta, NEW.ghi_chu);
      v_route := '/bao-duong/cong-viec/' || v_id;
    WHEN 'bao_tri' THEN
      v_ma   := NEW.ma_bao_tri;
      v_tieu := coalesce(NEW.ma_bao_tri, 'Bảo dưỡng');
      v_noi  := concat_ws(' ', NEW.snapshot_ma_thiet_bi, NEW.snapshot_ten_thiet_bi, NEW.mo_ta_cong_viec, NEW.ghi_chu_duyet);
      v_route := '/bao-duong/' || v_id;
    WHEN 'hong_hoc' THEN
      v_ma   := NEW.ma_hong_hoc;
      v_tieu := coalesce(NEW.ma_hong_hoc, 'Hỏng hóc');
      v_noi  := concat_ws(' ', NEW.snapshot_ma_thiet_bi, NEW.snapshot_ten_thiet_bi, NEW.mo_ta_hong_hoc);
      v_route := '/hong-hoc/' || v_id;
    WHEN 'ban_giao' THEN
      v_ma   := NEW.ma_ban_giao;
      v_tieu := coalesce(NEW.ma_ban_giao, 'Bàn giao');
      v_noi  := concat_ws(' ', NEW.snapshot_ma_thiet_bi, NEW.snapshot_ten_thiet_bi, NEW.ghi_chu, NEW.ghi_chu_duyet);
      v_route := '/ban-giao/' || v_id;
    WHEN 'giay_phep_khai_thac' THEN
      v_ma   := NEW.so_san_xuat;
      v_tieu := coalesce(NEW.ten_he_thong_theo_gp, NEW.so_san_xuat, 'Giấy phép');
      v_noi  := NEW.ma_dia_chi;
      v_route := '/giay-phep/' || v_id;
    WHEN 'vat_tu' THEN
      v_ma   := NEW.ma_vat_tu;
      v_tieu := coalesce(NEW.ten, NEW.ma_vat_tu);
      v_noi  := NEW.ghi_chu;
      v_route := '/kho/vat-tu/' || v_id;
    WHEN 'dm_he_thong' THEN
      v_ma   := NEW.so_san_xuat_gp;
      v_tieu := coalesce(NEW.ten, 'Hệ thống');
      v_noi  := concat_ws(' ', NEW.mo_ta, NEW.ten_he_thong_theo_gp, NEW.ma_dia_chi_kt_gp, NEW.ma_tai_san_bravo);
      v_route := '/he-thong/' || v_id;
    ELSE
      RETURN NEW;
  END CASE;

  INSERT INTO public.search_index(loai, id, ma, tieu_de, noi_dung, route, tsv, updated_at)
  VALUES (v_loai, v_id, v_ma, v_tieu, v_noi, v_route,
          public._search_tsv(coalesce(v_ma,'') || ' ' || v_tieu, v_noi), now())
  ON CONFLICT (loai, id) DO UPDATE
    SET ma = EXCLUDED.ma,
        tieu_de = EXCLUDED.tieu_de,
        noi_dung = EXCLUDED.noi_dung,
        route = EXCLUDED.route,
        tsv = EXCLUDED.tsv,
        updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: sync_taxonomy_he_thong(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_taxonomy_he_thong() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_pl uuid;
BEGIN
  IF NEW.nhom_he_thong_id IS NOT NULL THEN
    SELECT phan_loai_id INTO v_pl FROM public.dm_nhom_he_thong WHERE id = NEW.nhom_he_thong_id;
    IF v_pl IS NOT NULL THEN
      NEW.phan_loai_id := v_pl;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: sync_taxonomy_thiet_bi(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_taxonomy_thiet_bi() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_nhom uuid;
  v_pl uuid;
BEGIN
  IF NEW.he_thong_id IS NOT NULL THEN
    SELECT nhom_he_thong_id, phan_loai_id INTO v_nhom, v_pl
    FROM public.dm_he_thong WHERE id = NEW.he_thong_id;
    IF v_nhom IS NOT NULL THEN
      NEW.nhom_he_thong_id := v_nhom;
    END IF;
    IF v_pl IS NOT NULL THEN
      NEW.phan_loai_id := v_pl;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: sync_thanh_phan_don_vi(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_thanh_phan_don_vi() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.don_vi_id_snapshot IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT don_vi_id INTO NEW.don_vi_id_snapshot
  FROM public.dm_he_thong
  WHERE id = NEW.he_thong_id;

  RETURN NEW;
END;
$$;


--
-- Name: sync_thiet_bi_he_thong_cache(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_thiet_bi_he_thong_cache(p_thiet_bi_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ht uuid; v_vt uuid; v_tt uuid; v_dv uuid;
  v_nhom uuid; v_pl uuid;
  v_found boolean := false;
  v_retired boolean := false;
BEGIN
  IF p_thiet_bi_id IS NULL THEN RETURN; END IF;

  SELECT tp.he_thong_id, tp.vi_tri_id, tp.trang_thai_id, tp.don_vi_id_snapshot
    INTO v_ht, v_vt, v_tt, v_dv
  FROM public.gan_chuc_nang g
  JOIN public.he_thong_thanh_phan tp ON tp.id = g.thanh_phan_id
  WHERE g.thiet_bi_id = p_thiet_bi_id AND g.den_ngay IS NULL
  LIMIT 1;
  v_found := FOUND;

  SELECT COALESCE(dts.ma IN ('NGUNG_KHAI_THAC','THANH_LY'), false)
    INTO v_retired
  FROM public.thiet_bi t
  LEFT JOIN public.dm_trang_thai_thiet_bi dts ON dts.id = t.trang_thai_id
  WHERE t.id = p_thiet_bi_id;
  v_retired := COALESCE(v_retired, false);

  IF v_found THEN
    IF v_ht IS NOT NULL THEN
      SELECT nhom_he_thong_id, phan_loai_id INTO v_nhom, v_pl
      FROM public.dm_he_thong WHERE id = v_ht;
    END IF;
    UPDATE public.thiet_bi SET
      he_thong_id       = v_ht,
      nhom_he_thong_id  = COALESCE(v_nhom, nhom_he_thong_id),
      phan_loai_id      = COALESCE(v_pl, phan_loai_id),
      vi_tri_id         = v_vt,
      don_vi_quan_ly_id = COALESCE(v_dv, don_vi_quan_ly_id),
      trang_thai_id     = CASE WHEN v_retired THEN trang_thai_id ELSE COALESCE(v_tt, trang_thai_id) END
    WHERE id = p_thiet_bi_id;
  ELSE
    UPDATE public.thiet_bi SET
      he_thong_id       = NULL,
      nhom_he_thong_id  = NULL,
      phan_loai_id      = NULL,
      vi_tri_id         = NULL,
      trang_thai_id     = CASE WHEN v_retired THEN trang_thai_id ELSE NULL END
    WHERE id = p_thiet_bi_id;
  END IF;
END;
$$;


--
-- Name: tao_cong_viec_bao_tri_dinh_ky(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tao_cong_viec_bao_tri_dinh_ky() RETURNS TABLE(so_phieu_tao integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_count integer := 0;
BEGIN
  IF NOT public.can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Không có quyền tạo phiếu công việc bảo dưỡng';
  END IF;

  WITH ung_vien AS (
    SELECT t.id AS thiet_bi_id,
           t.he_thong_id,
           cs.id AS chinh_sach_id,
           COALESCE(t.ngay_bao_tri_ke_tiep, CURRENT_DATE) AS ngay_den_han
    FROM public.thiet_bi t
    JOIN public.bao_tri_chinh_sach cs
      ON cs.loai_thiet_bi_id = t.loai_thiet_bi_id
     AND cs.active = true
    WHERE t.thoi_diem_cham_dut IS NULL
      AND COALESCE(t.ngay_bao_tri_ke_tiep, CURRENT_DATE)
          <= CURRENT_DATE + COALESCE(cs.canh_bao_truoc_ngay, 0)
      AND NOT EXISTS (
        SELECT 1 FROM public.cong_viec_bao_tri cv
        WHERE cv.thiet_bi_id = t.id
          AND cv.chinh_sach_id = cs.id
          AND cv.trang_thai IN ('MO','DANG_LAM')
      )
  )
  INSERT INTO public.cong_viec_bao_tri
    (thiet_bi_id, he_thong_id, chinh_sach_id, loai, trang_thai, ngay_den_han, mo_ta)
  SELECT thiet_bi_id, he_thong_id, chinh_sach_id, 'PM', 'MO', ngay_den_han,
         'Bảo dưỡng định kỳ theo chính sách'
  FROM ung_vien;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$;


--
-- Name: tb_serial_khong_trung(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tb_serial_khong_trung() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_serial text;
  v_trung text;
BEGIN
  -- Chuẩn hoá: trim khoảng trắng; chuỗi rỗng coi như NULL.
  v_serial := NULLIF(btrim(COALESCE(NEW.ma_serial, '')), '');
  NEW.ma_serial := v_serial;

  -- Ô trống thì bỏ qua kiểm tra.
  IF v_serial IS NULL THEN
    RETURN NEW;
  END IF;

  -- Chỉ kiểm tra khi có thay đổi serial (INSERT hoặc UPDATE đổi serial).
  IF TG_OP = 'UPDATE'
     AND NULLIF(btrim(COALESCE(OLD.ma_serial, '')), '') IS NOT DISTINCT FROM v_serial THEN
    RETURN NEW;
  END IF;

  -- So khớp không phân biệt hoa/thường, bỏ khoảng trắng thừa hai đầu.
  SELECT ma_thiet_bi INTO v_trung
  FROM public.thiet_bi
  WHERE id <> NEW.id
    AND lower(btrim(ma_serial)) = lower(v_serial)
  LIMIT 1;

  IF v_trung IS NOT NULL THEN
    RAISE EXCEPTION 'Số serial "%" đã tồn tại ở thiết bị %', v_serial, v_trung
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: tg_bao_cao_annotation_updated(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_bao_cao_annotation_updated() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.cap_nhat_luc = now();
  RETURN NEW;
END; $$;


--
-- Name: tg_change_request_touch(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_change_request_touch() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;


--
-- Name: tg_node_note_touch(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_node_note_touch() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END$$;


--
-- Name: thao_linh_kien(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.thao_linh_kien(p_khe_id uuid, p_ly_do text DEFAULT 'tháo'::text, p_ghi_chu text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_gan uuid;
BEGIN
  IF NOT can_manage_equipment(public.current_uid()) THEN RAISE EXCEPTION 'Không có quyền quản lý thiết bị'; END IF;
  SELECT id INTO v_gan FROM public.gan_linh_kien WHERE khe_id = p_khe_id AND den_ngay IS NULL FOR UPDATE;
  IF v_gan IS NULL THEN RAISE EXCEPTION 'Khe chưa có linh kiện để tháo'; END IF;
  PERFORM public._dong_gan_lk(v_gan, 'tháo', NULL, public._map_trang_thai_tb(p_ly_do),
    'Tháo linh kiện khỏi khe: ' || COALESCE(p_ly_do,'tháo'));
END;
$$;


--
-- Name: thao_tai_san_khoi_thanh_phan(uuid, uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.thao_tai_san_khoi_thanh_phan(p_gan_id uuid, p_new_vi_tri_id uuid, p_ly_do text DEFAULT 'tháo'::text, p_ghi_chu text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_thiet_bi_id uuid;
  v_thanh_phan_id uuid;
BEGIN
  IF p_new_vi_tri_id IS NULL THEN
    RAISE EXCEPTION 'Phải chọn vị trí mới cho tài sản trước khi tháo';
  END IF;

  SELECT thiet_bi_id, thanh_phan_id INTO v_thiet_bi_id, v_thanh_phan_id
    FROM public.gan_chuc_nang
   WHERE id = p_gan_id AND den_ngay IS NULL;

  IF v_thiet_bi_id IS NULL THEN
    RAISE EXCEPTION 'Bản ghi gắn không tồn tại hoặc đã tháo';
  END IF;

  PERFORM public._validate_vi_tri_tuong_thich(p_new_vi_tri_id, v_thanh_phan_id);

  UPDATE public.gan_chuc_nang
     SET den_ngay = now(),
         ly_do = p_ly_do,
         ghi_chu = COALESCE(p_ghi_chu, ghi_chu)
   WHERE id = p_gan_id;

  UPDATE public.thiet_bi
     SET vi_tri_id = p_new_vi_tri_id
   WHERE id = v_thiet_bi_id;
END;
$$;


--
-- Name: thao_thiet_bi(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.thao_thiet_bi(p_thanh_phan_id uuid, p_ly_do text DEFAULT 'tháo'::text, p_ghi_chu text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_gan uuid;
BEGIN
  IF NOT can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Không có quyền quản lý thiết bị';
  END IF;
  SELECT id INTO v_gan FROM public.gan_chuc_nang
    WHERE thanh_phan_id = p_thanh_phan_id AND den_ngay IS NULL FOR UPDATE;
  IF v_gan IS NULL THEN RAISE EXCEPTION 'Vị trí chức năng chưa có thiết bị để tháo'; END IF;
  PERFORM public._dong_gan_va_vong_doi(
    v_gan, 'tháo', NULL, public._map_trang_thai_tb(p_ly_do),
    'Tháo khỏi vị trí chức năng: ' || COALESCE(p_ly_do,'tháo'));
END;
$$;


--
-- Name: thay_the_linh_kien(uuid, uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.thay_the_linh_kien(p_khe_id uuid, p_linh_kien_moi_id uuid, p_hong_hoc_id uuid DEFAULT NULL::uuid, p_ghi_chu text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_gan_cu uuid; v_id uuid; v_tt text;
BEGIN
  IF NOT can_manage_equipment(public.current_uid()) THEN RAISE EXCEPTION 'Không có quyền quản lý thiết bị'; END IF;
  SELECT trang_thai INTO v_tt FROM public.thiet_bi_khe_linh_kien WHERE id = p_khe_id FOR UPDATE;
  IF v_tt IS NULL THEN RAISE EXCEPTION 'Khe linh kiện không tồn tại'; END IF;
  IF v_tt <> 'hoat_dong' THEN RAISE EXCEPTION 'Khe linh kiện đã ngừng'; END IF;
  IF EXISTS (SELECT 1 FROM public.gan_linh_kien WHERE linh_kien_id = p_linh_kien_moi_id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Linh kiện mới đang được lắp ở khe khác';
  END IF;
  SELECT id INTO v_gan_cu FROM public.gan_linh_kien WHERE khe_id = p_khe_id AND den_ngay IS NULL FOR UPDATE;
  IF v_gan_cu IS NOT NULL THEN
    PERFORM public._dong_gan_lk(v_gan_cu, 'thay do hỏng', p_hong_hoc_id,
      public._map_trang_thai_tb('sửa'), 'Thay thế linh kiện do hỏng');
  END IF;
  v_id := public._mo_gan_lk(p_khe_id, p_linh_kien_moi_id, 'thay do hỏng', p_hong_hoc_id, p_ghi_chu);
  RETURN v_id;
END;
$$;


--
-- Name: thay_the_thiet_bi(uuid, uuid, uuid, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.thay_the_thiet_bi(p_thanh_phan_id uuid, p_thiet_bi_moi_id uuid, p_hong_hoc_id uuid DEFAULT NULL::uuid, p_ghi_chu text DEFAULT NULL::text, p_vi_tri_tai_san_cu_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_gan_cu uuid;
  v_tb_cu  uuid;
  v_id     uuid;
  v_tt     text;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền quản lý thiết bị';
  END IF;

  IF p_vi_tri_tai_san_cu_id IS NOT NULL THEN
    PERFORM public._validate_vi_tri_tuong_thich(p_vi_tri_tai_san_cu_id, p_thanh_phan_id);
  END IF;

  SELECT trang_thai INTO v_tt
  FROM public.he_thong_thanh_phan
  WHERE id = p_thanh_phan_id
  FOR UPDATE;

  IF v_tt IS NULL THEN RAISE EXCEPTION 'Vị trí chức năng không tồn tại'; END IF;
  IF v_tt <> 'hoat_dong' THEN RAISE EXCEPTION 'Vị trí chức năng đã ngừng'; END IF;

  SELECT id, thiet_bi_id INTO v_gan_cu, v_tb_cu
  FROM public.gan_chuc_nang
  WHERE thanh_phan_id = p_thanh_phan_id AND den_ngay IS NULL
  FOR UPDATE;

  IF v_gan_cu IS NOT NULL THEN
    PERFORM public._dong_gan_va_vong_doi(
      v_gan_cu, 'thay do hỏng', p_hong_hoc_id,
      public._map_trang_thai_tb('sửa'), 'Thay thế do hỏng'
    );
    IF p_vi_tri_tai_san_cu_id IS NOT NULL AND v_tb_cu IS NOT NULL THEN
      UPDATE public.thiet_bi SET vi_tri_id = p_vi_tri_tai_san_cu_id WHERE id = v_tb_cu;
    END IF;
  END IF;

  v_id := public._mo_gan_va_vong_doi(
    p_thanh_phan_id, p_thiet_bi_moi_id, 'thay do hỏng', p_hong_hoc_id, p_ghi_chu
  );
  RETURN v_id;
END;
$$;


--
-- Name: FUNCTION thay_the_thiet_bi(p_thanh_phan_id uuid, p_thiet_bi_moi_id uuid, p_hong_hoc_id uuid, p_ghi_chu text, p_vi_tri_tai_san_cu_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.thay_the_thiet_bi(p_thanh_phan_id uuid, p_thiet_bi_moi_id uuid, p_hong_hoc_id uuid, p_ghi_chu text, p_vi_tri_tai_san_cu_id uuid) IS 'Thay thế tài sản tại vị trí chức năng. Nếu p_vi_tri_tai_san_cu_id được truyền, tài sản cũ được chuyển về vị trí đó (thường là kho sửa chữa/xưởng). Nếu bỏ trống, tài sản cũ giữ nguyên vị trí (tương thích ngược).';


--
-- Name: thiet_bi_inherit_model(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.thiet_bi_inherit_model() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE m public.dm_model;
BEGIN
  IF NEW.model_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.model_id IS DISTINCT FROM OLD.model_id) THEN
    SELECT * INTO m FROM public.dm_model WHERE id = NEW.model_id;
    IF FOUND THEN
      IF m.loai_thiet_bi_id IS NOT NULL THEN NEW.loai_thiet_bi_id := m.loai_thiet_bi_id; END IF;
      IF m.nha_san_xuat_id IS NOT NULL THEN NEW.nha_san_xuat_id := m.nha_san_xuat_id; END IF;
      IF m.field_set_id IS NOT NULL THEN NEW.field_set_id := m.field_set_id; END IF;
      IF m.p_n IS NOT NULL AND m.p_n <> '' THEN NEW.p_n := m.p_n; END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: thiet_bi_sync_hierarchy(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.thiet_bi_sync_hierarchy() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE r record;
BEGIN
  IF NEW.he_thong_id IS NOT NULL THEN
    SELECT phan_loai_id, nhom_he_thong_id INTO r
      FROM public.dm_he_thong WHERE id = NEW.he_thong_id;
    IF FOUND THEN
      NEW.phan_loai_id     := r.phan_loai_id;
      NEW.nhom_he_thong_id := r.nhom_he_thong_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: thiet_bi_sync_ref_text(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.thiet_bi_sync_ref_text() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_id uuid;
  v_cnt int;
BEGIN
  -- Hàm nội bộ: nếu có FK → text = ten của FK (snapshot).
  -- Nếu chỉ có text (FK NULL) → thử resolve FK theo tên chuẩn hoá,
  --   chỉ gán khi match DUY NHẤT (an toàn, không tự merge).

  -- nha_san_xuat
  IF NEW.nha_san_xuat_id IS NOT NULL THEN
    SELECT ten INTO NEW.nha_san_xuat FROM public.dm_nha_san_xuat WHERE id = NEW.nha_san_xuat_id;
  ELSIF NEW.nha_san_xuat IS NOT NULL AND btrim(NEW.nha_san_xuat) <> '' THEN
    SELECT id INTO v_id FROM public.dm_nha_san_xuat
      WHERE public.chuan_hoa_ten(ten) = public.chuan_hoa_ten(NEW.nha_san_xuat)
      LIMIT 2;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    IF v_cnt = 1 THEN
      NEW.nha_san_xuat_id := v_id;
      SELECT ten INTO NEW.nha_san_xuat FROM public.dm_nha_san_xuat WHERE id = v_id;
    END IF;
  END IF;

  -- nha_cung_cap
  IF NEW.nha_cung_cap_id IS NOT NULL THEN
    SELECT ten INTO NEW.nha_cung_cap FROM public.dm_nha_cung_cap WHERE id = NEW.nha_cung_cap_id;
  ELSIF NEW.nha_cung_cap IS NOT NULL AND btrim(NEW.nha_cung_cap) <> '' THEN
    SELECT id INTO v_id FROM public.dm_nha_cung_cap
      WHERE public.chuan_hoa_ten(ten) = public.chuan_hoa_ten(NEW.nha_cung_cap)
      LIMIT 2;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    IF v_cnt = 1 THEN
      NEW.nha_cung_cap_id := v_id;
      SELECT ten INTO NEW.nha_cung_cap FROM public.dm_nha_cung_cap WHERE id = v_id;
    END IF;
  END IF;

  -- model
  IF NEW.model_id IS NOT NULL THEN
    SELECT ten INTO NEW.model FROM public.dm_model WHERE id = NEW.model_id;
  ELSIF NEW.model IS NOT NULL AND btrim(NEW.model) <> '' THEN
    SELECT id INTO v_id FROM public.dm_model
      WHERE public.chuan_hoa_ten(ten) = public.chuan_hoa_ten(NEW.model)
      LIMIT 2;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    IF v_cnt = 1 THEN
      NEW.model_id := v_id;
      SELECT ten INTO NEW.model FROM public.dm_model WHERE id = v_id;
    END IF;
  END IF;

  -- vi_tri
  IF NEW.vi_tri_id IS NOT NULL THEN
    SELECT ten INTO NEW.vi_tri FROM public.dm_vi_tri WHERE id = NEW.vi_tri_id;
  ELSIF NEW.vi_tri IS NOT NULL AND btrim(NEW.vi_tri) <> '' THEN
    SELECT id INTO v_id FROM public.dm_vi_tri
      WHERE public.chuan_hoa_ten(ten) = public.chuan_hoa_ten(NEW.vi_tri)
      LIMIT 2;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    IF v_cnt = 1 THEN
      NEW.vi_tri_id := v_id;
      SELECT ten INTO NEW.vi_tri FROM public.dm_vi_tri WHERE id = v_id;
    END IF;
  END IF;

  -- phan_loai
  IF NEW.phan_loai_id IS NOT NULL THEN
    SELECT ten INTO NEW.phan_loai FROM public.dm_phan_loai WHERE id = NEW.phan_loai_id;
  ELSIF NEW.phan_loai IS NOT NULL AND btrim(NEW.phan_loai) <> '' THEN
    SELECT id INTO v_id FROM public.dm_phan_loai
      WHERE public.chuan_hoa_ten(ten) = public.chuan_hoa_ten(NEW.phan_loai)
      LIMIT 2;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    IF v_cnt = 1 THEN
      NEW.phan_loai_id := v_id;
      SELECT ten INTO NEW.phan_loai FROM public.dm_phan_loai WHERE id = v_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: thoi_gian_may_chu(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.thoi_gian_may_chu() RETURNS timestamp with time zone
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$ SELECT now() $$;


--
-- Name: tim_kiem_toan_cuc(text, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tim_kiem_toan_cuc(_q text, _loai text DEFAULT NULL::text, _gioi_han integer DEFAULT 30) RETURNS TABLE(loai text, id text, tieu_de text, mota_ngan text, route text, hang real)
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  v_q text := public.f_unaccent(coalesce(_q,''));
  v_clean text;
  v_tsq tsquery;
  v_tokens text[];
BEGIN
  IF length(trim(v_q)) = 0 THEN RETURN; END IF;

  -- Loại ký tự nguy hiểm, chỉ giữ [a-z0-9\s]
  v_clean := lower(regexp_replace(v_q, '[^a-zA-Z0-9\s]', ' ', 'g'));
  v_tokens := regexp_split_to_array(trim(regexp_replace(v_clean, '\s+', ' ', 'g')), ' ');
  IF array_length(v_tokens,1) IS NULL THEN RETURN; END IF;

  BEGIN
    v_tsq := to_tsquery('simple', array_to_string(
      array(SELECT t || ':*' FROM unnest(v_tokens) t WHERE length(t) > 0),
      ' & '
    ));
  EXCEPTION WHEN OTHERS THEN
    RETURN;
  END;

  RETURN QUERY
  SELECT s.loai, s.id, s.tieu_de,
         left(coalesce(s.noi_dung,''), 160) AS mota_ngan,
         s.route,
         (
           ts_rank(s.tsv, v_tsq)
           + CASE WHEN public.f_unaccent(coalesce(s.ma,'')) ILIKE v_clean || '%' THEN 0.5 ELSE 0 END
           + CASE WHEN public.f_unaccent(s.tieu_de)         ILIKE v_clean || '%' THEN 0.3 ELSE 0 END
           + CASE WHEN s.loai = 'trang' THEN 0.05 ELSE 0 END
         )::real AS hang
  FROM public.search_index s
  WHERE s.tsv @@ v_tsq
    AND (_loai IS NULL OR s.loai = _loai)
  ORDER BY hang DESC, s.tieu_de
  LIMIT least(coalesce(_gioi_han, 30), 100);
END;
$$;


--
-- Name: topology_import_tu_so_do(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.topology_import_tu_so_do(p_so_do_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_data    jsonb;
  v_edge    jsonb;
  v_src_ma  text; v_tgt_ma text;
  v_src_id  uuid; v_tgt_id uuid;
  v_mapped  int := 0; v_unmapped int := 0; v_created int := 0;
  v_details jsonb := '[]'::jsonb;
BEGIN
  IF NOT can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Không có quyền nhập topology từ sơ đồ';
  END IF;

  SELECT du_lieu INTO v_data FROM public.so_do_he_thong WHERE id = p_so_do_id;
  IF v_data IS NULL THEN
    RETURN jsonb_build_object('mapped',0,'unmapped',0,'created',0,'details','[]'::jsonb);
  END IF;

  FOR v_edge IN SELECT * FROM jsonb_array_elements(COALESCE(v_data->'edges','[]'::jsonb))
  LOOP
    SELECT (n->'data'->>'ref') INTO v_src_ma
      FROM jsonb_array_elements(COALESCE(v_data->'nodes','[]'::jsonb)) n
      WHERE n->>'id' = v_edge->>'source' AND n->'data'->>'kind' = 'thiet_bi' LIMIT 1;
    SELECT (n->'data'->>'ref') INTO v_tgt_ma
      FROM jsonb_array_elements(COALESCE(v_data->'nodes','[]'::jsonb)) n
      WHERE n->>'id' = v_edge->>'target' AND n->'data'->>'kind' = 'thiet_bi' LIMIT 1;

    v_src_id := NULL; v_tgt_id := NULL;
    IF v_src_ma IS NOT NULL THEN SELECT id INTO v_src_id FROM public.thiet_bi WHERE ma_thiet_bi = v_src_ma LIMIT 1; END IF;
    IF v_tgt_ma IS NOT NULL THEN SELECT id INTO v_tgt_id FROM public.thiet_bi WHERE ma_thiet_bi = v_tgt_ma LIMIT 1; END IF;

    IF v_src_id IS NOT NULL AND v_tgt_id IS NOT NULL AND v_src_id <> v_tgt_id THEN
      v_mapped := v_mapped + 1;
      IF NOT EXISTS (
        SELECT 1 FROM public.thiet_bi_ket_noi
        WHERE tu_thiet_bi_id = v_src_id AND den_thiet_bi_id = v_tgt_id AND loai = 'CAP'
          AND COALESCE(tu_cong,'') = '' AND COALESCE(den_cong,'') = ''
      ) THEN
        INSERT INTO public.thiet_bi_ket_noi(tu_thiet_bi_id, den_thiet_bi_id, loai, mo_ta)
        VALUES (v_src_id, v_tgt_id, 'CAP', 'Nhập từ sơ đồ');
        v_created := v_created + 1;
      END IF;
    ELSE
      v_unmapped := v_unmapped + 1;
      v_details := v_details || jsonb_build_object(
        'edge', v_edge->>'id',
        'source', v_edge->>'source',
        'target', v_edge->>'target',
        'ly_do', 'Một hoặc cả hai đầu không phải thiết bị có mã hợp lệ'
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('mapped',v_mapped,'unmapped',v_unmapped,'created',v_created,'details',v_details);
END;
$$;


--
-- Name: touch_user_layout_prefs(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_user_layout_prefs() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;


--
-- Name: trg_bao_tri_3lop(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_bao_tri_3lop() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public._sync_3lop(
    NEW.thanh_phan_id, NEW.he_thong_id, NEW.thiet_bi_id, NEW.ngay_bat_dau);
  NEW.thanh_phan_id := r.o_thanh_phan_id;
  NEW.he_thong_id   := r.o_he_thong_id;
  NEW.thiet_bi_id   := r.o_thiet_bi_id;
  RETURN NEW;
END; $$;


--
-- Name: trg_cascade_he_thong_don_vi_to_tai_san(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_cascade_he_thong_don_vi_to_tai_san() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.don_vi_id IS DISTINCT FROM OLD.don_vi_id THEN
    UPDATE public.thiet_bi tb
       SET don_vi_id = NEW.don_vi_id
      FROM public.gan_chuc_nang gcn
      JOIN public.he_thong_thanh_phan tp ON tp.id = gcn.thanh_phan_id
     WHERE tp.he_thong_id = NEW.id
       AND gcn.den_ngay IS NULL
       AND tb.id = gcn.thiet_bi_id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: trg_cascade_thanh_phan_vi_tri(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_cascade_thanh_phan_vi_tri() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.vi_tri_id IS DISTINCT FROM OLD.vi_tri_id THEN
    UPDATE public.thiet_bi tb
       SET vi_tri_id = NEW.vi_tri_id
      FROM public.gan_chuc_nang gcn
     WHERE gcn.thanh_phan_id = NEW.id
       AND gcn.den_ngay IS NULL
       AND tb.id = gcn.thiet_bi_id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: trg_cvbt_ma(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_cvbt_ma() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.ma_cong_viec IS NULL OR NEW.ma_cong_viec = '' THEN
    NEW.ma_cong_viec := 'WO-' || lpad(nextval('public.cong_viec_bao_tri_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;


