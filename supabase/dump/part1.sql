SET search_path = public, pg_catalog;
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'phong_kt',
    'phu_trach_dv',
    'ktv',
    'readonly',
    'quan_ly_du_an',
    'to_truong'
);


--
-- Name: bao_cao_annotation_loai; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.bao_cao_annotation_loai AS ENUM (
    'bao_tri',
    'su_co',
    'thay_doi',
    'ghi_chu'
);


--
-- Name: change_request_loai; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.change_request_loai AS ENUM (
    'cay.delete_node',
    'cay.restore_node',
    'cay.hard_delete_node',
    'cay.reorg',
    'thiet_bi.change_model',
    'thiet_bi.change_don_vi',
    'he_thong.change_nhom',
    'he_thong.change_don_vi',
    'danh_muc.merge',
    'danh_muc.deactivate',
    'role.grant',
    'role.revoke'
);


--
-- Name: change_request_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.change_request_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled',
    'applied_failed'
);


--
-- Name: cong_viec_trang_thai; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cong_viec_trang_thai AS ENUM (
    'chua_bat_dau',
    'dang_lam',
    'cho_duyet',
    'hoan_thanh',
    'qua_han'
);


--
-- Name: don_vi_code; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.don_vi_code AS ENUM (
    'CRA',
    'CLA',
    'THO',
    'PCA',
    'PBA',
    'PLK'
);


--
-- Name: du_an_trang_thai; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.du_an_trang_thai AS ENUM (
    'moi',
    'dang_thuc_hien',
    'tam_dung',
    'hoan_thanh',
    'huy'
);


--
-- Name: form_field_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.form_field_kind AS ENUM (
    'text',
    'textarea',
    'number',
    'date',
    'datetime',
    'select',
    'multiselect',
    'checkbox',
    'file',
    'user_ref',
    'don_vi_ref',
    'thiet_bi_ref',
    'measure',
    'before_after',
    'rating',
    'radio',
    'photo',
    'signature',
    'geo',
    'duration',
    'table',
    'linh_kien_ref',
    'vat_tu_ref',
    'he_thong_thanh_phan_ref',
    'computed',
    'heading',
    'note',
    'divider',
    'section_repeat'
);


--
-- Name: form_ket_qua; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.form_ket_qua AS ENUM (
    'dat',
    'khong_dat',
    'khong_ap_dung'
);


--
-- Name: form_result_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.form_result_kind AS ENUM (
    'so',
    'dat_khong_dat',
    'chon',
    'text'
);


--
-- Name: form_submission_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.form_submission_status AS ENUM (
    'draft',
    'submitted',
    'approved',
    'returned'
);


--
-- Name: form_template_version_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.form_template_version_status AS ENUM (
    'draft',
    'published',
    'retired'
);


--
-- Name: form_thiet_bi_mode; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.form_thiet_bi_mode AS ENUM (
    'none',
    'single',
    'multi'
);


--
-- Name: node_note_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.node_note_type AS ENUM (
    'he_thong',
    'thanh_phan'
);


--
-- Name: notification_loai; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_loai AS ENUM (
    'ticket_moi',
    'ticket_cap_nhat',
    'ticket_binh_luan',
    'tin_nhan_moi',
    'he_thong'
);


--
-- Name: thiet_bi_tep_loai; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.thiet_bi_tep_loai AS ENUM (
    'hinh_anh',
    'tai_lieu'
);


--
-- Name: ticket_loai; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_loai AS ENUM (
    'cap_tai_khoan',
    'doi_quyen',
    'reset_mat_khau',
    'bao_loi',
    'khac'
);


--
-- Name: ticket_trang_thai; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_trang_thai AS ENUM (
    'moi',
    'dang_xu_ly',
    'cho_phan_hoi',
    'hoan_thanh',
    'tu_choi',
    'dong'
);


--
-- Name: ticket_uu_tien; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_uu_tien AS ENUM (
    'thap',
    'trung_binh',
    'cao',
    'khan'
);


--
-- Name: _admin_check_ident(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._admin_check_ident(_ident text) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $_$
BEGIN
  IF _ident IS NULL OR _ident !~ '^[a-z_][a-z0-9_]*$' OR length(_ident) > 63 THEN
    RAISE EXCEPTION 'Tên định danh không hợp lệ: %', _ident;
  END IF;
END;
$_$;


--
-- Name: _admin_check_table(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._admin_check_table(_table text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
BEGIN
  IF _table IS NULL OR _table !~ '^[a-z_][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Tên bảng không hợp lệ: %', _table;
  END IF;
  IF NOT (_table ~ '^(dm_|thiet_bi|giay_phep|form_)') THEN
    RAISE EXCEPTION 'Bảng "%" không nằm trong nhóm bảng nghiệp vụ được phép sửa', _table;
  END IF;
  IF _table IN ('audit_log','profiles','user_roles') THEN
    RAISE EXCEPTION 'Không được sửa bảng hệ thống "%"', _table;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name=_table
  ) THEN
    RAISE EXCEPTION 'Bảng "%" không tồn tại', _table;
  END IF;
END;
$_$;


--
-- Name: _admin_check_type(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._admin_check_type(_type text) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF _type NOT IN ('text','integer','bigint','numeric','boolean','date','timestamptz','uuid','jsonb') THEN
    RAISE EXCEPTION 'Kiểu dữ liệu "%" không được phép', _type;
  END IF;
END;
$$;


--
-- Name: _backup_allowed_table(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._backup_allowed_table(p_table text) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT p_table = ANY (ARRAY[
    'profiles','user_roles','role_permission','user_scope',
    'dm_don_vi','dm_he_thong','dm_vi_tri','dm_loai_thiet_bi','dm_nha_san_xuat',
    'dm_nha_cung_cap','dm_dac_tinh','dm_phan_loai','dm_linh_vuc','dm_nhom_he_thong',
    'dm_to_chuc','dm_loai_giay_phep','dm_loai_lien_ket','dm_trang_thai_thiet_bi',
    'dm_noi_cap','dm_danh_gia_nien_han','dm_model','dm_model_dac_tinh',
    'thiet_bi','he_thong_thanh_phan','thiet_bi_khe_linh_kien','gan_linh_kien',
    'gan_chuc_nang','lien_ket_he_thong','lien_ket_khe',
    'su_co','bao_tri','hong_hoc','kiem_ke','chung_chi_thiet_bi','ban_giao',
    'giay_phep','giay_phep_khai_thac','cong_viec_bao_tri','van_de','tickets',
    'ticket_comment',
    'form_template','form_section','form_field','form_check_item',
    'form_submission','form_submission_item_result','form_template_version',
    'form_template_he_thong','form_template_include','form_submission_thiet_bi',
    'field_set','field_set_item',
    'import_batch','import_item','import_alias',
    'audit_log','backup_lich_su','cay_thay_doi','cay_node_edit',
    'notifications','telegram_subscriber','telegram_da_gui',
    'ai_config','ai_conversation','ai_message','search_index','node_note',
    'so_do_he_thong','so_do_tep_dinh_kem','so_do_thu_vien_hinh',
    'vat_tu','kho','kho_giao_dich','thiet_bi_cap_phat','thiet_bi_do_dac',
    'thiet_bi_ket_noi','thiet_bi_tep_dinh_kem','thiet_bi_vong_doi',
    'nhan_vien','du_an','du_an_cong_viec','du_an_cong_viec_phoi_hop','du_an_moc',
    'bao_tri_chinh_sach','anomaly_alert','app_cai_dat','dinh_nghia_truong',
    'he_thong_truong','bang_cot_tuy_chinh','canh_bao_het_han_log',
    'auth_event_log','audit_log','feature_usage_log','access_request',
    'conversations','conversation_participant','messages','webauthn_credentials',
    'model_tai_lieu','vi_tri_media'
  ]);
$$;


--
-- Name: _cay_apply(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._cay_apply(_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  r public.cay_thay_doi;
  snap jsonb := '{}'::jsonb;
  v_to_pl uuid; v_to_nh_key text; v_to_nh_ten text; v_nhom_id uuid;
  v_ids uuid[]; v_dev_ma text; v_to_ht uuid; v_to_pl_dev uuid;
  v_ht_nhom uuid; v_ht_pl uuid; v_scope text; v_pham_vi text;
BEGIN
  SELECT * INTO r FROM public.cay_thay_doi WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Khong tim thay thay doi'; END IF;
  IF r.da_ap_dung THEN RETURN jsonb_build_object('ok', true, 'noop', true); END IF;

  IF r.loai = 'move_system' THEN
    v_to_pl := NULLIF(r.payload->>'to_nhom_id','')::uuid;
    v_to_nh_key := NULLIF(r.payload->>'to_nh_key','');
    v_nhom_id := NULL;
    IF v_to_pl IS NOT NULL AND v_to_nh_key IS NOT NULL THEN
      SELECT id INTO v_nhom_id FROM public.dm_nhom_he_thong
        WHERE phan_loai_id = v_to_pl AND ma = v_to_nh_key LIMIT 1;
    END IF;
    SELECT jsonb_build_object(
      'he_thong', (SELECT jsonb_build_object('phan_loai_id', phan_loai_id, 'nhom_he_thong_id', nhom_he_thong_id) FROM public.dm_he_thong WHERE id = r.he_thong_id::uuid),
      'thiet_bi', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'phan_loai_id', phan_loai_id, 'nhom_he_thong_id', nhom_he_thong_id)) FROM public.thiet_bi WHERE he_thong_id = r.he_thong_id::uuid), '[]'::jsonb),
      'node_edit', (SELECT to_jsonb(n) FROM public.cay_node_edit n WHERE n.kind = 'ht' AND n.ma = r.he_thong_id)
    ) INTO snap;
    UPDATE public.dm_he_thong SET phan_loai_id = COALESCE(v_to_pl, phan_loai_id), nhom_he_thong_id = v_nhom_id WHERE id = r.he_thong_id::uuid;
  ELSIF r.loai = 'move_systems' THEN
    v_ids := ARRAY(SELECT jsonb_array_elements_text(COALESCE(r.payload->'ids','[]'::jsonb)))::uuid[];
    v_to_pl := NULLIF(r.payload->>'to_nhom_id','')::uuid;
    v_to_nh_key := NULLIF(r.payload->>'to_nh_key','');
    v_nhom_id := NULL;
    IF v_to_pl IS NOT NULL AND v_to_nh_key IS NOT NULL THEN
      SELECT id INTO v_nhom_id FROM public.dm_nhom_he_thong WHERE phan_loai_id = v_to_pl AND ma = v_to_nh_key LIMIT 1;
    END IF;
    SELECT jsonb_build_object(
      'he_thong', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'phan_loai_id', phan_loai_id, 'nhom_he_thong_id', nhom_he_thong_id)) FROM public.dm_he_thong WHERE id = ANY(v_ids)), '[]'::jsonb),
      'thiet_bi', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'phan_loai_id', phan_loai_id, 'nhom_he_thong_id', nhom_he_thong_id)) FROM public.thiet_bi WHERE he_thong_id = ANY(v_ids)), '[]'::jsonb)
    ) INTO snap;
    UPDATE public.dm_he_thong SET phan_loai_id = COALESCE(v_to_pl, phan_loai_id), nhom_he_thong_id = v_nhom_id WHERE id = ANY(v_ids);
  ELSIF r.loai = 'move_device' THEN
    v_dev_ma := r.payload->>'device_ma';
    v_to_ht := NULLIF(r.payload->>'to_ht_id','')::uuid;
    v_to_pl_dev := NULLIF(r.payload->>'to_pl_id','')::uuid;
    SELECT jsonb_build_object('thiet_bi',
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'he_thong_id', he_thong_id, 'nhom_he_thong_id', nhom_he_thong_id, 'phan_loai_id', phan_loai_id))
       FROM public.thiet_bi WHERE ma_thiet_bi = v_dev_ma), '[]'::jsonb)) INTO snap;
    IF v_to_ht IS NOT NULL THEN
      SELECT nhom_he_thong_id, phan_loai_id INTO v_ht_nhom, v_ht_pl FROM public.dm_he_thong WHERE id = v_to_ht;
      UPDATE public.thiet_bi SET he_thong_id = v_to_ht, nhom_he_thong_id = COALESCE(v_ht_nhom, nhom_he_thong_id), phan_loai_id = COALESCE(v_ht_pl, phan_loai_id) WHERE ma_thiet_bi = v_dev_ma;
    ELSIF v_to_pl_dev IS NOT NULL THEN
      UPDATE public.thiet_bi SET phan_loai_id = v_to_pl_dev, he_thong_id = NULL, nhom_he_thong_id = NULL WHERE ma_thiet_bi = v_dev_ma;
    ELSIF COALESCE((r.payload->>'detach')::boolean, false) THEN
      UPDATE public.thiet_bi SET he_thong_id = NULL, nhom_he_thong_id = NULL WHERE ma_thiet_bi = v_dev_ma;
    END IF;
  ELSIF r.loai = 'custom_fields' THEN
    v_scope := COALESCE(r.payload->>'scope','he_thong');
    v_pham_vi := CASE WHEN v_scope = 'thiet_bi' THEN 'thiet_bi' ELSE 'he_thong' END;
    SELECT jsonb_build_object('he_thong_truong',
      COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.he_thong_truong t WHERE t.he_thong_id = r.he_thong_id), '[]'::jsonb)
    ) INTO snap;
    DELETE FROM public.he_thong_truong WHERE he_thong_id = r.he_thong_id;
    INSERT INTO public.he_thong_truong (he_thong_id, field_key, nhan, kieu, tuy_chon, thu_tu, help_text, bat_buoc, nhom_field, created_by)
    SELECT r.he_thong_id, f->>'field_key', f->>'nhan', COALESCE(f->>'kieu','text'), COALESCE(f->'tuy_chon','[]'::jsonb), COALESCE((f->>'thu_tu')::int, 0), NULLIF(f->>'help_text',''), COALESCE((f->>'bat_buoc')::boolean, false), NULLIF(f->>'nhom_field',''), r.nguoi_tao
    FROM jsonb_array_elements(COALESCE(r.payload->'fields','[]'::jsonb)) f
    WHERE COALESCE(f->>'field_key','') <> '';
  ELSE
    RAISE EXCEPTION 'Loai thay doi khong ho tro: %', r.loai;
  END IF;

  UPDATE public.cay_thay_doi SET snapshot_cu = snap, da_ap_dung = true, trang_thai = 'da_duyet' WHERE id = _id;
  RETURN jsonb_build_object('ok', true);
END;
$$;


--
-- Name: _danh_muc_merge_ref_map(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._danh_muc_merge_ref_map() RETURNS jsonb
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT '{
    "dm_don_vi": [
      {"table":"dm_vi_tri","column":"don_vi_id"},
      {"table":"dm_he_thong","column":"don_vi_id"},
      {"table":"dm_nhom_he_thong","column":"don_vi_id"},
      {"table":"nhan_vien","column":"don_vi_id"},
      {"table":"user_scope","column":"don_vi_id"}
    ],
    "dm_vi_tri": [
      {"table":"thiet_bi","column":"vi_tri_id"},
      {"table":"he_thong_thanh_phan","column":"vi_tri_id"}
    ],
    "dm_loai_thiet_bi": [
      {"table":"thiet_bi","column":"loai_thiet_bi_id"},
      {"table":"dm_model","column":"loai_thiet_bi_id"}
    ],
    "dm_nha_san_xuat": [
      {"table":"dm_model","column":"nha_san_xuat_id"},
      {"table":"thiet_bi","column":"nha_san_xuat_id"}
    ],
    "dm_nha_cung_cap": [
      {"table":"thiet_bi","column":"nha_cung_cap_id"}
    ],
    "dm_model": [
      {"table":"thiet_bi","column":"model_id"},
      {"table":"dm_model_dac_tinh","column":"model_id"},
      {"table":"model_tai_lieu","column":"model_id"}
    ],
    "dm_nhom_he_thong": [
      {"table":"dm_he_thong","column":"nhom_he_thong_id"}
    ],
    "dm_he_thong": [
      {"table":"he_thong_thanh_phan","column":"he_thong_id"},
      {"table":"lien_ket_he_thong","column":"he_thong_a_id"},
      {"table":"lien_ket_he_thong","column":"he_thong_b_id"},
      {"table":"form_template_he_thong","column":"he_thong_id"}
    ],
    "dm_phan_loai": [
      {"table":"dm_he_thong","column":"phan_loai_id"},
      {"table":"dm_nhom_he_thong","column":"phan_loai_id"},
      {"table":"thiet_bi","column":"phan_loai_id"}
    ],
    "dm_dac_tinh": [
      {"table":"dm_model_dac_tinh","column":"dac_tinh_id"}
    ],
    "dm_noi_cap": [],
    "dm_loai_giay_phep": [
      {"table":"giay_phep","column":"loai_giay_phep_id"}
    ],
    "dm_loai_lien_ket": [
      {"table":"lien_ket_he_thong","column":"loai_lien_ket_id"},
      {"table":"lien_ket_khe","column":"loai_lien_ket_id"}
    ],
    "dm_trang_thai_thiet_bi": [
      {"table":"thiet_bi","column":"trang_thai_id"}
    ],
    "dm_danh_gia_nien_han": [
      {"table":"thiet_bi","column":"danh_gia_nien_han_id"}
    ],
    "dm_to_chuc": []
  }'::jsonb
$$;


--
-- Name: _debug_test_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._debug_test_insert() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE r text;
BEGIN
  INSERT INTO he_thong_thanh_phan (he_thong_id, ma_thanh_phan, ten, bat_buoc, thu_tu, mo_ta)
  VALUES ('1e44141b-e2de-49d2-930b-5886ba6a3b38','TPHT_TEST99','test',true,999,'test')
  RETURNING id::text INTO r;
  RAISE EXCEPTION 'rollback: %', r;
END $$;


--
-- Name: _dong_gan_lk(uuid, text, uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._dong_gan_lk(p_gan_id uuid, p_ly_do_gan text, p_hong_hoc_id uuid, p_trang_thai_moi uuid, p_ly_do_vd text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_lk uuid; v_cu uuid;
BEGIN
  UPDATE public.gan_linh_kien
    SET den_ngay = now(),
        ly_do = COALESCE(p_ly_do_gan, ly_do),
        hong_hoc_id = COALESCE(p_hong_hoc_id, hong_hoc_id)
    WHERE id = p_gan_id
    RETURNING linh_kien_id INTO v_lk;

  IF p_trang_thai_moi IS NOT NULL AND v_lk IS NOT NULL THEN
    SELECT trang_thai_id INTO v_cu FROM public.thiet_bi WHERE id = v_lk;
    UPDATE public.thiet_bi SET trang_thai_id = p_trang_thai_moi WHERE id = v_lk;
    INSERT INTO public.thiet_bi_vong_doi(thiet_bi_id, tu_trang_thai_id, den_trang_thai_id, thoi_diem, ly_do, nguoi_thuc_hien)
    VALUES (v_lk, v_cu, p_trang_thai_moi, now(), COALESCE(p_ly_do_vd,'Cập nhật trạng thái'), public.current_uid());
  END IF;
END;
$$;


--
-- Name: _dong_gan_va_vong_doi(uuid, text, uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._dong_gan_va_vong_doi(p_gan_id uuid, p_ly_do_gan text, p_hong_hoc_id uuid, p_trang_thai_moi uuid, p_ly_do_vd text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_tb uuid; v_cu uuid;
BEGIN
  UPDATE public.gan_chuc_nang
    SET den_ngay = now(),
        ly_do = COALESCE(p_ly_do_gan, ly_do),
        hong_hoc_id = COALESCE(p_hong_hoc_id, hong_hoc_id)
    WHERE id = p_gan_id
    RETURNING thiet_bi_id INTO v_tb;

  IF p_trang_thai_moi IS NOT NULL AND v_tb IS NOT NULL THEN
    SELECT trang_thai_id INTO v_cu FROM public.thiet_bi WHERE id = v_tb;
    UPDATE public.thiet_bi SET trang_thai_id = p_trang_thai_moi WHERE id = v_tb;
    INSERT INTO public.thiet_bi_vong_doi(thiet_bi_id, tu_trang_thai_id, den_trang_thai_id, thoi_diem, ly_do, nguoi_thuc_hien)
    VALUES (v_tb, v_cu, p_trang_thai_moi, now(), COALESCE(p_ly_do_vd,'Cập nhật trạng thái'), public.current_uid());
  END IF;
END;
$$;


--
-- Name: _gen_ma_thiet_bi_random(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._gen_ma_thiet_bi_random(len integer DEFAULT 8) RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  alphabet text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  s text := '';
  i int;
BEGIN
  FOR i IN 1..len LOOP
    s := s || substr(alphabet, 1 + (floor(random() * length(alphabet)))::int, 1);
  END LOOP;
  RETURN 'TB_' || s;
END $$;


--
-- Name: _import_allowed_table(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._import_allowed_table(_tbl text) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT _tbl = ANY (ARRAY[
    'thiet_bi','dm_he_thong','dm_nhom_he_thong','dm_model','dm_nha_san_xuat',
    'dm_nha_cung_cap','dm_phan_loai','dm_linh_vuc','dm_loai_thiet_bi','dm_vi_tri',
    'dm_trang_thai_thiet_bi','dm_noi_cap','dm_loai_giay_phep','dm_danh_gia_nien_han',
    'dm_don_vi','he_thong_truong','giay_phep','giay_phep_khai_thac','vat_tu','kho'
  ]::text[])
$$;


--
-- Name: _import_has_dependents(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._import_has_dependents(_tbl text, _id uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  r RECORD;
  ex boolean;
BEGIN
  FOR r IN
    SELECT (con.conrelid::regclass)::text AS child_tbl,
           att.attname AS child_col
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
    WHERE con.contype = 'f'
      AND con.confrelid = ('public.' || _tbl)::regclass
      AND array_length(con.conkey, 1) = 1
  LOOP
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %s WHERE %I = $1)', r.child_tbl, r.child_col)
      INTO ex USING _id;
    IF ex THEN RETURN true; END IF;
  END LOOP;
  RETURN false;
END;
$_$;


--
-- Name: _map_trang_thai_tb(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._map_trang_thai_tb(p_key text) RETURNS uuid
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_ma text; v_id uuid;
BEGIN
  v_ma := CASE
    WHEN p_key ILIKE '%hư hỏng%' OR p_key ILIKE '%hỏng%'            THEN 'HONG'
    WHEN p_key ILIKE '%sửa%'                                          THEN 'DANG_SUA_CHUA'
    WHEN p_key ILIKE '%ngừng%' OR p_key ILIKE '%thôi khai thác%'     THEN 'NGUNG_KHAI_THAC'
    WHEN p_key ILIKE '%thanh lý%'                                     THEN 'THANH_LY'
    WHEN p_key ILIKE '%sử dụng%' OR p_key ILIKE '%khai thác%' OR p_key ILIKE '%lắp%' THEN 'DANG_KHAI_THAC'
    ELSE 'CHO_XU_LY'   -- tháo/trong kho/mặc định
  END;
  SELECT id INTO v_id FROM public.dm_trang_thai_thiet_bi WHERE ma = v_ma LIMIT 1;
  RETURN v_id;
END;
$$;


--
-- Name: _mo_gan_lk(uuid, uuid, text, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._mo_gan_lk(p_khe_id uuid, p_lk_id uuid, p_ly_do text, p_hong_hoc_id uuid, p_ghi_chu text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_id uuid; v_cu uuid; v_dang uuid;
BEGIN
  v_dang := public._map_trang_thai_tb('khai thác');
  INSERT INTO public.gan_linh_kien(khe_id, linh_kien_id, ly_do, hong_hoc_id, ghi_chu, nguoi_thuc_hien)
  VALUES (p_khe_id, p_lk_id, p_ly_do, p_hong_hoc_id, p_ghi_chu, public.current_uid())
  RETURNING id INTO v_id;

  SELECT trang_thai_id INTO v_cu FROM public.thiet_bi WHERE id = p_lk_id;
  UPDATE public.thiet_bi SET trang_thai_id = v_dang WHERE id = p_lk_id;
  INSERT INTO public.thiet_bi_vong_doi(thiet_bi_id, tu_trang_thai_id, den_trang_thai_id, thoi_diem, ly_do, nguoi_thuc_hien)
  VALUES (p_lk_id, v_cu, v_dang, now(), 'Lắp linh kiện vào khe', public.current_uid());
  RETURN v_id;
END;
$$;


--
-- Name: _mo_gan_va_vong_doi(uuid, uuid, text, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._mo_gan_va_vong_doi(p_thanh_phan_id uuid, p_thiet_bi_id uuid, p_ly_do text, p_hong_hoc_id uuid, p_ghi_chu text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_id uuid; v_cu uuid; v_dang uuid;
BEGIN
  v_dang := public._map_trang_thai_tb('khai thác');
  INSERT INTO public.gan_chuc_nang(thanh_phan_id, thiet_bi_id, ly_do, hong_hoc_id, ghi_chu, nguoi_thuc_hien)
  VALUES (p_thanh_phan_id, p_thiet_bi_id, p_ly_do, p_hong_hoc_id, p_ghi_chu, public.current_uid())
  RETURNING id INTO v_id;

  SELECT trang_thai_id INTO v_cu FROM public.thiet_bi WHERE id = p_thiet_bi_id;
  UPDATE public.thiet_bi SET trang_thai_id = v_dang WHERE id = p_thiet_bi_id;
  INSERT INTO public.thiet_bi_vong_doi(thiet_bi_id, tu_trang_thai_id, den_trang_thai_id, thoi_diem, ly_do, nguoi_thuc_hien)
  VALUES (p_thiet_bi_id, v_cu, v_dang, now(), 'Lắp vào vị trí chức năng', public.current_uid());
  RETURN v_id;
END;
$$;


--
-- Name: _n6_normalize(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._n6_normalize(_raw text) RETURNS text
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT CASE lower(coalesce(btrim(_raw), ''))
    WHEN '' THEN 'bao_cao'
    WHEN 'moi' THEN 'bao_cao'
    WHEN 'mới' THEN 'bao_cao'
    WHEN 'new' THEN 'bao_cao'
    WHEN 'bao_cao' THEN 'bao_cao'
    WHEN 'tiep_nhan' THEN 'tiep_nhan'
    WHEN 'đã tiếp nhận' THEN 'tiep_nhan'
    WHEN 'dang_xu_ly' THEN 'dang_xu_ly'
    WHEN 'đang xử lý' THEN 'dang_xu_ly'
    WHEN 'in_progress' THEN 'dang_xu_ly'
    WHEN 'cho_vat_tu' THEN 'cho_vat_tu'
    WHEN 'chờ vật tư' THEN 'cho_vat_tu'
    WHEN 'hoan_thanh' THEN 'hoan_thanh'
    WHEN 'hoàn thành xử lý' THEN 'hoan_thanh'
    WHEN 'hoàn thành' THEN 'hoan_thanh'
    WHEN 'da_khac_phuc' THEN 'hoan_thanh'
    WHEN 'đã khắc phục' THEN 'hoan_thanh'
    WHEN 'resolved' THEN 'hoan_thanh'
    WHEN 'nghiem_thu' THEN 'nghiem_thu'
    WHEN 'đã nghiệm thu' THEN 'nghiem_thu'
    WHEN 'dong' THEN 'nghiem_thu'
    WHEN 'đóng' THEN 'nghiem_thu'
    WHEN 'closed' THEN 'nghiem_thu'
    WHEN 'da_dong' THEN 'nghiem_thu'
    WHEN 'huy' THEN 'huy'
    WHEN 'huỷ' THEN 'huy'
    WHEN 'hủy' THEN 'huy'
    WHEN 'cancelled' THEN 'huy'
    ELSE 'bao_cao'
  END;
$$;


--
-- Name: _search_tsv(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._search_tsv(_tieu_de text, _noi_dung text) RETURNS tsvector
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    SET search_path TO 'public', 'pg_catalog'
    AS $$
  SELECT setweight(to_tsvector('simple', public.f_unaccent(coalesce(_tieu_de,''))), 'A')
      || setweight(to_tsvector('simple', public.f_unaccent(coalesce(_noi_dung,''))), 'B');
$$;


--
-- Name: _sync_3lop(uuid, uuid, uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._sync_3lop(p_thanh_phan_id uuid, p_he_thong_id uuid, p_thiet_bi_id uuid, p_ngay date, OUT o_thanh_phan_id uuid, OUT o_he_thong_id uuid, OUT o_thiet_bi_id uuid) RETURNS record
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  v_evt date := COALESCE(p_ngay, CURRENT_DATE);
BEGIN
  o_thanh_phan_id := p_thanh_phan_id;
  o_he_thong_id   := p_he_thong_id;
  o_thiet_bi_id   := p_thiet_bi_id;

  IF o_thanh_phan_id IS NOT NULL THEN
    IF o_he_thong_id IS NULL THEN
      SELECT tp.he_thong_id INTO o_he_thong_id
      FROM public.he_thong_thanh_phan tp WHERE tp.id = o_thanh_phan_id;
    END IF;
    IF o_thiet_bi_id IS NULL THEN
      SELECT g.thiet_bi_id INTO o_thiet_bi_id
      FROM public.gan_chuc_nang g
      WHERE g.thanh_phan_id = o_thanh_phan_id
        AND g.tu_ngay <= v_evt
        AND (g.den_ngay IS NULL OR g.den_ngay >= v_evt)
      ORDER BY g.tu_ngay DESC LIMIT 1;
    END IF;
  ELSIF o_thiet_bi_id IS NOT NULL THEN
    SELECT g.thanh_phan_id INTO o_thanh_phan_id
    FROM public.gan_chuc_nang g
    WHERE g.thiet_bi_id = o_thiet_bi_id
      AND g.tu_ngay <= v_evt
      AND (g.den_ngay IS NULL OR g.den_ngay >= v_evt)
    ORDER BY g.tu_ngay DESC LIMIT 1;
    IF o_thanh_phan_id IS NOT NULL AND o_he_thong_id IS NULL THEN
      SELECT tp.he_thong_id INTO o_he_thong_id
      FROM public.he_thong_thanh_phan tp WHERE tp.id = o_thanh_phan_id;
    END IF;
  END IF;
END;
$$;


--
-- Name: _validate_vi_tri_tuong_thich(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._validate_vi_tri_tuong_thich(p_vi_tri_id uuid, p_thanh_phan_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_vt_ma text;
  v_vt_active boolean;
  v_dv_ma text;
  v_dv_id uuid;
BEGIN
  IF p_vi_tri_id IS NULL THEN RETURN; END IF;

  SELECT ma, active INTO v_vt_ma, v_vt_active
  FROM public.dm_vi_tri WHERE id = p_vi_tri_id;

  IF v_vt_ma IS NULL THEN
    RAISE EXCEPTION 'Vị trí đích không tồn tại' USING ERRCODE = '22023';
  END IF;
  IF v_vt_active IS FALSE THEN
    RAISE EXCEPTION 'Vị trí đích "%" đã ngừng hoạt động', v_vt_ma USING ERRCODE = '22023';
  END IF;

  SELECT ht.don_vi_id, dv.ma
    INTO v_dv_id, v_dv_ma
  FROM public.he_thong_thanh_phan tp
  JOIN public.dm_he_thong ht ON ht.id = tp.he_thong_id
  LEFT JOIN public.dm_don_vi dv ON dv.id = ht.don_vi_id
  WHERE tp.id = p_thanh_phan_id;

  IF v_vt_ma = 'KHO_CONG_TY' THEN RETURN; END IF;

  IF v_dv_ma IS NULL THEN
    RAISE EXCEPTION 'Thành phần chưa xác định đơn vị quản lý; chỉ được chọn KHO_CONG_TY làm vị trí đích'
      USING ERRCODE = '22023';
  END IF;

  IF v_vt_ma = v_dv_ma OR v_vt_ma ILIKE ('%\_' || v_dv_ma) THEN RETURN; END IF;

  RAISE EXCEPTION 'Vị trí "%" không thuộc đơn vị quản lý "%". Vui lòng chọn kho/xưởng của đơn vị này hoặc KHO_CONG_TY.',
    v_vt_ma, v_dv_ma
    USING ERRCODE = '22023';
END;
$$;


--
-- Name: admin_add_column(text, text, text, boolean, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_add_column(_table text, _column text, _type text, _nullable boolean DEFAULT true, _default text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_sql text;
BEGIN
  IF NOT public.has_role(public.current_uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Chỉ admin mới thêm cột được';
  END IF;
  PERFORM public._admin_check_table(_table);
  PERFORM public._admin_check_ident(_column);
  PERFORM public._admin_check_type(_type);

  v_sql := format('ALTER TABLE public.%I ADD COLUMN %I %s', _table, _column, _type);
  IF NOT _nullable THEN v_sql := v_sql || ' NOT NULL'; END IF;
  IF _default IS NOT NULL AND length(trim(_default)) > 0 THEN
    v_sql := v_sql || ' DEFAULT ' || _default;
  END IF;
  EXECUTE v_sql;

  PERFORM public.log_app_event('admin_add_column', _table, _column,
    jsonb_build_object('type', _type, 'nullable', _nullable, 'default', _default));
END;
$$;


--
-- Name: admin_drop_column(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_drop_column(_table text, _column text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.has_role(public.current_uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Chỉ admin mới xoá cột được';
  END IF;
  PERFORM public._admin_check_table(_table);
  PERFORM public._admin_check_ident(_column);
  IF _column IN ('id','created_at','updated_at') THEN
    RAISE EXCEPTION 'Không được xoá cột lõi "%"', _column;
  END IF;
  -- disallow dropping FK columns to avoid breaking relations silently
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema='public' AND tc.table_name=_table
      AND tc.constraint_type IN ('FOREIGN KEY','PRIMARY KEY','UNIQUE')
      AND kcu.column_name=_column
  ) THEN
    RAISE EXCEPTION 'Cột "%" đang tham gia khoá/ràng buộc, không thể xoá trực tiếp', _column;
  END IF;

  EXECUTE format('ALTER TABLE public.%I DROP COLUMN %I', _table, _column);
  PERFORM public.log_app_event('admin_drop_column', _table, _column, '{}'::jsonb);
END;
$$;


--
-- Name: admin_get_audit_retention(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_audit_retention() RETURNS integer
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_days integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT NULLIF(gia_tri, '')::int INTO v_days FROM public.app_cai_dat WHERE khoa = 'audit_retention_days';
  RETURN COALESCE(v_days, 365);
END;
$$;


--
-- Name: admin_import_rows(text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_import_rows(p_table text, p_rows jsonb) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  n integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  IF NOT public._backup_allowed_table(p_table) THEN
    RAISE EXCEPTION 'Table % is not allowed for import', p_table;
  END IF;
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) = 0 THEN
    RETURN 0;
  END IF;

  -- Bypass triggers/FK checks in this transaction only
  PERFORM set_config('session_replication_role', 'replica', true);

  EXECUTE format(
    'INSERT INTO public.%1$I SELECT * FROM jsonb_populate_recordset(NULL::public.%1$I, $1) ON CONFLICT DO NOTHING',
    p_table
  ) USING p_rows;
  GET DIAGNOSTICS n = ROW_COUNT;

  RETURN n;
END;
$_$;


--
-- Name: admin_list_backup_tables(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_list_backup_tables() RETURNS TABLE(table_name text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT c.relname::text
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
    AND c.relname NOT IN ('backup_lich_su')
  ORDER BY c.relname;
$$;


--
-- Name: admin_list_schema(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_list_schema() RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_tables jsonb;
  v_fks jsonb;
BEGIN
  IF NOT public.has_role(public.current_uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Chỉ admin mới xem được lược đồ';
  END IF;

  SELECT jsonb_agg(t ORDER BY t->>'table_name') INTO v_tables FROM (
    SELECT jsonb_build_object(
      'table_name', c.table_name,
      'columns', (
        SELECT jsonb_agg(jsonb_build_object(
          'name', col.column_name,
          'type', col.data_type,
          'udt', col.udt_name,
          'nullable', (col.is_nullable = 'YES'),
          'default', col.column_default,
          'position', col.ordinal_position,
          'is_pk', EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            WHERE tc.table_schema='public' AND tc.table_name=c.table_name
              AND tc.constraint_type='PRIMARY KEY' AND kcu.column_name=col.column_name
          )
        ) ORDER BY col.ordinal_position)
        FROM information_schema.columns col
        WHERE col.table_schema='public' AND col.table_name=c.table_name
      )
    ) AS t
    FROM information_schema.tables c
    WHERE c.table_schema='public'
      AND c.table_type='BASE TABLE'
  ) s;

  SELECT jsonb_agg(jsonb_build_object(
    'from_table', tc.table_name,
    'from_column', kcu.column_name,
    'to_table', ccu.table_name,
    'to_column', ccu.column_name,
    'constraint', tc.constraint_name
  )) INTO v_fks
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type='FOREIGN KEY'
    AND tc.table_schema='public';

  RETURN jsonb_build_object('tables', COALESCE(v_tables,'[]'::jsonb), 'foreign_keys', COALESCE(v_fks,'[]'::jsonb));
END;
$$;


--
-- Name: admin_rename_column(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_rename_column(_table text, _old text, _new text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.has_role(public.current_uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Chỉ admin mới đổi tên cột được';
  END IF;
  PERFORM public._admin_check_table(_table);
  PERFORM public._admin_check_ident(_old);
  PERFORM public._admin_check_ident(_new);
  IF _old IN ('id','created_at','updated_at') THEN
    RAISE EXCEPTION 'Không được đổi tên cột lõi "%"', _old;
  END IF;

  EXECUTE format('ALTER TABLE public.%I RENAME COLUMN %I TO %I', _table, _old, _new);
  PERFORM public.log_app_event('admin_rename_column', _table, _old,
    jsonb_build_object('new', _new));
END;
$$;


--
-- Name: admin_reset_sequences(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_reset_sequences() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  r record;
  cnt integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  FOR r IN
    SELECT
      n.nspname || '.' || c.relname                             AS seq_fqname,
      (dep.refobjid::regclass)::text                            AS tbl_fqname,
      a.attname                                                 AS col_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_depend dep  ON dep.objid = c.oid AND dep.deptype = 'a'
    JOIN pg_attribute a ON a.attrelid = dep.refobjid AND a.attnum = dep.refobjsubid
    WHERE c.relkind = 'S' AND n.nspname = 'public'
  LOOP
    EXECUTE format(
      'SELECT setval(%L, GREATEST(COALESCE((SELECT MAX(%I) FROM %s), 0), 1), true)',
      r.seq_fqname, r.col_name, r.tbl_fqname
    );
    cnt := cnt + 1;
  END LOOP;

  RETURN cnt;
END;
$$;


--
-- Name: admin_restore_database(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_restore_database(payload jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
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
  IF NOT public.has_role(public.current_uid(), 'admin') THEN
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
$_$;


--
-- Name: admin_rollback_audit(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_rollback_audit(_audit_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_row public.audit_log;
  v_table text;
  v_old jsonb;
  v_new jsonb;
  v_id text;
  v_set text;
  v_result text;
BEGIN
  IF NOT public.has_role(public.current_uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Chỉ admin mới được hoàn tác dữ liệu';
  END IF;

  SELECT * INTO v_row FROM public.audit_log WHERE id = _audit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy bản ghi nhật ký';
  END IF;

  v_table := v_row.entity;
  IF v_table IS NULL OR v_table !~ '^[a-z_][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Tên bảng không hợp lệ';
  END IF;

  -- only business tables can be rolled back
  IF NOT (v_table ~ '^(dm_|thiet_bi|giay_phep|form_|cay_node_edit|so_do|du_an|notifications)') THEN
    RAISE EXCEPTION 'Không hỗ trợ hoàn tác cho bảng "%"', v_table;
  END IF;
  IF v_table IN ('audit_log','profiles','user_roles') THEN
    RAISE EXCEPTION 'Không được hoàn tác bảng hệ thống "%"', v_table;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name=v_table AND table_type='BASE TABLE'
  ) THEN
    RAISE EXCEPTION 'Bảng "%" không tồn tại', v_table;
  END IF;

  v_old := v_row.detail->'old';
  v_new := v_row.detail->'new';

  IF v_row.action LIKE 'update\_%' THEN
    IF v_old IS NULL OR v_old->>'id' IS NULL THEN
      RAISE EXCEPTION 'Không có dữ liệu cũ để khôi phục';
    END IF;
    v_id := v_old->>'id';

    SELECT string_agg(format('%I = s.%I', c.column_name, c.column_name), ', ')
    INTO v_set
    FROM information_schema.columns c
    WHERE c.table_schema='public' AND c.table_name=v_table
      AND c.column_name <> 'id';

    EXECUTE format(
      'UPDATE public.%I AS t SET %s FROM (SELECT * FROM jsonb_populate_record(NULL::public.%I, $1)) AS s WHERE t.id = $2',
      v_table, v_set, v_table
    ) USING v_old, v_id;
    v_result := 'restored_update';

  ELSIF v_row.action LIKE 'delete\_%' THEN
    IF v_old IS NULL OR v_old->>'id' IS NULL THEN
      RAISE EXCEPTION 'Không có dữ liệu cũ để khôi phục';
    END IF;
    v_id := v_old->>'id';
    IF EXISTS (SELECT 1 FROM public.audit_log WHERE 1=0) THEN NULL; END IF;

    EXECUTE format(
      'INSERT INTO public.%I SELECT * FROM jsonb_populate_record(NULL::public.%I, $1) ON CONFLICT (id) DO NOTHING',
      v_table, v_table
    ) USING v_old;
    v_result := 'restored_delete';

  ELSIF v_row.action LIKE 'insert\_%' THEN
    IF v_new IS NULL OR v_new->>'id' IS NULL THEN
      RAISE EXCEPTION 'Không có dữ liệu để hoàn tác';
    END IF;
    v_id := v_new->>'id';
    EXECUTE format('DELETE FROM public.%I WHERE id = $1', v_table) USING v_id;
    v_result := 'undo_insert';

  ELSE
    RAISE EXCEPTION 'Hành động "%" không thể hoàn tác', v_row.action;
  END IF;

  PERFORM public.log_app_event('rollback_audit', v_table, v_id,
    jsonb_build_object('audit_id', _audit_id, 'original_action', v_row.action, 'result', v_result));

  RETURN jsonb_build_object('ok', true, 'table', v_table, 'id', v_id, 'result', v_result);
END;
$_$;


--
-- Name: admin_set_audit_retention(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_set_audit_retention(_days integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF _days IS NULL OR _days < 30 OR _days > 3650 THEN
    RAISE EXCEPTION 'audit_retention_days phải trong khoảng 30..3650';
  END IF;
  INSERT INTO public.app_cai_dat(khoa, gia_tri, updated_by, updated_at)
  VALUES ('audit_retention_days', _days::text, auth.uid(), now())
  ON CONFLICT (khoa) DO UPDATE SET gia_tri = EXCLUDED.gia_tri, updated_by = EXCLUDED.updated_by, updated_at = now();
  RETURN _days;
END;
$$;


--
-- Name: agent_add_bao_tri(text, text, text, text, text, text, date, date, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.agent_add_bao_tri(p_he_thong text, p_mo_ta_cong_viec text, p_thiet_bi text DEFAULT NULL::text, p_don_vi text DEFAULT NULL::text, p_loai_bao_tri text DEFAULT NULL::text, p_ke_hoach text DEFAULT NULL::text, p_ngay_bat_dau date DEFAULT NULL::date, p_ngay_hoan_thanh date DEFAULT NULL::date, p_ket_qua text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Bạn không có quyền ghi dữ liệu bảo dưỡng';
  END IF;
  IF p_he_thong IS NULL OR length(btrim(p_he_thong)) = 0 THEN
    RAISE EXCEPTION 'Trường hệ thống là bắt buộc';
  END IF;
  IF p_mo_ta_cong_viec IS NULL OR length(btrim(p_mo_ta_cong_viec)) = 0 THEN
    RAISE EXCEPTION 'Trường mô tả công việc là bắt buộc';
  END IF;

  INSERT INTO public.bao_tri (he_thong, mo_ta_cong_viec, thiet_bi, don_vi, loai_bao_tri,
                              ke_hoach, ngay_bat_dau, ngay_hoan_thanh, ket_qua, created_by)
  VALUES (btrim(p_he_thong), btrim(p_mo_ta_cong_viec), p_thiet_bi, p_don_vi, p_loai_bao_tri,
          p_ke_hoach, p_ngay_bat_dau, p_ngay_hoan_thanh, p_ket_qua, public.current_uid())
  RETURNING id INTO v_id;

  PERFORM public.log_app_event('agent_add_bao_tri', 'bao_tri', v_id::text,
    jsonb_build_object('he_thong', p_he_thong, 'via', 'ai_agent'));
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END; $$;


--
-- Name: agent_add_hong_hoc(text, text, text, date, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.agent_add_hong_hoc(p_thiet_bi_hong text, p_mo_ta_hong_hoc text, p_su_co text DEFAULT NULL::text, p_ngay_hong date DEFAULT NULL::date, p_bo_phan_hong text DEFAULT NULL::text, p_phuong_an text DEFAULT NULL::text, p_thiet_bi_thay_the text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Bạn không có quyền ghi dữ liệu hỏng hóc';
  END IF;
  IF p_thiet_bi_hong IS NULL OR length(btrim(p_thiet_bi_hong)) = 0 THEN
    RAISE EXCEPTION 'Trường thiết bị hỏng là bắt buộc';
  END IF;
  IF p_mo_ta_hong_hoc IS NULL OR length(btrim(p_mo_ta_hong_hoc)) = 0 THEN
    RAISE EXCEPTION 'Trường mô tả hỏng hóc là bắt buộc';
  END IF;

  INSERT INTO public.hong_hoc (thiet_bi_hong, mo_ta_hong_hoc, su_co, ngay_hong,
                               bo_phan_hong, phuong_an, thiet_bi_thay_the, created_by)
  VALUES (btrim(p_thiet_bi_hong), btrim(p_mo_ta_hong_hoc), p_su_co,
          COALESCE(p_ngay_hong, current_date), p_bo_phan_hong, p_phuong_an, p_thiet_bi_thay_the, public.current_uid())
  RETURNING id INTO v_id;

  PERFORM public.log_app_event('agent_add_hong_hoc', 'hong_hoc', v_id::text,
    jsonb_build_object('thiet_bi_hong', p_thiet_bi_hong, 'via', 'ai_agent'));
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END; $$;


--
-- Name: agent_add_kiem_ke(uuid, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.agent_add_kiem_ke(p_thiet_bi_id uuid, p_tinh_trang text, p_nguoi_kiem text DEFAULT NULL::text, p_ghi_chu text DEFAULT NULL::text, p_vi_tri_gps text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Bạn không có quyền ghi dữ liệu kiểm kê';
  END IF;
  IF p_thiet_bi_id IS NULL THEN
    RAISE EXCEPTION 'Thiếu id thiết bị';
  END IF;
  IF p_tinh_trang IS NULL OR length(btrim(p_tinh_trang)) = 0 THEN
    RAISE EXCEPTION 'Trường tình trạng là bắt buộc';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.thiet_bi WHERE id = p_thiet_bi_id) THEN
    RAISE EXCEPTION 'Không tìm thấy thiết bị với id đã cho';
  END IF;

  INSERT INTO public.kiem_ke (thiet_bi_id, tinh_trang, nguoi_kiem, ghi_chu, vi_tri_gps, thoi_diem, created_by)
  VALUES (p_thiet_bi_id, btrim(p_tinh_trang), p_nguoi_kiem, p_ghi_chu, p_vi_tri_gps, now(), public.current_uid())
  RETURNING id INTO v_id;

  PERFORM public.log_app_event('agent_add_kiem_ke', 'kiem_ke', v_id::text,
    jsonb_build_object('thiet_bi_id', p_thiet_bi_id, 'via', 'ai_agent'));
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END; $$;


--
-- Name: agent_add_su_co(text, text, text, text, text, date, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.agent_add_su_co(p_he_thong text, p_hien_tuong text, p_thiet_bi text DEFAULT NULL::text, p_don_vi text DEFAULT NULL::text, p_muc_do text DEFAULT NULL::text, p_ngay_phat_hien date DEFAULT NULL::date, p_nguoi_bao_cao text DEFAULT NULL::text, p_nguyen_nhan text DEFAULT NULL::text, p_bien_phap_xu_ly text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Bạn không có quyền ghi dữ liệu sự cố';
  END IF;
  IF p_he_thong IS NULL OR length(btrim(p_he_thong)) = 0 THEN
    RAISE EXCEPTION 'Trường hệ thống là bắt buộc';
  END IF;
  IF p_hien_tuong IS NULL OR length(btrim(p_hien_tuong)) = 0 THEN
    RAISE EXCEPTION 'Trường hiện tượng là bắt buộc';
  END IF;

  INSERT INTO public.su_co (he_thong, hien_tuong, thiet_bi, don_vi, muc_do,
                            ngay_phat_hien, nguoi_bao_cao, nguyen_nhan, bien_phap_xu_ly, created_by)
  VALUES (btrim(p_he_thong), btrim(p_hien_tuong), p_thiet_bi, p_don_vi, p_muc_do,
          COALESCE(p_ngay_phat_hien, current_date), p_nguoi_bao_cao, p_nguyen_nhan, p_bien_phap_xu_ly, public.current_uid())
  RETURNING id INTO v_id;

  PERFORM public.log_app_event('agent_add_su_co', 'su_co', v_id::text,
    jsonb_build_object('he_thong', p_he_thong, 'via', 'ai_agent'));
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END; $$;


--
-- Name: ai_describe_schema(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ai_describe_schema() RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH cols AS (
    SELECT
      c.table_name,
      jsonb_agg(jsonb_build_object(
        'name', c.column_name,
        'type', c.data_type,
        'udt', c.udt_name,
        'nullable', (c.is_nullable = 'YES')
      ) ORDER BY c.ordinal_position) AS columns
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND (c.table_name ~ '^(dm_|thiet_bi|giay_phep|form_)'
           OR c.table_name IN ('profiles','user_roles','tickets','ticket_comment',
                               'notifications','conversations','messages',
                               'conversation_participant'))
    GROUP BY c.table_name
  ),
  fks AS (
    SELECT jsonb_agg(jsonb_build_object(
      'from_table', tc.table_name,
      'from_column', kcu.column_name,
      'to_table', ccu.table_name,
      'to_column', ccu.column_name
    )) AS list
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
  )
  SELECT jsonb_build_object(
    'tables', COALESCE((SELECT jsonb_agg(jsonb_build_object('table_name', table_name, 'columns', columns) ORDER BY table_name) FROM cols), '[]'::jsonb),
    'foreign_keys', COALESCE((SELECT list FROM fks), '[]'::jsonb)
  );
$$;


--
-- Name: ai_run_select(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ai_run_select(_sql text, _max_rows integer DEFAULT 100) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_sql text := btrim(_sql);
  v_lower text;
  v_scan text;                 -- bản đã loại literal/định danh để quét từ khoá & ';'
  v_limit int := LEAST(GREATEST(COALESCE(_max_rows, 100), 1), 500);
  v_result jsonb;
BEGIN
  IF v_sql IS NULL OR length(v_sql) = 0 THEN
    RAISE EXCEPTION 'SQL trống';
  END IF;

  -- Bỏ dấu chấm phẩy ở cuối câu (một câu SELECT kết thúc bằng ';' vẫn hợp lệ)
  v_sql := rtrim(v_sql, ';');
  v_lower := lower(v_sql);

  -- Loại literal chuỗi '...' và định danh trích dẫn "..." TRƯỚC KHI quét,
  -- để không chặn oan các ký tự/từ thường nằm trong dữ liệu
  -- (vd: ILIKE '%a;b%' hay ILIKE '%delete%').
  v_scan := regexp_replace(v_lower, '''(''''|[^''])*''', ' ', 'g');
  v_scan := regexp_replace(v_scan, '"[^"]*"', ' ', 'g');

  -- Chỉ cho phép 1 câu lệnh: sau khi đã loại literal, không còn ';' nào ở giữa
  IF position(';' IN v_scan) > 0 THEN
    RAISE EXCEPTION 'Chỉ cho phép 1 câu lệnh duy nhất';
  END IF;

  -- Bắt buộc bắt đầu bằng SELECT hoặc WITH
  IF v_lower !~ '^(select|with)\s' THEN
    RAISE EXCEPTION 'Chỉ cho phép SELECT/WITH';
  END IF;

  -- Chặn từ khoá GHI / nguy hiểm thực sự. An toàn còn được đảm bảo bởi:
  -- ép prefix SELECT/WITH + 1 câu lệnh + SECURITY INVOKER (RLS) + LIMIT cưỡng bức.
  IF v_scan ~* '\y(insert|update|delete|drop|alter|truncate|grant|revoke|copy|call|vacuum|reindex|refresh|lock|listen|notify|prepare|execute|deallocate|dblink|pg_sleep|pg_read_file|pg_ls_dir|pg_reload_conf)\y' THEN
    RAISE EXCEPTION 'Câu lệnh chứa từ khoá không được phép';
  END IF;

  -- Bọc LIMIT để tránh kết quả quá lớn
  EXECUTE format('SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM (SELECT * FROM (%s) _q LIMIT %s) t', v_sql, v_limit)
    INTO v_result;
  RETURN jsonb_build_object('rows', v_result, 'row_limit', v_limit);
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;


--
-- Name: apply_import_batch(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.apply_import_batch(_batch_id uuid, _limit integer DEFAULT NULL::integer) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  _uid uuid := public.current_uid();
  it RECORD;
  _tbl text;
  _cols text;
  _assigns text;
  _before jsonb;
  _after jsonb;
  _new_id uuid;
  _created int := 0; _updated int := 0; _retired int := 0; _kept int := 0;
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden: chỉ Admin được áp dụng lô nhập';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.import_batch WHERE id = _batch_id) THEN
    RAISE EXCEPTION 'Không tìm thấy lô nhập %', _batch_id;
  END IF;

  FOR it IN
    SELECT * FROM public.import_item
    WHERE batch_id = _batch_id
      AND status = 'valid'
      AND applied_at IS NULL
      AND action IN ('create','update','retire','keep')
    ORDER BY sheet NULLS FIRST, row_index
    LIMIT _limit
  LOOP
    _tbl := COALESCE(it.target_table, it.cat_table, it.entity);

    -- KEEP: không ghi, chỉ ghi nhận ảnh chụp hiện tại.
    IF it.action = 'keep' THEN
      _before := NULL;
      IF it.target_id IS NOT NULL THEN
        EXECUTE format('SELECT to_jsonb(t.*) FROM public.%I t WHERE t.id = $1', _tbl)
          INTO _before USING it.target_id;
      END IF;
      UPDATE public.import_item
        SET target_table = _tbl, before_snapshot = _before, after_snapshot = _before,
            applied_at = now(), status = 'committed'
        WHERE id = it.id;
      _kept := _kept + 1;
      CONTINUE;
    END IF;

    IF NOT public._import_allowed_table(_tbl) THEN
      RAISE EXCEPTION 'Bảng đích không được phép áp dụng: %', _tbl;
    END IF;
    IF it.normalized_row IS NULL THEN
      RAISE EXCEPTION 'Dòng % thiếu dữ liệu chuẩn hoá (normalized_row)', it.row_index;
    END IF;

    IF it.action = 'create' THEN
      SELECT string_agg(quote_ident(k), ', ') INTO _cols
      FROM jsonb_object_keys(it.normalized_row) k
      WHERE EXISTS (SELECT 1 FROM information_schema.columns c
                    WHERE c.table_schema='public' AND c.table_name=_tbl AND c.column_name=k);
      IF _cols IS NULL THEN
        RAISE EXCEPTION 'Dòng %: không có cột hợp lệ để tạo', it.row_index;
      END IF;
      EXECUTE format(
        'INSERT INTO public.%1$I (%2$s) SELECT %2$s FROM jsonb_populate_record(null::public.%1$I, $1) RETURNING id, to_jsonb(%1$I.*)',
        _tbl, _cols
      ) USING it.normalized_row INTO _new_id, _after;

      UPDATE public.import_item
        SET target_table = _tbl, target_id = _new_id, before_snapshot = NULL,
            after_snapshot = _after, applied_at = now(), status = 'committed'
        WHERE id = it.id;
      INSERT INTO public.audit_log(user_id, action, entity, entity_id, detail)
        VALUES (_uid, 'import_apply_create', _tbl, _new_id::text,
                jsonb_build_object('batch_id', _batch_id, 'item_id', it.id));
      _created := _created + 1;

    ELSE  -- update / retire (retire = cập nhật, KHÔNG xóa cứng)
      IF it.target_id IS NULL THEN
        RAISE EXCEPTION 'Dòng % (%): thiếu target_id', it.row_index, it.action;
      END IF;
      EXECUTE format('SELECT to_jsonb(t.*) FROM public.%I t WHERE t.id = $1', _tbl)
        INTO _before USING it.target_id;
      IF _before IS NULL THEN
        RAISE EXCEPTION 'Dòng %: không tìm thấy bản ghi đích % trong %', it.row_index, it.target_id, _tbl;
      END IF;

      SELECT string_agg(quote_ident(k) || ' = s.' || quote_ident(k), ', ') INTO _assigns
      FROM jsonb_object_keys(it.normalized_row) k
      WHERE k NOT IN ('id','created_at')
        AND EXISTS (SELECT 1 FROM information_schema.columns c
                    WHERE c.table_schema='public' AND c.table_name=_tbl AND c.column_name=k);
      IF _assigns IS NULL THEN
        RAISE EXCEPTION 'Dòng %: không có cột hợp lệ để cập nhật', it.row_index;
      END IF;
      EXECUTE format(
        'UPDATE public.%1$I AS t SET %2$s FROM jsonb_populate_record(null::public.%1$I, $1) s WHERE t.id = $2 RETURNING to_jsonb(t.*)',
        _tbl, _assigns
      ) USING it.normalized_row, it.target_id INTO _after;

      UPDATE public.import_item
        SET target_table = _tbl, before_snapshot = _before, after_snapshot = _after,
            applied_at = now(), status = 'committed'
        WHERE id = it.id;
      INSERT INTO public.audit_log(user_id, action, entity, entity_id, detail)
        VALUES (_uid, 'import_apply_' || it.action, _tbl, it.target_id::text,
                jsonb_build_object('batch_id', _batch_id, 'item_id', it.id));
      IF it.action = 'retire' THEN _retired := _retired + 1; ELSE _updated := _updated + 1; END IF;
    END IF;
  END LOOP;

  UPDATE public.import_batch
    SET status = 'committed',
        applied_at = COALESCE(applied_at, now()),
        summary = summary || jsonb_build_object(
          'applied', jsonb_build_object('created',_created,'updated',_updated,'retired',_retired,'kept',_kept))
    WHERE id = _batch_id;

  RETURN jsonb_build_object('ok', true, 'created',_created,'updated',_updated,'retired',_retired,'kept',_kept);
END;
$_$;


--
-- Name: approve_change_request(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.approve_change_request(p_id uuid, p_ly_do text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.change_request%ROWTYPE;
  v_pl  jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE='28000'; END IF;
  IF NOT public.has_role(v_uid,'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE='42501';
  END IF;

  SELECT * INTO v_row FROM public.change_request WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  IF v_row.nguoi_tao = v_uid THEN RAISE EXCEPTION 'self_approve_forbidden' USING ERRCODE='42501'; END IF;
  IF v_row.trang_thai <> 'pending' THEN RAISE EXCEPTION 'invalid_state' USING ERRCODE='22023'; END IF;

  v_pl := v_row.payload;

  BEGIN
    -- Dispatch theo loai. Các nhánh chưa hỗ trợ → RAISE để rơi vào EXCEPTION dưới.
    IF v_row.loai = 'danh_muc.merge' THEN
      PERFORM public.merge_danh_muc(
        (v_pl->>'entity')::text,
        (v_pl->>'keep_id')::uuid,
        (v_pl->>'drop_id')::uuid,
        p_ly_do
      );

    ELSIF v_row.loai = 'danh_muc.deactivate' THEN
      EXECUTE format('UPDATE public.%I SET active = false WHERE id = $1', v_pl->>'entity')
        USING (v_pl->>'id')::uuid;

    ELSIF v_row.loai = 'role.grant' THEN
      INSERT INTO public.user_roles(user_id, role)
      VALUES ((v_pl->>'user_id')::uuid, (v_pl->>'role')::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;

    ELSIF v_row.loai = 'role.revoke' THEN
      DELETE FROM public.user_roles
       WHERE user_id = (v_pl->>'user_id')::uuid
         AND role = (v_pl->>'role')::app_role;

    ELSIF v_row.loai = 'thiet_bi.change_don_vi' THEN
      UPDATE public.thiet_bi
         SET don_vi_id = (v_pl->>'to_don_vi_id')::uuid
       WHERE id = (v_pl->>'thiet_bi_id')::uuid;

    ELSIF v_row.loai = 'he_thong.change_nhom' THEN
      UPDATE public.dm_he_thong
         SET nhom_he_thong_id = (v_pl->>'to_nhom_id')::uuid
       WHERE id = (v_pl->>'he_thong_id')::uuid;

    ELSIF v_row.loai = 'he_thong.change_don_vi' THEN
      UPDATE public.dm_he_thong
         SET don_vi_id = (v_pl->>'to_don_vi_id')::uuid
       WHERE id = (v_pl->>'he_thong_id')::uuid;

    ELSE
      RAISE EXCEPTION 'loai_not_supported: %', v_row.loai USING ERRCODE='0A000';
    END IF;

    UPDATE public.change_request
       SET trang_thai='approved',
           ly_do = NULLIF(btrim(coalesce(p_ly_do,'')),''),
           resolved_by=v_uid, resolved_at=now()
     WHERE id = p_id;

    RETURN p_id;

  EXCEPTION WHEN OTHERS THEN
    UPDATE public.change_request
       SET trang_thai='applied_failed',
           ly_do = NULLIF(btrim(coalesce(p_ly_do,'')),''),
           resolved_by=v_uid, resolved_at=now(),
           error_message = SQLERRM
     WHERE id = p_id;
    RAISE;
  END;
END $_$;


--
-- Name: audit_row_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_row_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_user uuid := public.current_uid();
  v_entity_id text;
  v_detail jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_entity_id := (to_jsonb(OLD)->>'id');
    v_detail := jsonb_build_object('old', to_jsonb(OLD));
  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_id := (to_jsonb(NEW)->>'id');
    v_detail := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSE
    v_entity_id := (to_jsonb(NEW)->>'id');
    v_detail := jsonb_build_object('new', to_jsonb(NEW));
  END IF;

  INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
  VALUES (v_user, lower(TG_OP) || '_' || TG_TABLE_NAME, TG_TABLE_NAME, v_entity_id, v_detail);

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;


--
-- Name: backup_schema_json(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.backup_schema_json() RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_tables jsonb;
  v_fks jsonb;
BEGIN
  IF NOT (public.current_role() = 'service_role' OR public.has_role(public.current_uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Không có quyền xem lược đồ';
  END IF;

  SELECT jsonb_agg(t ORDER BY t->>'table_name') INTO v_tables FROM (
    SELECT jsonb_build_object(
      'table_name', c.table_name,
      'columns', (
        SELECT jsonb_agg(jsonb_build_object(
          'name', col.column_name,
          'type', col.data_type,
          'udt', col.udt_name,
          'nullable', (col.is_nullable = 'YES'),
          'default', col.column_default,
          'position', col.ordinal_position,
          'is_pk', EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            WHERE tc.table_schema='public' AND tc.table_name=c.table_name
              AND tc.constraint_type='PRIMARY KEY' AND kcu.column_name=col.column_name
          )
        ) ORDER BY col.ordinal_position)
        FROM information_schema.columns col
        WHERE col.table_schema='public' AND col.table_name=c.table_name
      )
    ) AS t
    FROM information_schema.tables c
    WHERE c.table_schema='public' AND c.table_type='BASE TABLE'
  ) s;

  SELECT jsonb_agg(jsonb_build_object(
    'from_table', tc.table_name,
    'from_column', kcu.column_name,
    'to_table', ccu.table_name,
    'to_column', ccu.column_name,
    'constraint', tc.constraint_name
  )) INTO v_fks
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public';

  RETURN jsonb_build_object('tables', COALESCE(v_tables,'[]'::jsonb), 'foreign_keys', COALESCE(v_fks,'[]'::jsonb));
END;
$$;


--
-- Name: can_access_du_an(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_du_an(_du_an_id uuid, _user uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    public.has_role(_user, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.du_an d
      WHERE d.id = _du_an_id
        AND (d.quan_ly_id = _user OR d.nguoi_tao_id = _user)
    )
    OR EXISTS (
      SELECT 1 FROM public.du_an_cong_viec c
      WHERE c.du_an_id = _du_an_id
        AND (c.nguoi_xu_ly_chinh = _user OR c.created_by = _user)
    )
    OR EXISTS (
      SELECT 1 FROM public.du_an_cong_viec_phoi_hop ph
      JOIN public.du_an_cong_viec c ON c.id = ph.cong_viec_id
      WHERE c.du_an_id = _du_an_id AND ph.user_id = _user
    );
$$;


--
-- Name: can_access_so_do(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_so_do(_so_do_id uuid, _user uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
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


--
-- Name: can_access_ticket(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_ticket(_ticket_id uuid, _user uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = _ticket_id
      AND (t.created_by = _user OR t.assigned_to = _user OR public.has_role(_user, 'admin'::app_role))
  )
$$;


--
-- Name: can_edit_cong_viec(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_edit_cong_viec(_cv_id uuid, _user uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    public.has_role(_user, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.du_an_cong_viec c
      JOIN public.du_an d ON d.id = c.du_an_id
      WHERE c.id = _cv_id
        AND (d.quan_ly_id = _user OR c.nguoi_xu_ly_chinh = _user OR c.created_by = _user)
    )
    OR EXISTS (
      SELECT 1 FROM public.du_an_cong_viec_phoi_hop ph
      WHERE ph.cong_viec_id = _cv_id AND ph.user_id = _user
    );
$$;


--
-- Name: can_manage_du_an(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_manage_du_an(_du_an_id uuid, _user uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_role(_user, 'admin'::app_role)
      OR EXISTS (SELECT 1 FROM public.du_an d WHERE d.id = _du_an_id AND d.quan_ly_id = _user);
$$;


--
-- Name: can_manage_equipment(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_manage_equipment(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
      OR public.has_role(_user_id, 'phong_kt'::app_role)
$$;


--
-- Name: can_view_import_batch(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_import_batch(_batch_id uuid, _user uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.import_batch b
    WHERE b.id = _batch_id
      AND (b.created_by = _user OR public.has_role(_user, 'admin'))
  )
$$;


--
-- Name: can_view_thiet_bi(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_thiet_bi(_id uuid, _user uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.thiet_bi t
    WHERE t.id = _id
      AND (
        public.can_manage_equipment(_user)
        OR t.don_vi_quan_ly_id = public.get_user_don_vi_id(_user)
        OR t.don_vi_id = public.get_user_don_vi_id(_user)
      )
  )
$$;


--
-- Name: can_view_thiet_bi_ma(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_thiet_bi_ma(_ma text, _user uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1
    from public.thiet_bi t
    where t.ma_thiet_bi = _ma
      and (
        public.can_manage_equipment(_user)
        or (t.don_vi_quan_ly_id is not distinct from public.get_user_don_vi_id(_user))
        or (t.don_vi_id is not distinct from public.get_user_don_vi_id(_user))
      )
  )
$$;


--
-- Name: cancel_change_request(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cancel_change_request(p_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.change_request%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.change_request WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  IF v_row.nguoi_tao <> v_uid THEN RAISE EXCEPTION 'not_authorized' USING ERRCODE='42501'; END IF;
  IF v_row.trang_thai <> 'pending' THEN RAISE EXCEPTION 'invalid_state' USING ERRCODE='22023'; END IF;

  UPDATE public.change_request
     SET trang_thai='cancelled', resolved_by=v_uid, resolved_at=now()
   WHERE id = p_id;
END $$;


--
-- Name: f_unaccent(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.f_unaccent(text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
    SET search_path TO 'public', 'pg_catalog'
    AS $_$ SELECT public.unaccent('public.unaccent', $1) $_$;


SET default_table_access_method = heap;

--
-- Name: thiet_bi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thiet_bi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_thiet_bi text NOT NULL,
    ten_thiet_bi text NOT NULL,
    loai_thiet_bi_id uuid,
    ma_serial text,
    model text,
    nha_san_xuat text,
    ngay_mua date,
    he_thong_id uuid,
    nhom_he_thong_id uuid,
    nha_cung_cap text,
    han_bao_hanh date,
    trang_thai_id uuid,
    don_vi_quan_ly_id uuid,
    vi_tri text,
    ghi_chu text,
    file_tai_lieu text,
    hinh_anh text,
    qr_code text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    nha_san_xuat_id uuid,
    nha_cung_cap_id uuid,
    vi_tri_id uuid,
    search_text text GENERATED ALWAYS AS (public.f_unaccent(((((((((((((((COALESCE(ma_thiet_bi, ''::text) || ' '::text) || COALESCE(ten_thiet_bi, ''::text)) || ' '::text) || COALESCE(ma_serial, ''::text)) || ' '::text) || COALESCE(model, ''::text)) || ' '::text) || COALESCE(nha_san_xuat, ''::text)) || ' '::text) || COALESCE(nha_cung_cap, ''::text)) || ' '::text) || COALESCE(vi_tri, ''::text)) || ' '::text) || COALESCE(ghi_chu, ''::text)))) STORED,
    search_tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, public.f_unaccent(((((((((((((((COALESCE(ma_thiet_bi, ''::text) || ' '::text) || COALESCE(ten_thiet_bi, ''::text)) || ' '::text) || COALESCE(ma_serial, ''::text)) || ' '::text) || COALESCE(model, ''::text)) || ' '::text) || COALESCE(nha_san_xuat, ''::text)) || ' '::text) || COALESCE(nha_cung_cap, ''::text)) || ' '::text) || COALESCE(vi_tri, ''::text)) || ' '::text) || COALESCE(ghi_chu, ''::text))))) STORED,
    thanh_phan text,
    p_n text,
    nam_san_xuat integer,
    nam_dua_vao_khai_thac integer,
    don_vi_id uuid,
    danh_gia_nien_han_id uuid,
    phan_loai text,
    noi_quan_ly text,
    giay_phep_khai_thac text,
    giay_phep_tan_so text,
    so_nam_su_dung integer,
    ty_le_tuoi_tho numeric(6,3),
    vat_tu_du_phong text,
    thong_ke_hong_hoc text,
    de_xuat_phuong_an text,
    de_xuat_tiep_tuc text,
    de_xuat_khac text,
    thoi_diem_dieu_chuyen text,
    noi_chuyen_di text,
    noi_chuyen_den text,
    ly_do_dieu_chuyen text,
    thoi_diem_cham_dut text,
    quyet_dinh_cham_dut text,
    noi_cat_giu text,
    do_tin_cay text,
    nguon_du_lieu text,
    ma_tai_san_bravo text,
    nguoi_giu text,
    don_vi_giu_id uuid,
    ngay_cap_phat timestamp with time zone,
    trang_thai_cap_phat text DEFAULT 'san_sang'::text NOT NULL,
    ngay_kiem_ke_ke_tiep date,
    phan_loai_id uuid,
    ngay_bao_tri_gan_nhat date,
    ngay_bao_tri_ke_tiep date,
    tinh_trang_ky_thuat text,
    la_linh_kien boolean DEFAULT false NOT NULL,
    ma_thiet_bi_cu text,
    model_id uuid,
    attrs jsonb DEFAULT '{}'::jsonb NOT NULL,
    che_do_kd_hc text DEFAULT 'KHONG'::text NOT NULL,
    field_set_id uuid,
    CONSTRAINT thiet_bi_che_do_kd_hc_chk CHECK ((che_do_kd_hc = ANY (ARRAY['KHONG'::text, 'KIEM_DINH'::text, 'HIEU_CHUAN'::text])))
);

ALTER TABLE ONLY public.thiet_bi REPLICA IDENTITY FULL;


--
-- Name: COLUMN thiet_bi.ma_tai_san_bravo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thiet_bi.ma_tai_san_bravo IS 'Mã tài sản Bravo (cột vật lý cố định, áp dụng cho mọi thiết bị)';


--
-- Name: COLUMN thiet_bi.la_linh_kien; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thiet_bi.la_linh_kien IS 'true = đơn vị vật lý này là linh kiện, được gán vào khe linh kiện của một thiết bị cha';


--
-- Name: COLUMN thiet_bi.ma_thiet_bi_cu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.thiet_bi.ma_thiet_bi_cu IS 'Mã thiết bị trước khi chuẩn hoá sang TB_XXXXXXXX. Chỉ dùng để tra ngược.';


--
-- Name: cap_phat_thiet_bi(uuid, text, text, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cap_phat_thiet_bi(_thiet_bi_id uuid, _hanh_dong text, _nguoi_giu text DEFAULT NULL::text, _don_vi_giu_id uuid DEFAULT NULL::uuid, _ghi_chu text DEFAULT NULL::text) RETURNS public.thiet_bi
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _uid uuid := public.current_uid();
  _row public.thiet_bi;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Chưa đăng nhập';
  END IF;
  IF _hanh_dong NOT IN ('cap_phat','thu_hoi') THEN
    RAISE EXCEPTION 'Hành động không hợp lệ: %', _hanh_dong;
  END IF;

  IF _hanh_dong = 'cap_phat' THEN
    IF coalesce(btrim(_nguoi_giu), '') = '' AND _don_vi_giu_id IS NULL THEN
      RAISE EXCEPTION 'Cần chọn người giữ hoặc đơn vị khi cấp phát';
    END IF;
    UPDATE public.thiet_bi SET
      nguoi_giu = _nguoi_giu,
      don_vi_giu_id = _don_vi_giu_id,
      ngay_cap_phat = now(),
      trang_thai_cap_phat = 'da_cap_phat',
      updated_at = now()
    WHERE id = _thiet_bi_id
    RETURNING * INTO _row;
  ELSE
    UPDATE public.thiet_bi SET
      nguoi_giu = NULL,
      don_vi_giu_id = NULL,
      ngay_cap_phat = NULL,
      trang_thai_cap_phat = 'san_sang',
      updated_at = now()
    WHERE id = _thiet_bi_id
    RETURNING * INTO _row;
  END IF;

  IF _row.id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy thiết bị %', _thiet_bi_id;
  END IF;

  INSERT INTO public.thiet_bi_cap_phat (thiet_bi_id, hanh_dong, nguoi_giu, don_vi_giu_id, ghi_chu, thuc_hien_boi)
  VALUES (_thiet_bi_id, _hanh_dong, _nguoi_giu, _don_vi_giu_id, _ghi_chu, _uid);

  RETURN _row;
END;
$$;


--
-- Name: cascade_he_thong_don_vi(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cascade_he_thong_don_vi() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.don_vi_id IS DISTINCT FROM OLD.don_vi_id THEN
    UPDATE public.he_thong_thanh_phan
    SET don_vi_id_snapshot = NEW.don_vi_id
    WHERE he_thong_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: cay_duyet(uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cay_duyet(_id uuid, _approve boolean) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.has_role(public.current_uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Chi admin moi duyet thay doi'; END IF;
  IF _approve THEN
    PERFORM public._cay_apply(_id);
    UPDATE public.cay_thay_doi SET nguoi_duyet = public.current_uid(), duyet_luc = now() WHERE id = _id;
    PERFORM public.log_app_event('cay_duyet', 'cay_thay_doi', _id::text, '{}'::jsonb);
  ELSE
    UPDATE public.cay_thay_doi SET trang_thai = 'tu_choi', nguoi_duyet = public.current_uid(), duyet_luc = now() WHERE id = _id;
    PERFORM public.log_app_event('cay_tu_choi', 'cay_thay_doi', _id::text, '{}'::jsonb);
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;


--
-- Name: cay_hoan_tac(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cay_hoan_tac(_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE r public.cay_thay_doi; snap jsonb; v_ht jsonb; v_node jsonb;
BEGIN
  IF NOT public.has_role(public.current_uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Chi admin moi hoan tac'; END IF;
  SELECT * INTO r FROM public.cay_thay_doi WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Khong tim thay thay doi'; END IF;
  IF NOT r.da_ap_dung THEN RAISE EXCEPTION 'Thay doi chua duoc ap dung'; END IF;
  IF r.da_hoan_tac THEN RETURN jsonb_build_object('ok', true, 'noop', true); END IF;
  snap := r.snapshot_cu;
  IF r.loai = 'move_system' THEN
    v_ht := snap->'he_thong';
    UPDATE public.dm_he_thong SET phan_loai_id = CASE WHEN v_ht ? 'phan_loai_id' THEN NULLIF(v_ht->>'phan_loai_id','')::uuid ELSE phan_loai_id END, nhom_he_thong_id = NULLIF(v_ht->>'nhom_he_thong_id','')::uuid WHERE id = r.he_thong_id::uuid;
    UPDATE public.thiet_bi t SET phan_loai_id = CASE WHEN e ? 'phan_loai_id' THEN NULLIF(e->>'phan_loai_id','')::uuid ELSE t.phan_loai_id END, nhom_he_thong_id = NULLIF(e->>'nhom_he_thong_id','')::uuid FROM jsonb_array_elements(COALESCE(snap->'thiet_bi','[]'::jsonb)) e WHERE t.id = (e->>'id')::uuid;
    v_node := snap->'node_edit';
    IF v_node IS NULL OR v_node = 'null'::jsonb THEN
      DELETE FROM public.cay_node_edit WHERE kind = 'ht' AND ma = r.he_thong_id;
    ELSE
      INSERT INTO public.cay_node_edit (id, kind, ma, don_vi_ma, ten, du_lieu, created_by, created_at, updated_at)
      VALUES ((v_node->>'id')::uuid, v_node->>'kind', v_node->>'ma', NULLIF(v_node->>'don_vi_ma',''), NULLIF(v_node->>'ten',''), COALESCE(v_node->'du_lieu','{}'::jsonb), NULLIF(v_node->>'created_by','')::uuid, COALESCE((v_node->>'created_at')::timestamptz, now()), now())
      ON CONFLICT (kind, ma) DO UPDATE SET ten = EXCLUDED.ten, don_vi_ma = EXCLUDED.don_vi_ma, du_lieu = EXCLUDED.du_lieu, updated_at = now();
    END IF;
  ELSIF r.loai = 'move_systems' THEN
    UPDATE public.dm_he_thong s SET phan_loai_id = CASE WHEN e ? 'phan_loai_id' THEN NULLIF(e->>'phan_loai_id','')::uuid ELSE s.phan_loai_id END, nhom_he_thong_id = NULLIF(e->>'nhom_he_thong_id','')::uuid FROM jsonb_array_elements(COALESCE(snap->'he_thong','[]'::jsonb)) e WHERE s.id = (e->>'id')::uuid;
    UPDATE public.thiet_bi t SET phan_loai_id = CASE WHEN e ? 'phan_loai_id' THEN NULLIF(e->>'phan_loai_id','')::uuid ELSE t.phan_loai_id END, nhom_he_thong_id = NULLIF(e->>'nhom_he_thong_id','')::uuid FROM jsonb_array_elements(COALESCE(snap->'thiet_bi','[]'::jsonb)) e WHERE t.id = (e->>'id')::uuid;
  ELSIF r.loai = 'move_device' THEN
    UPDATE public.thiet_bi t SET he_thong_id = NULLIF(e->>'he_thong_id','')::uuid, nhom_he_thong_id = NULLIF(e->>'nhom_he_thong_id','')::uuid, phan_loai_id = CASE WHEN e ? 'phan_loai_id' THEN NULLIF(e->>'phan_loai_id','')::uuid ELSE t.phan_loai_id END FROM jsonb_array_elements(COALESCE(snap->'thiet_bi','[]'::jsonb)) e WHERE t.id = (e->>'id')::uuid;
  ELSIF r.loai = 'custom_fields' THEN
    DELETE FROM public.he_thong_truong WHERE he_thong_id = r.he_thong_id;
    INSERT INTO public.he_thong_truong (id, he_thong_id, field_key, nhan, kieu, tuy_chon, thu_tu, created_by, created_at, updated_at)
    SELECT (e->>'id')::uuid, e->>'he_thong_id', e->>'field_key', e->>'nhan', COALESCE(e->>'kieu','text'), COALESCE(e->'tuy_chon','[]'::jsonb), COALESCE((e->>'thu_tu')::int,0), NULLIF(e->>'created_by','')::uuid, now(), now()
    FROM jsonb_array_elements(COALESCE(snap->'he_thong_truong','[]'::jsonb)) e;
  END IF;
  UPDATE public.cay_thay_doi SET da_hoan_tac = true, da_ap_dung = false, trang_thai = 'da_hoan_tac' WHERE id = _id;
  PERFORM public.log_app_event('cay_hoan_tac', 'cay_thay_doi', _id::text, jsonb_build_object('loai', r.loai));
  RETURN jsonb_build_object('ok', true);
END;
$$;


--
-- Name: cay_submit_change(text, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cay_submit_change(_loai text, _he_thong_id text, _mo_ta text, _payload jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_id uuid; v_admin boolean; v_mgr boolean;
BEGIN
  v_admin := public.has_role(public.current_uid(), 'admin'::app_role);
  v_mgr := public.can_manage_equipment(public.current_uid());
  IF NOT v_mgr THEN RAISE EXCEPTION 'Ban khong co quyen chinh sua so do he thong'; END IF;
  IF _loai NOT IN ('move_system','move_systems','move_device','custom_fields') THEN
    RAISE EXCEPTION 'Loai thay doi khong hop le';
  END IF;

  INSERT INTO public.cay_thay_doi(loai, he_thong_id, mo_ta, payload, trang_thai, nguoi_tao)
  VALUES (_loai, NULLIF(_he_thong_id,''), _mo_ta, COALESCE(_payload, '{}'::jsonb),
          CASE WHEN v_admin THEN 'da_duyet' ELSE 'cho_duyet' END, public.current_uid())
  RETURNING id INTO v_id;

  IF v_admin THEN
    PERFORM public._cay_apply(v_id);
    UPDATE public.cay_thay_doi SET nguoi_duyet = public.current_uid(), duyet_luc = now() WHERE id = v_id;
    PERFORM public.log_app_event('cay_apply', 'cay_thay_doi', v_id::text, jsonb_build_object('loai', _loai, 'he_thong_id', _he_thong_id));
  END IF;
  RETURN jsonb_build_object('id', v_id, 'applied', v_admin);
END;
$$;


--
-- Name: chuan_hoa_ten(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.chuan_hoa_ten(s text) RETURNS text
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT btrim(regexp_replace(
    lower(translate(
      regexp_replace(unaccent(coalesce(s, '')), '\s+', ' ', 'g'),
      'đĐ', 'dD'
    )),
    '\s+', ' ', 'g'
  ));
$$;


--
-- Name: create_change_request(public.change_request_loai, jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_change_request(p_loai public.change_request_loai, p_payload jsonb, p_ghi_chu text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id  uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;
  IF NOT (public.has_role(v_uid,'admin'::app_role) OR public.has_role(v_uid,'phong_kt'::app_role)) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'invalid_payload' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.change_request(loai, payload, ghi_chu, nguoi_tao)
  VALUES (p_loai, p_payload, NULLIF(btrim(p_ghi_chu), ''), v_uid)
  RETURNING id INTO v_id;

  RETURN v_id;
END $$;


--
-- Name: current_jwt(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
$$;


--
-- Name: current_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public."current_role"() RETURNS text
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''),
                  NULLIF(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', ''),
                  'anon')
$$;


--
-- Name: current_uid(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_uid() RETURNS uuid
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid,
    NULLIF((NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'), '')::uuid
  )
$$;


--
-- Name: dashboard_asset_status(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboard_asset_status(p_don_vi_ids uuid[] DEFAULT NULL::uuid[]) RETURNS TABLE(trang_thai_ma text, ten text, so_luong integer)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT
    COALESCE(tt.ma, 'KHONG_XAC_DINH')  AS trang_thai_ma,
    COALESCE(tt.ten, 'Không xác định') AS ten,
    count(t.id)::int                    AS so_luong
  FROM thiet_bi t
  LEFT JOIN dm_trang_thai_thiet_bi tt ON tt.id = t.trang_thai_id
  WHERE (p_don_vi_ids IS NULL OR t.don_vi_id = ANY(p_don_vi_ids))
  GROUP BY tt.ma, tt.ten
  ORDER BY count(t.id) DESC;
$$;


--
-- Name: dashboard_kpis(uuid[], date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboard_kpis(p_don_vi_ids uuid[] DEFAULT NULL::uuid[], p_from date DEFAULT ((CURRENT_DATE - '30 days'::interval))::date, p_to date DEFAULT CURRENT_DATE) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  WITH
  tt AS (
    SELECT id, ma FROM dm_trang_thai_thiet_bi
  ),
  tb AS (
    SELECT t.id, t.don_vi_id, t.trang_thai_id
    FROM thiet_bi t
    WHERE (p_don_vi_ids IS NULL OR t.don_vi_id = ANY(p_don_vi_ids))
  ),
  sc AS (
    SELECT s.id, s.trang_thai, s.at_bao_cao, s.he_thong_id
    FROM su_co s
    LEFT JOIN dm_he_thong h ON h.id = s.he_thong_id
    WHERE (p_don_vi_ids IS NULL OR h.don_vi_id = ANY(p_don_vi_ids))
  ),
  pm AS (
    SELECT p.id, p.han, p.trang_thai, p.hoan_thanh_at, p.don_vi_id
    FROM pm_cong_viec p
    WHERE (p_don_vi_ids IS NULL OR p.don_vi_id = ANY(p_don_vi_ids))
  ),
  she AS (
    SELECT v.so_ngay_con_lai FROM v_sap_het_han v
  ),
  gp AS (
    SELECT g.so_ngay_con_lai, g.don_vi_id FROM v_giay_phep g
    WHERE (p_don_vi_ids IS NULL OR g.don_vi_id = ANY(p_don_vi_ids))
  )
  SELECT jsonb_build_object(
    'tong_tai_san',      (SELECT count(*) FROM tb),
    'dang_hoat_dong',    (SELECT count(*) FROM tb JOIN tt ON tt.id = tb.trang_thai_id WHERE tt.ma = 'DANG_KHAI_THAC'),
    'ngung_khai_thac',   (SELECT count(*) FROM tb JOIN tt ON tt.id = tb.trang_thai_id WHERE tt.ma IN ('NGUNG_KHAI_THAC','HONG','THANH_LY')),
    'su_co_mo',          (SELECT count(*) FROM sc WHERE trang_thai IN ('bao_cao','tiep_nhan','dang_xu_ly','cho_vat_tu')),
    'su_co_moi',         (SELECT count(*) FROM sc WHERE at_bao_cao::date BETWEEN p_from AND p_to),
    'pm_den_han',        (SELECT count(*) FROM pm WHERE hoan_thanh_at IS NULL AND han BETWEEN current_date AND (current_date + INTERVAL '7 days')::date),
    'pm_qua_han',        (SELECT count(*) FROM pm WHERE hoan_thanh_at IS NULL AND han < current_date),
    'sap_het_han',       (SELECT count(*) FROM she WHERE so_ngay_con_lai BETWEEN 0 AND 30),
    'qua_han_giay_phep', (SELECT count(*) FROM gp WHERE so_ngay_con_lai < 0)
  );
$$;


--
-- Name: dashboard_su_co_by_month(uuid[], integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboard_su_co_by_month(p_don_vi_ids uuid[] DEFAULT NULL::uuid[], p_months integer DEFAULT 12) RETURNS TABLE(thang date, muc_do text, so_luong integer)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  WITH bucket AS (
    SELECT (date_trunc('month', (current_date - make_interval(months => g))) AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS thang
    FROM generate_series(0, GREATEST(p_months, 1) - 1) g
  )
  SELECT
    b.thang,
    COALESCE(NULLIF(TRIM(s.muc_do), ''), 'khac') AS muc_do,
    count(s.id)::int AS so_luong
  FROM bucket b
  LEFT JOIN su_co s
    ON date_trunc('month', COALESCE(s.at_bao_cao, s.created_at) AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = b.thang
   AND (
        p_don_vi_ids IS NULL
     OR EXISTS (SELECT 1 FROM dm_he_thong h WHERE h.id = s.he_thong_id AND h.don_vi_id = ANY(p_don_vi_ids))
   )
  GROUP BY b.thang, COALESCE(NULLIF(TRIM(s.muc_do), ''), 'khac')
  ORDER BY b.thang;
$$;


--
-- Name: dashboard_top_he_thong_su_co(uuid[], integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboard_top_he_thong_su_co(p_don_vi_ids uuid[] DEFAULT NULL::uuid[], p_limit integer DEFAULT 5) RETURNS TABLE(he_thong_id uuid, ten_he_thong text, so_su_co_mo integer)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT
    h.id                       AS he_thong_id,
    COALESCE(h.ten, '(không tên)') AS ten_he_thong,
    count(s.id)::int           AS so_su_co_mo
  FROM su_co s
  JOIN dm_he_thong h ON h.id = s.he_thong_id
  WHERE s.trang_thai IN ('bao_cao','tiep_nhan','dang_xu_ly','cho_vat_tu')
    AND (p_don_vi_ids IS NULL OR h.don_vi_id = ANY(p_don_vi_ids))
  GROUP BY h.id, h.ten
  ORDER BY count(s.id) DESC
  LIMIT GREATEST(p_limit, 1);
$$;


--
-- Name: dieu_chuyen(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dieu_chuyen(p_thiet_bi_id uuid, p_thanh_phan_dich uuid, p_ghi_chu text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_gan_cu uuid; v_tt text; v_id uuid;
BEGIN
  IF NOT can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Không có quyền quản lý thiết bị';
  END IF;
  SELECT trang_thai INTO v_tt FROM public.he_thong_thanh_phan WHERE id = p_thanh_phan_dich FOR UPDATE;
  IF v_tt IS NULL THEN RAISE EXCEPTION 'Vị trí đích không tồn tại'; END IF;
  IF v_tt <> 'hoat_dong' THEN RAISE EXCEPTION 'Vị trí đích đã ngừng'; END IF;
  IF EXISTS (SELECT 1 FROM public.gan_chuc_nang WHERE thanh_phan_id = p_thanh_phan_dich AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Vị trí đích đang có thiết bị';
  END IF;

  SELECT id INTO v_gan_cu FROM public.gan_chuc_nang
    WHERE thiet_bi_id = p_thiet_bi_id AND den_ngay IS NULL FOR UPDATE;
  IF v_gan_cu IS NOT NULL THEN
    UPDATE public.gan_chuc_nang SET den_ngay = now(), ly_do = 'điều chuyển' WHERE id = v_gan_cu;
  END IF;

  INSERT INTO public.gan_chuc_nang(thanh_phan_id, thiet_bi_id, ly_do, ghi_chu, nguoi_thuc_hien)
  VALUES (p_thanh_phan_dich, p_thiet_bi_id, 'điều chuyển', p_ghi_chu, public.current_uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;


--
-- Name: dieu_chuyen_linh_kien(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dieu_chuyen_linh_kien(p_linh_kien_id uuid, p_khe_moi_id uuid, p_ghi_chu text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_gan_cu uuid; v_tt text; v_id uuid;
BEGIN
  IF NOT can_manage_equipment(public.current_uid()) THEN RAISE EXCEPTION 'Không có quyền quản lý thiết bị'; END IF;
  SELECT trang_thai INTO v_tt FROM public.thiet_bi_khe_linh_kien WHERE id = p_khe_moi_id FOR UPDATE;
  IF v_tt IS NULL THEN RAISE EXCEPTION 'Khe linh kiện đích không tồn tại'; END IF;
  IF v_tt <> 'hoat_dong' THEN RAISE EXCEPTION 'Khe linh kiện đích đã ngừng'; END IF;
  IF EXISTS (SELECT 1 FROM public.gan_linh_kien WHERE khe_id = p_khe_moi_id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Khe đích đang có linh kiện, hãy dùng Thay thế';
  END IF;
  SELECT id INTO v_gan_cu FROM public.gan_linh_kien WHERE linh_kien_id = p_linh_kien_id AND den_ngay IS NULL FOR UPDATE;
  IF v_gan_cu IS NOT NULL THEN
    PERFORM public._dong_gan_lk(v_gan_cu, 'điều chuyển', NULL, NULL, 'Điều chuyển linh kiện sang khe khác');
  END IF;
  v_id := public._mo_gan_lk(p_khe_moi_id, p_linh_kien_id, 'điều chuyển', NULL, p_ghi_chu);
  RETURN v_id;
END;
$$;


--
-- Name: dieu_chuyen_thiet_bi(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dieu_chuyen_thiet_bi(p_thiet_bi_id uuid, p_thanh_phan_moi_id uuid, p_ghi_chu text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_gan_cu uuid; v_tt text; v_id uuid;
BEGIN
  IF NOT can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Không có quyền quản lý thiết bị';
  END IF;

  -- Khe đích phải tồn tại, đang hoạt động và còn trống.
  SELECT trang_thai INTO v_tt FROM public.he_thong_thanh_phan
    WHERE id = p_thanh_phan_moi_id FOR UPDATE;
  IF v_tt IS NULL THEN RAISE EXCEPTION 'Khe chức năng đích không tồn tại'; END IF;
  IF v_tt <> 'hoat_dong' THEN RAISE EXCEPTION 'Khe chức năng đích đã ngừng'; END IF;
  IF EXISTS (SELECT 1 FROM public.gan_chuc_nang
             WHERE thanh_phan_id = p_thanh_phan_moi_id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Khe đích đang có thiết bị, hãy dùng Thay thế';
  END IF;

  -- Đóng dòng gán hiện tại của thiết bị (nếu có), giữ nguyên trạng thái vì
  -- thiết bị vẫn tiếp tục khai thác ở khe mới.
  SELECT id INTO v_gan_cu FROM public.gan_chuc_nang
    WHERE thiet_bi_id = p_thiet_bi_id AND den_ngay IS NULL FOR UPDATE;
  IF v_gan_cu IS NOT NULL THEN
    PERFORM public._dong_gan_va_vong_doi(
      v_gan_cu, 'điều chuyển', NULL, NULL, 'Điều chuyển sang khe khác');
  END IF;

  -- Mở dòng gán mới ở khe đích.
  v_id := public._mo_gan_va_vong_doi(
    p_thanh_phan_moi_id, p_thiet_bi_id, 'điều chuyển', NULL, p_ghi_chu);
  RETURN v_id;
END;
$$;


--
-- Name: dieu_chuyen_trao(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dieu_chuyen_trao(p_thanh_phan_a uuid, p_thanh_phan_b uuid, p_ghi_chu text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_ga uuid; v_gb uuid; v_tba uuid; v_tbb uuid;
BEGIN
  IF NOT can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Không có quyền quản lý thiết bị';
  END IF;
  SELECT id, thiet_bi_id INTO v_ga, v_tba FROM public.gan_chuc_nang
    WHERE thanh_phan_id = p_thanh_phan_a AND den_ngay IS NULL FOR UPDATE;
  SELECT id, thiet_bi_id INTO v_gb, v_tbb FROM public.gan_chuc_nang
    WHERE thanh_phan_id = p_thanh_phan_b AND den_ngay IS NULL FOR UPDATE;
  IF v_ga IS NULL OR v_gb IS NULL THEN
    RAISE EXCEPTION 'Cả hai vị trí phải đang có thiết bị để tráo';
  END IF;

  UPDATE public.gan_chuc_nang SET den_ngay = now(), ly_do = 'điều chuyển' WHERE id IN (v_ga, v_gb);

  INSERT INTO public.gan_chuc_nang(thanh_phan_id, thiet_bi_id, ly_do, ghi_chu, nguoi_thuc_hien)
  VALUES (p_thanh_phan_a, v_tbb, 'điều chuyển', p_ghi_chu, public.current_uid()),
         (p_thanh_phan_b, v_tba, 'điều chuyển', p_ghi_chu, public.current_uid());
END;
$$;


--
-- Name: dm_model_propagate_to_thiet_bi(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dm_model_propagate_to_thiet_bi() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- loai_thiet_bi_id
  IF NEW.loai_thiet_bi_id IS NOT NULL
     AND NEW.loai_thiet_bi_id IS DISTINCT FROM OLD.loai_thiet_bi_id THEN
    UPDATE public.thiet_bi
       SET loai_thiet_bi_id = NEW.loai_thiet_bi_id
     WHERE model_id = NEW.id
       AND loai_thiet_bi_id IS DISTINCT FROM NEW.loai_thiet_bi_id;
  END IF;

  -- nha_san_xuat_id
  IF NEW.nha_san_xuat_id IS NOT NULL
     AND NEW.nha_san_xuat_id IS DISTINCT FROM OLD.nha_san_xuat_id THEN
    UPDATE public.thiet_bi
       SET nha_san_xuat_id = NEW.nha_san_xuat_id
     WHERE model_id = NEW.id
       AND nha_san_xuat_id IS DISTINCT FROM NEW.nha_san_xuat_id;
  END IF;

  -- field_set_id
  IF NEW.field_set_id IS NOT NULL
     AND NEW.field_set_id IS DISTINCT FROM OLD.field_set_id THEN
    UPDATE public.thiet_bi
       SET field_set_id = NEW.field_set_id
     WHERE model_id = NEW.id
       AND field_set_id IS DISTINCT FROM NEW.field_set_id;
  END IF;

  -- p_n (ghi đè khi ≠ '')
  IF NEW.p_n IS NOT NULL AND NEW.p_n <> ''
     AND NEW.p_n IS DISTINCT FROM OLD.p_n THEN
    UPDATE public.thiet_bi
       SET p_n = NEW.p_n
     WHERE model_id = NEW.id
       AND p_n IS DISTINCT FROM NEW.p_n;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: dm_xoa_an_toan(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dm_xoa_an_toan(_bang text, _id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_col text;
  v_count integer;
  v_extra_check jsonb := '[]'::jsonb;
  v_rec record;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Forbidden: cần quyền admin hoặc phong_kt' USING ERRCODE = '42501';
  END IF;

  v_col := CASE _bang
    WHEN 'dm_nha_san_xuat'  THEN 'nha_san_xuat_id'
    WHEN 'dm_nha_cung_cap'  THEN 'nha_cung_cap_id'
    WHEN 'dm_loai_thiet_bi' THEN 'loai_thiet_bi_id'
    WHEN 'dm_model'         THEN 'model_id'
    WHEN 'dm_don_vi'        THEN 'don_vi_id'
    WHEN 'dm_vi_tri'        THEN 'vi_tri_id'
    ELSE NULL
  END;

  IF v_col IS NULL THEN
    RAISE EXCEPTION 'Bảng danh mục không hỗ trợ xoá qua RPC: %', _bang USING ERRCODE = '22023';
  END IF;

  EXECUTE format('SELECT count(*) FROM public.thiet_bi WHERE %I = $1', v_col)
    INTO v_count USING _id;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Không thể xoá: còn % tài sản đang tham chiếu.', v_count
      USING ERRCODE = '23503';
  END IF;

  -- Với dm_don_vi: chặn thêm nếu còn hệ thống (dm_he_thong.don_vi_id) đang trỏ tới.
  IF _bang = 'dm_don_vi' THEN
    SELECT count(*) INTO v_count FROM public.dm_he_thong WHERE don_vi_id = _id;
    IF v_count > 0 THEN
      RAISE EXCEPTION 'Không thể xoá: còn % hệ thống đang trực thuộc đơn vị.', v_count
        USING ERRCODE = '23503';
    END IF;
  END IF;

  EXECUTE format('DELETE FROM public.%I WHERE id = $1', _bang) USING _id;

  RETURN jsonb_build_object('deleted', 1, 'bang', _bang, 'id', _id);
END;
$_$;


--
-- Name: dong_van_de(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dong_van_de(p_id uuid, p_ghi_chu text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_old text;
  v_blocking int;
BEGIN
  IF NOT can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Không có quyền đóng vấn đề';
  END IF;

  SELECT trang_thai INTO v_old FROM public.van_de WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy vấn đề'; END IF;

  SELECT count(*) INTO v_blocking
  FROM public.cong_viec_bao_tri
  WHERE van_de_id = p_id
    AND bat_buoc = true
    AND trang_thai NOT IN ('HOAN_THANH','HUY');

  IF v_blocking > 0 THEN
    RAISE EXCEPTION 'Còn % hành động bắt buộc chưa hoàn thành, không thể đóng vấn đề', v_blocking;
  END IF;

  IF v_old IS DISTINCT FROM 'dong' THEN
    UPDATE public.van_de
      SET trang_thai = 'dong', updated_at = now()
      WHERE id = p_id;

    -- Audit rõ ràng cho chuyển trạng thái (kèm audit trigger của bảng)
    PERFORM public.log_app_event(
      'chuyen_trang_thai_van_de',
      'van_de',
      p_id::text,
      jsonb_build_object('tu', v_old, 'den', 'dong', 'ghi_chu', p_ghi_chu)
    );
  END IF;
END; $$;


--
-- Name: ftinc_parent_must_be_draft(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ftinc_parent_must_be_draft() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_parent uuid;
  v_status form_template_version_status;
BEGIN
  v_parent := COALESCE(NEW.parent_version_id, OLD.parent_version_id);
  SELECT status INTO v_status FROM public.form_template_version WHERE id = v_parent;
  IF v_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Không thể thay đổi include: mẫu (version) không ở trạng thái draft (đang %).', v_status
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: ftv_lock_published(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ftv_lock_published() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF OLD.status = 'published' THEN
    IF NEW.compiled_schema IS DISTINCT FROM OLD.compiled_schema
       OR NEW.version IS DISTINCT FROM OLD.version
       OR NEW.template_id IS DISTINCT FROM OLD.template_id THEN
      RAISE EXCEPTION 'Version đã publish bị khóa: không thể sửa nội dung/biên bản đã biên dịch.'
        USING ERRCODE = 'check_violation';
    END IF;
    -- chỉ cho phép giữ nguyên hoặc chuyển sang retired
    IF NEW.status NOT IN ('published','retired') THEN
      RAISE EXCEPTION 'Version đã publish chỉ có thể giữ published hoặc chuyển retired.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: gen_ma_van_de(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gen_ma_van_de() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.ma_van_de IS NULL OR btrim(NEW.ma_van_de) = '' THEN
    NEW.ma_van_de := 'VD-' || lpad(nextval('public.van_de_ma_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;


--
-- Name: get_ai_public_config(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_ai_public_config() RETURNS TABLE(enabled boolean, model text, beta_label text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT enabled, model, beta_label FROM public.ai_config WHERE id = 1
$$;


--
-- Name: get_user_don_vi_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_don_vi_id(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT dv.id
  FROM public.profiles p
  JOIN public.dm_don_vi dv ON dv.ma = (p.don_vi)::text
  WHERE p.id = _user_id
  LIMIT 1
$$;


--
-- Name: get_user_don_vi_ma(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_don_vi_ma(_user_id uuid) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT (p.don_vi)::text FROM public.profiles p WHERE p.id = _user_id LIMIT 1
$$;


--
-- Name: kiem_ke; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kiem_ke (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thiet_bi_id uuid NOT NULL,
    nguoi_kiem text,
    thoi_diem timestamp with time zone DEFAULT now() NOT NULL,
    tinh_trang text NOT NULL,
    vi_tri_gps text,
    anh_url text,
    ghi_chu text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ghi_kiem_ke(uuid, text, text, text, text, text, timestamp with time zone, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ghi_kiem_ke(_thiet_bi_id uuid, _tinh_trang text, _nguoi_kiem text DEFAULT NULL::text, _vi_tri_gps text DEFAULT NULL::text, _anh_url text DEFAULT NULL::text, _ghi_chu text DEFAULT NULL::text, _thoi_diem timestamp with time zone DEFAULT now(), _chu_ky_ngay integer DEFAULT 365) RETURNS public.kiem_ke
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _uid uuid := public.current_uid();
  _row public.kiem_ke;
  _cyc integer := _chu_ky_ngay;
  _td timestamptz := COALESCE(_thoi_diem, now());
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Chưa đăng nhập';
  END IF;
  IF coalesce(btrim(_tinh_trang), '') = '' THEN
    RAISE EXCEPTION 'Cần nhập tình trạng kiểm kê';
  END IF;
  IF NOT (public.can_manage_equipment(_uid) OR public.can_view_thiet_bi(_thiet_bi_id, _uid)) THEN
    RAISE EXCEPTION 'Không có quyền kiểm kê thiết bị này';
  END IF;
  IF _cyc IS NULL OR _cyc <= 0 THEN
    _cyc := 365;
  END IF;

  INSERT INTO public.kiem_ke (thiet_bi_id, nguoi_kiem, thoi_diem, tinh_trang, vi_tri_gps, anh_url, ghi_chu, created_by)
  VALUES (_thiet_bi_id, _nguoi_kiem, _td, _tinh_trang, _vi_tri_gps, _anh_url, _ghi_chu, _uid)
  RETURNING * INTO _row;

  UPDATE public.thiet_bi
  SET ngay_kiem_ke_ke_tiep = ((_td AT TIME ZONE 'UTC')::date + _cyc),
      updated_at = now()
  WHERE id = _thiet_bi_id;

  RETURN _row;
END;
$$;


--
-- Name: global_search(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.global_search(_q text, _limit integer DEFAULT 20) RETURNS TABLE(entity text, id uuid, title text, subtitle text, score real)
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  v_q text := public.f_unaccent(coalesce(_q, ''));
  v_tsq tsquery;
BEGIN
  IF length(trim(v_q)) = 0 THEN
    RETURN;
  END IF;

  -- prefix tsquery: split words + :*
  v_tsq := to_tsquery('simple',
    regexp_replace(
      trim(regexp_replace(v_q, '[^a-zA-Z0-9\s]', ' ', 'g')),
      '\s+', ':* & ', 'g'
    ) || ':*'
  );

  RETURN QUERY
  SELECT * FROM (
    SELECT 'thiet_bi'::text,
           t.id,
           coalesce(t.ten_thiet_bi, t.ma_thiet_bi)::text,
           t.ma_thiet_bi::text,
           (ts_rank(t.search_tsv, v_tsq) + similarity(t.search_text, v_q))::real AS score
    FROM public.thiet_bi t
    WHERE t.search_tsv @@ v_tsq OR t.search_text % v_q

    UNION ALL
    SELECT 'giay_phep',
           g.id,
           coalesce(g.so_giay_phep, g.ma_giay_phep)::text,
           g.ma_giay_phep::text,
           (ts_rank(g.search_tsv, v_tsq) + similarity(g.search_text, v_q))::real
    FROM public.giay_phep g
    WHERE g.search_tsv @@ v_tsq OR g.search_text % v_q

    UNION ALL
    SELECT 'form_submission',
           f.id,
           coalesce(f.tieu_de, f.template_code)::text,
           f.template_code::text,
           (ts_rank(f.search_tsv, v_tsq) + similarity(f.search_text, v_q))::real
    FROM public.form_submission f
    WHERE f.search_tsv @@ v_tsq OR f.search_text % v_q
  ) s
  ORDER BY s.score DESC
  LIMIT least(coalesce(_limit, 20), 100);
END;
$$;


--
-- Name: gop_loai_thiet_bi(uuid[], uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gop_loai_thiet_bi(p_source_ids uuid[], p_target_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_target_name text;
  v_models int := 0;
  v_devices int := 0;
  v_deleted int := 0;
  v_sources uuid[];
BEGIN
  IF NOT (public.has_role(public.current_uid(), 'admin') OR public.has_role(public.current_uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Không có quyền gộp loại thiết bị.';
  END IF;

  SELECT array_agg(s) INTO v_sources
  FROM unnest(p_source_ids) s
  WHERE s <> p_target_id;

  IF v_sources IS NULL OR array_length(v_sources, 1) = 0 THEN
    RAISE EXCEPTION 'Không có loại thiết bị nguồn hợp lệ để gộp.';
  END IF;

  SELECT ten INTO v_target_name FROM public.dm_loai_thiet_bi WHERE id = p_target_id;
  IF v_target_name IS NULL THEN
    RAISE EXCEPTION 'Loại thiết bị giữ lại không tồn tại.';
  END IF;

  UPDATE public.dm_model
  SET loai_thiet_bi_id = p_target_id
  WHERE loai_thiet_bi_id = ANY(v_sources);
  GET DIAGNOSTICS v_models = ROW_COUNT;

  UPDATE public.thiet_bi
  SET loai_thiet_bi_id = p_target_id
  WHERE loai_thiet_bi_id = ANY(v_sources);
  GET DIAGNOSTICS v_devices = ROW_COUNT;

  UPDATE public.bao_tri_chinh_sach
  SET loai_thiet_bi_id = p_target_id
  WHERE loai_thiet_bi_id = ANY(v_sources);

  DELETE FROM public.dm_loai_thiet_bi WHERE id = ANY(v_sources);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'target_name', v_target_name,
    'models_moved', v_models,
    'devices_moved', v_devices,
    'deleted', v_deleted
  );
END;
$$;


--
-- Name: gop_model(uuid[], uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gop_model(p_source_ids uuid[], p_target_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_target_name text;
  v_devices int := 0;
  v_deleted int := 0;
  v_sources uuid[];
BEGIN
  IF NOT (public.has_role(public.current_uid(), 'admin') OR public.has_role(public.current_uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Không có quyền gộp mẫu thiết bị.';
  END IF;

  SELECT array_agg(s) INTO v_sources
  FROM unnest(p_source_ids) s
  WHERE s <> p_target_id;

  IF v_sources IS NULL OR array_length(v_sources, 1) = 0 THEN
    RAISE EXCEPTION 'Không có mẫu thiết bị nguồn hợp lệ để gộp.';
  END IF;

  SELECT ten INTO v_target_name FROM public.dm_model WHERE id = p_target_id;
  IF v_target_name IS NULL THEN
    RAISE EXCEPTION 'Mẫu thiết bị giữ lại không tồn tại.';
  END IF;

  UPDATE public.thiet_bi
  SET model_id = p_target_id,
      model = v_target_name
  WHERE model_id = ANY(v_sources);
  GET DIAGNOSTICS v_devices = ROW_COUNT;

  DELETE FROM public.dm_model WHERE id = ANY(v_sources);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'target_name', v_target_name,
    'models_moved', 0,
    'devices_moved', v_devices,
    'deleted', v_deleted
  );
END;
$$;


--
-- Name: gop_nha_cung_cap(uuid[], uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gop_nha_cung_cap(p_source_ids uuid[], p_target_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_target_name text;
  v_devices int := 0;
  v_deleted int := 0;
  v_sources uuid[];
BEGIN
  IF NOT (public.has_role(public.current_uid(), 'admin') OR public.has_role(public.current_uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Không có quyền gộp nhà cung cấp.';
  END IF;

  SELECT array_agg(s) INTO v_sources
  FROM unnest(p_source_ids) s
  WHERE s <> p_target_id;

  IF v_sources IS NULL OR array_length(v_sources, 1) = 0 THEN
    RAISE EXCEPTION 'Không có nhà cung cấp nguồn hợp lệ để gộp.';
  END IF;

  SELECT ten INTO v_target_name FROM public.dm_nha_cung_cap WHERE id = p_target_id;
  IF v_target_name IS NULL THEN
    RAISE EXCEPTION 'Nhà cung cấp giữ lại không tồn tại.';
  END IF;

  UPDATE public.thiet_bi
  SET nha_cung_cap_id = p_target_id,
      nha_cung_cap = v_target_name
  WHERE nha_cung_cap_id = ANY(v_sources);
  GET DIAGNOSTICS v_devices = ROW_COUNT;

  DELETE FROM public.dm_nha_cung_cap WHERE id = ANY(v_sources);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'target_name', v_target_name,
    'models_moved', 0,
    'devices_moved', v_devices,
    'deleted', v_deleted
  );
END;
$$;


--
-- Name: gop_nha_san_xuat(uuid[], uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gop_nha_san_xuat(p_source_ids uuid[], p_target_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_target_name text;
  v_models int := 0;
  v_devices int := 0;
  v_deleted int := 0;
  v_sources uuid[];
BEGIN
  -- Chỉ admin / phòng kỹ thuật được gộp danh mục.
  IF NOT (public.has_role(public.current_uid(), 'admin') OR public.has_role(public.current_uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Không có quyền gộp nhà sản xuất.';
  END IF;

  -- Loại bản chính khỏi danh sách nguồn (tránh tự gộp vào chính mình).
  SELECT array_agg(s) INTO v_sources
  FROM unnest(p_source_ids) s
  WHERE s <> p_target_id;

  IF v_sources IS NULL OR array_length(v_sources, 1) = 0 THEN
    RAISE EXCEPTION 'Không có nhà sản xuất nguồn hợp lệ để gộp.';
  END IF;

  SELECT ten INTO v_target_name FROM public.dm_nha_san_xuat WHERE id = p_target_id;
  IF v_target_name IS NULL THEN
    RAISE EXCEPTION 'Nhà sản xuất giữ lại không tồn tại.';
  END IF;

  -- Chuyển mẫu thiết bị sang bản chính.
  UPDATE public.dm_model
  SET nha_san_xuat_id = p_target_id
  WHERE nha_san_xuat_id = ANY(v_sources);
  GET DIAGNOSTICS v_models = ROW_COUNT;

  -- Chuyển thiết bị (khoá ngoại) sang bản chính + đồng bộ tên dạng chữ.
  UPDATE public.thiet_bi
  SET nha_san_xuat_id = p_target_id,
      nha_san_xuat = v_target_name
  WHERE nha_san_xuat_id = ANY(v_sources);
  GET DIAGNOSTICS v_devices = ROW_COUNT;

  -- Xoá các bản trùng.
  DELETE FROM public.dm_nha_san_xuat WHERE id = ANY(v_sources);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'target_name', v_target_name,
    'models_moved', v_models,
    'devices_moved', v_devices,
    'deleted', v_deleted
  );
END;
$$;


--
-- Name: gop_vi_tri(uuid[], uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gop_vi_tri(p_source_ids uuid[], p_target_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_target_name text;
  v_target_ma text;
  v_sources uuid[];
  v_source_mas text[];
  v_devices int := 0;
  v_children int := 0;
  v_media int := 0;
  v_deleted int := 0;
BEGIN
  IF NOT (public.has_role(public.current_uid(), 'admin') OR public.has_role(public.current_uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Không có quyền gộp vị trí.';
  END IF;

  SELECT array_agg(s) INTO v_sources
  FROM unnest(p_source_ids) s
  WHERE s <> p_target_id;

  IF v_sources IS NULL OR array_length(v_sources, 1) = 0 THEN
    RAISE EXCEPTION 'Không có vị trí nguồn hợp lệ để gộp.';
  END IF;

  SELECT ten, ma INTO v_target_name, v_target_ma FROM public.dm_vi_tri WHERE id = p_target_id;
  IF v_target_name IS NULL THEN
    RAISE EXCEPTION 'Vị trí giữ lại không tồn tại.';
  END IF;

  SELECT array_agg(ma) INTO v_source_mas
  FROM public.dm_vi_tri WHERE id = ANY(v_sources) AND ma IS NOT NULL;

  -- Chuyển thiết bị sang vị trí đích
  UPDATE public.thiet_bi
  SET vi_tri_id = p_target_id
  WHERE vi_tri_id = ANY(v_sources);
  GET DIAGNOSTICS v_devices = ROW_COUNT;

  -- Chuyển vị trí con (đang trực thuộc nguồn) sang trực thuộc đích
  UPDATE public.dm_vi_tri
  SET parent_id = p_target_id
  WHERE parent_id = ANY(v_sources) AND id <> p_target_id;
  GET DIAGNOSTICS v_children = ROW_COUNT;

  -- Chuyển media (ảnh/360/3D) sang mã vị trí đích
  IF v_source_mas IS NOT NULL AND v_target_ma IS NOT NULL THEN
    UPDATE public.vi_tri_media
    SET vi_tri_ma = v_target_ma
    WHERE vi_tri_ma = ANY(v_source_mas);
    GET DIAGNOSTICS v_media = ROW_COUNT;
  END IF;

  DELETE FROM public.dm_vi_tri WHERE id = ANY(v_sources);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'target_name', v_target_name,
    'devices_moved', v_devices,
    'children_moved', v_children,
    'media_moved', v_media,
    'deleted', v_deleted
  );
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_is_bootstrap boolean := (NEW.email = 'buileson93@gmail.com');
  v_display text := COALESCE(
    NEW.raw_user_meta_data->>'ho_ten',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
BEGIN
  INSERT INTO public.profiles (id, email, ho_ten, active)
  VALUES (NEW.id, NEW.email, v_display, v_is_bootstrap)
  ON CONFLICT (id) DO NOTHING;

  IF v_is_bootstrap
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: has_permission(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_permission(_user_id uuid, _module text, _action text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: he_thong_cascade_thiet_bi(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.he_thong_cascade_thiet_bi() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.phan_loai_id IS DISTINCT FROM OLD.phan_loai_id
     OR NEW.nhom_he_thong_id IS DISTINCT FROM OLD.nhom_he_thong_id THEN
    UPDATE public.thiet_bi
      SET phan_loai_id = NEW.phan_loai_id,
          nhom_he_thong_id = NEW.nhom_he_thong_id
    WHERE he_thong_id = NEW.id
      AND (phan_loai_id IS DISTINCT FROM NEW.phan_loai_id
        OR nhom_he_thong_id IS DISTINCT FROM NEW.nhom_he_thong_id);
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: he_thong_sync_phan_loai(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.he_thong_sync_phan_loai() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_pl uuid;
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
-- Name: he_thong_truong_validate(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.he_thong_truong_validate() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $_$
BEGIN
  IF NEW.pham_vi NOT IN ('he_thong','nhom','linh_vuc','toan_cuc','thiet_bi') THEN
    RAISE EXCEPTION 'Phạm vi trường không hợp lệ: %', NEW.pham_vi;
  END IF;
  IF NEW.ap_dung_lop NOT IN ('thiet_bi','he_thong') THEN
    RAISE EXCEPTION 'Lớp áp dụng không hợp lệ: %', NEW.ap_dung_lop;
  END IF;
  IF NEW.field_key IS NULL OR NEW.field_key !~ '^[a-z_][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Khóa trường không hợp lệ (chỉ a-z, 0-9, _): %', NEW.field_key;
  END IF;

  IF NEW.ap_dung_lop = 'thiet_bi' AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'thiet_bi'
      AND column_name = NEW.field_key
  ) THEN
    RAISE EXCEPTION 'Khóa trường "%" trùng cột lõi của thiet_bi. Hãy đặt tiền tố, ví dụ "x_%"', NEW.field_key, NEW.field_key;
  END IF;

  IF NEW.ap_dung_lop = 'he_thong' AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dm_he_thong'
      AND column_name = NEW.field_key
  ) THEN
    RAISE EXCEPTION 'Khóa trường "%" trùng cột lõi của dm_he_thong. Hãy đặt tiền tố, ví dụ "x_%"', NEW.field_key, NEW.field_key;
  END IF;

  -- Đồng bộ ap_dung_id với he_thong_id cho phạm vi theo hệ thống / thiết bị
  IF NEW.pham_vi IN ('he_thong','thiet_bi') AND NEW.ap_dung_id IS NULL THEN
    NEW.ap_dung_id := NEW.he_thong_id;
  END IF;
  IF NEW.pham_vi = 'toan_cuc' THEN
    NEW.ap_dung_id := NULL;
  END IF;
  RETURN NEW;
END;
$_$;


--
-- Name: hoan_thanh_cong_viec_bao_tri(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.hoan_thanh_cong_viec_bao_tri(_id uuid, _bao_tri_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_tb uuid;
  v_cs uuid;
  v_chu_ky integer;
BEGIN
  IF NOT public.can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Không có quyền cập nhật phiếu công việc bảo dưỡng';
  END IF;

  UPDATE public.cong_viec_bao_tri
     SET trang_thai = 'HOAN_THANH',
         ngay_hoan_thanh = CURRENT_DATE,
         bao_tri_id = COALESCE(_bao_tri_id, bao_tri_id)
   WHERE id = _id
   RETURNING thiet_bi_id, chinh_sach_id INTO v_tb, v_cs;

  IF v_tb IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu công việc';
  END IF;

  SELECT chu_ky_ngay INTO v_chu_ky FROM public.bao_tri_chinh_sach WHERE id = v_cs;

  UPDATE public.thiet_bi
     SET ngay_bao_tri_gan_nhat = CURRENT_DATE,
         ngay_bao_tri_ke_tiep = CASE
           WHEN v_chu_ky IS NOT NULL AND v_chu_ky > 0
           THEN CURRENT_DATE + v_chu_ky
           ELSE ngay_bao_tri_ke_tiep END
   WHERE id = v_tb;
END;
$$;


--
-- Name: hoan_thanh_cong_viec_bao_tri(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.hoan_thanh_cong_viec_bao_tri(_id uuid, _bao_tri_id uuid DEFAULT NULL::uuid, _form_submission_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_tb uuid;
  v_cs uuid;
  v_tt text;
  v_chu_ky integer;
  v_bt_tb uuid;
BEGIN
  -- (1) Vai trò
  IF NOT public.can_manage_equipment(public.current_uid()) THEN
    RAISE EXCEPTION 'Không có quyền cập nhật phiếu công việc bảo dưỡng'
      USING ERRCODE = '42501';
  END IF;

  -- (2) Khóa phiếu + lấy trạng thái hiện tại
  SELECT thiet_bi_id, chinh_sach_id, trang_thai
    INTO v_tb, v_cs, v_tt
    FROM public.cong_viec_bao_tri
   WHERE id = _id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu công việc' USING ERRCODE = 'P0002';
  END IF;

  -- Đơn vị: quản lý phải xem được thiết bị của phiếu (nếu phiếu gắn thiết bị)
  IF v_tb IS NOT NULL AND NOT public.can_view_thiet_bi(v_tb, public.current_uid()) THEN
    RAISE EXCEPTION 'Không có quyền thao tác trên đơn vị của thiết bị này'
      USING ERRCODE = '42501';
  END IF;

  -- (3) Chuyển trạng thái hợp lệ
  IF v_tt NOT IN ('MO', 'DANG_LAM') THEN
    RAISE EXCEPTION 'Phiếu ở trạng thái % không thể hoàn thành', v_tt
      USING ERRCODE = 'P0001';
  END IF;

  -- (4) Liên kết biên bản: bao_tri phải tồn tại & khớp thiết bị của phiếu
  IF _bao_tri_id IS NOT NULL THEN
    SELECT thiet_bi_id INTO v_bt_tb FROM public.bao_tri WHERE id = _bao_tri_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Biên bản bảo dưỡng không tồn tại' USING ERRCODE = 'P0002';
    END IF;
    IF v_tb IS NOT NULL AND v_bt_tb IS NOT NULL AND v_bt_tb <> v_tb THEN
      RAISE EXCEPTION 'Biên bản không thuộc thiết bị của phiếu' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF _form_submission_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.form_submission WHERE id = _form_submission_id) THEN
    RAISE EXCEPTION 'Phiếu biểu mẫu (biên bản) không tồn tại' USING ERRCODE = 'P0002';
  END IF;

  -- Cập nhật phiếu: trạng thái + ngày hoàn thành + liên kết biên bản
  UPDATE public.cong_viec_bao_tri
     SET trang_thai = 'HOAN_THANH',
         ngay_hoan_thanh = CURRENT_DATE,
         bao_tri_id = COALESCE(_bao_tri_id, bao_tri_id)
   WHERE id = _id;

  -- Gắn form_submission vào biên bản bao_tri (nếu có cả hai)
  IF _bao_tri_id IS NOT NULL AND _form_submission_id IS NOT NULL THEN
    UPDATE public.bao_tri
       SET form_submission_id = _form_submission_id
     WHERE id = _bao_tri_id;
  END IF;

  -- (5) Kỳ bảo dưỡng kế tiếp
  SELECT chu_ky_ngay INTO v_chu_ky FROM public.bao_tri_chinh_sach WHERE id = v_cs;

  IF v_tb IS NOT NULL THEN
    UPDATE public.thiet_bi
       SET ngay_bao_tri_gan_nhat = CURRENT_DATE,
           ngay_bao_tri_ke_tiep = CASE
             WHEN v_chu_ky IS NOT NULL AND v_chu_ky > 0
             THEN CURRENT_DATE + v_chu_ky
             ELSE ngay_bao_tri_ke_tiep END
     WHERE id = v_tb;
  END IF;
END;
$$;


--
-- Name: hoan_thanh_hong_hoc(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.hoan_thanh_hong_hoc(_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_role_ok boolean;
  v_hh public.hong_hoc%ROWTYPE;
  v_pa text;
  v_now timestamptz := now();
BEGIN
  IF public.current_uid() IS NULL THEN
    RAISE EXCEPTION 'Chưa đăng nhập' USING ERRCODE = '28000';
  END IF;

  SELECT (public.has_role(public.current_uid(),'admin')
       OR public.has_role(public.current_uid(),'phong_kt')
       OR public.has_role(public.current_uid(),'ktv'))
    INTO v_role_ok;
  IF NOT v_role_ok THEN
    RAISE EXCEPTION 'Không có quyền hoàn thành hỏng hóc' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_hh FROM public.hong_hoc WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu hỏng hóc %', _id USING ERRCODE = 'P0002';
  END IF;

  -- Chuẩn hoá phương án về snake_case ổn định.
  v_pa := lower(regexp_replace(coalesce(v_hh.phuong_an,''), '\s+', '_', 'g'));
  v_pa := replace(replace(replace(replace(v_pa,'ế','e'),'ữ','u'),'ý','y'),'ả','a');
  v_pa := CASE
            WHEN v_pa LIKE 'thay%' THEN 'thay_the'
            WHEN v_pa LIKE 'sua%'  THEN 'sua_chua'
            WHEN v_pa LIKE 'thanh%' THEN 'thanh_ly'
            ELSE v_pa
          END;

  IF v_pa = '' THEN
    RAISE EXCEPTION 'Phiếu chưa có phương án — không thể hoàn thành' USING ERRCODE = '22023';
  END IF;

  IF v_pa = 'thay_the' AND v_hh.thiet_bi_thay_the_id IS NULL THEN
    RAISE EXCEPTION 'Phương án thay thế yêu cầu thiết bị thay thế' USING ERRCODE = '22023';
  END IF;

  -- Cập nhật phiếu (nguyên tử).
  UPDATE public.hong_hoc
     SET trang_thai = 'Hoàn thành',
         ngay_hoan_thanh = coalesce(ngay_hoan_thanh, v_now::date::text),
         updated_at = v_now
   WHERE id = _id;

  -- Nếu thay thế: đóng gan_chuc_nang hiện hành của thiết bị hỏng + mở dòng mới cho thiết bị thay thế
  IF v_pa = 'thay_the' AND v_hh.thanh_phan_id IS NOT NULL AND v_hh.thiet_bi_hong_id IS NOT NULL THEN
    UPDATE public.gan_chuc_nang
       SET den_ngay = v_now
     WHERE thanh_phan_id = v_hh.thanh_phan_id
       AND thiet_bi_id   = v_hh.thiet_bi_hong_id
       AND den_ngay IS NULL;

    INSERT INTO public.gan_chuc_nang
      (thanh_phan_id, thiet_bi_id, tu_ngay, ly_do, hong_hoc_id, created_by)
    VALUES
      (v_hh.thanh_phan_id, v_hh.thiet_bi_thay_the_id, v_now,
       'Thay thế theo phiếu hỏng hóc ' || coalesce(v_hh.ma_hong_hoc, _id::text),
       _id, public.current_uid());
  END IF;

  RETURN _id;
END;
$$;


--
-- Name: is_active_user(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_active_user(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND active = true)
$$;


--
-- Name: is_conv_participant(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_conv_participant(_conv uuid, _user uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_participant WHERE conversation_id = _conv AND user_id = _user)
$$;


