--
-- PostgreSQL database dump
--

\restrict CmS8kCR51KBn0tfTCyUYARe8XzalJfuUad5FzeNUuTaiJNGgnLLAJWgsrIcvh7r

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

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


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
    'role.revoke',
    'thiet_bi.propose_field',
    'he_thong.propose_field',
    'dm.propose_new'
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
-- Name: cong_van_lien_ket_loai; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cong_van_lien_ket_loai AS ENUM (
    'tra_loi',
    'can_cu',
    'lien_quan',
    'dinh_kem'
);


--
-- Name: cong_van_loai; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cong_van_loai AS ENUM (
    'den',
    'di',
    'to_trinh',
    'bao_cao',
    'quyet_dinh',
    'khac'
);


--
-- Name: cong_van_trang_thai; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cong_van_trang_thai AS ENUM (
    'moi',
    'dang_xu_ly',
    'cho_duyet',
    'da_duyet',
    'da_phat_hanh',
    'hoan_tat',
    'huy'
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
-- Name: dot_bao_duong_hm_ket_qua; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.dot_bao_duong_hm_ket_qua AS ENUM (
    'dat',
    'khong_dat',
    'khac'
);


--
-- Name: dot_bao_duong_hm_nguon; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.dot_bao_duong_hm_nguon AS ENUM (
    'kt_khoi_tao',
    'don_vi_bo_sung'
);


--
-- Name: dot_bao_duong_hm_trang_thai; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.dot_bao_duong_hm_trang_thai AS ENUM (
    'chua_bat_dau',
    'dang_lam',
    'hoan_thanh',
    'khong_thuc_hien'
);


--
-- Name: dot_bao_duong_trang_thai; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.dot_bao_duong_trang_thai AS ENUM (
    'nhap',
    'mo',
    'dang_thuc_hien',
    'dong',
    'huy'
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
-- Name: _dbd_object_allowed(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._dbd_object_allowed(_name text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'phong_kt')
      OR EXISTS (
           SELECT 1
             FROM public.dot_bao_duong_hang_muc h
            WHERE h.id::text = split_part(_name, '/', 1)
              AND h.don_vi_id = public.get_user_don_vi_id(auth.uid())
         );
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
-- Name: _gen_ma_dac_tinh(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._gen_ma_dac_tinh() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  candidate text;
  i int := 0;
BEGIN
  IF NEW.ma IS NOT NULL AND length(btrim(NEW.ma)) > 0 THEN
    RETURN NEW;
  END IF;
  LOOP
    candidate := 'DT_' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.dm_dac_tinh WHERE ma = candidate);
    i := i + 1;
    IF i > 8 THEN
      RAISE EXCEPTION 'Không sinh được mã nhãn tài sản duy nhất sau 8 lần thử';
    END IF;
  END LOOP;
  NEW.ma := candidate;
  RETURN NEW;
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
-- Name: _try_date(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._try_date(txt text) RETURNS date
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE d date;
BEGIN
  IF txt IS NULL OR btrim(txt) = '' THEN RETURN NULL; END IF;
  BEGIN d := to_date(txt, 'DD/MM/YYYY'); RETURN d; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN d := to_date(txt, 'YYYY-MM-DD'); RETURN d; EXCEPTION WHEN OTHERS THEN NULL; END;
  RETURN NULL;
END $$;


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
-- Name: admin_restore_table(text, jsonb, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_restore_table(p_table text, p_rows jsonb, p_truncate boolean DEFAULT false) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  blocklist text[] := ARRAY['backup_lich_su','audit_log','user_roles','profiles',
                            'ai_config','ai_conversation','ai_message',
                            'messages','conversations','conversation_participant','notifications'];
  n integer := 0;
BEGIN
  IF NOT public.has_role(public.current_uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: chỉ Admin được khôi phục dữ liệu';
  END IF;

  IF p_table = ANY(blocklist) THEN
    RETURN jsonb_build_object('ok', false, 'skipped', true, 'reason', 'blocked', 'rows', 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace nsp ON nsp.oid = c.relnamespace
    WHERE nsp.nspname = 'public' AND c.relkind = 'r' AND c.relname = p_table
  ) THEN
    RAISE EXCEPTION 'Bảng không hợp lệ: %', p_table;
  END IF;

  IF jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'Dữ liệu phải là mảng JSON';
  END IF;

  PERFORM set_config('session_replication_role', 'replica', true);

  IF p_truncate THEN
    EXECUTE format('DELETE FROM public.%I', p_table);
  END IF;

  IF jsonb_array_length(p_rows) > 0 THEN
    EXECUTE format(
      'INSERT INTO public.%I SELECT * FROM jsonb_populate_recordset(NULL::public.%I, $1)',
      p_table, p_table
    ) USING p_rows;
    GET DIAGNOSTICS n = ROW_COUNT;
  END IF;

  PERFORM set_config('session_replication_role', 'origin', true);
  RETURN jsonb_build_object('ok', true, 'table', p_table, 'rows', n);
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

    -- NEW: Propose field update support
    ELSIF v_row.loai = 'thiet_bi.propose_field' THEN
      EXECUTE format('UPDATE public.thiet_bi SET %I = $1 WHERE id = $2', v_pl->>'field')
        USING (v_pl->>'value'), (v_pl->>'thiet_bi_id')::uuid;
        
    ELSIF v_row.loai = 'he_thong.propose_field' THEN
      EXECUTE format('UPDATE public.dm_he_thong SET %I = $1 WHERE id = $2', v_pl->>'field')
        USING (v_pl->>'value'), (v_pl->>'he_thong_id')::uuid;

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
-- Name: ban_quyen_tong_hop(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ban_quyen_tong_hop() RETURNS TABLE(tong_ban_quyen bigint, sap_het_han bigint, da_het_han bigint, tong_ghe bigint, ghe_da_dung bigint, tong_gia_tri numeric)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT
    count(*)::bigint,
    count(*) FILTER (WHERE bq.ngay_het_han IS NOT NULL
      AND bq.ngay_het_han >= CURRENT_DATE
      AND bq.ngay_het_han <= CURRENT_DATE + 60)::bigint,
    count(*) FILTER (WHERE bq.ngay_het_han IS NOT NULL AND bq.ngay_het_han < CURRENT_DATE)::bigint,
    COALESCE(sum(bq.so_ghe), 0)::bigint,
    COALESCE((SELECT count(*) FROM public.phan_mem_ban_quyen_cap_phat cp WHERE cp.ngay_thu_hoi IS NULL), 0)::bigint,
    COALESCE(sum(bq.gia_tri), 0)
  FROM public.phan_mem_ban_quyen bq;
$$;


--
-- Name: calculate_completeness(text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_completeness(p_entity text, p_row jsonb) RETURNS integer
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  v_fields text[];
  v_filled_count integer := 0;
  v_field text;
BEGIN
  IF p_entity = 'thiet_bi' THEN
    v_fields := ARRAY['ten_thiet_bi', 'ma_serial', 'model_id', 'trang_thai_id', 'he_thong_id', 'don_vi_id'];
  ELSIF p_entity = 'dm_he_thong' THEN
    v_fields := ARRAY['ten', 'ma', 'loai_he_thong_id', 'don_vi_id', 'nhom_he_thong_id'];
  ELSE
    RETURN 0;
  END IF;

  FOREACH v_field IN ARRAY v_fields LOOP
    IF (p_row->>v_field) IS NOT NULL AND (p_row->>v_field) != '' THEN
      v_filled_count := v_filled_count + 1;
    END IF;
  END LOOP;

  RETURN ROUND((v_filled_count::float / array_length(v_fields, 1)::float) * 100);
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
    AS $_$ SELECT extensions.unaccent('public.unaccent', $1) $_$;


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
    completeness_pct integer DEFAULT 0,
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
-- Name: dashboard_activity_feed(uuid[], integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboard_activity_feed(p_don_vi_ids uuid[] DEFAULT NULL::uuid[], p_limit integer DEFAULT 20) RETURNS TABLE(at timestamp with time zone, loai text, tieu_de text, ref_route text, ref_id uuid)
    LANGUAGE sql STABLE
    AS $$
  (SELECT ngay_phat_hien, 'su_co'::text, ('Sự cố: ' || COALESCE(thiet_bi, ma_su_co)), '/su-co'::text, id
     FROM public.su_co ORDER BY ngay_phat_hien DESC LIMIT p_limit)
  UNION ALL
  (SELECT updated_at, 'bao_tri'::text, ('Bảo trì: ' || COALESCE(thiet_bi, ma_bao_tri)), '/bao-tri'::text, id
     FROM public.bao_tri WHERE ngay_hoan_thanh IS NOT NULL ORDER BY updated_at DESC LIMIT p_limit)
  UNION ALL
  (SELECT created_at, 'ban_giao'::text, 'Bàn giao thiết bị', '/ban-giao'::text, id
     FROM public.ban_giao ORDER BY created_at DESC LIMIT p_limit)
  UNION ALL
  (SELECT thoi_diem, 'kiem_ke'::text, 'Kiểm kê thiết bị', '/kiem-ke'::text, id
     FROM public.kiem_ke ORDER BY thoi_diem DESC LIMIT p_limit)
  ORDER BY 1 DESC LIMIT p_limit;
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
-- Name: dashboard_brief_today(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboard_brief_today(p_don_vi_ids uuid[] DEFAULT NULL::uuid[]) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  today date := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
BEGIN
  RETURN jsonb_build_object(
    'su_co_khan', COALESCE((
      SELECT count(*) FROM public.su_co
      WHERE trang_thai NOT IN ('Đã xử lý','Đã đóng','Hoàn thành','hoan_thanh','dong')
        AND lower(coalesce(muc_do,'')) IN ('cao','nghiem_trong','nghiêm trọng','critical','high')
    ),0),
    'pm_hom_nay', COALESCE((
      SELECT count(*) FROM public.pm_cong_viec
      WHERE han = today AND trang_thai NOT IN ('hoan_thanh','bo_qua')
        AND (p_don_vi_ids IS NULL OR don_vi_id = ANY(p_don_vi_ids))
    ),0),
    'pm_qua_han', COALESCE((
      SELECT count(*) FROM public.pm_cong_viec
      WHERE han < today AND trang_thai NOT IN ('hoan_thanh','bo_qua')
        AND (p_don_vi_ids IS NULL OR don_vi_id = ANY(p_don_vi_ids))
    ),0),
    'han_7_ngay',
      COALESCE((SELECT count(*) FROM public.chung_chi_thiet_bi WHERE ngay_het_han BETWEEN today AND today + 7),0)
      + COALESCE((SELECT count(*) FROM public.giay_phep_khai_thac WHERE public._try_date(gp_han) BETWEEN today AND today + 7),0),
    'sap_het_han_30',
      COALESCE((SELECT count(*) FROM public.chung_chi_thiet_bi WHERE ngay_het_han BETWEEN today AND today + 30),0)
      + COALESCE((SELECT count(*) FROM public.giay_phep_khai_thac WHERE public._try_date(gp_han) BETWEEN today AND today + 30),0),
    'generated_at', now()
  );
END $$;


--
-- Name: dashboard_expiry_timeline(uuid[], integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboard_expiry_timeline(p_don_vi_ids uuid[] DEFAULT NULL::uuid[], p_days integer DEFAULT 90) RETURNS TABLE(loai text, ref_id uuid, ten text, ngay_het date, days_left integer)
    LANGUAGE sql STABLE
    AS $$
  SELECT 'giay_phep'::text, g.id, COALESCE(g.ten_he_thong_theo_gp, g.gp_so, 'Giấy phép'),
         public._try_date(g.gp_han), (public._try_date(g.gp_han) - CURRENT_DATE)::int
    FROM public.giay_phep_khai_thac g
   WHERE public._try_date(g.gp_han) IS NOT NULL
     AND public._try_date(g.gp_han) BETWEEN CURRENT_DATE - 30 AND CURRENT_DATE + p_days
  UNION ALL
  SELECT c.loai, c.id, ('CC ' || COALESCE(t.ma_thiet_bi, 'TB')),
         c.ngay_het_han, (c.ngay_het_han - CURRENT_DATE)::int
    FROM public.chung_chi_thiet_bi c LEFT JOIN public.thiet_bi t ON t.id = c.thiet_bi_id
   WHERE c.ngay_het_han IS NOT NULL
     AND c.ngay_het_han BETWEEN CURRENT_DATE - 30 AND CURRENT_DATE + p_days
   ORDER BY 5 ASC;
$$;


--
-- Name: dashboard_health(uuid[], date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboard_health(p_don_vi_ids uuid[] DEFAULT NULL::uuid[], p_from date DEFAULT (CURRENT_DATE - 30), p_to date DEFAULT CURRENT_DATE) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  span int := GREATEST((p_to - p_from), 1);
  prev_from date := p_from - span;
  prev_to date := p_from;
  mttr_h numeric; mtbf_h numeric; mttr_prev_h numeric;
  n_closed int; n_closed_prev int;
  n_open_time_h numeric; n_total_h numeric;
  n_gp_valid int; n_gp_total int; n_cc_valid int; n_cc_total int;
  today date := CURRENT_DATE;
BEGIN
  SELECT COALESCE(avg(EXTRACT(EPOCH FROM (thoi_diem_khac_phuc - ngay_phat_hien))/3600.0), 0), count(*)
    INTO mttr_h, n_closed FROM public.su_co
    WHERE thoi_diem_khac_phuc IS NOT NULL AND ngay_phat_hien::date BETWEEN p_from AND p_to;

  SELECT COALESCE(avg(EXTRACT(EPOCH FROM (thoi_diem_khac_phuc - ngay_phat_hien))/3600.0), 0), count(*)
    INTO mttr_prev_h, n_closed_prev FROM public.su_co
    WHERE thoi_diem_khac_phuc IS NOT NULL AND ngay_phat_hien::date BETWEEN prev_from AND prev_to;

  SELECT (span::numeric * 24.0 * GREATEST(count(*),1)) / GREATEST(n_closed,1)
    INTO mtbf_h FROM public.thiet_bi tb
    LEFT JOIN public.dm_trang_thai_thiet_bi t ON t.id = tb.trang_thai_id
    WHERE COALESCE(t.la_ngung_khai_thac,false) = false;

  WITH win AS (SELECT p_from::timestamp AS f, (p_to + 1)::timestamp AS t),
  segs AS (
    SELECT v.thiet_bi_id, v.thoi_diem AS seg_start,
           COALESCE(lead(v.thoi_diem) OVER (PARTITION BY v.thiet_bi_id ORDER BY v.thoi_diem), now()) AS seg_end,
           t.la_ngung_khai_thac AS ngung
      FROM public.thiet_bi_vong_doi v
      LEFT JOIN public.dm_trang_thai_thiet_bi t ON t.id = v.den_trang_thai_id
  )
  SELECT COALESCE(sum(EXTRACT(EPOCH FROM (LEAST(seg_end, (SELECT t FROM win)) - GREATEST(seg_start, (SELECT f FROM win))))/3600.0)
                    FILTER (WHERE ngung IS TRUE), 0),
         COALESCE(sum(EXTRACT(EPOCH FROM (LEAST(seg_end, (SELECT t FROM win)) - GREATEST(seg_start, (SELECT f FROM win))))/3600.0), 0)
    INTO n_open_time_h, n_total_h FROM segs
    WHERE seg_start < (SELECT t FROM win) AND seg_end > (SELECT f FROM win);

  SELECT count(*) FILTER (WHERE public._try_date(gp_han) >= today), count(*)
    INTO n_gp_valid, n_gp_total FROM public.giay_phep_khai_thac WHERE gp_han IS NOT NULL;
  SELECT count(*) FILTER (WHERE ngay_het_han >= today), count(*)
    INTO n_cc_valid, n_cc_total FROM public.chung_chi_thiet_bi WHERE ngay_het_han IS NOT NULL;

  RETURN jsonb_build_object(
    'availability_pct', CASE WHEN n_total_h > 0 THEN round((1.0 - n_open_time_h/n_total_h) * 100, 2) ELSE NULL END,
    'mtbf_h', round(mtbf_h::numeric, 1),
    'mttr_h', round(mttr_h::numeric, 2),
    'mttr_prev_h', round(mttr_prev_h::numeric, 2),
    'compliance_pct', CASE WHEN (n_gp_total + n_cc_total) > 0
                           THEN round(((n_gp_valid + n_cc_valid)::numeric / (n_gp_total + n_cc_total)) * 100, 1) ELSE NULL END,
    'n_closed', n_closed, 'n_closed_prev', n_closed_prev,
    'downtime_h', round(n_open_time_h::numeric, 1), 'total_h', round(n_total_h::numeric, 1),
    'period_days', span
  );
END $$;


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
-- Name: dashboard_su_co_heatmap(uuid[], integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboard_su_co_heatmap(p_don_vi_ids uuid[] DEFAULT NULL::uuid[], p_days integer DEFAULT 90) RETURNS TABLE(dow integer, hour integer, so_luong integer)
    LANGUAGE sql STABLE
    AS $$
  SELECT EXTRACT(DOW FROM (ngay_phat_hien AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int,
         EXTRACT(HOUR FROM (ngay_phat_hien AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int,
         count(*)::int
    FROM public.su_co
   WHERE ngay_phat_hien >= now() - make_interval(days => p_days)
   GROUP BY 1, 2 ORDER BY 1, 2;
$$;


--
-- Name: dashboard_top_he_thong_su_co(uuid[], integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboard_top_he_thong_su_co(p_don_vi_ids uuid[] DEFAULT NULL::uuid[], p_limit integer DEFAULT 5) RETURNS TABLE(he_thong_id uuid, ten_he_thong text, so_su_co_mo integer, mttr_h numeric)
    LANGUAGE sql STABLE
    AS $$
  SELECT s.he_thong_id,
         COALESCE(h.ten, s.he_thong, 'Không xác định'),
         count(*) FILTER (WHERE s.thoi_diem_khac_phuc IS NULL)::int,
         round(COALESCE(avg(EXTRACT(EPOCH FROM (s.thoi_diem_khac_phuc - s.ngay_phat_hien))/3600.0)
                        FILTER (WHERE s.thoi_diem_khac_phuc IS NOT NULL), 0)::numeric, 1)
    FROM public.su_co s LEFT JOIN public.dm_he_thong h ON h.id = s.he_thong_id
   WHERE s.he_thong_id IS NOT NULL AND s.ngay_phat_hien >= now() - interval '90 days'
   GROUP BY s.he_thong_id, COALESCE(h.ten, s.he_thong, 'Không xác định')
  HAVING count(*) FILTER (WHERE s.thoi_diem_khac_phuc IS NULL) > 0
   ORDER BY 3 DESC LIMIT p_limit;
$$;


--
-- Name: dashboard_top_thiet_bi_hong_lap(uuid[], integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboard_top_thiet_bi_hong_lap(p_don_vi_ids uuid[] DEFAULT NULL::uuid[], p_limit integer DEFAULT 5) RETURNS TABLE(thiet_bi_id uuid, ma text, ten text, so_lan integer, mttr_h numeric)
    LANGUAGE sql STABLE
    AS $$
  SELECT s.thiet_bi_id, t.ma_thiet_bi, t.ten_thiet_bi, count(*)::int,
         round(COALESCE(avg(EXTRACT(EPOCH FROM (s.thoi_diem_khac_phuc - s.ngay_phat_hien))/3600.0)
                        FILTER (WHERE s.thoi_diem_khac_phuc IS NOT NULL), 0)::numeric, 1)
    FROM public.su_co s LEFT JOIN public.thiet_bi t ON t.id = s.thiet_bi_id
   WHERE s.thiet_bi_id IS NOT NULL AND s.ngay_phat_hien >= now() - interval '90 days'
   GROUP BY s.thiet_bi_id, t.ma_thiet_bi, t.ten_thiet_bi
  HAVING count(*) >= 2
   ORDER BY 4 DESC, 5 DESC LIMIT p_limit;
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
-- Name: dot_bao_cao_tong_hop(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dot_bao_cao_tong_hop(p_dot_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v JSONB;
BEGIN
  SELECT jsonb_build_object(
    'tong', COUNT(*),
    'hoan_thanh', COUNT(*) FILTER (WHERE trang_thai='hoan_thanh'),
    'dat', COUNT(*) FILTER (WHERE ket_qua='dat'),
    'khong_dat', COUNT(*) FILTER (WHERE ket_qua='khong_dat'),
    'theo_don_vi', (
      SELECT jsonb_agg(row_to_json(x)) FROM (
        SELECT dv.id AS don_vi_id, dv.ten AS don_vi_ten, dv.ma AS don_vi_ma,
               COUNT(h.*) AS tong,
               COUNT(h.*) FILTER (WHERE h.trang_thai='hoan_thanh') AS hoan_thanh,
               COUNT(h.*) FILTER (WHERE h.ket_qua='dat') AS dat,
               COUNT(h.*) FILTER (WHERE h.ket_qua='khong_dat') AS khong_dat
        FROM public.dot_bao_duong_hang_muc h
        JOIN public.dm_don_vi dv ON dv.id = h.don_vi_id
        WHERE h.dot_id = p_dot_id
        GROUP BY dv.id, dv.ten, dv.ma
        ORDER BY dv.ma
      ) x
    ),
    'ton_tai', (
      SELECT jsonb_agg(row_to_json(y)) FROM (
        SELECT h.id, ht.ten AS he_thong_ten, dv.ten AS don_vi_ten, h.ton_tai, h.kien_nghi
        FROM public.dot_bao_duong_hang_muc h
        JOIN public.dm_he_thong ht ON ht.id = h.he_thong_id
        JOIN public.dm_don_vi dv ON dv.id = h.don_vi_id
        WHERE h.dot_id = p_dot_id AND (h.ton_tai IS NOT NULL AND h.ton_tai <> '')
        ORDER BY dv.ma
      ) y
    )
  ) INTO v
  FROM public.dot_bao_duong_hang_muc WHERE dot_id = p_dot_id;
  RETURN v;
END$$;


--
-- Name: dot_bao_duong_canh_bao(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dot_bao_duong_canh_bao(p_dot_id uuid, p_sap_han_ngay integer DEFAULT 3) RETURNS TABLE(don_vi_id uuid, don_vi_ma text, don_vi_ten text, han_ngay date, tong integer, hoan_thanh integer, cho_duyet integer, da_duyet integer, qua_han integer, sap_han integer, muc_do text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH items AS (
    SELECT hm.*,
           COALESCE(hm.han_hoan_thanh, h.han_ngay) AS eff_han
    FROM public.dot_bao_duong_hang_muc hm
    LEFT JOIN public.dot_bao_duong_han h
      ON h.dot_id = hm.dot_id AND h.don_vi_id = hm.don_vi_id
    WHERE hm.dot_id = p_dot_id
  ),
  agg AS (
    SELECT
      i.don_vi_id,
      MAX(i.eff_han) AS eff_han,
      COUNT(*)::int AS tong,
      COUNT(*) FILTER (WHERE i.trang_thai = 'hoan_thanh')::int AS hoan_thanh,
      COUNT(*) FILTER (WHERE i.duyet_trang_thai = 'cho_duyet')::int AS cho_duyet,
      COUNT(*) FILTER (WHERE i.duyet_trang_thai = 'da_duyet')::int AS da_duyet,
      COUNT(*) FILTER (WHERE i.eff_han IS NOT NULL
                         AND i.eff_han < CURRENT_DATE
                         AND i.duyet_trang_thai <> 'da_duyet'
                         AND i.trang_thai <> 'hoan_thanh')::int AS qua_han,
      COUNT(*) FILTER (WHERE i.eff_han IS NOT NULL
                         AND i.eff_han >= CURRENT_DATE
                         AND i.eff_han <= (CURRENT_DATE + (p_sap_han_ngay || ' days')::interval)::date
                         AND i.duyet_trang_thai <> 'da_duyet'
                         AND i.trang_thai <> 'hoan_thanh')::int AS sap_han
    FROM items i
    GROUP BY i.don_vi_id
  )
  SELECT
    a.don_vi_id,
    dv.ma AS don_vi_ma,
    dv.ten AS don_vi_ten,
    a.eff_han AS han_ngay,
    a.tong, a.hoan_thanh, a.cho_duyet, a.da_duyet,
    a.qua_han, a.sap_han,
    CASE
      WHEN a.qua_han > 0 THEN 'qua_han'
      WHEN a.sap_han > 0 THEN 'sap_han'
      WHEN a.tong > 0 AND a.tong = a.da_duyet THEN 'hoan_tat'
      ELSE 'on_track'
    END AS muc_do
  FROM agg a
  JOIN public.dm_don_vi dv ON dv.id = a.don_vi_id
  ORDER BY dv.ma;
$$;


--
-- Name: dot_hm_approve(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dot_hm_approve(p_hang_muc_id uuid, p_note text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF NOT (has_role(v_user,'admin') OR has_role(v_user,'phong_kt')) THEN
    RAISE EXCEPTION 'forbidden_only_kt';
  END IF;
  UPDATE public.dot_bao_duong_hang_muc
     SET duyet_trang_thai = 'da_duyet',
         approved_at = now(),
         approved_by = v_user,
         approval_note = p_note,
         trang_thai = CASE WHEN trang_thai::text = 'chua_bat_dau'
                           THEN 'hoan_thanh'::dot_bao_duong_hm_trang_thai
                           ELSE trang_thai END
   WHERE id = p_hang_muc_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'hang_muc_not_found'; END IF;
END; $$;


--
-- Name: dot_hm_reject(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dot_hm_reject(p_hang_muc_id uuid, p_note text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF NOT (has_role(v_user,'admin') OR has_role(v_user,'phong_kt')) THEN
    RAISE EXCEPTION 'forbidden_only_kt';
  END IF;
  UPDATE public.dot_bao_duong_hang_muc
     SET duyet_trang_thai = 'tu_choi',
         approval_note = p_note,
         approved_at = NULL,
         approved_by = NULL
   WHERE id = p_hang_muc_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'hang_muc_not_found'; END IF;
END; $$;


--
-- Name: dot_hm_submit(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dot_hm_submit(p_hang_muc_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_dv uuid; v_user uuid := auth.uid(); v_dot_status text; v_duyet text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT hm.don_vi_id, hm.duyet_trang_thai, d.trang_thai::text
    INTO v_dv, v_duyet, v_dot_status
  FROM public.dot_bao_duong_hang_muc hm
  JOIN public.dot_bao_duong d ON d.id = hm.dot_id
  WHERE hm.id = p_hang_muc_id;
  IF v_dv IS NULL THEN RAISE EXCEPTION 'hang_muc_not_found'; END IF;
  IF v_dot_status IN ('dong','huy') THEN RAISE EXCEPTION 'dot_closed'; END IF;
  IF v_duyet = 'da_duyet' THEN RAISE EXCEPTION 'already_approved'; END IF;
  IF NOT (has_role(v_user,'admin') OR has_role(v_user,'phong_kt')
          OR v_dv = get_user_don_vi_id(v_user)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.dot_bao_duong_hang_muc
     SET duyet_trang_thai = 'cho_duyet',
         submitted_at = now(),
         submitted_by = v_user
   WHERE id = p_hang_muc_id;
END; $$;


--
-- Name: dot_hm_unlock(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dot_hm_unlock(p_hang_muc_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF NOT has_role(v_user,'admin') THEN RAISE EXCEPTION 'forbidden_admin_only'; END IF;
  UPDATE public.dot_bao_duong_hang_muc
     SET duyet_trang_thai = 'chua_gui',
         approved_at = NULL, approved_by = NULL,
         submitted_at = NULL, submitted_by = NULL,
         approval_note = NULL
   WHERE id = p_hang_muc_id;
END; $$;


--
-- Name: dot_them_hang_muc_hang_loat(uuid, uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dot_them_hang_muc_hang_loat(p_dot_id uuid, p_don_vi_id uuid, p_he_thong_ids uuid[]) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_count INT := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt')
          OR p_don_vi_id = public.get_user_don_vi_id(auth.uid())) THEN
    RAISE EXCEPTION 'Không có quyền';
  END IF;
  INSERT INTO public.dot_bao_duong_hang_muc(dot_id, don_vi_id, he_thong_id, nguon)
  SELECT p_dot_id, p_don_vi_id, unnest(p_he_thong_ids),
    CASE WHEN public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt')
         THEN 'kt_khoi_tao'::public.dot_bao_duong_hm_nguon
         ELSE 'don_vi_bo_sung'::public.dot_bao_duong_hm_nguon END
  ON CONFLICT (dot_id, he_thong_id) DO NOTHING;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END$$;


--
-- Name: fsir_enrich(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fsir_enrich() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_item public.form_check_item%ROWTYPE;
  v_sub  public.form_submission%ROWTYPE;
  v_op   text;
  v_ok   boolean;
BEGIN
  -- Lấy metadata từ form_check_item (theo template + item_code)
  SELECT fci.* INTO v_item
  FROM public.form_check_item fci
  JOIN public.form_submission s ON s.id = NEW.submission_id
  WHERE fci.template_id = s.template_id AND fci.item_code = NEW.item_code
  LIMIT 1;

  IF FOUND THEN
    NEW.metric_key := COALESCE(NEW.metric_key, v_item.metric_key);
    NEW.nguong_min := COALESCE(NEW.nguong_min, v_item.nguong_min);
    NEW.nguong_max := COALESCE(NEW.nguong_max, v_item.nguong_max);
    NEW.nguong_op  := COALESCE(NEW.nguong_op,  v_item.nguong_op);
    NEW.don_vi     := COALESCE(NEW.don_vi,     v_item.don_vi);
    NEW.tieu_chuan := COALESCE(NEW.tieu_chuan, v_item.tieu_chuan);
  END IF;

  -- Kế thừa liên kết từ submission
  SELECT * INTO v_sub FROM public.form_submission WHERE id = NEW.submission_id;
  IF FOUND THEN
    NEW.thiet_bi_id  := COALESCE(NEW.thiet_bi_id,  v_sub.thiet_bi_id);
    NEW.he_thong_id  := COALESCE(NEW.he_thong_id,  v_sub.he_thong_id);
    NEW.don_vi_id    := COALESCE(NEW.don_vi_id,    v_sub.don_vi_id);
    NEW.submitted_at := COALESCE(NEW.submitted_at, v_sub.submitted_at, v_sub.created_at);
  END IF;

  -- Tự chấm Đạt/Không đạt nếu có giá trị số + ngưỡng và chưa có ket_qua
  IF NEW.ket_qua IS NULL
     AND NEW.result_kind = 'so'
     AND NEW.gia_tri_so IS NOT NULL
     AND (NEW.nguong_min IS NOT NULL OR NEW.nguong_max IS NOT NULL) THEN
    v_op := COALESCE(NEW.nguong_op, 'between');
    v_ok := CASE v_op
      WHEN 'ge' THEN NEW.nguong_min IS NULL OR NEW.gia_tri_so >= NEW.nguong_min
      WHEN 'le' THEN NEW.nguong_max IS NULL OR NEW.gia_tri_so <= NEW.nguong_max
      WHEN 'eq' THEN NEW.nguong_min IS NOT NULL AND NEW.gia_tri_so = NEW.nguong_min
      ELSE (NEW.nguong_min IS NULL OR NEW.gia_tri_so >= NEW.nguong_min)
       AND (NEW.nguong_max IS NULL OR NEW.gia_tri_so <= NEW.nguong_max)
    END;
    NEW.ket_qua := CASE WHEN v_ok THEN 'dat'::form_ket_qua ELSE 'khong_dat'::form_ket_qua END;
    NEW.auto_ket_qua := true;
  END IF;

  RETURN NEW;
END$$;


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
-- Name: get_completeness_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_completeness_stats() RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'avg_thiet_bi', ROUND(AVG(completeness_pct)),
    'avg_he_thong', (SELECT ROUND(AVG(completeness_pct)) FROM public.dm_he_thong),
    'total_tb', COUNT(*),
    'low_pct_tb', COUNT(*) FILTER (WHERE completeness_pct < 50),
    'perfect_tb', COUNT(*) FILTER (WHERE completeness_pct = 100),
    'total_tasks', (SELECT COUNT(*) FROM public.nhiem_vu_nhap_lieu WHERE trang_thai = 'moi'),
    'top_contributors', (
      SELECT jsonb_agg(sub) FROM (
        SELECT user_id, SUM(diem) as total_diem 
        FROM public.dong_gop_diem 
        GROUP BY user_id 
        ORDER BY total_diem DESC 
        LIMIT 5
      ) sub
    )
  ) INTO v_result
  FROM public.thiet_bi;
  
  RETURN v_result;
END;
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
-- Name: ghi_bao_duong_atomic(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ghi_bao_duong_atomic(p_payload jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_sub jsonb := p_payload->'submission';
  v_sub_id uuid;
  v_dev jsonb; v_it jsonb; v_vt jsonb;
  v_i int := 0; v_id uuid; v_ids uuid[] := '{}';
  v_ma_base text := nullif(p_payload->>'ma_base','');
  v_nguoi text[];
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập'; END IF;
  IF has_role(v_uid, 'readonly'::app_role) AND NOT has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Tài khoản chỉ đọc không được ghi bảo dưỡng';
  END IF;
  IF v_sub IS NULL THEN RAISE EXCEPTION 'Thiếu submission'; END IF;
  IF v_ma_base IS NULL THEN RAISE EXCEPTION 'Thiếu ma_base'; END IF;

  IF jsonb_typeof(p_payload->'nguoi_thuc_hien') = 'array' THEN
    SELECT array_agg(x) INTO v_nguoi FROM jsonb_array_elements_text(p_payload->'nguoi_thuc_hien') x;
  ELSE
    v_nguoi := ARRAY[coalesce(p_payload->>'nguoi_thuc_hien','')];
  END IF;

  INSERT INTO public.form_submission (
    template_id, template_code, template_version, template_version_id, template_snapshot,
    he_thong_id, tieu_de, data, status, submitted_at, created_by
  ) VALUES (
    (v_sub->>'template_id')::uuid,
    v_sub->>'template_code',
    coalesce((v_sub->>'template_version')::int, 1),
    nullif(v_sub->>'template_version_id','')::uuid,
    v_sub->'template_snapshot',
    nullif(v_sub->>'he_thong_id','')::uuid,
    v_sub->>'tieu_de',
    coalesce(v_sub->'data', '{}'::jsonb),
    'submitted'::form_submission_status,
    coalesce(nullif(v_sub->>'submitted_at','')::timestamptz, now()),
    v_uid
  ) RETURNING id INTO v_sub_id;

  FOR v_dev IN SELECT * FROM jsonb_array_elements(coalesce(p_payload->'devices','[]'::jsonb)) LOOP
    v_i := v_i + 1;
    INSERT INTO public.form_submission_thiet_bi (submission_id, thiet_bi_id)
    VALUES (v_sub_id, (v_dev->>'id')::uuid) ON CONFLICT DO NOTHING;

    INSERT INTO public.bao_tri (
      ma_bao_tri, thiet_bi, thiet_bi_id, he_thong, he_thong_id, don_vi,
      loai_bao_tri, ngay_bat_dau, ngay_hoan_thanh, ket_qua, trang_thai,
      nguoi_thuc_hien, don_vi_thuc_hien, mo_ta_cong_viec
    ) VALUES (
      v_ma_base || '-' || lpad(v_i::text, 2, '0'),
      v_dev->>'ma_thiet_bi',
      nullif(v_dev->>'id','')::uuid,
      nullif(p_payload->>'he_thong_ten',''),
      nullif(v_sub->>'he_thong_id','')::uuid,
      nullif(v_dev->>'don_vi',''),
      nullif(p_payload->>'loai_bao_tri',''),
      nullif(p_payload->>'ngay_bat_dau','')::date,
      nullif(p_payload->>'ngay_hoan_thanh','')::date,
      nullif(p_payload->>'ket_qua',''),
      nullif(p_payload->>'trang_thai',''),
      v_nguoi,
      nullif(p_payload->>'don_vi_thuc_hien',''),
      nullif(p_payload->>'mo_ta_cong_viec','')
    ) RETURNING id INTO v_id;
    v_ids := v_ids || v_id;
  END LOOP;

  FOR v_it IN SELECT * FROM jsonb_array_elements(coalesce(p_payload->'item_results','[]'::jsonb)) LOOP
    INSERT INTO public.form_submission_item_result (
      submission_id, section_code, section_ten, item_code, ten, result_kind,
      gia_tri_so, gia_tri_text, don_vi, tieu_chuan, ket_qua, ghi_chu, hanh_dong,
      position, metric_key, nguong_min, nguong_max, nguong_op,
      thanh_phan_id, thiet_bi_id, he_thong_id, submitted_at
    ) VALUES (
      v_sub_id,
      coalesce(v_it->>'section_code',''),
      nullif(v_it->>'section_ten',''),
      coalesce(v_it->>'item_code',''),
      coalesce(v_it->>'ten',''),
      coalesce(nullif(v_it->>'result_kind',''), 'text')::form_result_kind,
      nullif(v_it->>'gia_tri_so','')::numeric,
      nullif(v_it->>'gia_tri_text',''),
      nullif(v_it->>'don_vi',''),
      nullif(v_it->>'tieu_chuan',''),
      nullif(v_it->>'ket_qua','')::form_ket_qua,
      nullif(v_it->>'ghi_chu',''),
      nullif(v_it->>'hanh_dong',''),
      nullif(v_it->>'position','')::int,
      nullif(v_it->>'metric_key',''),
      nullif(v_it->>'nguong_min','')::numeric,
      nullif(v_it->>'nguong_max','')::numeric,
      nullif(v_it->>'nguong_op',''),
      nullif(v_it->>'thanh_phan_id','')::uuid,
      nullif(v_it->>'thiet_bi_id','')::uuid,
      nullif(v_it->>'he_thong_id','')::uuid,
      now()
    );
  END LOOP;

  FOR v_vt IN SELECT * FROM jsonb_array_elements(coalesce(p_payload->'vat_tu','[]'::jsonb)) LOOP
    PERFORM kho_xuat((v_vt->>'vat_tu_id')::uuid, (v_vt->>'kho_id')::uuid,
                     (v_vt->>'so_luong')::numeric, NULL,
                     'Tiêu hao khi bảo dưỡng ' || v_ma_base, NULL, NULL, NULL, false);
  END LOOP;

  INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
  VALUES (v_uid, 'ghi_bao_duong', 'form_submission', v_sub_id::text,
          jsonb_build_object('nguon_nhap','khai_form','ma_base',v_ma_base,'bao_tri_ids',to_jsonb(v_ids)));

  RETURN jsonb_build_object('submission_id', v_sub_id, 'bao_tri_ids', to_jsonb(coalesce(v_ids,'{}'::uuid[])));
END;
$$;


--
-- Name: ghi_bao_duong_atomic(uuid, text, timestamp with time zone, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ghi_bao_duong_atomic(p_thiet_bi_id uuid, p_mo_ta text, p_ngay_bat_dau timestamp with time zone DEFAULT NULL::timestamp with time zone, p_vat_tu jsonb DEFAULT '[]'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tb record; v_id uuid; v_vt jsonb; v_ma text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập'; END IF;
  SELECT ma_thiet_bi, don_vi, he_thong_id INTO v_tb FROM public.thiet_bi WHERE id = p_thiet_bi_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy tài sản %', p_thiet_bi_id; END IF;
  v_ma := 'BD-' || to_char(coalesce(p_ngay_bat_dau, now()), 'YYYYMMDDHH24MISS') || '-' || left(replace(p_thiet_bi_id::text,'-',''), 6);

  INSERT INTO public.bao_tri (ma_bao_tri, thiet_bi, thiet_bi_id, don_vi, he_thong_id,
                              ngay_bat_dau, mo_ta_cong_viec, trang_thai)
  VALUES (v_ma, v_tb.ma_thiet_bi, p_thiet_bi_id, v_tb.don_vi, v_tb.he_thong_id,
          coalesce(p_ngay_bat_dau, now())::date, p_mo_ta, 'Đang thực hiện')
  RETURNING id INTO v_id;

  FOR v_vt IN SELECT * FROM jsonb_array_elements(coalesce(p_vat_tu,'[]'::jsonb)) LOOP
    PERFORM kho_xuat((v_vt->>'vat_tu_id')::uuid, (v_vt->>'kho_id')::uuid,
                     (v_vt->>'so_luong')::numeric, NULL, 'Tiêu hao khi bảo dưỡng ' || v_ma, NULL, NULL, NULL, false);
  END LOOP;

  INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
  VALUES (v_uid, 'ghi_bao_duong', 'bao_tri', v_id::text, jsonb_build_object('nguon_nhap','khai_form'));
  RETURN v_id;
END;
$$;


--
-- Name: ghi_hong_hoc_atomic(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ghi_hong_hoc_atomic(p_payload jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_ma text := nullif(p_payload->>'ma_hong_hoc','');
  v_tbid uuid; v_id uuid; v_ids uuid[] := '{}'; v_i int := 0;
  v_vt jsonb; v_ma_tb text; v_don_vi text; v_nguoi text[];
  v_tt_ma text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập'; END IF;
  IF has_role(v_uid, 'readonly'::app_role) AND NOT has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Tài khoản chỉ đọc không được ghi hỏng hóc';
  END IF;
  IF v_ma IS NULL THEN RAISE EXCEPTION 'Thiếu ma_hong_hoc'; END IF;

  SELECT array_agg(x) INTO v_nguoi
    FROM jsonb_array_elements_text(coalesce(p_payload->'nguoi_thuc_hien','[]'::jsonb)) x;

  SELECT ma_thiet_bi INTO v_tt_ma FROM public.thiet_bi
   WHERE id = nullif(p_payload->>'thiet_bi_thay_the_id','')::uuid;

  FOR v_tbid IN SELECT (x)::uuid FROM jsonb_array_elements_text(coalesce(p_payload->'thiet_bi_hong_ids','[]'::jsonb)) x LOOP
    v_i := v_i + 1;
    SELECT ma_thiet_bi, don_vi INTO v_ma_tb, v_don_vi FROM public.thiet_bi WHERE id = v_tbid;
    INSERT INTO public.hong_hoc (
      ma_hong_hoc, thiet_bi_hong, thiet_bi_hong_id, he_thong_id, thanh_phan_id,
      su_co, ngay_hong, bo_phan_hong, mo_ta_hong_hoc, phuong_an,
      thiet_bi_thay_the, thiet_bi_thay_the_id, nguoi_thuc_hien, don_vi_thuc_hien,
      trang_thai, nguoi_bao_cao_id, at_bao_cao
    ) VALUES (
      CASE WHEN v_i = 1 THEN v_ma ELSE v_ma || '-' || lpad(v_i::text,2,'0') END,
      coalesce(v_ma_tb, v_tbid::text), v_tbid,
      nullif(p_payload->>'he_thong_id','')::uuid,
      nullif(p_payload->>'thanh_phan_id','')::uuid,
      nullif(p_payload->>'su_co',''),
      nullif(p_payload->>'ngay_hong','')::date,
      nullif(p_payload->>'bo_phan_hong',''),
      nullif(p_payload->>'mo_ta_hong_hoc',''),
      nullif(p_payload->>'phuong_an',''),
      v_tt_ma,
      nullif(p_payload->>'thiet_bi_thay_the_id','')::uuid,
      coalesce(v_nguoi, '{}'::text[]),
      v_don_vi,
      coalesce(nullif(p_payload->>'trang_thai',''), 'Mới'),
      v_uid, now()
    ) RETURNING id INTO v_id;
    v_ids := v_ids || v_id;
  END LOOP;

  IF array_length(v_ids,1) IS NULL THEN
    RAISE EXCEPTION 'Không có tài sản hỏng nào để ghi';
  END IF;

  FOR v_vt IN SELECT * FROM jsonb_array_elements(coalesce(p_payload->'vat_tu','[]'::jsonb)) LOOP
    PERFORM kho_xuat((v_vt->>'vat_tu_id')::uuid, (v_vt->>'kho_id')::uuid,
                     (v_vt->>'so_luong')::numeric, NULL, 'Tiêu hao khi ghi hỏng hóc ' || v_ma,
                     NULL, NULL, v_ids[1], false);
  END LOOP;

  INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
  VALUES (v_uid, 'ghi_hong_hoc', 'hong_hoc', v_ids[1]::text,
          jsonb_build_object('nguon_nhap','khai_form','ma_hong_hoc',v_ma,'ids',to_jsonb(v_ids)));

  RETURN jsonb_build_object('ids', to_jsonb(v_ids), 'ma_hong_hoc', v_ma);
END;
$$;


--
-- Name: ghi_hong_hoc_atomic(uuid, text, timestamp with time zone, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ghi_hong_hoc_atomic(p_thiet_bi_id uuid, p_mo_ta_hong_hoc text, p_ngay_hong timestamp with time zone DEFAULT NULL::timestamp with time zone, p_vat_tu jsonb DEFAULT '[]'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tb record; v_id uuid; v_vt jsonb; v_ma text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập'; END IF;
  SELECT ma_thiet_bi, don_vi, he_thong_id INTO v_tb FROM public.thiet_bi WHERE id = p_thiet_bi_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy tài sản %', p_thiet_bi_id; END IF;
  v_ma := 'HH-' || to_char(coalesce(p_ngay_hong, now()), 'YYYYMMDDHH24MISS') || '-' || left(replace(p_thiet_bi_id::text,'-',''), 6);

  INSERT INTO public.hong_hoc (ma_hong_hoc, thiet_bi_hong, thiet_bi_hong_id, he_thong_id,
                               ngay_hong, mo_ta_hong_hoc, trang_thai, don_vi_thuc_hien,
                               nguoi_bao_cao_id, at_bao_cao)
  VALUES (v_ma, v_tb.ma_thiet_bi, p_thiet_bi_id, v_tb.he_thong_id,
          coalesce(p_ngay_hong, now())::date, p_mo_ta_hong_hoc, 'Mới', v_tb.don_vi, v_uid, now())
  RETURNING id INTO v_id;

  FOR v_vt IN SELECT * FROM jsonb_array_elements(coalesce(p_vat_tu,'[]'::jsonb)) LOOP
    PERFORM kho_xuat((v_vt->>'vat_tu_id')::uuid, (v_vt->>'kho_id')::uuid,
                     (v_vt->>'so_luong')::numeric, NULL, 'Tiêu hao khi ghi hỏng hóc ' || v_ma, NULL, NULL, v_id, false);
  END LOOP;

  INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
  VALUES (v_uid, 'ghi_hong_hoc', 'hong_hoc', v_id::text, jsonb_build_object('nguon_nhap','khai_form'));
  RETURN v_id;
END;
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
-- Name: ghi_su_co_atomic(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ghi_su_co_atomic(p_payload jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_ma_nhom text := nullif(p_payload->>'ma_nhom_bc','');
  v_dev jsonb;
  v_vt jsonb;
  v_i int := 0;
  v_id uuid;
  v_ids uuid[] := '{}';
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập'; END IF;
  IF has_role(v_uid, 'readonly'::app_role) AND NOT has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Tài khoản chỉ đọc không được ghi sự cố';
  END IF;
  IF v_ma_nhom IS NULL THEN RAISE EXCEPTION 'Thiếu ma_nhom_bc'; END IF;

  FOR v_dev IN SELECT * FROM jsonb_array_elements(coalesce(p_payload->'devices','[]'::jsonb)) LOOP
    v_i := v_i + 1;
    INSERT INTO public.su_co (
      ma_su_co, thiet_bi, thiet_bi_id, he_thong, he_thong_id, don_vi,
      ngay_phat_hien, nguoi_bao_cao, muc_do, anh_huong_dhb, hien_tuong,
      nguyen_nhan, bien_phap_xu_ly, trang_thai, ma_nhom_bc, bao_cao_ban_dau,
      van_de_id, nguoi_bao_cao_id, at_bao_cao
    ) VALUES (
      v_ma_nhom || '-' || lpad(v_i::text, 2, '0'),
      v_dev->>'ma_thiet_bi',
      nullif(v_dev->>'id','')::uuid,
      nullif(v_dev->>'he_thong_ten',''),
      nullif(v_dev->>'he_thong_id','')::uuid,
      nullif(v_dev->>'don_vi',''),
      coalesce(nullif(p_payload->>'ngay_phat_hien','')::timestamptz, now()),
      nullif(p_payload->>'nguoi_bao_cao',''),
      nullif(p_payload->>'muc_do',''),
      nullif(p_payload->>'anh_huong_dhb',''),
      nullif(p_payload->>'hien_tuong',''),
      nullif(p_payload->>'nguyen_nhan',''),
      nullif(p_payload->>'bien_phap_xu_ly',''),
      coalesce(nullif(p_payload->>'trang_thai',''), 'Mới'),
      v_ma_nhom,
      p_payload->'bao_cao_ban_dau',
      nullif(p_payload->>'van_de_id','')::uuid,
      v_uid,
      now()
    ) RETURNING id INTO v_id;
    v_ids := v_ids || v_id;
  END LOOP;

  IF array_length(v_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Không có tài sản nào để ghi sự cố';
  END IF;

  FOR v_vt IN SELECT * FROM jsonb_array_elements(coalesce(p_payload->'vat_tu','[]'::jsonb)) LOOP
    PERFORM kho_xuat(
      (v_vt->>'vat_tu_id')::uuid,
      (v_vt->>'kho_id')::uuid,
      (v_vt->>'so_luong')::numeric,
      NULL, 'Tiêu hao khi ghi sự cố ' || v_ma_nhom, NULL, v_ids[1], NULL, false
    );
  END LOOP;

  INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
  VALUES (v_uid, 'ghi_su_co', 'su_co', v_ids[1]::text,
          jsonb_build_object('nguon_nhap','khai_form','ma_nhom_bc',v_ma_nhom,'ids',to_jsonb(v_ids)));

  RETURN jsonb_build_object('ids', to_jsonb(v_ids), 'ma_nhom_bc', v_ma_nhom);
END;
$$;


--
-- Name: ghi_su_co_atomic(uuid, text, timestamp with time zone, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ghi_su_co_atomic(p_thiet_bi_id uuid, p_hien_tuong text, p_ngay_phat_hien timestamp with time zone DEFAULT NULL::timestamp with time zone, p_vat_tu jsonb DEFAULT '[]'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tb record;
  v_id uuid;
  v_vt jsonb;
  v_ma text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập'; END IF;
  SELECT ma_thiet_bi, don_vi, he_thong_id INTO v_tb FROM public.thiet_bi WHERE id = p_thiet_bi_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy tài sản %', p_thiet_bi_id; END IF;

  v_ma := 'SC-' || to_char(coalesce(p_ngay_phat_hien, now()), 'YYYYMMDDHH24MISS') || '-' || left(replace(p_thiet_bi_id::text,'-',''), 6);

  INSERT INTO public.su_co (ma_su_co, thiet_bi, thiet_bi_id, don_vi, he_thong_id,
                            ngay_phat_hien, hien_tuong, trang_thai, nguoi_bao_cao_id, at_bao_cao)
  VALUES (v_ma, v_tb.ma_thiet_bi, p_thiet_bi_id, v_tb.don_vi, v_tb.he_thong_id,
          coalesce(p_ngay_phat_hien, now()), p_hien_tuong, 'Mới', v_uid, now())
  RETURNING id INTO v_id;

  FOR v_vt IN SELECT * FROM jsonb_array_elements(coalesce(p_vat_tu,'[]'::jsonb)) LOOP
    PERFORM kho_xuat((v_vt->>'vat_tu_id')::uuid, (v_vt->>'kho_id')::uuid,
                     (v_vt->>'so_luong')::numeric, NULL, 'Tiêu hao khi ghi sự cố ' || v_ma,
                     NULL, v_id, NULL, false);
  END LOOP;

  INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
  VALUES (v_uid, 'ghi_su_co', 'su_co', v_id::text, jsonb_build_object('nguon_nhap','khai_form'));

  RETURN v_id;
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
-- Name: metric_summary(text, timestamp with time zone, timestamp with time zone, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.metric_summary(_metric_key text, _from timestamp with time zone DEFAULT NULL::timestamp with time zone, _to timestamp with time zone DEFAULT NULL::timestamp with time zone, _he_thong_id uuid DEFAULT NULL::uuid) RETURNS TABLE(n_samples bigint, n_dat bigint, n_khong_dat bigint, pct_dat numeric, gt_min numeric, gt_max numeric, gt_avg numeric, gt_p95 numeric)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE ket_qua = 'dat')::bigint,
    COUNT(*) FILTER (WHERE ket_qua = 'khong_dat')::bigint,
    ROUND(100.0 * COUNT(*) FILTER (WHERE ket_qua = 'dat')
      / NULLIF(COUNT(*) FILTER (WHERE ket_qua IN ('dat','khong_dat')), 0), 2),
    MIN(gia_tri_so),
    MAX(gia_tri_so),
    ROUND(AVG(gia_tri_so)::numeric, 4),
    percentile_cont(0.95) WITHIN GROUP (ORDER BY gia_tri_so)::numeric
  FROM public.v_metric_timeseries
  WHERE metric_key = _metric_key
    AND (_from IS NULL OR thoi_diem >= _from)
    AND (_to   IS NULL OR thoi_diem <= _to)
    AND (_he_thong_id IS NULL OR he_thong_id = _he_thong_id);
$$;


--
-- Name: mirats_ddl_dong_bo(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mirats_ddl_dong_bo() RETURNS text[]
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v text[] := '{}';
  r record;
  v_cols text;
  v_pk text;
  v_fn text[] := '{}';
BEGIN
  v := v || ARRAY['CREATE SCHEMA IF NOT EXISTS extensions'];
  FOR r IN
    SELECT e.extname, n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname NOT IN ('plpgsql')
  LOOP
    v := v || format('CREATE EXTENSION IF NOT EXISTS %I WITH SCHEMA %I', r.extname, r.nspname);
  END LOOP;

  FOR r IN
    SELECT t.typname,
           string_agg(quote_literal(el.enumlabel), ', ' ORDER BY el.enumsortorder) AS labels
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    JOIN pg_enum el ON el.enumtypid = t.oid
    WHERE n.nspname = 'public' AND t.typtype = 'e'
    GROUP BY t.typname
  LOOP
    v := v || format(
      'DO $mig$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname=''public'' AND t.typname=%L) THEN CREATE TYPE public.%I AS ENUM (%s); END IF; END $mig$;',
      r.typname, r.typname, r.labels);
  END LOOP;

  FOR r IN
    SELECT pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
      AND p.proname NOT LIKE 'mirats\_%'
  LOOP
    v_fn := v_fn || r.def;
  END LOOP;
  v := v || v_fn;

  FOR r IN
    SELECT c.oid, c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname
  LOOP
    SELECT string_agg(
      format('%I %s%s%s', a.attname, format_type(a.atttypid, a.atttypmod),
             CASE WHEN d.adbin IS NOT NULL THEN ' DEFAULT ' || pg_get_expr(d.adbin, d.adrelid) ELSE '' END,
             CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END),
      ', ' ORDER BY a.attnum)
    INTO v_cols
    FROM pg_attribute a
    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    WHERE a.attrelid = r.oid AND a.attnum > 0 AND NOT a.attisdropped;

    SELECT string_agg(quote_ident(att.attname), ', ' ORDER BY k.ord)
    INTO v_pk
    FROM pg_constraint pc
    CROSS JOIN LATERAL unnest(pc.conkey) WITH ORDINALITY AS k(attnum, ord)
    JOIN pg_attribute att ON att.attrelid = r.oid AND att.attnum = k.attnum
    WHERE pc.conrelid = r.oid AND pc.contype = 'p';

    v := v || format('CREATE TABLE IF NOT EXISTS public.%I (%s%s)', r.relname, v_cols,
                     CASE WHEN v_pk IS NOT NULL THEN format(', PRIMARY KEY (%s)', v_pk) ELSE '' END);

    FOR v_cols IN
      SELECT format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %I %s%s', r.relname, a.attname,
                    format_type(a.atttypid, a.atttypmod),
                    CASE WHEN d.adbin IS NOT NULL THEN ' DEFAULT ' || pg_get_expr(d.adbin, d.adrelid) ELSE '' END)
      FROM pg_attribute a
      LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
      WHERE a.attrelid = r.oid AND a.attnum > 0 AND NOT a.attisdropped
    LOOP
      v := v || v_cols;
    END LOOP;

    v := v || format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', r.relname);
    v := v || format('GRANT ALL ON public.%I TO service_role', r.relname);
  END LOOP;

  v := v || v_fn;

  FOR r IN
    SELECT c.relname, c.relrowsecurity
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
  LOOP
    v := v || format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
  END LOOP;

  FOR r IN SELECT * FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname
  LOOP
    v := v || format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    v := v || format('CREATE POLICY %I ON public.%I AS %s FOR %s TO %s%s%s',
      r.policyname, r.tablename,
      CASE WHEN r.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      r.cmd,
      array_to_string(r.roles, ', '),
      CASE WHEN r.qual IS NOT NULL THEN format(' USING (%s)', r.qual) ELSE '' END,
      CASE WHEN r.with_check IS NOT NULL THEN format(' WITH CHECK (%s)', r.with_check) ELSE '' END);
  END LOOP;

  RETURN v;
END;
$_$;


--
-- Name: mirats_schema_snapshot(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mirats_schema_snapshot() RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT jsonb_build_object(
    'extensions', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('name', e.extname, 'schema', n.nspname) ORDER BY e.extname), '[]'::jsonb)
      FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
      WHERE e.extname NOT IN ('plpgsql')
    ),
    'enums', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', t.typname,
        'labels', (SELECT jsonb_agg(el.enumlabel ORDER BY el.enumsortorder) FROM pg_enum el WHERE el.enumtypid = t.oid)
      ) ORDER BY t.typname), '[]'::jsonb)
      FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typtype = 'e'
    ),
    'tables', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', c.relname,
        'rls', c.relrowsecurity,
        'columns', (
          SELECT jsonb_agg(jsonb_build_object(
            'name', a.attname,
            'type', format_type(a.atttypid, a.atttypmod),
            'nullable', NOT a.attnotnull,
            'default', pg_get_expr(d.adbin, d.adrelid),
            'is_pk', COALESCE(a.attnum = ANY (pk.conkey), false)
          ) ORDER BY a.attnum)
          FROM pg_attribute a
          LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
          WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
        ),
        'pk', (SELECT COALESCE(jsonb_agg(att.attname ORDER BY att.attnum), '[]'::jsonb)
               FROM unnest(COALESCE(pk.conkey, '{}'::smallint[])) k
               JOIN pg_attribute att ON att.attrelid = c.oid AND att.attnum = k)
      ) ORDER BY c.relname), '[]'::jsonb)
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_constraint pk ON pk.conrelid = c.oid AND pk.contype = 'p'
      WHERE n.nspname = 'public' AND c.relkind = 'r'
    ),
    'policies', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'table', p.tablename, 'name', p.policyname, 'cmd', p.cmd,
        'roles', p.roles, 'using', p.qual, 'check', p.with_check, 'permissive', p.permissive
      ) ORDER BY p.tablename, p.policyname), '[]'::jsonb)
      FROM pg_policies p WHERE p.schemaname = 'public'
    )
  );
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
-- Name: pmbq_auto_ma(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pmbq_auto_ma() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.ma_ban_quyen IS NULL OR NEW.ma_ban_quyen = '' THEN
    NEW.ma_ban_quyen := 'BQ_' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: pmbq_check_seats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pmbq_check_seats() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_so_ghe int;
  v_dang_dung int;
BEGIN
  IF NEW.ngay_thu_hoi IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Khóa hàng bản quyền để tránh race condition
  SELECT so_ghe INTO v_so_ghe 
  FROM public.phan_mem_ban_quyen 
  WHERE id = NEW.ban_quyen_id 
  FOR UPDATE;

  IF v_so_ghe IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_dang_dung
  FROM public.phan_mem_ban_quyen_cap_phat
  WHERE ban_quyen_id = NEW.ban_quyen_id
    AND ngay_thu_hoi IS NULL
    AND id IS DISTINCT FROM NEW.id;

  IF v_dang_dung >= v_so_ghe THEN
    RAISE EXCEPTION 'Bản quyền đã dùng hết % ghế, không thể cấp phát thêm', v_so_ghe;
  END IF;
  
  RETURN NEW;
END;
$$;


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
-- Name: storage_don_vi_allowed(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.storage_don_vi_allowed(_bucket text, _name text) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid uuid := public.current_uid();
  v_dv_id uuid;
  v_dv_ma text;
  v_found boolean := false;
  v_ok boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;
  -- Quản lý thiết bị / admin: xem toàn bộ
  IF public.can_manage_equipment(v_uid) THEN
    RETURN true;
  END IF;
  v_dv_id := public.get_user_don_vi_id(v_uid);
  v_dv_ma := public.get_user_don_vi_ma(v_uid);

  IF _bucket IN ('thiet-bi-tai-lieu', 'thiet-bi-hinh-anh') THEN
    SELECT true, bool_or(tb.don_vi_id IS NOT DISTINCT FROM v_dv_id)
      INTO v_found, v_ok
      FROM public.thiet_bi_tep_dinh_kem t
      JOIN public.thiet_bi tb ON tb.id = t.thiet_bi_id
     WHERE t.file_path = _name OR t.file_path LIKE '%' || _name;

  ELSIF _bucket = 'su-co-images' THEN
    SELECT true, bool_or(s.don_vi IS NOT DISTINCT FROM v_dv_ma)
      INTO v_found, v_ok
      FROM public.su_co s
     WHERE s.file_dinh_kem = _name OR s.file_dinh_kem LIKE '%' || _name;

  ELSIF _bucket = 'vi-tri-media' THEN
    SELECT true, bool_or(m.don_vi IS NOT DISTINCT FROM v_dv_ma)
      INTO v_found, v_ok
      FROM public.vi_tri_media m
     WHERE m.duong_dan = _name OR m.duong_dan LIKE '%' || _name;

  ELSIF _bucket IN ('form-pdf', 'form-attachments') THEN
    SELECT true, bool_or(f.don_vi_id IS NOT DISTINCT FROM v_dv_id)
      INTO v_found, v_ok
      FROM public.form_submission f
     WHERE f.pdf_path = _name OR f.pdf_path LIKE '%' || _name;

  ELSIF _bucket = 'du-an-cong-van' THEN
    SELECT true, bool_or(public.can_access_du_an(cv.du_an_id))
      INTO v_found, v_ok
      FROM public.du_an_cong_van_tep t
      JOIN public.du_an_cong_van cv ON cv.id = t.cong_van_id
     WHERE t.file_path = _name OR t.file_path LIKE '%' || _name;
  END IF;

  -- Không tìm thấy bản ghi tham chiếu (tệp mồ côi / vừa tải lên) → chỉ quản lý xem.
  IF v_found IS NOT TRUE THEN
    RETURN false;
  END IF;
  RETURN COALESCE(v_ok, false);
END;
$$;


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
-- Name: thanh_phan_kpi(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.thanh_phan_kpi(_tp_id uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $$
DECLARE
  v_so_su_co_12m int := 0;
  v_so_su_co_mo  int := 0;
  v_so_bao_tri_12m int := 0;
  v_so_hong_hoc  int := 0;
  v_so_gan_tong  int := 0;
  v_so_gan_active int := 0;
  v_mtbf_days   numeric;
  v_mttr_hours  numeric;
  v_ti_le_dat   numeric;
  v_by_month    jsonb;
BEGIN
  IF _tp_id IS NULL THEN RETURN '{}'::jsonb; END IF;

  -- Sự cố: đếm trong 12 tháng + đang mở.
  SELECT
    count(*) FILTER (WHERE ngay_phat_hien >= (now() - interval '12 months')),
    count(*) FILTER (WHERE trang_thai IN ('moi','dang_xu_ly') OR thoi_diem_khac_phuc IS NULL)
  INTO v_so_su_co_12m, v_so_su_co_mo
  FROM su_co WHERE thanh_phan_id = _tp_id;

  -- MTBF (ngày) = khoảng giữa các lần sự cố trong 12 tháng.
  SELECT CASE WHEN count(*) > 1
      THEN EXTRACT(EPOCH FROM (max(ngay_phat_hien) - min(ngay_phat_hien))) / 86400.0 / (count(*) - 1)
      ELSE NULL END
  INTO v_mtbf_days
  FROM su_co
  WHERE thanh_phan_id = _tp_id
    AND ngay_phat_hien >= (now() - interval '12 months');

  -- MTTR (giờ) = thời gian TB từ phát hiện đến khắc phục.
  SELECT avg(EXTRACT(EPOCH FROM (thoi_diem_khac_phuc - ngay_phat_hien)) / 3600.0)
  INTO v_mttr_hours
  FROM su_co
  WHERE thanh_phan_id = _tp_id
    AND thoi_diem_khac_phuc IS NOT NULL
    AND ngay_phat_hien IS NOT NULL
    AND ngay_phat_hien >= (now() - interval '12 months');

  -- Bảo dưỡng 12 tháng.
  SELECT count(*) INTO v_so_bao_tri_12m
  FROM bao_tri
  WHERE thanh_phan_id = _tp_id
    AND coalesce(ngay_bat_dau, ngay_hoan_thanh) >= (now() - interval '12 months');

  -- Hỏng hóc (tổng).
  SELECT count(*) INTO v_so_hong_hoc
  FROM hong_hoc WHERE thanh_phan_id = _tp_id;

  -- Số lần gắn tài sản.
  SELECT count(*), count(*) FILTER (WHERE den_ngay IS NULL)
  INTO v_so_gan_tong, v_so_gan_active
  FROM gan_chuc_nang WHERE thanh_phan_id = _tp_id;

  -- Tỉ lệ Đạt của các phiếu bảo dưỡng liên kết thành phần này (nếu có form_submission_item_result).
  SELECT CASE WHEN count(*) > 0
      THEN 100.0 * count(*) FILTER (WHERE ket_qua = 'dat') / count(*)
      ELSE NULL END
  INTO v_ti_le_dat
  FROM form_submission_item_result
  WHERE thanh_phan_id = _tp_id AND ket_qua IS NOT NULL;

  -- Chuỗi sự cố theo tháng (12 tháng gần nhất).
  SELECT coalesce(jsonb_agg(jsonb_build_object('thang', thang, 'so_su_co', c) ORDER BY thang), '[]'::jsonb)
  INTO v_by_month
  FROM (
    SELECT to_char(date_trunc('month', ngay_phat_hien), 'YYYY-MM') AS thang, count(*) AS c
    FROM su_co
    WHERE thanh_phan_id = _tp_id
      AND ngay_phat_hien >= (now() - interval '12 months')
    GROUP BY 1
  ) t;

  RETURN jsonb_build_object(
    'so_su_co_12m', v_so_su_co_12m,
    'so_su_co_mo',  v_so_su_co_mo,
    'so_bao_tri_12m', v_so_bao_tri_12m,
    'so_hong_hoc',  v_so_hong_hoc,
    'so_gan_tong',  v_so_gan_tong,
    'so_gan_active', v_so_gan_active,
    'mtbf_days',    v_mtbf_days,
    'mttr_hours',   v_mttr_hours,
    'ti_le_dat',    v_ti_le_dat,
    'su_co_by_month', v_by_month
  );
END;
$$;


--
-- Name: thanh_phan_tai_san_history(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.thanh_phan_tai_san_history(_tp_id uuid) RETURNS TABLE(gan_id uuid, thiet_bi_id uuid, ma_thiet_bi text, ten_thiet_bi text, ma_serial text, tu_ngay timestamp with time zone, den_ngay timestamp with time zone, ly_do text, ghi_chu text, dang_lap boolean)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT g.id, g.thiet_bi_id,
         tb.ma_thiet_bi, tb.ten_thiet_bi, tb.ma_serial,
         g.tu_ngay, g.den_ngay, g.ly_do, g.ghi_chu,
         (g.den_ngay IS NULL) AS dang_lap
  FROM gan_chuc_nang g
  JOIN thiet_bi tb ON tb.id = g.thiet_bi_id
  WHERE g.thanh_phan_id = _tp_id
  ORDER BY g.tu_ngay DESC NULLS LAST;
$$;


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


--
-- Name: trg_dbd_bb_audit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_dbd_bb_audit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_hm RECORD;
  v_fs_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT dot_id, don_vi_id INTO v_hm FROM public.dot_bao_duong_hang_muc WHERE id = NEW.hang_muc_id;
    INSERT INTO public.dot_bao_duong_audit_log(hang_muc_id, dot_id, don_vi_id, action, actor, changes)
    VALUES (NEW.hang_muc_id, v_hm.dot_id, v_hm.don_vi_id, 'gan_bien_ban', auth.uid(),
      jsonb_build_object('form_submission_id', NEW.form_submission_id));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT dot_id, don_vi_id INTO v_hm FROM public.dot_bao_duong_hang_muc WHERE id = OLD.hang_muc_id;
    IF FOUND THEN
      INSERT INTO public.dot_bao_duong_audit_log(hang_muc_id, dot_id, don_vi_id, action, actor, changes)
      VALUES (OLD.hang_muc_id, v_hm.dot_id, v_hm.don_vi_id, 'go_bien_ban', auth.uid(),
        jsonb_build_object('form_submission_id', OLD.form_submission_id));
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: trg_dbd_hm_audit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_dbd_hm_audit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_action text;
  v_changes jsonb := '{}'::jsonb;
  v_note text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.dot_bao_duong_audit_log(hang_muc_id, dot_id, don_vi_id, action, actor, changes)
    VALUES (NEW.id, NEW.dot_id, NEW.don_vi_id, 'tao', auth.uid(),
      jsonb_build_object('he_thong_id', NEW.he_thong_id, 'nguon', NEW.nguon, 'han_hoan_thanh', NEW.han_hoan_thanh));
    RETURN NEW;
  END IF;

  -- UPDATE: detect state transitions first
  IF NEW.duyet_trang_thai IS DISTINCT FROM OLD.duyet_trang_thai THEN
    v_action := CASE NEW.duyet_trang_thai
      WHEN 'cho_duyet' THEN 'gui_duyet'
      WHEN 'da_duyet' THEN 'duyet'
      WHEN 'tu_choi' THEN 'tra_lai'
      WHEN 'chua_gui' THEN 'mo_khoa'
      ELSE 'cap_nhat'
    END;
    v_note := NEW.approval_note;
  ELSE
    v_action := 'cap_nhat';
  END IF;

  IF NEW.trang_thai IS DISTINCT FROM OLD.trang_thai THEN
    v_changes := v_changes || jsonb_build_object('trang_thai', jsonb_build_array(OLD.trang_thai, NEW.trang_thai));
  END IF;
  IF NEW.ket_qua IS DISTINCT FROM OLD.ket_qua THEN
    v_changes := v_changes || jsonb_build_object('ket_qua', jsonb_build_array(OLD.ket_qua, NEW.ket_qua));
  END IF;
  IF NEW.duyet_trang_thai IS DISTINCT FROM OLD.duyet_trang_thai THEN
    v_changes := v_changes || jsonb_build_object('duyet_trang_thai', jsonb_build_array(OLD.duyet_trang_thai, NEW.duyet_trang_thai));
  END IF;
  IF NEW.han_hoan_thanh IS DISTINCT FROM OLD.han_hoan_thanh THEN
    v_changes := v_changes || jsonb_build_object('han_hoan_thanh', jsonb_build_array(OLD.han_hoan_thanh, NEW.han_hoan_thanh));
  END IF;
  IF NEW.ton_tai IS DISTINCT FROM OLD.ton_tai THEN
    v_changes := v_changes || jsonb_build_object('ton_tai', jsonb_build_array(COALESCE(OLD.ton_tai,''), COALESCE(NEW.ton_tai,'')));
  END IF;
  IF NEW.kien_nghi IS DISTINCT FROM OLD.kien_nghi THEN
    v_changes := v_changes || jsonb_build_object('kien_nghi', jsonb_build_array(COALESCE(OLD.kien_nghi,''), COALESCE(NEW.kien_nghi,'')));
  END IF;

  -- Skip pure no-op updates
  IF v_action = 'cap_nhat' AND v_changes = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.dot_bao_duong_audit_log(hang_muc_id, dot_id, don_vi_id, action, actor, changes, note)
  VALUES (NEW.id, NEW.dot_id, NEW.don_vi_id, v_action, auth.uid(), v_changes, v_note);

  RETURN NEW;
END;
$$;


--
-- Name: trg_detect_bulk_delete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_detect_bulk_delete() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  cnt integer;
  h int;
BEGIN
  IF NEW.action = 'DELETE' AND NEW.user_id IS NOT NULL THEN
    SELECT count(*) INTO cnt FROM public.audit_log
      WHERE user_id=NEW.user_id AND entity=NEW.entity
        AND action='DELETE' AND created_at > now() - interval '60 seconds';
    IF cnt >= 10 THEN
      INSERT INTO public.anomaly_alert(kind, user_id, entity, detail, severity)
      VALUES ('bulk_delete', NEW.user_id, NEW.entity,
              jsonb_build_object('count',cnt,'window_sec',60), 'critical');
    END IF;
  END IF;
  -- off-hours flag
  h := EXTRACT(HOUR FROM now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::int;
  IF (h >= 22 OR h < 5) AND NEW.severity='info' THEN
    UPDATE public.audit_log SET severity='off_hours' WHERE id=NEW.id;
  END IF;
  RETURN NEW;
END$$;


--
-- Name: trg_gcn_before(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_gcn_before() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_tp             public.he_thong_thanh_phan%ROWTYPE;
  v_loai_tb        uuid;
  v_don_vi         uuid;
BEGIN
  SELECT * INTO v_tp FROM public.he_thong_thanh_phan WHERE id = NEW.thanh_phan_id;

  -- Chặn gán vào vị trí đã ngừng (chỉ khi tạo dòng hiệu lực mới).
  IF TG_OP = 'INSERT' AND NEW.den_ngay IS NULL AND v_tp.trang_thai = 'ngung' THEN
    RAISE EXCEPTION 'Vị trí chức năng đã ngừng, không thể gán thiết bị';
  END IF;

  -- Validate loại thiết bị đúng yêu cầu của vị trí.
  IF v_tp.loai_thiet_bi_yeu_cau IS NOT NULL THEN
    SELECT loai_thiet_bi_id INTO v_loai_tb FROM public.thiet_bi WHERE id = NEW.thiet_bi_id;
    IF v_loai_tb IS DISTINCT FROM v_tp.loai_thiet_bi_yeu_cau THEN
      RAISE EXCEPTION 'Thiết bị không đúng loại yêu cầu của vị trí chức năng';
    END IF;
  END IF;

  -- Đóng băng đơn vị (theo thiết bị đang lắp).
  IF NEW.don_vi_id_snapshot IS NULL THEN
    SELECT COALESCE(t.don_vi_quan_ly_id, t.don_vi_id) INTO v_don_vi
    FROM public.thiet_bi t WHERE t.id = NEW.thiet_bi_id;
    NEW.don_vi_id_snapshot := v_don_vi;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: trg_glk_before(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_glk_before() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_khe     public.thiet_bi_khe_linh_kien%ROWTYPE;
  v_loai    uuid;
  v_is_lk   boolean;
  v_don_vi  uuid;
BEGIN
  SELECT * INTO v_khe FROM public.thiet_bi_khe_linh_kien WHERE id = NEW.khe_id;

  IF TG_OP = 'INSERT' AND NEW.den_ngay IS NULL AND v_khe.trang_thai = 'ngung' THEN
    RAISE EXCEPTION 'Khe linh kiện đã ngừng, không thể gán linh kiện';
  END IF;

  SELECT loai_thiet_bi_id, la_linh_kien INTO v_loai, v_is_lk
    FROM public.thiet_bi WHERE id = NEW.linh_kien_id;
  IF v_is_lk IS NOT TRUE THEN
    RAISE EXCEPTION 'Thiết bị được gán không được đánh dấu là linh kiện';
  END IF;
  IF v_khe.loai_thiet_bi_yeu_cau IS NOT NULL
     AND v_loai IS DISTINCT FROM v_khe.loai_thiet_bi_yeu_cau THEN
    RAISE EXCEPTION 'Linh kiện không đúng loại yêu cầu của khe';
  END IF;

  IF NEW.don_vi_id_snapshot IS NULL THEN
    SELECT COALESCE(t.don_vi_quan_ly_id, t.don_vi_id) INTO v_don_vi
      FROM public.thiet_bi t WHERE t.id = NEW.linh_kien_id;
    NEW.don_vi_id_snapshot := v_don_vi;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: trg_hong_hoc_3lop(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_hong_hoc_3lop() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public._sync_3lop(
    NEW.thanh_phan_id, NEW.he_thong_id, NEW.thiet_bi_hong_id, NEW.ngay_hong);
  NEW.thanh_phan_id  := r.o_thanh_phan_id;
  NEW.he_thong_id    := r.o_he_thong_id;
  NEW.thiet_bi_hong_id := r.o_thiet_bi_id;
  RETURN NEW;
END; $$;


--
-- Name: trg_http_before(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_http_before() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.trang_thai = 'ngung' AND COALESCE(OLD.trang_thai,'') <> 'ngung' THEN
    IF EXISTS (
      SELECT 1 FROM public.gan_chuc_nang g
      WHERE g.thanh_phan_id = NEW.id AND g.den_ngay IS NULL
    ) THEN
      RAISE EXCEPTION 'Phải tháo thiết bị trước khi ngừng vị trí chức năng';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: trg_http_sync_device(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_http_sync_device() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE v_tb uuid;
BEGIN
  SELECT g.thiet_bi_id INTO v_tb
  FROM public.gan_chuc_nang g
  WHERE g.thanh_phan_id = NEW.id AND g.den_ngay IS NULL
  LIMIT 1;
  IF v_tb IS NOT NULL THEN
    PERFORM public.sync_thiet_bi_he_thong_cache(v_tb);
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: trg_http_touch(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_http_touch() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


--
-- Name: trg_kgd_before_ins(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_kgd_before_ins() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.so_ct IS NULL OR NEW.so_ct = '' THEN
    NEW.so_ct := 'MV-' || lpad(nextval('public.kho_giao_dich_seq')::text, 6, '0');
  END IF;
  IF NEW.don_vi_id IS NULL THEN
    SELECT k.don_vi_id INTO NEW.don_vi_id FROM public.kho k WHERE k.id = NEW.kho_id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: trg_khe_lk_before_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_khe_lk_before_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.trang_thai = 'ngung' AND OLD.trang_thai <> 'ngung'
     AND EXISTS (SELECT 1 FROM public.gan_linh_kien
                 WHERE khe_id = NEW.id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Khe còn linh kiện đang gán, hãy tháo trước khi ngừng';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: trg_su_co_3lop(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_su_co_3lop() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public._sync_3lop(
    NEW.thanh_phan_id, NEW.he_thong_id, NEW.thiet_bi_id, NEW.ngay_phat_hien::date);
  NEW.thanh_phan_id := r.o_thanh_phan_id;
  NEW.he_thong_id   := r.o_he_thong_id;
  NEW.thiet_bi_id   := r.o_thiet_bi_id;
  RETURN NEW;
END; $$;


--
-- Name: trg_sync_thiet_bi_from_thanh_phan(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_sync_thiet_bi_from_thanh_phan() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_vi_tri uuid;
  v_don_vi uuid;
BEGIN
  IF NEW.den_ngay IS NULL THEN
    SELECT tp.vi_tri_id,
           COALESCE(tp.don_vi_id_snapshot, ht.don_vi_id)
      INTO v_vi_tri, v_don_vi
      FROM public.he_thong_thanh_phan tp
      JOIN public.dm_he_thong ht ON ht.id = tp.he_thong_id
     WHERE tp.id = NEW.thanh_phan_id;

    UPDATE public.thiet_bi
       SET vi_tri_id = COALESCE(v_vi_tri, vi_tri_id),
           don_vi_id = COALESCE(v_don_vi, don_vi_id)
     WHERE id = NEW.thiet_bi_id;

    NEW.don_vi_id_snapshot := v_don_vi;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: trg_tbkn_audit(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_tbkn_audit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
  VALUES (
    public.current_uid(),
    TG_OP,
    'thiet_bi_ket_noi',
    COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;


--
-- Name: trg_tbkn_before(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_tbkn_before() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.tu_thiet_bi_id = NEW.den_thiet_bi_id THEN
    RAISE EXCEPTION 'Không thể tạo kết nối từ một thiết bị tới chính nó';
  END IF;
  IF NEW.don_vi_id_snapshot IS NULL THEN
    SELECT COALESCE(t.don_vi_quan_ly_id, t.don_vi_id) INTO NEW.don_vi_id_snapshot
    FROM public.thiet_bi t WHERE t.id = NEW.tu_thiet_bi_id;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


--
-- Name: trg_ticket_sla(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_ticket_sla() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.sla_han IS NULL THEN
      NEW.sla_han := COALESCE(NEW.created_at, now()) + CASE NEW.uu_tien
        WHEN 'khan' THEN interval '4 hours'
        WHEN 'cao' THEN interval '24 hours'
        WHEN 'trung_binh' THEN interval '48 hours'
        ELSE interval '72 hours' END;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.first_response_at IS NULL AND OLD.trang_thai = 'moi' AND NEW.trang_thai <> 'moi' THEN
      NEW.first_response_at := now();
    END IF;
    IF NEW.closed_at IS NULL AND NEW.trang_thai IN ('dong','hoan_thanh') THEN
      NEW.closed_at := now();
    END IF;
  END IF;
  RETURN NEW;
END; $$;


--
-- Name: trg_update_completeness(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_update_completeness() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_TABLE_NAME = 'thiet_bi' THEN
    NEW.completeness_pct := public.calculate_completeness('thiet_bi', to_jsonb(NEW));
  ELSIF TG_TABLE_NAME = 'dm_he_thong' THEN
    NEW.completeness_pct := public.calculate_completeness('dm_he_thong', to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: undo_merge_danh_muc(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.undo_merge_danh_muc(p_entity text, p_drop_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_uid uuid := auth.uid();
  v_audit RECORD;
  v_reassigned jsonb;
  v_ref jsonb;
  v_tbl text;
  v_col text;
  v_ids jsonb;
  v_id_elem jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF NOT (public.has_role(v_uid, 'admin'::app_role)
       OR public.has_role(v_uid, 'phong_kt'::app_role)) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  -- Tìm audit merge gần nhất trong 24h
  SELECT * INTO v_audit
  FROM public.audit_log
  WHERE action = 'merge_danh_muc'
    AND entity = p_entity
    AND entity_id = p_drop_id::text
    AND created_at > now() - interval '24 hours'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_audit.id IS NULL THEN
    RAISE EXCEPTION 'no_merge_to_undo_within_24h' USING ERRCODE = 'P0002';
  END IF;

  -- Chỉ actor gốc hoặc admin được undo
  IF v_audit.user_id <> v_uid AND NOT public.has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  v_reassigned := v_audit.detail -> 'reassigned';

  -- Trả lại FK từ keep_id về drop_id trên đúng các dòng đã đổi
  FOR v_ref IN SELECT * FROM jsonb_array_elements(v_reassigned) LOOP
    v_tbl := v_ref ->> 'table';
    v_col := v_ref ->> 'column';
    v_ids := v_ref -> 'ids';

    FOR v_id_elem IN SELECT * FROM jsonb_array_elements(v_ids) LOOP
      EXECUTE format(
        'UPDATE public.%I SET %I = $1 WHERE id = $2',
        v_tbl, v_col
      ) USING p_drop_id, (v_id_elem #>> '{}')::uuid;
    END LOOP;
  END LOOP;

  -- Kích hoạt lại bản ghi drop
  EXECUTE format(
    'UPDATE public.%I
       SET active = true,
           merged_into = NULL,
           deactivated_at = NULL,
           updated_at = now()
     WHERE id = $1',
    p_entity
  ) USING p_drop_id;

  INSERT INTO public.audit_log(user_id, action, entity, entity_id, detail, severity)
  VALUES (
    v_uid,
    'undo_merge_danh_muc',
    p_entity,
    p_drop_id::text,
    jsonb_build_object('undo_of_audit_id', v_audit.id),
    'warning'
  );

  RETURN jsonb_build_object('ok', true, 'restored', p_drop_id);
END;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: user_can(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_can(_user_id uuid, _module text, _action text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.role_permission rp
    JOIN public.user_roles ur ON ur.role = rp.role
    WHERE ur.user_id=_user_id
      AND rp.module=_module AND rp.action=_action AND rp.allowed=true
  );
$$;


--
-- Name: user_can_see_he_thong(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_can_see_he_thong(_user_id uuid, _he_thong_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.has_role(_user_id,'admin')
      OR public.has_role(_user_id,'phong_kt')
      OR EXISTS (SELECT 1 FROM public.user_scope WHERE user_id=_user_id AND to_chuc_id IS NULL AND don_vi_id IS NULL)
      OR EXISTS (
        SELECT 1 FROM public.dm_he_thong h
        WHERE h.id=_he_thong_id
          AND (h.don_vi_id = ANY(public.user_scope_don_vi(_user_id))
            OR h.to_chuc_id = ANY(public.user_scope_to_chuc(_user_id)))
      );
$$;


--
-- Name: user_scope_don_vi(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_scope_don_vi(_user_id uuid) RETURNS uuid[]
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT CASE
    WHEN public.has_role(_user_id,'admin') OR public.has_role(_user_id,'phong_kt')
      THEN ARRAY(SELECT id FROM public.dm_don_vi)
    WHEN EXISTS (SELECT 1 FROM public.user_scope WHERE user_id=_user_id AND to_chuc_id IS NULL AND don_vi_id IS NULL)
      THEN ARRAY(SELECT id FROM public.dm_don_vi)
    ELSE COALESCE(
      (SELECT array_agg(DISTINCT dv.id)
         FROM public.dm_don_vi dv
         JOIN public.user_scope us ON us.user_id=_user_id
        WHERE us.don_vi_id = dv.id
           OR (us.to_chuc_id IS NOT NULL AND EXISTS(
               SELECT 1 FROM public.dm_he_thong h WHERE h.don_vi_id=dv.id AND h.to_chuc_id=us.to_chuc_id))
      ), ARRAY[]::uuid[])
  END;
$$;


--
-- Name: user_scope_to_chuc(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_scope_to_chuc(_user_id uuid) RETURNS uuid[]
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT CASE
    WHEN public.has_role(_user_id,'admin') OR public.has_role(_user_id,'phong_kt')
      THEN ARRAY(SELECT id FROM public.dm_to_chuc)
    WHEN EXISTS (SELECT 1 FROM public.user_scope WHERE user_id=_user_id AND to_chuc_id IS NULL AND don_vi_id IS NULL)
      THEN ARRAY(SELECT id FROM public.dm_to_chuc)
    ELSE COALESCE(
      (SELECT array_agg(DISTINCT to_chuc_id) FROM public.user_scope WHERE user_id=_user_id AND to_chuc_id IS NOT NULL),
      ARRAY[]::uuid[])
  END;
$$;


--
-- Name: lien_ket_khe; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lien_ket_khe (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    khe_nguon_id uuid NOT NULL,
    khe_dich_id uuid NOT NULL,
    loai_lien_ket_id uuid NOT NULL,
    giao_dien_nguon text,
    giao_dien_dich text,
    giao_thuc text,
    mo_ta text,
    trang_thai text DEFAULT 'hoat_dong'::text NOT NULL,
    hieu_luc_tu timestamp with time zone DEFAULT now() NOT NULL,
    hieu_luc_den timestamp with time zone,
    don_vi_id_snapshot uuid,
    ghi_chu text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lien_ket_khe_trang_thai_check CHECK ((trang_thai = ANY (ARRAY['hoat_dong'::text, 'tam_ngung'::text]))),
    CONSTRAINT lkk_hieu_luc_hop_le CHECK (((hieu_luc_den IS NULL) OR (hieu_luc_den >= hieu_luc_tu))),
    CONSTRAINT lkk_khong_tu_noi CHECK ((khe_nguon_id <> khe_dich_id))
);


--
-- Name: v_lien_ket_hieu_luc(timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.v_lien_ket_hieu_luc(tai_thoi_diem timestamp with time zone DEFAULT now()) RETURNS SETOF public.lien_ket_khe
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT *
  FROM public.lien_ket_khe
  WHERE hieu_luc_tu <= tai_thoi_diem
    AND (hieu_luc_den IS NULL OR hieu_luc_den > tai_thoi_diem);
$$;


--
-- Name: validate_dm_he_thong_taxonomy(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_dm_he_thong_taxonomy() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.nhom_he_thong_id IS NULL THEN
    RAISE EXCEPTION 'Hệ thống % phải có Nhóm hệ thống', COALESCE(NEW.ma, NEW.ten)
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.phan_loai_id IS NULL THEN
    RAISE EXCEPTION 'Hệ thống % phải có Phân loại', COALESCE(NEW.ma, NEW.ten)
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: validate_he_thong_don_vi(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_he_thong_don_vi() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.don_vi_id IS NULL THEN
    RAISE EXCEPTION 'Đơn vị quản lý là bắt buộc khi tạo/sửa hệ thống'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: validate_su_co(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_su_co() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.thoi_diem_khac_phuc IS NOT NULL AND NEW.ngay_phat_hien IS NOT NULL
     AND NEW.thoi_diem_khac_phuc < NEW.ngay_phat_hien::timestamptz THEN
    RAISE EXCEPTION 'Thời điểm khắc phục (%) không thể trước ngày phát hiện (%)',
      NEW.thoi_diem_khac_phuc, NEW.ngay_phat_hien
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.thoi_gian_gian_doan IS NOT NULL AND NEW.thoi_gian_gian_doan < 0 THEN
    RAISE EXCEPTION 'Thời gian gián đoạn không thể âm (%)', NEW.thoi_gian_gian_doan
      USING ERRCODE = 'check_violation';
  END IF;

  -- Nguồn duy nhất: khi có đủ mốc mà chưa nhập downtime → tự tính.
  IF NEW.thoi_gian_gian_doan IS NULL
     AND NEW.thoi_diem_khac_phuc IS NOT NULL
     AND NEW.ngay_phat_hien IS NOT NULL THEN
    NEW.thoi_gian_gian_doan := public.su_co_downtime_minutes(NEW.ngay_phat_hien, NEW.thoi_diem_khac_phuc);
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: validate_thiet_bi_he_thong_khi_lap(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_thiet_bi_he_thong_khi_lap() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_tb_he_thong_id uuid;
  v_tp_he_thong_id uuid;
BEGIN
  -- Bỏ qua khi bản ghi đã tháo
  IF NEW.den_ngay IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT he_thong_id INTO v_tb_he_thong_id
  FROM public.thiet_bi WHERE id = NEW.thiet_bi_id;

  -- Nếu tài sản chưa có hệ thống mặc định → tự gán theo hệ thống của thành phần đích
  IF v_tb_he_thong_id IS NULL THEN
    SELECT he_thong_id INTO v_tp_he_thong_id
    FROM public.he_thong_thanh_phan WHERE id = NEW.thanh_phan_id;

    IF v_tp_he_thong_id IS NOT NULL THEN
      UPDATE public.thiet_bi
      SET he_thong_id = v_tp_he_thong_id
      WHERE id = NEW.thiet_bi_id AND he_thong_id IS NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: validate_thuoc_tinh(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_thuoc_tinh() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN RETURN NEW; END;
$$;


--
-- Name: xem_truoc_xoa_thanh_phan(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.xem_truoc_xoa_thanh_phan(v_id uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: xoa_thanh_phan_cuong_buc(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.xoa_thanh_phan_cuong_buc(v_id uuid, v_reason text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  uid uuid := public.current_uid();
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


--
-- Name: unaccent; Type: TEXT SEARCH DICTIONARY; Schema: public; Owner: -
--

CREATE TEXT SEARCH DICTIONARY public.unaccent (
    TEMPLATE = extensions.unaccent,
    rules = 'unaccent' );


--
-- Name: access_request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.access_request (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    module text NOT NULL,
    action text NOT NULL,
    reason text,
    status text DEFAULT 'pending'::text NOT NULL,
    ttl_minutes integer DEFAULT 60 NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_config (
    id integer DEFAULT 1 NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    provider text DEFAULT 'lovable'::text NOT NULL,
    model text DEFAULT 'google/gemini-2.5-flash'::text NOT NULL,
    base_url text,
    api_key_secret_name text,
    system_prompt text DEFAULT 'Bạn là trợ lý MIRATS. LUÔN trả lời tiếng Việt, ngắn gọn, chuyên nghiệp. Chỉ dùng dữ liệu từ các tool được cung cấp — không đoán số liệu. Nếu không tìm thấy hoặc cần thêm thông tin, hỏi lại người dùng. Khi hiển thị mã/tên thiết bị, giấy phép, biểu mẫu, trích nguyên văn từ tool.'::text NOT NULL,
    max_tokens integer DEFAULT 2048 NOT NULL,
    beta_label text DEFAULT 'Beta'::text NOT NULL,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_config_provider_check CHECK ((provider = ANY (ARRAY['lovable'::text, 'custom'::text]))),
    CONSTRAINT ai_config_singleton CHECK ((id = 1))
);


--
-- Name: ai_conversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_conversation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tieu_de text DEFAULT 'Hội thoại mới'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_message (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    role text NOT NULL,
    content jsonb NOT NULL,
    tokens integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_message_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text, 'tool'::text])))
);


--
-- Name: anomaly_alert; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anomaly_alert (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kind text NOT NULL,
    user_id uuid,
    entity text,
    entity_id text,
    detail jsonb,
    severity text DEFAULT 'warn'::text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: app_cai_dat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_cai_dat (
    khoa text NOT NULL,
    gia_tri text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    entity text,
    entity_id text,
    detail jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ip inet,
    user_agent text,
    severity text DEFAULT 'info'::text NOT NULL,
    to_chuc_id uuid,
    don_vi_id uuid,
    he_thong_id uuid
);


--
-- Name: auth_event_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_event_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    event text NOT NULL,
    target_user_id uuid,
    detail jsonb,
    ip inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: backup_lich_su; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_lich_su (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    loai text DEFAULT 'thu_cong'::text NOT NULL,
    trang_thai text DEFAULT 'hoan_thanh'::text NOT NULL,
    so_bang integer DEFAULT 0 NOT NULL,
    so_dong integer DEFAULT 0 NOT NULL,
    dung_luong bigint DEFAULT 0 NOT NULL,
    file_path text,
    dich text[] DEFAULT '{}'::text[] NOT NULL,
    dong_bo jsonb DEFAULT '{}'::jsonb NOT NULL,
    ghi_chu text,
    tao_boi uuid,
    tao_boi_ten text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ban_giao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ban_giao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_ban_giao text NOT NULL,
    thiet_bi text NOT NULL,
    thiet_bi_id uuid,
    loai_ban_giao text,
    nguoi_giao text,
    nguoi_nhan text,
    don_vi_nhan text,
    ngay_nhan date DEFAULT CURRENT_DATE NOT NULL,
    ngay_tra date,
    tinh_trang_khi_nhan text,
    tinh_trang_khi_tra text,
    file_bien_ban text,
    trang_thai text DEFAULT 'Đang mượn'::text,
    ghi_chu text,
    snapshot_ma_thiet_bi text,
    snapshot_ten_thiet_bi text,
    snapshot_he_thong text,
    snapshot_don_vi text,
    snapshot_vi_tri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    nguoi_giao_id uuid,
    nguoi_nhan_id uuid,
    chu_ky_url text,
    da_chap_nhan boolean DEFAULT false NOT NULL,
    thoi_diem_chap_nhan timestamp with time zone
);


--
-- Name: bang_cot_tuy_chinh; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bang_cot_tuy_chinh (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    bang_key text NOT NULL,
    cau_hinh jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bao_cao_annotation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bao_cao_annotation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thoi_diem timestamp with time zone NOT NULL,
    tieu_de text NOT NULL,
    mo_ta text,
    loai public.bao_cao_annotation_loai DEFAULT 'ghi_chu'::public.bao_cao_annotation_loai NOT NULL,
    mau text,
    he_thong_id uuid,
    tao_boi uuid,
    tao_luc timestamp with time zone DEFAULT now() NOT NULL,
    cap_nhat_luc timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bao_tri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bao_tri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_bao_tri text NOT NULL,
    thiet_bi text NOT NULL,
    thiet_bi_id uuid,
    he_thong text,
    he_thong_id uuid,
    don_vi text,
    thanh_phan_id uuid,
    loai_bao_tri text,
    ke_hoach text,
    ngay_bat_dau date DEFAULT CURRENT_DATE NOT NULL,
    ngay_hoan_thanh date,
    mo_ta_cong_viec text,
    ket_qua text,
    chi_phi numeric DEFAULT 0,
    nguoi_thuc_hien text[] DEFAULT '{}'::text[],
    don_vi_thuc_hien text,
    trang_thai text DEFAULT 'Đang thực hiện'::text,
    file_bien_ban text,
    snapshot_ma_thiet_bi text,
    snapshot_ten_thiet_bi text,
    snapshot_he_thong text,
    snapshot_don_vi text,
    snapshot_vi_tri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    luu_tru boolean DEFAULT false NOT NULL
);


--
-- Name: bao_tri_chinh_sach; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bao_tri_chinh_sach (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    loai_thiet_bi_id uuid,
    ten text NOT NULL,
    mo_ta text,
    chu_ky_ngay integer,
    chu_ky_gio_chay numeric,
    canh_bao_truoc_ngay integer DEFAULT 7 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    chu_ky_loai text DEFAULT 'time'::text NOT NULL,
    chu_ky_gia_tri numeric,
    metric_field text,
    noi_dung text,
    nguoi_phu_trach_id uuid,
    lan_gan_nhat_at timestamp with time zone,
    lan_gan_nhat_metric numeric,
    advance_days integer DEFAULT 7 NOT NULL,
    priority integer DEFAULT 100 NOT NULL,
    thiet_bi_id uuid,
    he_thong_id uuid,
    model_id uuid,
    CONSTRAINT bao_tri_chinh_sach_chu_ky_loai_check CHECK ((chu_ky_loai = ANY (ARRAY['time'::text, 'metric'::text]))),
    CONSTRAINT bao_tri_chinh_sach_metric_field_check CHECK (((metric_field IS NULL) OR (metric_field = ANY (ARRAY['gio_chay'::text, 'so_lan'::text, 'km'::text]))))
);


--
-- Name: canh_bao_het_han_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.canh_bao_het_han_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    khoa text NOT NULL,
    loai text NOT NULL,
    thiet_bi_id uuid,
    ngay_het_han date NOT NULL,
    nguong integer NOT NULL,
    so_nguoi_nhan integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cay_node_edit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cay_node_edit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kind text NOT NULL,
    ma text NOT NULL,
    don_vi_ma text,
    ten text,
    du_lieu jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cay_node_edit_kind_check CHECK ((kind = ANY (ARRAY['pl'::text, 'lv'::text, 'nh'::text, 'nhom'::text, 'ht'::text, 'tb'::text, 'tp'::text])))
);

ALTER TABLE ONLY public.cay_node_edit REPLICA IDENTITY FULL;


--
-- Name: COLUMN cay_node_edit.ten; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.cay_node_edit.ten IS 'CHỈ dùng cho node nháp (chưa có bản ghi ở bảng gốc). Với node thật, tên đọc/ghi tại bảng gốc (dm_phan_loai/dm_nhom_he_thong/dm_he_thong/thiet_bi) — xem renameEntity().';


--
-- Name: cay_thay_doi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cay_thay_doi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    loai text NOT NULL,
    he_thong_id text,
    mo_ta text,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    snapshot_cu jsonb DEFAULT '{}'::jsonb NOT NULL,
    trang_thai text DEFAULT 'cho_duyet'::text NOT NULL,
    da_ap_dung boolean DEFAULT false NOT NULL,
    da_hoan_tac boolean DEFAULT false NOT NULL,
    nguoi_tao uuid,
    nguoi_duyet uuid,
    duyet_luc timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: change_request; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.change_request (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    loai public.change_request_loai NOT NULL,
    payload jsonb NOT NULL,
    ghi_chu text,
    nguoi_tao uuid NOT NULL,
    trang_thai public.change_request_status DEFAULT 'pending'::public.change_request_status NOT NULL,
    ly_do text,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    applied_audit_id uuid,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chung_chi_thiet_bi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chung_chi_thiet_bi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thiet_bi_id uuid NOT NULL,
    loai text NOT NULL,
    so_giay_chung_nhan text NOT NULL,
    ngay_bat_dau date,
    ngay_het_han date,
    ghi_chu text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    CONSTRAINT chung_chi_thiet_bi_loai_check CHECK ((loai = ANY (ARRAY['KIEM_DINH'::text, 'HIEU_CHUAN'::text])))
);


--
-- Name: cong_viec_bao_tri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cong_viec_bao_tri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_cong_viec text,
    thiet_bi_id uuid,
    he_thong_id uuid,
    chinh_sach_id uuid,
    loai text DEFAULT 'PM'::text NOT NULL,
    uu_tien text DEFAULT 'TRUNG_BINH'::text NOT NULL,
    trang_thai text DEFAULT 'MO'::text NOT NULL,
    ngay_den_han date,
    ngay_bat_dau date,
    ngay_hoan_thanh date,
    nguoi_phu_trach uuid,
    bao_tri_id uuid,
    mo_ta text,
    ghi_chu text,
    don_vi_id_snapshot uuid,
    created_by uuid DEFAULT public.current_uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    luu_tru boolean DEFAULT false NOT NULL,
    van_de_id uuid,
    su_co_id uuid,
    can_phe_duyet boolean DEFAULT false NOT NULL,
    trang_thai_phe_duyet text DEFAULT 'chua_duyet'::text NOT NULL,
    nguoi_phe_duyet uuid,
    phe_duyet_at timestamp with time zone,
    ke_hoach_rollback text,
    bat_buoc boolean DEFAULT false NOT NULL
);


--
-- Name: cong_viec_bao_tri_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cong_viec_bao_tri_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversation_participant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_participant (
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    last_read_at timestamp with time zone DEFAULT to_timestamp((0)::double precision) NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kind text DEFAULT 'dm'::text NOT NULL,
    ten text,
    created_by uuid,
    last_message_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dinh_nghia_truong; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dinh_nghia_truong (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    nhan text NOT NULL,
    loai text NOT NULL,
    bat_buoc boolean DEFAULT false NOT NULL,
    lua_chon jsonb,
    ap_dung_cho text NOT NULL,
    mo_ta text,
    min_so numeric,
    max_so numeric,
    thu_tu integer DEFAULT 0 NOT NULL,
    kich_hoat boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    CONSTRAINT dinh_nghia_truong_loai_check CHECK ((loai = ANY (ARRAY['text'::text, 'so'::text, 'ngay'::text, 'chon'::text, 'checkbox'::text]))),
    CONSTRAINT dnt_key_format CHECK ((key ~ '^[a-z][a-z0-9_]*$'::text))
);


--
-- Name: dm_dac_tinh; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_dac_tinh (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    nhom text DEFAULT 'chuc_nang'::text NOT NULL,
    mo_ta text,
    thu_tu integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    mau text,
    merged_into uuid,
    deactivated_at timestamp with time zone,
    CONSTRAINT dm_dac_tinh_nhom_check CHECK ((nhom = ANY (ARRAY['chuc_nang'::text, 'bang_tan'::text, 'khac'::text])))
);


--
-- Name: dm_danh_gia_nien_han; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_danh_gia_nien_han (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    thu_tu integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    merged_into uuid,
    deactivated_at timestamp with time zone
);


--
-- Name: dm_don_vi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_don_vi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    thu_tu integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    parent_id uuid,
    merged_into uuid,
    deactivated_at timestamp with time zone
);

ALTER TABLE ONLY public.dm_don_vi REPLICA IDENTITY FULL;


--
-- Name: COLUMN dm_don_vi.parent_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dm_don_vi.parent_id IS 'Đơn vị cấp trên trực tiếp (VD: các Đội trực thuộc Trung tâm Bảo đảm kỹ thuật).';


--
-- Name: dm_he_thong; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_he_thong (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    thu_tu integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    nhom_he_thong_id uuid,
    don_vi_id uuid,
    ten_he_thong_theo_gp text,
    nam_sx_theo_gp text,
    gp_so text,
    gp_ngay_cap text,
    gp_han text,
    kieu_thiet_bi_gp text,
    so_san_xuat_gp text,
    noi_san_xuat_gp text,
    muc_dich_gp text,
    pham_vi_hoat_dong_gp text,
    ma_dia_chi_kt_gp text,
    dia_diem_dat_gp text,
    thoi_gian_hoat_dong_gp text,
    gp_cu_bai_bo text,
    thanh_phan_theo_gp text,
    ma_tai_san_bravo text,
    phan_loai_id uuid,
    tinh_nang_ky_thuat text,
    giay_phep_khai_thac text,
    pham_vi_quan_ly text DEFAULT 'noi_bo'::text NOT NULL,
    to_chuc_so_huu text,
    to_chuc_id uuid,
    attrs jsonb DEFAULT '{}'::jsonb NOT NULL,
    merged_into uuid,
    deactivated_at timestamp with time zone,
    completeness_pct integer DEFAULT 0
);

ALTER TABLE ONLY public.dm_he_thong REPLICA IDENTITY FULL;


--
-- Name: COLUMN dm_he_thong.ma_tai_san_bravo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dm_he_thong.ma_tai_san_bravo IS 'Mã tài sản Bravo (cột vật lý cố định, áp dụng cho mọi hệ thống)';


--
-- Name: dm_loai_ban_quyen; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_loai_ban_quyen (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    thu_tu integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dm_loai_giay_phep; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_loai_giay_phep (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    thu_tu integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    merged_into uuid,
    deactivated_at timestamp with time zone
);


--
-- Name: dm_loai_lien_ket; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_loai_lien_ket (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    mau_sac text DEFAULT '#6b7280'::text NOT NULL,
    kieu_net text DEFAULT 'solid'::text NOT NULL,
    thu_tu integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    co_huong boolean DEFAULT false NOT NULL,
    lan_truyen_tac_dong boolean DEFAULT true NOT NULL,
    merged_into uuid,
    deactivated_at timestamp with time zone,
    CONSTRAINT dm_loai_lien_ket_kieu_net_check CHECK ((kieu_net = ANY (ARRAY['solid'::text, 'dashed'::text, 'dotted'::text])))
);


--
-- Name: dm_loai_thiet_bi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_loai_thiet_bi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    thu_tu integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    mau text,
    merged_into uuid,
    deactivated_at timestamp with time zone,
    la_may_tinh boolean DEFAULT false NOT NULL
);


--
-- Name: dm_model; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_model (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text,
    ten text NOT NULL,
    so_model text,
    nha_san_xuat_id uuid,
    loai_thiet_bi_id uuid,
    field_set_id uuid,
    hinh_anh text,
    mo_ta text,
    thu_tu integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    p_n text,
    merged_into uuid,
    deactivated_at timestamp with time zone
);


--
-- Name: dm_model_dac_tinh; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_model_dac_tinh (
    model_id uuid NOT NULL,
    dac_tinh_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dm_nha_cung_cap; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_nha_cung_cap (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    thu_tu integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    merged_into uuid,
    deactivated_at timestamp with time zone
);


--
-- Name: dm_nha_san_xuat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_nha_san_xuat (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    thu_tu integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    trang_web text,
    ghi_chu text,
    xuat_xu text,
    logo text,
    merged_into uuid,
    deactivated_at timestamp with time zone
);


--
-- Name: COLUMN dm_nha_san_xuat.xuat_xu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dm_nha_san_xuat.xuat_xu IS 'Xuất xứ / quốc gia của nhà sản xuất';


--
-- Name: dm_nhom_he_thong; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_nhom_he_thong (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    thu_tu integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    phan_loai_id uuid,
    merged_into uuid,
    deactivated_at timestamp with time zone
);

ALTER TABLE ONLY public.dm_nhom_he_thong REPLICA IDENTITY FULL;


--
-- Name: dm_noi_cap; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_noi_cap (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    thu_tu integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    merged_into uuid,
    deactivated_at timestamp with time zone
);


--
-- Name: dm_phan_loai; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_phan_loai (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text,
    ten text NOT NULL,
    mo_ta text,
    thu_tu integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    merged_into uuid,
    deactivated_at timestamp with time zone
);


--
-- Name: dm_to_chuc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_to_chuc (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    loai text NOT NULL,
    to_chuc_cha_id uuid,
    mau_sac text,
    ghi_chu text,
    thu_tu integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    merged_into uuid,
    deactivated_at timestamp with time zone,
    CONSTRAINT dm_to_chuc_loai_check CHECK ((loai = ANY (ARRAY['tong_cong_ty'::text, 'don_vi_thanh_vien'::text, 'co_quan_ngoai'::text])))
);


--
-- Name: dm_trang_thai_thiet_bi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_trang_thai_thiet_bi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    thu_tu integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    la_ngung_khai_thac boolean DEFAULT false NOT NULL,
    yeu_cau_gan_slot boolean DEFAULT false NOT NULL,
    merged_into uuid,
    deactivated_at timestamp with time zone
);


--
-- Name: COLUMN dm_trang_thai_thiet_bi.yeu_cau_gan_slot; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dm_trang_thai_thiet_bi.yeu_cau_gan_slot IS 'true = thiết bị ở trạng thái này bắt buộc đang nằm trong đúng 1 khe chức năng (đang khai thác/dự phòng nóng)';


--
-- Name: dm_vi_tri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dm_vi_tri (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    thu_tu integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    parent_id uuid,
    merged_into uuid,
    deactivated_at timestamp with time zone
);

ALTER TABLE ONLY public.dm_vi_tri REPLICA IDENTITY FULL;


--
-- Name: dong_gop_diem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dong_gop_diem (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    change_request_id uuid,
    nhiem_vu_id uuid,
    loai_dong_gop text NOT NULL,
    diem integer NOT NULL,
    ky text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: dot_bao_duong; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dot_bao_duong (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ten text NOT NULL,
    nam integer NOT NULL,
    ky smallint NOT NULL,
    tu_ngay date,
    den_ngay date,
    mo_ta text,
    trang_thai public.dot_bao_duong_trang_thai DEFAULT 'nhap'::public.dot_bao_duong_trang_thai NOT NULL,
    nguoi_tao uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT dot_bao_duong_ky_check CHECK ((ky = ANY (ARRAY[1, 2])))
);


--
-- Name: dot_bao_duong_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dot_bao_duong_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hang_muc_id uuid NOT NULL,
    dot_id uuid NOT NULL,
    don_vi_id uuid,
    action text NOT NULL,
    actor uuid,
    changes jsonb,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dot_bao_duong_bien_ban; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dot_bao_duong_bien_ban (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hang_muc_id uuid NOT NULL,
    form_submission_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dot_bao_duong_han; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dot_bao_duong_han (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dot_id uuid NOT NULL,
    don_vi_id uuid NOT NULL,
    han_ngay date NOT NULL,
    mo_ta text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dot_bao_duong_hang_muc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dot_bao_duong_hang_muc (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dot_id uuid NOT NULL,
    don_vi_id uuid NOT NULL,
    he_thong_id uuid NOT NULL,
    nguon public.dot_bao_duong_hm_nguon DEFAULT 'kt_khoi_tao'::public.dot_bao_duong_hm_nguon NOT NULL,
    bat_buoc boolean DEFAULT true NOT NULL,
    ghi_chu_kt text,
    trang_thai public.dot_bao_duong_hm_trang_thai DEFAULT 'chua_bat_dau'::public.dot_bao_duong_hm_trang_thai NOT NULL,
    ket_qua public.dot_bao_duong_hm_ket_qua,
    ton_tai text,
    kien_nghi text,
    nguoi_thuc_hien uuid,
    ngay_hoan_thanh timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    duyet_trang_thai text DEFAULT 'chua_gui'::text NOT NULL,
    submitted_at timestamp with time zone,
    submitted_by uuid,
    approved_at timestamp with time zone,
    approved_by uuid,
    approval_note text,
    han_hoan_thanh date,
    CONSTRAINT dot_bao_duong_hang_muc_duyet_chk CHECK ((duyet_trang_thai = ANY (ARRAY['chua_gui'::text, 'cho_duyet'::text, 'da_duyet'::text, 'tu_choi'::text])))
);


--
-- Name: dot_bao_duong_su_co; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dot_bao_duong_su_co (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hang_muc_id uuid NOT NULL,
    su_co_id uuid,
    hong_hoc_id uuid,
    ghi_chu text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT dot_bao_duong_su_co_check CHECK (((su_co_id IS NOT NULL) OR (hong_hoc_id IS NOT NULL)))
);


--
-- Name: dot_bao_duong_tep; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dot_bao_duong_tep (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hang_muc_id uuid NOT NULL,
    duong_dan text NOT NULL,
    ten_goc text,
    loai text,
    nguoi_up uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: du_an; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.du_an (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma text,
    ten text NOT NULL,
    mo_ta text,
    don_vi_id uuid,
    nguoi_tao_id uuid NOT NULL,
    quan_ly_id uuid NOT NULL,
    ngay_bat_dau date,
    ngay_ket_thuc_du_kien date,
    trang_thai public.du_an_trang_thai DEFAULT 'moi'::public.du_an_trang_thai NOT NULL,
    tien_do smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    attrs jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT du_an_tien_do_check CHECK (((tien_do >= 0) AND (tien_do <= 100)))
);


--
-- Name: du_an_cong_van; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.du_an_cong_van (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    du_an_id uuid NOT NULL,
    parent_id uuid,
    so_cong_van text NOT NULL,
    loai public.cong_van_loai DEFAULT 'den'::public.cong_van_loai NOT NULL,
    trich_yeu text,
    co_quan_ban_hanh text,
    co_quan_nhan text,
    ngay_ban_hanh date,
    ngay_tiep_nhan date,
    han_phuc_dap date,
    trang_thai public.cong_van_trang_thai DEFAULT 'moi'::public.cong_van_trang_thai NOT NULL,
    can_cu_text text,
    ghi_chu text,
    nguoi_tao_id uuid DEFAULT auth.uid() NOT NULL,
    attrs jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: du_an_cong_van_lien_ket; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.du_an_cong_van_lien_ket (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tu_id uuid NOT NULL,
    den_id uuid NOT NULL,
    loai public.cong_van_lien_ket_loai DEFAULT 'tra_loi'::public.cong_van_lien_ket_loai NOT NULL,
    ghi_chu text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT dacvlk_khac_nhau CHECK ((tu_id <> den_id))
);


--
-- Name: du_an_cong_van_tep; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.du_an_cong_van_tep (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cong_van_id uuid NOT NULL,
    bucket text DEFAULT 'tai-lieu'::text NOT NULL,
    file_path text NOT NULL,
    file_name text NOT NULL,
    mime_type text,
    kich_thuoc bigint,
    mo_ta text,
    uploaded_by uuid DEFAULT auth.uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: du_an_cong_viec; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.du_an_cong_viec (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    du_an_id uuid NOT NULL,
    moc_id uuid NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    nguoi_xu_ly_chinh uuid,
    ngay_bat_dau date,
    ngay_ket_thuc_du_kien date,
    ngay_hoan_thanh_thuc_te date,
    trang_thai public.cong_viec_trang_thai DEFAULT 'chua_bat_dau'::public.cong_viec_trang_thai NOT NULL,
    tien_do smallint DEFAULT 0 NOT NULL,
    ket_qua text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT du_an_cong_viec_tien_do_check CHECK (((tien_do >= 0) AND (tien_do <= 100)))
);


--
-- Name: du_an_cong_viec_phoi_hop; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.du_an_cong_viec_phoi_hop (
    cong_viec_id uuid NOT NULL,
    user_id uuid NOT NULL,
    added_at timestamp with time zone DEFAULT now() NOT NULL,
    added_by uuid
);


--
-- Name: du_an_moc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.du_an_moc (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    du_an_id uuid NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    thu_tu integer DEFAULT 0 NOT NULL,
    ngay_bat_dau date,
    ngay_ket_thuc_du_kien date,
    trang_thai public.cong_viec_trang_thai DEFAULT 'chua_bat_dau'::public.cong_viec_trang_thai NOT NULL,
    tien_do smallint DEFAULT 0 NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT du_an_moc_tien_do_check CHECK (((tien_do >= 0) AND (tien_do <= 100)))
);


--
-- Name: feature_usage_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_usage_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    feature text NOT NULL,
    path text,
    params jsonb,
    duration_ms integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: field_set; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.field_set (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: field_set_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.field_set_item (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    field_set_id uuid NOT NULL,
    field_key text NOT NULL,
    thu_tu integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: form_check_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_check_item (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section_id uuid NOT NULL,
    template_id uuid NOT NULL,
    item_code text NOT NULL,
    ten text NOT NULL,
    huong_dan text,
    result_kind public.form_result_kind DEFAULT 'text'::public.form_result_kind NOT NULL,
    don_vi text,
    tieu_chuan text,
    tuy_chon jsonb,
    bat_buoc boolean DEFAULT false NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    metric_key text,
    nguong_min numeric,
    nguong_max numeric,
    nguong_op text,
    chu_ky text
);


--
-- Name: form_field; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_field (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    key text NOT NULL,
    label text NOT NULL,
    kind public.form_field_kind DEFAULT 'text'::public.form_field_kind NOT NULL,
    required boolean DEFAULT false NOT NULL,
    options jsonb,
    help_text text,
    placeholder text,
    default_value jsonb,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    unit text,
    tieu_chuan text,
    min_value numeric,
    max_value numeric,
    col_span smallint DEFAULT 3 NOT NULL,
    visible_if jsonb,
    columns jsonb,
    ratings jsonb,
    formula text,
    nhom text,
    required_if jsonb,
    constraint_formula text,
    constraint_message text,
    CONSTRAINT form_field_col_span_check CHECK (((col_span >= 1) AND (col_span <= 3)))
);


--
-- Name: COLUMN form_field.col_span; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.form_field.col_span IS 'Độ rộng của trường trên lưới 3 cột (1..3).';


--
-- Name: COLUMN form_field.visible_if; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.form_field.visible_if IS 'Điều kiện hiển thị: { field_key, op, value }';


--
-- Name: COLUMN form_field.columns; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.form_field.columns IS 'Cấu hình cột cho kind=table: [{ key, label, kind, unit, options? }]';


--
-- Name: COLUMN form_field.ratings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.form_field.ratings IS 'Cấu hình mức cho kind=rating: [{ value, label, color }]';


--
-- Name: COLUMN form_field.formula; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.form_field.formula IS 'Biểu thức cho kind=computed, tham chiếu {key} của trường khác.';


--
-- Name: form_section; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_section (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    ma_section text NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    col_layout smallint DEFAULT 1 NOT NULL,
    repeatable boolean DEFAULT false NOT NULL,
    visible_if jsonb,
    CONSTRAINT form_section_col_layout_check CHECK (((col_layout >= 1) AND (col_layout <= 3)))
);


--
-- Name: COLUMN form_section.col_layout; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.form_section.col_layout IS 'Số cột mặc định của mục (1..3).';


--
-- Name: COLUMN form_section.repeatable; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.form_section.repeatable IS 'Mục lặp lại theo tài sản khi lập phiếu.';


--
-- Name: form_sign_otp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_sign_otp (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    user_id uuid NOT NULL,
    channel text NOT NULL,
    code_hash text NOT NULL,
    signer_role text DEFAULT 'phu_trach'::text NOT NULL,
    note text,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    attempts integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT form_sign_otp_channel_check CHECK ((channel = ANY (ARRAY['telegram'::text, 'email'::text])))
);


--
-- Name: form_submission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_submission (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    template_code text NOT NULL,
    template_version integer DEFAULT 1 NOT NULL,
    don_vi_id uuid,
    created_by uuid,
    status public.form_submission_status DEFAULT 'draft'::public.form_submission_status NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    thiet_bi_id uuid,
    ky_bao_cao text,
    tieu_de text,
    submitted_at timestamp with time zone,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    review_note text,
    signed_by uuid,
    signed_at timestamp with time zone,
    pdf_path text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    search_text text GENERATED ALWAYS AS (public.f_unaccent(((((((COALESCE(tieu_de, ''::text) || ' '::text) || COALESCE(template_code, ''::text)) || ' '::text) || COALESCE(ky_bao_cao, ''::text)) || ' '::text) || COALESCE(review_note, ''::text)))) STORED,
    search_tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, public.f_unaccent(((((((COALESCE(tieu_de, ''::text) || ' '::text) || COALESCE(template_code, ''::text)) || ' '::text) || COALESCE(ky_bao_cao, ''::text)) || ' '::text) || COALESCE(review_note, ''::text))))) STORED,
    he_thong_id uuid,
    template_version_id uuid,
    template_snapshot jsonb,
    signatures jsonb DEFAULT '[]'::jsonb NOT NULL,
    content_hash text
);

ALTER TABLE ONLY public.form_submission REPLICA IDENTITY FULL;


--
-- Name: COLUMN form_submission.signatures; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.form_submission.signatures IS 'Danh sách chữ ký số: [{ path, ky_boi, ho_ten, thoi_diem, ip, ua, hash, vai_tro }]';


--
-- Name: form_submission_item_result; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_submission_item_result (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    section_code text NOT NULL,
    section_ten text,
    item_code text NOT NULL,
    ten text NOT NULL,
    result_kind public.form_result_kind NOT NULL,
    gia_tri_so numeric,
    gia_tri_text text,
    don_vi text,
    tieu_chuan text,
    ket_qua public.form_ket_qua,
    ghi_chu text,
    hanh_dong text,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    metric_key text,
    nguong_min numeric,
    nguong_max numeric,
    nguong_op text,
    thanh_phan_id uuid,
    thiet_bi_id uuid,
    he_thong_id uuid,
    don_vi_id uuid,
    submitted_at timestamp with time zone,
    auto_ket_qua boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_khong_dat_can_hanh_dong CHECK (((ket_qua IS DISTINCT FROM 'khong_dat'::public.form_ket_qua) OR ((hanh_dong IS NOT NULL) AND (btrim(hanh_dong) <> ''::text))))
);


--
-- Name: form_submission_signature; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_submission_signature (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    signer_user_id uuid NOT NULL,
    signer_role text NOT NULL,
    signer_name text,
    signed_at timestamp with time zone DEFAULT now() NOT NULL,
    content_hash text NOT NULL,
    signature_b64 text NOT NULL,
    key_id uuid NOT NULL,
    alg text DEFAULT 'Ed25519'::text NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT form_submission_signature_signer_role_check CHECK ((signer_role = ANY (ARRAY['nguoi_thuc_hien'::text, 'phu_trach'::text, 'admin'::text])))
);

ALTER TABLE ONLY public.form_submission_signature REPLICA IDENTITY FULL;


--
-- Name: form_submission_thiet_bi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_submission_thiet_bi (
    submission_id uuid NOT NULL,
    thiet_bi_id uuid NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: form_template; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_template (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    ten text NOT NULL,
    mo_ta text,
    thiet_bi_mode public.form_thiet_bi_mode DEFAULT 'none'::public.form_thiet_bi_mode NOT NULL,
    active boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    require_signature boolean DEFAULT false NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    nhom text DEFAULT 'bien_ban'::text NOT NULL
);


--
-- Name: form_template_he_thong; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_template_he_thong (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    he_thong_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: form_template_include; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_template_include (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_version_id uuid NOT NULL,
    child_version_id uuid NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    section_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    CONSTRAINT ftinc_no_self CHECK ((parent_version_id <> child_version_id))
);


--
-- Name: TABLE form_template_include; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.form_template_include IS 'Cạnh include giữa các form_template_version. Compiler TS giải theo position, chống cycle/duplicate.';


--
-- Name: form_template_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.form_template_version (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    version integer NOT NULL,
    status public.form_template_version_status DEFAULT 'draft'::public.form_template_version_status NOT NULL,
    compiled_schema jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: gan_chuc_nang; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gan_chuc_nang (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thanh_phan_id uuid NOT NULL,
    thiet_bi_id uuid NOT NULL,
    tu_ngay timestamp with time zone DEFAULT now() NOT NULL,
    den_ngay timestamp with time zone,
    ly_do text DEFAULT 'lắp mới'::text NOT NULL,
    hong_hoc_id uuid,
    nguoi_thuc_hien uuid,
    ghi_chu text,
    don_vi_id_snapshot uuid,
    created_by uuid DEFAULT public.current_uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT gan_chuc_nang_check CHECK (((den_ngay IS NULL) OR (den_ngay >= tu_ngay))),
    CONSTRAINT gan_chuc_nang_ly_do_check CHECK ((ly_do = ANY (ARRAY['lắp mới'::text, 'thay do hỏng'::text, 'điều chuyển'::text, 'tháo'::text])))
);

ALTER TABLE ONLY public.gan_chuc_nang REPLICA IDENTITY FULL;


--
-- Name: gan_linh_kien; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gan_linh_kien (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    khe_id uuid NOT NULL,
    linh_kien_id uuid NOT NULL,
    tu_ngay timestamp with time zone DEFAULT now() NOT NULL,
    den_ngay timestamp with time zone,
    ly_do text DEFAULT 'lắp mới'::text NOT NULL,
    hong_hoc_id uuid,
    nguoi_thuc_hien uuid,
    ghi_chu text,
    don_vi_id_snapshot uuid,
    created_by uuid DEFAULT public.current_uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT gan_linh_kien_check CHECK (((den_ngay IS NULL) OR (den_ngay >= tu_ngay))),
    CONSTRAINT gan_linh_kien_ly_do_check CHECK ((ly_do = ANY (ARRAY['lắp mới'::text, 'thay do hỏng'::text, 'điều chuyển'::text, 'tháo'::text])))
);


--
-- Name: giay_phep; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.giay_phep (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_giay_phep text NOT NULL,
    thiet_bi_id uuid NOT NULL,
    loai_giay_phep_id uuid,
    so_giay_phep text,
    ngay_cap date,
    ngay_het_han date,
    noi_cap_id uuid,
    file_giay_phep text,
    ghi_chu text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    search_text text GENERATED ALWAYS AS (public.f_unaccent(((((COALESCE(ma_giay_phep, ''::text) || ' '::text) || COALESCE(so_giay_phep, ''::text)) || ' '::text) || COALESCE(ghi_chu, ''::text)))) STORED,
    search_tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, public.f_unaccent(((((COALESCE(ma_giay_phep, ''::text) || ' '::text) || COALESCE(so_giay_phep, ''::text)) || ' '::text) || COALESCE(ghi_chu, ''::text))))) STORED
);


--
-- Name: giay_phep_khai_thac; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.giay_phep_khai_thac (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    he_thong_id uuid,
    don_vi text,
    tram text,
    he_thong_folder text,
    gp_so text,
    gp_ngay text,
    gp_han text,
    gp_cu text,
    ten_he_thong_theo_gp text,
    nam_sx_gp text,
    he_thong_csdl text,
    trang_thai_doi_chieu text,
    kieu_thiet_bi text,
    so_san_xuat text,
    noi_san_xuat text,
    muc_dich text,
    pham_vi text,
    ma_dia_chi text,
    dia_diem text,
    thoi_gian text,
    thanh_phan_theo_gp text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    attrs jsonb DEFAULT '{}'::jsonb NOT NULL,
    luu_tru boolean DEFAULT false NOT NULL,
    file_gpkt text,
    created_by uuid
);


--
-- Name: he_thong_thanh_phan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.he_thong_thanh_phan (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    he_thong_id uuid NOT NULL,
    ma_thanh_phan text NOT NULL,
    ten text NOT NULL,
    loai_thiet_bi_yeu_cau uuid,
    thanh_phan_cha uuid,
    bat_buoc boolean DEFAULT true NOT NULL,
    thu_tu integer,
    mo_ta text,
    trang_thai text DEFAULT 'hoat_dong'::text NOT NULL,
    hieu_luc_tu date,
    hieu_luc_den date,
    don_vi_id_snapshot uuid NOT NULL,
    created_by uuid DEFAULT public.current_uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    vi_tri_id uuid,
    trang_thai_id uuid,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    deleted_reason text,
    CONSTRAINT he_thong_thanh_phan_check CHECK (((hieu_luc_den IS NULL) OR (hieu_luc_tu IS NULL) OR (hieu_luc_den >= hieu_luc_tu))),
    CONSTRAINT he_thong_thanh_phan_trang_thai_check CHECK ((trang_thai = ANY (ARRAY['hoat_dong'::text, 'ngung'::text])))
);

ALTER TABLE ONLY public.he_thong_thanh_phan REPLICA IDENTITY FULL;


--
-- Name: he_thong_truong; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.he_thong_truong (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    he_thong_id text NOT NULL,
    field_key text NOT NULL,
    nhan text NOT NULL,
    kieu text DEFAULT 'text'::text NOT NULL,
    tuy_chon jsonb DEFAULT '[]'::jsonb NOT NULL,
    thu_tu integer DEFAULT 0 NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    help_text text,
    nhom_field text,
    bat_buoc boolean DEFAULT false NOT NULL
);


--
-- Name: hong_hoc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hong_hoc (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_hong_hoc text NOT NULL,
    thanh_phan_id uuid,
    thiet_bi_hong text NOT NULL,
    thiet_bi_hong_id uuid,
    su_co text,
    ngay_hong date DEFAULT CURRENT_DATE NOT NULL,
    bo_phan_hong text,
    mo_ta_hong_hoc text,
    phuong_an text,
    thiet_bi_thay_the text,
    thiet_bi_thay_the_id uuid,
    vat_tu_su_dung text[] DEFAULT '{}'::text[],
    chi_phi numeric DEFAULT 0,
    nguoi_thuc_hien text[] DEFAULT '{}'::text[],
    don_vi_thuc_hien text,
    ket_qua text,
    ngay_hoan_thanh date,
    trang_thai text DEFAULT 'Đang xử lý'::text,
    file_dinh_kem text,
    snapshot_ma_thiet_bi text,
    snapshot_ten_thiet_bi text,
    snapshot_he_thong text,
    snapshot_don_vi text,
    snapshot_vi_tri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    he_thong_id uuid,
    trang_thai_moi text,
    nguoi_bao_cao_id uuid,
    nguoi_tiep_nhan_id uuid,
    nguoi_xu_ly_chinh_id uuid,
    nguoi_nghiem_thu_id uuid,
    at_bao_cao timestamp with time zone,
    at_tiep_nhan timestamp with time zone,
    at_bat_dau_xu_ly timestamp with time zone,
    at_hoan_thanh timestamp with time zone,
    at_nghiem_thu timestamp with time zone,
    at_huy timestamp with time zone,
    tong_thoi_gian_cho_vat_tu_phut integer DEFAULT 0 NOT NULL
);


--
-- Name: import_alias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.import_alias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity text NOT NULL,
    scope text,
    source text DEFAULT 'manual'::text NOT NULL,
    alias text NOT NULL,
    alias_norm text NOT NULL,
    canonical_id uuid NOT NULL,
    canonical_key text,
    confirmed_by uuid DEFAULT public.current_uid() NOT NULL,
    confirmed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT import_alias_source_chk CHECK ((source = ANY (ARRAY['manual'::text, 'import'::text, 'ai'::text])))
);


--
-- Name: import_batch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.import_batch (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_by uuid DEFAULT public.current_uid() NOT NULL,
    file_name text NOT NULL,
    file_hash text NOT NULL,
    file_size bigint,
    schema_version text,
    source text DEFAULT 'allinone'::text NOT NULL,
    scope text,
    status text DEFAULT 'staged'::text NOT NULL,
    summary jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_at timestamp with time zone,
    rolled_back_at timestamp with time zone,
    CONSTRAINT import_batch_source_chk CHECK ((source = ANY (ARRAY['allinone'::text, 'csv'::text]))),
    CONSTRAINT import_batch_status_chk CHECK ((status = ANY (ARRAY['staged'::text, 'reviewing'::text, 'committed'::text, 'discarded'::text, 'rolled_back'::text, 'partially_rolled_back'::text])))
);


--
-- Name: import_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.import_item (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    batch_id uuid NOT NULL,
    sheet text,
    entity text NOT NULL,
    cat_table text,
    row_index integer NOT NULL,
    raw_row jsonb DEFAULT '{}'::jsonb NOT NULL,
    normalized_row jsonb,
    status text DEFAULT 'staged'::text NOT NULL,
    messages jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    action text,
    target_table text,
    target_id uuid,
    before_snapshot jsonb,
    after_snapshot jsonb,
    applied_at timestamp with time zone,
    rolled_back_at timestamp with time zone,
    CONSTRAINT import_item_action_chk CHECK (((action IS NULL) OR (action = ANY (ARRAY['create'::text, 'update'::text, 'retire'::text, 'keep'::text, 'error'::text, 'skip'::text])))),
    CONSTRAINT import_item_status_chk CHECK ((status = ANY (ARRAY['staged'::text, 'valid'::text, 'error'::text, 'committed'::text, 'skipped'::text, 'rolled_back'::text])))
);


--
-- Name: kho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kho (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_kho text,
    ten text NOT NULL,
    vi_tri_id uuid,
    don_vi_id uuid,
    ghi_chu text,
    kich_hoat boolean DEFAULT true NOT NULL,
    created_by uuid DEFAULT public.current_uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: kho_giao_dich; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kho_giao_dich (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    so_ct text,
    nhom_ct uuid,
    vat_tu_id uuid NOT NULL,
    kho_id uuid NOT NULL,
    loai text NOT NULL,
    so_luong numeric NOT NULL,
    hieu_ung numeric GENERATED ALWAYS AS (
CASE
    WHEN (loai = ANY (ARRAY['NHAP'::text, 'CHUYEN_NHAP'::text, 'DIEU_CHINH_TANG'::text])) THEN so_luong
    ELSE (- so_luong)
END) STORED,
    don_gia numeric DEFAULT 0 NOT NULL,
    ngay timestamp with time zone DEFAULT now() NOT NULL,
    lien_ket_cong_viec_id uuid,
    lien_ket_su_co_id uuid,
    lien_ket_hong_hoc_id uuid,
    don_vi_id uuid,
    nguoi_thuc_hien uuid DEFAULT public.current_uid(),
    ghi_chu text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT kho_giao_dich_loai_check CHECK ((loai = ANY (ARRAY['NHAP'::text, 'XUAT'::text, 'CHUYEN_NHAP'::text, 'CHUYEN_XUAT'::text, 'DIEU_CHINH_TANG'::text, 'DIEU_CHINH_GIAM'::text]))),
    CONSTRAINT kho_giao_dich_so_luong_check CHECK ((so_luong > (0)::numeric))
);


--
-- Name: kho_giao_dich_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kho_giao_dich_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lien_ket_he_thong; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lien_ket_he_thong (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    he_thong_nguon_id uuid NOT NULL,
    he_thong_dich_id uuid NOT NULL,
    loai_lien_ket_id uuid NOT NULL,
    lop text DEFAULT 'logic'::text NOT NULL,
    huong text DEFAULT 'mot_chieu'::text NOT NULL,
    giao_dien_nguon text,
    giao_dien_dich text,
    giao_thuc text,
    mo_ta_tin_hieu text,
    vai_tro_du_phong text,
    trang_thai text DEFAULT 'hoat_dong'::text NOT NULL,
    hieu_luc_tu date,
    hieu_luc_den date,
    don_vi_id_snapshot uuid,
    ghi_chu text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lien_ket_he_thong_huong_check CHECK ((huong = ANY (ARRAY['mot_chieu'::text, 'hai_chieu'::text]))),
    CONSTRAINT lien_ket_he_thong_lop_check CHECK ((lop = ANY (ARRAY['vat_ly'::text, 'logic'::text]))),
    CONSTRAINT lien_ket_he_thong_trang_thai_check CHECK ((trang_thai = ANY (ARRAY['hoat_dong'::text, 'tam_ngung'::text]))),
    CONSTRAINT lien_ket_he_thong_vai_tro_du_phong_check CHECK ((vai_tro_du_phong = ANY (ARRAY['chinh'::text, 'du_phong'::text]))),
    CONSTRAINT lkht_khong_tu_noi CHECK ((he_thong_nguon_id <> he_thong_dich_id))
);


--
-- Name: luu_tru_health_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.luu_tru_health_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    backend text NOT NULL,
    ok boolean NOT NULL,
    latency_ms integer,
    message text,
    error_code text,
    detail jsonb,
    nguon text DEFAULT 'manual'::text NOT NULL,
    checked_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT luu_tru_health_log_backend_check CHECK ((backend = ANY (ARRAY['cloud'::text, 'r2'::text])))
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    noi_dung text,
    file_path text,
    file_name text,
    file_size integer,
    file_mime text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: model_tai_lieu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_tai_lieu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    model_id uuid NOT NULL,
    loai_tai_lieu text DEFAULT 'Khác'::text NOT NULL,
    bucket text DEFAULT 'model-tai-lieu'::text NOT NULL,
    file_path text NOT NULL,
    file_name text NOT NULL,
    mime_type text,
    kich_thuoc bigint,
    mo_ta text,
    thu_tu integer DEFAULT 0 NOT NULL,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: su_co; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.su_co (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_su_co text NOT NULL,
    thiet_bi text NOT NULL,
    thiet_bi_id uuid,
    he_thong text,
    he_thong_id uuid,
    don_vi text,
    thanh_phan_id uuid,
    ngay_phat_hien timestamp with time zone DEFAULT now() NOT NULL,
    nguoi_bao_cao text,
    muc_do text,
    anh_huong_dhb text,
    hien_tuong text,
    nguyen_nhan text,
    bien_phap_xu_ly text,
    thoi_diem_khac_phuc timestamp with time zone,
    thoi_gian_gian_doan numeric,
    nguoi_xu_ly text[] DEFAULT '{}'::text[],
    trang_thai text DEFAULT 'Mới'::text,
    lien_ket_hong_hoc text,
    file_dinh_kem text,
    bao_cao_ban_dau jsonb,
    ma_nhom_bc text,
    van_de_id uuid,
    snapshot_ma_thiet_bi text,
    snapshot_ten_thiet_bi text,
    snapshot_he_thong text,
    snapshot_don_vi text,
    snapshot_vi_tri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    luu_tru boolean DEFAULT false NOT NULL,
    trang_thai_moi text,
    nguoi_bao_cao_id uuid,
    nguoi_tiep_nhan_id uuid,
    nguoi_xu_ly_chinh_id uuid,
    nguoi_nghiem_thu_id uuid,
    at_bao_cao timestamp with time zone,
    at_tiep_nhan timestamp with time zone,
    at_bat_dau_xu_ly timestamp with time zone,
    at_hoan_thanh timestamp with time zone,
    at_nghiem_thu timestamp with time zone,
    at_huy timestamp with time zone,
    tong_thoi_gian_cho_vat_tu_phut integer DEFAULT 0 NOT NULL
);


--
-- Name: mv_asset_anomaly; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.mv_asset_anomaly AS
 WITH per_asset AS (
         SELECT su_co.thiet_bi_id,
            (count(*))::integer AS c
           FROM public.su_co
          WHERE ((su_co.thiet_bi_id IS NOT NULL) AND (su_co.ngay_phat_hien >= (now() - '90 days'::interval)))
          GROUP BY su_co.thiet_bi_id
        ), per_type AS (
         SELECT tb_1.loai_thiet_bi_id,
            avg(pa_1.c) AS mean_c,
            COALESCE(stddev_samp(pa_1.c), (0)::numeric) AS sd_c
           FROM (per_asset pa_1
             JOIN public.thiet_bi tb_1 ON ((tb_1.id = pa_1.thiet_bi_id)))
          GROUP BY tb_1.loai_thiet_bi_id
        )
 SELECT tb.id AS asset_id,
    COALESCE(pa.c, 0) AS incident_count_90d,
        CASE
            WHEN ((pt.sd_c IS NULL) OR (pt.sd_c = (0)::numeric)) THEN (0)::numeric
            ELSE round((((COALESCE(pa.c, 0))::numeric - pt.mean_c) / pt.sd_c), 2)
        END AS z_score
   FROM ((public.thiet_bi tb
     LEFT JOIN per_asset pa ON ((pa.thiet_bi_id = tb.id)))
     LEFT JOIN per_type pt ON ((pt.loai_thiet_bi_id = tb.loai_thiet_bi_id)))
  WITH NO DATA;


--
-- Name: mv_dashboard_overview; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.mv_dashboard_overview AS
 SELECT jsonb_build_object('thiet_bi_total', ( SELECT count(*) AS count
           FROM public.thiet_bi), 'thiet_bi_by_trang_thai', COALESCE(( SELECT jsonb_object_agg(COALESCE((s.trang_thai_id)::text, 'null'::text), s.c) AS jsonb_object_agg
           FROM ( SELECT thiet_bi.trang_thai_id,
                    count(*) AS c
                   FROM public.thiet_bi
                  GROUP BY thiet_bi.trang_thai_id) s), '{}'::jsonb), 'su_co_by_trang_thai', COALESCE(( SELECT jsonb_object_agg(COALESCE(s.trang_thai, 'null'::text), s.c) AS jsonb_object_agg
           FROM ( SELECT su_co.trang_thai,
                    count(*) AS c
                   FROM public.su_co
                  GROUP BY su_co.trang_thai) s), '{}'::jsonb), 'bao_tri_by_trang_thai', COALESCE(( SELECT jsonb_object_agg(COALESCE(s.trang_thai, 'null'::text), s.c) AS jsonb_object_agg
           FROM ( SELECT bao_tri.trang_thai,
                    count(*) AS c
                   FROM public.bao_tri
                  GROUP BY bao_tri.trang_thai) s), '{}'::jsonb), 'hong_hoc_by_trang_thai', COALESCE(( SELECT jsonb_object_agg(COALESCE(s.trang_thai, 'null'::text), s.c) AS jsonb_object_agg
           FROM ( SELECT hong_hoc.trang_thai,
                    count(*) AS c
                   FROM public.hong_hoc
                  GROUP BY hong_hoc.trang_thai) s), '{}'::jsonb), 'refreshed_at', now()) AS payload
  WITH NO DATA;


--
-- Name: nhan_vien; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nhan_vien (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_nhan_vien text NOT NULL,
    ho_ten text NOT NULL,
    don_vi text,
    chuc_vu text,
    email text,
    dien_thoai text,
    hoat_dong boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    ngay_sinh date
);


--
-- Name: nhiem_vu_nhap_lieu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nhiem_vu_nhap_lieu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    loai text NOT NULL,
    entity text NOT NULL,
    target_id uuid NOT NULL,
    field_key text,
    don_vi_id uuid,
    nguoi_nhan uuid,
    trang_thai text DEFAULT 'moi'::text NOT NULL,
    do_uu_tien integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT nhiem_vu_nhap_lieu_trang_thai_check CHECK ((trang_thai = ANY (ARRAY['moi'::text, 'dang_lam'::text, 'da_gui'::text, 'hoan_thanh'::text, 'bo_qua'::text])))
);


--
-- Name: node_note; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.node_note (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    node_type public.node_note_type NOT NULL,
    node_id text NOT NULL,
    noi_dung text DEFAULT ''::text NOT NULL,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    loai public.notification_loai NOT NULL,
    tieu_de text NOT NULL,
    noi_dung text,
    link text,
    ref_type text,
    ref_id uuid,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: phan_mem_ban_quyen; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phan_mem_ban_quyen (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_ban_quyen text NOT NULL,
    ten_phan_mem text NOT NULL,
    nha_phat_hanh text,
    phien_ban text,
    loai_ban_quyen_id uuid,
    license_key text,
    so_ghe integer,
    ngay_mua date,
    ngay_bat_dau date,
    ngay_het_han date,
    gia_tri numeric,
    so_hop_dong text,
    don_vi_id uuid,
    nha_cung_cap_id uuid,
    ghi_chu text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT phan_mem_ban_quyen_so_ghe_check CHECK (((so_ghe IS NULL) OR (so_ghe > 0)))
);


--
-- Name: phan_mem_ban_quyen_cap_phat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phan_mem_ban_quyen_cap_phat (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ban_quyen_id uuid NOT NULL,
    thiet_bi_id uuid NOT NULL,
    ngay_cai_dat date DEFAULT CURRENT_DATE NOT NULL,
    nguoi_cai text,
    ngay_thu_hoi date,
    ghi_chu text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: phan_mem_ban_quyen_tep; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phan_mem_ban_quyen_tep (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ban_quyen_id uuid NOT NULL,
    ten_tep text NOT NULL,
    duong_dan text NOT NULL,
    mime_type text,
    kich_thuoc bigint,
    storage_provider text DEFAULT 'supabase'::text NOT NULL,
    ghi_chu text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pm_cong_viec; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pm_cong_viec (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chinh_sach_id uuid NOT NULL,
    doi_tuong_type text NOT NULL,
    doi_tuong_id uuid NOT NULL,
    don_vi_id uuid,
    han date NOT NULL,
    ky_hieu_han text NOT NULL,
    trang_thai text DEFAULT 'sap_den_han'::text NOT NULL,
    nguoi_phu_trach_id uuid,
    ghi_chu text,
    bao_tri_id uuid,
    hoan_thanh_at timestamp with time zone,
    bo_qua_ly_do text,
    estimated boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pm_cong_viec_doi_tuong_type_check CHECK ((doi_tuong_type = ANY (ARRAY['thiet_bi'::text, 'he_thong'::text]))),
    CONSTRAINT pm_cong_viec_trang_thai_check CHECK ((trang_thai = ANY (ARRAY['sap_den_han'::text, 'den_han'::text, 'qua_han'::text, 'dang_thuc_hien'::text, 'hoan_thanh'::text, 'bo_qua'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    ho_ten text,
    don_vi public.don_vi_code,
    active boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    avatar_url text,
    tour_hoan_thanh boolean DEFAULT false NOT NULL
);


--
-- Name: r2_access_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.r2_access_log (
    id bigint NOT NULL,
    user_id uuid,
    key text NOT NULL,
    action text NOT NULL,
    category text,
    expires_in integer,
    ok boolean DEFAULT true NOT NULL,
    reason text,
    ip text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: r2_access_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.r2_access_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: r2_access_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.r2_access_log_id_seq OWNED BY public.r2_access_log.id;


--
-- Name: r2_cau_hinh; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.r2_cau_hinh (
    id integer DEFAULT 1 NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    endpoint text,
    account_id text,
    bucket_name text,
    key_prefix text,
    public_base_url text,
    access_key_id text,
    secret_access_key text,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT r2_cau_hinh_id_check CHECK ((id = 1))
);


--
-- Name: r2_file; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.r2_file (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    key text NOT NULL,
    size bigint,
    content_type text,
    category text DEFAULT 'other'::text NOT NULL,
    status text DEFAULT 'temp'::text NOT NULL,
    original_name text,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT r2_file_status_check CHECK ((status = ANY (ARRAY['temp'::text, 'ready'::text, 'failed'::text])))
);


--
-- Name: role_permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permission (
    role public.app_role NOT NULL,
    module text NOT NULL,
    action text NOT NULL,
    allowed boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


--
-- Name: search_index; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_index (
    loai text NOT NULL,
    id text NOT NULL,
    ma text,
    tieu_de text NOT NULL,
    noi_dung text,
    route text NOT NULL,
    tsv tsvector,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: so_do_he_thong; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.so_do_he_thong (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    don_vi_id uuid,
    ten text NOT NULL,
    mo_ta text,
    du_lieu jsonb DEFAULT '{"edges": [], "nodes": []}'::jsonb NOT NULL,
    created_by uuid DEFAULT public.current_uid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    don_vi_ma text,
    he_thong_ma text,
    he_thong_ten text
);


--
-- Name: so_do_tep_dinh_kem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.so_do_tep_dinh_kem (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    so_do_id uuid NOT NULL,
    ten_tep text NOT NULL,
    duong_dan text NOT NULL,
    loai text,
    kich_thuoc bigint,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: so_do_thu_vien_hinh; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.so_do_thu_vien_hinh (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ten text NOT NULL,
    nhom text,
    duong_dan text NOT NULL,
    created_by uuid DEFAULT public.current_uid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: supabase_ngoai; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supabase_ngoai (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ten text NOT NULL,
    url text NOT NULL,
    publishable_key text NOT NULL,
    service_role_key text,
    ghi_chu text,
    kich_hoat boolean DEFAULT false NOT NULL,
    kiem_tra_luc timestamp with time zone,
    kiem_tra_ket_qua jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: supabase_ngoai_job; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supabase_ngoai_job (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ngoai_id uuid NOT NULL,
    che_do text DEFAULT 'that'::text NOT NULL,
    trang_thai text DEFAULT 'dang_chay'::text NOT NULL,
    tong_dong bigint DEFAULT 0 NOT NULL,
    da_chuyen bigint DEFAULT 0 NOT NULL,
    bat_dau timestamp with time zone DEFAULT now() NOT NULL,
    ket_thuc timestamp with time zone,
    loi text,
    nhat_ky jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT supabase_ngoai_job_che_do_check CHECK ((che_do = ANY (ARRAY['dry_run'::text, 'that'::text]))),
    CONSTRAINT supabase_ngoai_job_trang_thai_check CHECK ((trang_thai = ANY (ARRAY['dang_chay'::text, 'tam_dung'::text, 'hoan_thanh'::text, 'that_bai'::text, 'da_hoan_tac'::text])))
);


--
-- Name: supabase_ngoai_job_bang; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supabase_ngoai_job_bang (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    ten_bang text NOT NULL,
    tong_dong bigint DEFAULT 0 NOT NULL,
    da_chuyen bigint DEFAULT 0 NOT NULL,
    offset_tiep bigint DEFAULT 0 NOT NULL,
    dich_dong_truoc bigint,
    trang_thai text DEFAULT 'cho'::text NOT NULL,
    loi text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT supabase_ngoai_job_bang_trang_thai_check CHECK ((trang_thai = ANY (ARRAY['cho'::text, 'dang_chay'::text, 'hoan_thanh'::text, 'that_bai'::text, 'bo_qua'::text])))
);


--
-- Name: system_signing_key; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_signing_key (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alg text DEFAULT 'Ed25519'::text NOT NULL,
    public_key_b64 text NOT NULL,
    private_key_b64 text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    rotated_at timestamp with time zone
);


--
-- Name: telegram_da_gui; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telegram_da_gui (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    loai text NOT NULL,
    ref_id text NOT NULL,
    ref_meta jsonb,
    chat_id text NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: telegram_subscriber; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telegram_subscriber (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    chat_id text NOT NULL,
    ten text NOT NULL,
    la_nhom boolean DEFAULT false NOT NULL,
    don_vi_id text,
    cac_loai text[] DEFAULT ARRAY['gp_expiring'::text, 'su_co'::text, 'bao_tri_kiem_ke'::text] NOT NULL,
    nguong_ngay integer DEFAULT 90 NOT NULL,
    gio_gui integer DEFAULT 8 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: thiet_bi_cap_phat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thiet_bi_cap_phat (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thiet_bi_id uuid NOT NULL,
    hanh_dong text NOT NULL,
    nguoi_giu text,
    don_vi_giu_id uuid,
    ghi_chu text,
    thoi_diem timestamp with time zone DEFAULT now() NOT NULL,
    thuc_hien_boi uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT thiet_bi_cap_phat_hanh_dong_check CHECK ((hanh_dong = ANY (ARRAY['cap_phat'::text, 'thu_hoi'::text])))
);


--
-- Name: thiet_bi_do_dac; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thiet_bi_do_dac (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thiet_bi_id uuid NOT NULL,
    thoi_diem timestamp with time zone DEFAULT now() NOT NULL,
    chi_so text NOT NULL,
    gia_tri numeric,
    don_vi_do text,
    nguon text,
    ghi_chu text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: thiet_bi_he_thong_tuong_thich; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thiet_bi_he_thong_tuong_thich (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thiet_bi_id uuid NOT NULL,
    he_thong_id uuid NOT NULL,
    phan_loai text DEFAULT 'Thay thế trực tiếp'::text,
    danh_gia text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE thiet_bi_he_thong_tuong_thich; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.thiet_bi_he_thong_tuong_thich IS 'Lưu thông tin tương thích giữa tài sản (vật tư dự phòng) và các hệ thống kỹ thuật.';


--
-- Name: thiet_bi_ket_noi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thiet_bi_ket_noi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tu_thiet_bi_id uuid NOT NULL,
    den_thiet_bi_id uuid NOT NULL,
    tu_cong text,
    den_cong text,
    loai text DEFAULT 'CAP'::text NOT NULL,
    ten_mach text,
    mo_ta text,
    don_vi_id_snapshot uuid,
    created_by uuid DEFAULT public.current_uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: thiet_bi_khe_linh_kien; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thiet_bi_khe_linh_kien (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thiet_bi_id uuid NOT NULL,
    ma_khe text NOT NULL,
    ten text NOT NULL,
    loai_thiet_bi_yeu_cau uuid,
    khe_cha uuid,
    bat_buoc boolean DEFAULT true NOT NULL,
    thu_tu integer,
    mo_ta text,
    trang_thai text DEFAULT 'hoat_dong'::text NOT NULL,
    hieu_luc_tu date,
    hieu_luc_den date,
    don_vi_id_snapshot uuid,
    created_by uuid DEFAULT public.current_uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT thiet_bi_khe_linh_kien_check CHECK (((hieu_luc_den IS NULL) OR (hieu_luc_tu IS NULL) OR (hieu_luc_den >= hieu_luc_tu))),
    CONSTRAINT thiet_bi_khe_linh_kien_trang_thai_check CHECK ((trang_thai = ANY (ARRAY['hoat_dong'::text, 'ngung'::text])))
);


--
-- Name: thiet_bi_tep_dinh_kem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thiet_bi_tep_dinh_kem (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thiet_bi_id uuid NOT NULL,
    loai public.thiet_bi_tep_loai NOT NULL,
    bucket text NOT NULL,
    file_path text NOT NULL,
    file_name text NOT NULL,
    mime_type text,
    kich_thuoc bigint,
    mo_ta text,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: thiet_bi_vong_doi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thiet_bi_vong_doi (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thiet_bi_id uuid NOT NULL,
    tu_trang_thai_id uuid,
    den_trang_thai_id uuid,
    thoi_diem timestamp with time zone DEFAULT now() NOT NULL,
    ly_do text,
    nguoi_thuc_hien uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: thong_bao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thong_bao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    loai text NOT NULL,
    doi_tuong_bang text NOT NULL,
    doi_tuong_ref uuid NOT NULL,
    don_vi_id uuid,
    muc_do text NOT NULL,
    nguong integer,
    tieu_de text NOT NULL,
    noi_dung text NOT NULL,
    den_han_at date NOT NULL,
    khoa_chong_trung text NOT NULL,
    da_doc boolean DEFAULT false NOT NULL,
    da_doc_at timestamp with time zone,
    da_doc_boi uuid,
    kenh jsonb DEFAULT '{"email": false, "in_app": true}'::jsonb NOT NULL,
    email_queued boolean DEFAULT false NOT NULL,
    nguoi_nhan uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT thong_bao_loai_check CHECK ((loai = ANY (ARRAY['bao_hanh'::text, 'giay_phep'::text, 'chung_chi_kd'::text, 'chung_chi_hc'::text, 'he_thong'::text, 'khac'::text]))),
    CONSTRAINT thong_bao_muc_do_check CHECK ((muc_do = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text, 'overdue'::text])))
);


--
-- Name: thong_bao_cau_hinh; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thong_bao_cau_hinh (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    scope text NOT NULL,
    don_vi_id uuid,
    loai text,
    nguong integer[] DEFAULT ARRAY[30, 15, 7] NOT NULL,
    email_enabled boolean DEFAULT false NOT NULL,
    in_app_enabled boolean DEFAULT true NOT NULL,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT thong_bao_cau_hinh_scope_check CHECK ((scope = ANY (ARRAY['global'::text, 'don_vi'::text, 'loai'::text])))
);


--
-- Name: thong_bao_email_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thong_bao_email_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thong_bao_id uuid NOT NULL,
    to_email text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    trang_thai text DEFAULT 'pending'::text NOT NULL,
    attempt integer DEFAULT 0 NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sent_at timestamp with time zone,
    CONSTRAINT thong_bao_email_queue_trang_thai_check CHECK ((trang_thai = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'skipped'::text])))
);


--
-- Name: ticket_comment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_comment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    user_id uuid NOT NULL,
    noi_dung text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    loai public.ticket_loai DEFAULT 'khac'::public.ticket_loai NOT NULL,
    tieu_de text NOT NULL,
    mo_ta text,
    trang_thai public.ticket_trang_thai DEFAULT 'moi'::public.ticket_trang_thai NOT NULL,
    uu_tien public.ticket_uu_tien DEFAULT 'trung_binh'::public.ticket_uu_tien NOT NULL,
    created_by uuid NOT NULL,
    assigned_to uuid,
    don_vi text,
    ket_qua text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    closed_at timestamp with time zone,
    thiet_bi_id uuid,
    he_thong_id uuid,
    su_co_id uuid,
    sla_han timestamp with time zone,
    first_response_at timestamp with time zone
);


--
-- Name: user_layout_prefs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_layout_prefs (
    user_id uuid NOT NULL,
    key text NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_pinned; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_pinned (
    user_id uuid NOT NULL,
    path text NOT NULL,
    label text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_recent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_recent (
    user_id uuid NOT NULL,
    path text NOT NULL,
    label text NOT NULL,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_scope; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_scope (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    to_chuc_id uuid,
    don_vi_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    note text
);


--
-- Name: v_canh_bao_nien_han; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_canh_bao_nien_han WITH (security_invoker='true') AS
 SELECT tb.ma_thiet_bi,
    tb.ten_thiet_bi,
    tb.so_nam_su_dung,
    tb.ty_le_tuoi_tho,
    tb.de_xuat_phuong_an
   FROM (public.thiet_bi tb
     JOIN public.dm_danh_gia_nien_han n ON ((n.id = tb.danh_gia_nien_han_id)))
  WHERE (n.ma = ANY (ARRAY['NH-QUA'::text, 'NH-QUA-23'::text]));


--
-- Name: v_canh_dieu_huong; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_canh_dieu_huong WITH (security_invoker='on') AS
 SELECT lk.id AS lien_ket_id,
    lk.he_thong_nguon_id AS tu,
    lk.he_thong_dich_id AS den,
    lk.loai_lien_ket_id,
    llk.ma AS loai_ma,
    llk.lan_truyen_tac_dong,
    llk.co_huong
   FROM (public.lien_ket_he_thong lk
     JOIN public.dm_loai_lien_ket llk ON ((llk.id = lk.loai_lien_ket_id)))
  WHERE ((lk.hieu_luc_den IS NULL) AND (llk.co_huong = true))
UNION ALL
 SELECT lk.id AS lien_ket_id,
    lk.he_thong_nguon_id AS tu,
    lk.he_thong_dich_id AS den,
    lk.loai_lien_ket_id,
    llk.ma AS loai_ma,
    llk.lan_truyen_tac_dong,
    llk.co_huong
   FROM (public.lien_ket_he_thong lk
     JOIN public.dm_loai_lien_ket llk ON ((llk.id = lk.loai_lien_ket_id)))
  WHERE ((lk.hieu_luc_den IS NULL) AND (llk.co_huong = false))
UNION ALL
 SELECT lk.id AS lien_ket_id,
    lk.he_thong_dich_id AS tu,
    lk.he_thong_nguon_id AS den,
    lk.loai_lien_ket_id,
    llk.ma AS loai_ma,
    llk.lan_truyen_tac_dong,
    llk.co_huong
   FROM (public.lien_ket_he_thong lk
     JOIN public.dm_loai_lien_ket llk ON ((llk.id = lk.loai_lien_ket_id)))
  WHERE ((lk.hieu_luc_den IS NULL) AND (llk.co_huong = false));


--
-- Name: v_do_thi_he_thong; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_do_thi_he_thong WITH (security_invoker='true') AS
 SELECT lk.id,
    lk.he_thong_nguon_id AS nguon_id,
    hn.ten AS nguon_ten,
    nhn.ten AS nguon_nhom,
    dvn.ten AS nguon_don_vi,
    lk.he_thong_dich_id AS dich_id,
    hd.ten AS dich_ten,
    nhd.ten AS dich_nhom,
    dvd.ten AS dich_don_vi,
    lk.loai_lien_ket_id,
    llk.ma AS loai_ma,
    llk.ten AS loai_ten,
    llk.mau_sac,
    llk.kieu_net,
    llk.co_huong,
    lk.lop,
    lk.huong,
    lk.vai_tro_du_phong,
    lk.giao_dien_nguon,
    lk.giao_dien_dich,
    lk.giao_thuc,
    lk.trang_thai,
    lk.don_vi_id_snapshot,
    (hn.pham_vi_quan_ly = 'ben_ngoai'::text) AS nguon_ben_ngoai,
    hn.to_chuc_so_huu AS nguon_to_chuc,
    (hd.pham_vi_quan_ly = 'ben_ngoai'::text) AS dich_ben_ngoai,
    hd.to_chuc_so_huu AS dich_to_chuc
   FROM (((((((public.lien_ket_he_thong lk
     JOIN public.dm_he_thong hn ON ((hn.id = lk.he_thong_nguon_id)))
     JOIN public.dm_he_thong hd ON ((hd.id = lk.he_thong_dich_id)))
     JOIN public.dm_loai_lien_ket llk ON ((llk.id = lk.loai_lien_ket_id)))
     LEFT JOIN public.dm_nhom_he_thong nhn ON ((nhn.id = hn.nhom_he_thong_id)))
     LEFT JOIN public.dm_nhom_he_thong nhd ON ((nhd.id = hd.nhom_he_thong_id)))
     LEFT JOIN public.dm_don_vi dvn ON ((dvn.id = hn.don_vi_id)))
     LEFT JOIN public.dm_don_vi dvd ON ((dvd.id = hd.don_vi_id)))
  WHERE (lk.hieu_luc_den IS NULL);


--
-- Name: v_do_thi_toan_canh; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_do_thi_toan_canh WITH (security_invoker='on') AS
 SELECT h.id,
    h.ma,
    h.ten,
    h.pham_vi_quan_ly,
    (h.pham_vi_quan_ly = 'ben_ngoai'::text) AS ben_ngoai,
    h.nhom_he_thong_id,
    nh.ten AS nhom_ten,
    h.don_vi_id,
    dv.ten AS don_vi_ten,
    h.to_chuc_id,
    tc.ma AS to_chuc_ma,
    tc.ten AS to_chuc_ten,
    tc.loai AS to_chuc_loai,
    tc.mau_sac AS to_chuc_mau,
    tc.to_chuc_cha_id,
    h.to_chuc_so_huu,
    COALESCE(deg.bac, (0)::bigint) AS bac_lien_ket
   FROM ((((public.dm_he_thong h
     LEFT JOIN public.dm_nhom_he_thong nh ON ((nh.id = h.nhom_he_thong_id)))
     LEFT JOIN public.dm_don_vi dv ON ((dv.id = h.don_vi_id)))
     LEFT JOIN public.dm_to_chuc tc ON ((tc.id = h.to_chuc_id)))
     LEFT JOIN LATERAL ( SELECT count(*) AS bac
           FROM public.lien_ket_he_thong lk
          WHERE ((lk.hieu_luc_den IS NULL) AND ((lk.he_thong_nguon_id = h.id) OR (lk.he_thong_dich_id = h.id)))) deg ON (true))
  WHERE (h.active = true);


--
-- Name: v_giay_phep; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_giay_phep WITH (security_invoker='on') AS
 WITH base AS (
         SELECT g.id,
            'giay_phep'::text AS nguon,
            COALESCE(g.so_giay_phep, g.ma_giay_phep) AS so_giay_phep,
            g.ma_giay_phep,
            COALESCE(lg.ten, 'Giấy phép'::text) AS loai,
            lg.ma AS loai_ma,
            g.ngay_cap,
            g.ngay_het_han,
            nc.ten AS noi_cap,
            g.file_giay_phep AS file_url,
            g.ghi_chu,
            NULL::text AS gp_cu,
            'thiet_bi'::text AS pham_vi,
            g.thiet_bi_id,
            NULL::uuid AS he_thong_id,
            tb.don_vi_id,
            dv.ma AS don_vi_ma,
            dv.ten AS don_vi_ten,
            COALESCE(tb.ten_thiet_bi, tb.ma_thiet_bi) AS ten_doi_tuong,
            NULL::text AS kieu_thiet_bi,
            g.created_at,
            g.updated_at
           FROM ((((public.giay_phep g
             LEFT JOIN public.dm_loai_giay_phep lg ON ((lg.id = g.loai_giay_phep_id)))
             LEFT JOIN public.dm_noi_cap nc ON ((nc.id = g.noi_cap_id)))
             LEFT JOIN public.thiet_bi tb ON ((tb.id = g.thiet_bi_id)))
             LEFT JOIN public.dm_don_vi dv ON ((dv.id = tb.don_vi_id)))
        UNION ALL
         SELECT k.id,
            'gpkt'::text AS text,
            k.gp_so,
            k.gp_so,
            'Giấy phép khai thác'::text AS text,
            'GPKT'::text AS text,
            public.parse_vn_date(k.gp_ngay) AS parse_vn_date,
            public.parse_vn_date(k.gp_han) AS parse_vn_date,
            k.dia_diem,
            NULL::text AS text,
            k.muc_dich,
            k.gp_cu,
            'he_thong'::text AS text,
            NULL::uuid AS uuid,
            k.he_thong_id,
            ht.don_vi_id,
            dv.ma,
            COALESCE(dv.ten, k.don_vi) AS "coalesce",
            COALESCE(k.ten_he_thong_theo_gp, ht.ten) AS "coalesce",
            k.kieu_thiet_bi,
            k.created_at,
            k.updated_at
           FROM ((public.giay_phep_khai_thac k
             LEFT JOIN public.dm_he_thong ht ON ((ht.id = k.he_thong_id)))
             LEFT JOIN public.dm_don_vi dv ON ((dv.id = ht.don_vi_id)))
        )
 SELECT id,
    nguon,
    so_giay_phep,
    ma_giay_phep,
    loai,
    loai_ma,
    ngay_cap,
    ngay_het_han,
    noi_cap,
    file_url,
    ghi_chu,
    gp_cu,
    pham_vi,
    thiet_bi_id,
    he_thong_id,
    don_vi_id,
    don_vi_ma,
    don_vi_ten,
    ten_doi_tuong,
    kieu_thiet_bi,
    created_at,
    updated_at,
    (ngay_het_han - CURRENT_DATE) AS so_ngay_con_lai,
        CASE
            WHEN (ngay_het_han IS NULL) THEN 'none'::text
            WHEN (ngay_het_han < CURRENT_DATE) THEN 'expired'::text
            WHEN (ngay_het_han <= (CURRENT_DATE + 60)) THEN 'expiring'::text
            ELSE 'valid'::text
        END AS trang_thai,
    (EXISTS ( SELECT 1
           FROM base b2
          WHERE ((b2.gp_cu IS NOT NULL) AND (b2.id <> b.id) AND (btrim(b2.gp_cu) = btrim(b.so_giay_phep))))) AS bi_thay_the
   FROM base b;


--
-- Name: v_he_thong_ky_thuat_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_he_thong_ky_thuat_summary WITH (security_invoker='true') AS
 SELECT ( SELECT count(*) AS count
           FROM public.dm_nhom_he_thong
          WHERE COALESCE(dm_nhom_he_thong.active, true)) AS so_nhom,
    ( SELECT count(*) AS count
           FROM public.dm_he_thong
          WHERE COALESCE(dm_he_thong.active, true)) AS so_he_thong,
    ( SELECT count(*) AS count
           FROM public.he_thong_thanh_phan) AS so_thanh_phan,
    ( SELECT count(*) AS count
           FROM public.thiet_bi) AS so_tai_san,
    ( SELECT count(*) AS count
           FROM public.thiet_bi
          WHERE (thiet_bi.he_thong_id IS NULL)) AS so_tai_san_chua_gan_he_thong,
    ( SELECT count(DISTINCT gan_chuc_nang.thiet_bi_id) AS count
           FROM public.gan_chuc_nang
          WHERE (gan_chuc_nang.den_ngay IS NULL)) AS so_tai_san_dang_lap;


--
-- Name: v_kpi_bao_tri; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_kpi_bao_tri WITH (security_invoker='true') AS
 SELECT cv.don_vi_id_snapshot AS don_vi_id,
    dv.ten AS don_vi_ten,
    count(*) AS tong_cong_viec,
    count(*) FILTER (WHERE (cv.trang_thai = 'HOAN_THANH'::text)) AS da_hoan_thanh,
    count(*) FILTER (WHERE (cv.trang_thai = ANY (ARRAY['MO'::text, 'DANG_LAM'::text]))) AS dang_mo,
    count(*) FILTER (WHERE ((cv.trang_thai = ANY (ARRAY['MO'::text, 'DANG_LAM'::text])) AND (cv.ngay_den_han < CURRENT_DATE))) AS qua_han,
    count(*) FILTER (WHERE ((cv.trang_thai = 'HOAN_THANH'::text) AND (cv.ngay_hoan_thanh <= cv.ngay_den_han))) AS hoan_thanh_dung_han,
    round(((100.0 * (count(*) FILTER (WHERE ((cv.trang_thai = 'HOAN_THANH'::text) AND (cv.ngay_hoan_thanh <= cv.ngay_den_han))))::numeric) / (NULLIF(count(*) FILTER (WHERE (cv.trang_thai = 'HOAN_THANH'::text)), 0))::numeric), 1) AS ty_le_dung_han
   FROM (public.cong_viec_bao_tri cv
     LEFT JOIN public.dm_don_vi dv ON ((dv.id = cv.don_vi_id_snapshot)))
  GROUP BY cv.don_vi_id_snapshot, dv.ten;


--
-- Name: v_lien_ket_tu_khe; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_lien_ket_tu_khe WITH (security_invoker='on') AS
 SELECT lkk.id AS lien_ket_khe_id,
    sn.he_thong_id AS he_thong_nguon_id,
    sd.he_thong_id AS he_thong_dich_id,
    lkk.khe_nguon_id,
    lkk.khe_dich_id,
    lkk.loai_lien_ket_id,
    llk.ma AS loai_ma,
    llk.co_huong,
    llk.lan_truyen_tac_dong,
    lkk.giao_dien_nguon,
    lkk.giao_dien_dich,
    lkk.giao_thuc,
    lkk.trang_thai
   FROM (((public.lien_ket_khe lkk
     JOIN public.he_thong_thanh_phan sn ON ((sn.id = lkk.khe_nguon_id)))
     JOIN public.he_thong_thanh_phan sd ON ((sd.id = lkk.khe_dich_id)))
     JOIN public.dm_loai_lien_ket llk ON ((llk.id = lkk.loai_lien_ket_id)))
  WHERE ((lkk.hieu_luc_den IS NULL) AND (sn.he_thong_id <> sd.he_thong_id));


--
-- Name: v_ly_lich_he_thong; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_ly_lich_he_thong WITH (security_invoker='true') AS
 SELECT s.he_thong_id,
    s.ngay_phat_hien AS thoi_diem,
    'su_co'::text AS loai_su_kien,
    COALESCE(NULLIF(s.hien_tuong, ''::text), 'Sự cố'::text) AS tieu_de,
    NULLIF(s.muc_do, ''::text) AS mo_ta,
    'su_co'::text AS nguon,
    s.id AS nguon_id,
    s.thanh_phan_id,
    s.thiet_bi_id
   FROM public.su_co s
  WHERE (s.he_thong_id IS NOT NULL)
UNION ALL
 SELECT b.he_thong_id,
    (b.ngay_bat_dau)::timestamp with time zone AS thoi_diem,
    'bao_tri'::text AS loai_su_kien,
    COALESCE(NULLIF(b.mo_ta_cong_viec, ''::text), NULLIF(b.loai_bao_tri, ''::text), 'Bảo dưỡng'::text) AS tieu_de,
    NULLIF(b.ket_qua, ''::text) AS mo_ta,
    'bao_tri'::text AS nguon,
    b.id AS nguon_id,
    b.thanh_phan_id,
    b.thiet_bi_id
   FROM public.bao_tri b
  WHERE (b.he_thong_id IS NOT NULL)
UNION ALL
 SELECT h.he_thong_id,
    (h.ngay_hong)::timestamp with time zone AS thoi_diem,
    'hong_hoc'::text AS loai_su_kien,
    COALESCE(NULLIF(h.mo_ta_hong_hoc, ''::text), NULLIF(h.bo_phan_hong, ''::text), 'Hỏng hóc'::text) AS tieu_de,
    NULLIF(h.phuong_an, ''::text) AS mo_ta,
    'hong_hoc'::text AS nguon,
    h.id AS nguon_id,
    h.thanh_phan_id,
    h.thiet_bi_hong_id AS thiet_bi_id
   FROM public.hong_hoc h
  WHERE (h.he_thong_id IS NOT NULL);


--
-- Name: v_ly_lich_khe_linh_kien; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_ly_lich_khe_linh_kien WITH (security_invoker='on') AS
 SELECT g.khe_id,
    k.thiet_bi_id AS thiet_bi_cha_id,
    k.ma_khe,
    k.ten AS ten_khe,
    g.id AS gan_id,
    g.linh_kien_id,
    t.ma_thiet_bi,
    COALESCE(t.ten_thiet_bi, t.ma_thiet_bi) AS ten_linh_kien,
    t.ma_serial,
    g.tu_ngay,
    g.den_ngay,
    g.ly_do,
    g.hong_hoc_id,
    g.nguoi_thuc_hien,
    g.ghi_chu
   FROM ((public.gan_linh_kien g
     JOIN public.thiet_bi_khe_linh_kien k ON ((k.id = g.khe_id)))
     JOIN public.thiet_bi t ON ((t.id = g.linh_kien_id)))
  ORDER BY g.khe_id, g.tu_ngay;


--
-- Name: v_ly_lich_thanh_phan; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_ly_lich_thanh_phan WITH (security_invoker='true') AS
 SELECT g.thanh_phan_id,
    g.tu_ngay AS thoi_diem,
    'lap'::text AS loai_su_kien,
    ('Lắp thiết bị: '::text || COALESCE(t.ten_thiet_bi, t.ma_thiet_bi)) AS tieu_de,
    NULLIF(g.ghi_chu, ''::text) AS mo_ta,
    'gan_chuc_nang'::text AS nguon,
    g.id AS nguon_id,
    g.thiet_bi_id,
    t.ma_thiet_bi
   FROM (public.gan_chuc_nang g
     JOIN public.thiet_bi t ON ((t.id = g.thiet_bi_id)))
UNION ALL
 SELECT g.thanh_phan_id,
    g.den_ngay AS thoi_diem,
    'thao'::text AS loai_su_kien,
    (((('Tháo thiết bị: '::text || COALESCE(t.ten_thiet_bi, t.ma_thiet_bi)) || ' ('::text) || COALESCE(g.ly_do, ''::text)) || ')'::text) AS tieu_de,
    NULLIF(g.ghi_chu, ''::text) AS mo_ta,
    'gan_chuc_nang'::text AS nguon,
    g.id AS nguon_id,
    g.thiet_bi_id,
    t.ma_thiet_bi
   FROM (public.gan_chuc_nang g
     JOIN public.thiet_bi t ON ((t.id = g.thiet_bi_id)))
  WHERE (g.den_ngay IS NOT NULL)
UNION ALL
 SELECT s.thanh_phan_id,
    s.ngay_phat_hien AS thoi_diem,
    'su_co'::text AS loai_su_kien,
    COALESCE(NULLIF(s.hien_tuong, ''::text), 'Sự cố'::text) AS tieu_de,
    NULLIF(s.muc_do, ''::text) AS mo_ta,
    'su_co'::text AS nguon,
    s.id AS nguon_id,
    s.thiet_bi_id,
    s.snapshot_ma_thiet_bi AS ma_thiet_bi
   FROM public.su_co s
  WHERE (s.thanh_phan_id IS NOT NULL)
UNION ALL
 SELECT b.thanh_phan_id,
    (b.ngay_bat_dau)::timestamp with time zone AS thoi_diem,
    'bao_tri'::text AS loai_su_kien,
    COALESCE(NULLIF(b.mo_ta_cong_viec, ''::text), NULLIF(b.loai_bao_tri, ''::text), 'Bảo dưỡng'::text) AS tieu_de,
    NULLIF(b.ket_qua, ''::text) AS mo_ta,
    'bao_tri'::text AS nguon,
    b.id AS nguon_id,
    b.thiet_bi_id,
    b.snapshot_ma_thiet_bi AS ma_thiet_bi
   FROM public.bao_tri b
  WHERE (b.thanh_phan_id IS NOT NULL)
UNION ALL
 SELECT h.thanh_phan_id,
    (h.ngay_hong)::timestamp with time zone AS thoi_diem,
    'hong_hoc'::text AS loai_su_kien,
    COALESCE(NULLIF(h.mo_ta_hong_hoc, ''::text), NULLIF(h.bo_phan_hong, ''::text), 'Hỏng hóc'::text) AS tieu_de,
    NULLIF(h.phuong_an, ''::text) AS mo_ta,
    'hong_hoc'::text AS nguon,
    h.id AS nguon_id,
    h.thiet_bi_hong_id AS thiet_bi_id,
    h.snapshot_ma_thiet_bi AS ma_thiet_bi
   FROM public.hong_hoc h
  WHERE (h.thanh_phan_id IS NOT NULL);


--
-- Name: v_ly_lich_thiet_bi; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_ly_lich_thiet_bi WITH (security_invoker='on') AS
 SELECT g.thiet_bi_id,
    g.tu_ngay AS thoi_diem,
    'lap'::text AS loai_su_kien,
    ('Lắp vào vị trí: '::text || tp.ten) AS tieu_de,
    NULLIF(g.ghi_chu, ''::text) AS mo_ta,
    'gan_chuc_nang'::text AS nguon,
    g.id AS nguon_id
   FROM (public.gan_chuc_nang g
     JOIN public.he_thong_thanh_phan tp ON ((tp.id = g.thanh_phan_id)))
UNION ALL
 SELECT g.thiet_bi_id,
    g.den_ngay AS thoi_diem,
    'roi_vi_tri'::text AS loai_su_kien,
    (((('Rời vị trí: '::text || tp.ten) || ' ('::text) || g.ly_do) || ')'::text) AS tieu_de,
    NULLIF(g.ghi_chu, ''::text) AS mo_ta,
    'gan_chuc_nang'::text AS nguon,
    g.id AS nguon_id
   FROM (public.gan_chuc_nang g
     JOIN public.he_thong_thanh_phan tp ON ((tp.id = g.thanh_phan_id)))
  WHERE (g.den_ngay IS NOT NULL)
UNION ALL
 SELECT g.linh_kien_id AS thiet_bi_id,
    g.tu_ngay AS thoi_diem,
    'lap_linh_kien'::text AS loai_su_kien,
    ('Lắp vào khe linh kiện: '::text || k.ten) AS tieu_de,
    NULLIF(g.ghi_chu, ''::text) AS mo_ta,
    'gan_linh_kien'::text AS nguon,
    g.id AS nguon_id
   FROM (public.gan_linh_kien g
     JOIN public.thiet_bi_khe_linh_kien k ON ((k.id = g.khe_id)))
UNION ALL
 SELECT g.linh_kien_id AS thiet_bi_id,
    g.den_ngay AS thoi_diem,
    'roi_khe_linh_kien'::text AS loai_su_kien,
    (((('Rời khe linh kiện: '::text || k.ten) || ' ('::text) || g.ly_do) || ')'::text) AS tieu_de,
    NULLIF(g.ghi_chu, ''::text) AS mo_ta,
    'gan_linh_kien'::text AS nguon,
    g.id AS nguon_id
   FROM (public.gan_linh_kien g
     JOIN public.thiet_bi_khe_linh_kien k ON ((k.id = g.khe_id)))
  WHERE (g.den_ngay IS NOT NULL)
UNION ALL
 SELECT h.thiet_bi_hong_id AS thiet_bi_id,
    (h.ngay_hong)::timestamp with time zone AS thoi_diem,
    'hong_hoc'::text AS loai_su_kien,
    COALESCE(NULLIF(h.mo_ta_hong_hoc, ''::text), NULLIF(h.bo_phan_hong, ''::text), 'Hỏng hóc'::text) AS tieu_de,
    NULLIF(h.phuong_an, ''::text) AS mo_ta,
    'hong_hoc'::text AS nguon,
    h.id AS nguon_id
   FROM public.hong_hoc h
  WHERE (h.thiet_bi_hong_id IS NOT NULL)
UNION ALL
 SELECT b.thiet_bi_id,
    (b.ngay_bat_dau)::timestamp with time zone AS thoi_diem,
    'bao_tri'::text AS loai_su_kien,
    COALESCE(NULLIF(b.mo_ta_cong_viec, ''::text), NULLIF(b.loai_bao_tri, ''::text), 'Bảo dưỡng'::text) AS tieu_de,
    NULLIF(b.ket_qua, ''::text) AS mo_ta,
    'bao_tri'::text AS nguon,
    b.id AS nguon_id
   FROM public.bao_tri b
  WHERE (b.thiet_bi_id IS NOT NULL)
UNION ALL
 SELECT s.thiet_bi_id,
    s.ngay_phat_hien AS thoi_diem,
    'su_co'::text AS loai_su_kien,
    COALESCE(NULLIF(s.hien_tuong, ''::text), 'Sự cố'::text) AS tieu_de,
    NULLIF(s.muc_do, ''::text) AS mo_ta,
    'su_co'::text AS nguon,
    s.id AS nguon_id
   FROM public.su_co s
  WHERE (s.thiet_bi_id IS NOT NULL)
UNION ALL
 SELECT bg.thiet_bi_id,
    (bg.ngay_nhan)::timestamp with time zone AS thoi_diem,
    'ban_giao'::text AS loai_su_kien,
    ((COALESCE(NULLIF(bg.nguoi_giao, ''::text), '—'::text) || ' → '::text) || COALESCE(NULLIF(bg.nguoi_nhan, ''::text), '—'::text)) AS tieu_de,
    NULLIF(bg.loai_ban_giao, ''::text) AS mo_ta,
    'ban_giao'::text AS nguon,
    bg.id AS nguon_id
   FROM public.ban_giao bg
  WHERE (bg.thiet_bi_id IS NOT NULL)
UNION ALL
 SELECT vd.thiet_bi_id,
    vd.thoi_diem,
    'vong_doi'::text AS loai_su_kien,
    COALESCE(NULLIF(vd.ly_do, ''::text), 'Thay đổi trạng thái'::text) AS tieu_de,
    NULL::text AS mo_ta,
    'thiet_bi_vong_doi'::text AS nguon,
    vd.id AS nguon_id
   FROM public.thiet_bi_vong_doi vd
UNION ALL
 SELECT k.thiet_bi_id,
    k.thoi_diem,
    'kiem_ke'::text AS loai_su_kien,
    'Kiểm kê'::text AS tieu_de,
    NULLIF(k.tinh_trang, ''::text) AS mo_ta,
    'kiem_ke'::text AS nguon,
    k.id AS nguon_id
   FROM public.kiem_ke k;


--
-- Name: v_ly_lich_vi_tri_chuc_nang; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_ly_lich_vi_tri_chuc_nang WITH (security_invoker='on') AS
 SELECT g.thanh_phan_id,
    tp.he_thong_id,
    tp.ma_thanh_phan,
    tp.ten AS ten_vi_tri,
    g.id AS gan_id,
    g.thiet_bi_id,
    t.ma_thiet_bi,
    COALESCE(t.ten_thiet_bi, t.ma_thiet_bi) AS ten_thiet_bi,
    t.ma_serial,
    g.tu_ngay,
    g.den_ngay,
    g.ly_do,
    g.hong_hoc_id,
    g.nguoi_thuc_hien,
    g.ghi_chu
   FROM ((public.gan_chuc_nang g
     JOIN public.he_thong_thanh_phan tp ON ((tp.id = g.thanh_phan_id)))
     JOIN public.thiet_bi t ON ((t.id = g.thiet_bi_id)))
  ORDER BY g.thanh_phan_id, g.tu_ngay;


--
-- Name: v_menu_badges; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_menu_badges WITH (security_invoker='true') AS
 SELECT (( SELECT count(*) AS count
           FROM public.su_co
          WHERE ((su_co.trang_thai IS NOT NULL) AND (su_co.trang_thai <> ALL (ARRAY['DA_XU_LY'::text, 'DA_DONG'::text, 'HOAN_THANH'::text, 'CLOSED'::text, 'DONE'::text])))))::integer AS su_co_mo,
    (( SELECT count(*) AS count
           FROM public.bao_tri
          WHERE ((bao_tri.trang_thai IS NOT NULL) AND (bao_tri.trang_thai <> ALL (ARRAY['HOAN_THANH'::text, 'DA_DONG'::text, 'CLOSED'::text, 'DONE'::text])))))::integer AS bao_tri_mo,
    (( SELECT count(*) AS count
           FROM public.hong_hoc
          WHERE ((hong_hoc.trang_thai IS NOT NULL) AND (hong_hoc.trang_thai <> ALL (ARRAY['HOAN_THANH'::text, 'DA_XU_LY'::text, 'DA_DONG'::text, 'CLOSED'::text, 'DONE'::text])))))::integer AS hong_hoc_mo,
    (( SELECT count(*) AS count
           FROM public.bao_tri
          WHERE (bao_tri.ngay_bat_dau = CURRENT_DATE)))::integer AS bao_tri_hom_nay;


--
-- Name: v_metric_timeseries; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_metric_timeseries WITH (security_invoker='on') AS
 SELECT r.id,
    r.submission_id,
    r.metric_key,
    r.section_code,
    r.item_code,
    r.ten,
    r.result_kind,
    r.gia_tri_so,
    r.gia_tri_text,
    r.don_vi,
    r.tieu_chuan,
    r.nguong_min,
    r.nguong_max,
    r.nguong_op,
    r.ket_qua,
    r.auto_ket_qua,
    r.thanh_phan_id,
    r.thiet_bi_id,
    r.he_thong_id,
    r.don_vi_id,
    COALESCE(r.submitted_at, r.created_at) AS thoi_diem,
    s.template_code,
    s.template_version,
    s.status
   FROM (public.form_submission_item_result r
     JOIN public.form_submission s ON ((s.id = r.submission_id)))
  WHERE (r.metric_key IS NOT NULL);


--
-- Name: v_nsx_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_nsx_stats WITH (security_invoker='true') AS
 SELECT n.id AS nha_san_xuat_id,
    n.ma,
    n.ten,
    COALESCE(m.n_model, 0) AS so_model,
    COALESCE(t.n_thiet_bi, 0) AS so_thiet_bi
   FROM ((public.dm_nha_san_xuat n
     LEFT JOIN ( SELECT dm_model.nha_san_xuat_id,
            (count(*))::integer AS n_model
           FROM public.dm_model
          WHERE (dm_model.nha_san_xuat_id IS NOT NULL)
          GROUP BY dm_model.nha_san_xuat_id) m ON ((m.nha_san_xuat_id = n.id)))
     LEFT JOIN ( SELECT thiet_bi.nha_san_xuat_id,
            (count(*))::integer AS n_thiet_bi
           FROM public.thiet_bi
          WHERE (thiet_bi.nha_san_xuat_id IS NOT NULL)
          GROUP BY thiet_bi.nha_san_xuat_id) t ON ((t.nha_san_xuat_id = n.id)));


--
-- Name: v_sap_het_han; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_sap_het_han WITH (security_invoker='true') AS
 SELECT 'bao_hanh'::text AS loai,
    t.id AS thiet_bi_id,
    COALESCE(t.ten_thiet_bi, t.ma_thiet_bi) AS ten,
    t.han_bao_hanh AS ngay_het_han,
    (t.han_bao_hanh - ((now() AT TIME ZONE 'Asia/Ho_Chi_Minh'::text))::date) AS so_ngay_con_lai
   FROM public.thiet_bi t
  WHERE (t.han_bao_hanh IS NOT NULL)
UNION ALL
 SELECT 'giay_phep'::text AS loai,
    v.thiet_bi_id,
    COALESCE(v.so_giay_phep, v.ten_doi_tuong) AS ten,
    v.ngay_het_han,
    (v.ngay_het_han - ((now() AT TIME ZONE 'Asia/Ho_Chi_Minh'::text))::date) AS so_ngay_con_lai
   FROM public.v_giay_phep v
  WHERE ((v.ngay_het_han IS NOT NULL) AND (v.bi_thay_the = false))
UNION ALL
 SELECT 'chung_chi'::text AS loai,
    c.thiet_bi_id,
    ((((COALESCE(tb.ten_thiet_bi, tb.ma_thiet_bi, ''::text) || ' — '::text) || c.loai) || ' '::text) || c.so_giay_chung_nhan) AS ten,
    c.ngay_het_han,
    (c.ngay_het_han - ((now() AT TIME ZONE 'Asia/Ho_Chi_Minh'::text))::date) AS so_ngay_con_lai
   FROM (public.chung_chi_thiet_bi c
     JOIN public.thiet_bi tb ON ((tb.id = c.thiet_bi_id)))
  WHERE (c.ngay_het_han IS NOT NULL);


--
-- Name: v_thiet_bi_dac_tinh; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_thiet_bi_dac_tinh WITH (security_invoker='true') AS
 SELECT tb.id AS thiet_bi_id,
    mdt.dac_tinh_id
   FROM (public.thiet_bi tb
     JOIN public.dm_model_dac_tinh mdt ON ((mdt.model_id = tb.model_id)));


--
-- Name: v_thiet_bi_ket_noi; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_thiet_bi_ket_noi WITH (security_invoker='on') AS
 SELECT k.id,
    k.tu_thiet_bi_id,
    k.den_thiet_bi_id,
    k.tu_cong,
    k.den_cong,
    k.loai,
    k.ten_mach,
    k.mo_ta,
    k.don_vi_id_snapshot,
    k.created_by,
    k.created_at,
    k.updated_at,
    t1.ma_thiet_bi AS tu_ma,
    COALESCE(t1.ten_thiet_bi, t1.ma_thiet_bi) AS tu_ten,
    t2.ma_thiet_bi AS den_ma,
    COALESCE(t2.ten_thiet_bi, t2.ma_thiet_bi) AS den_ten,
    dv.ma AS don_vi_ma,
    dv.ten AS don_vi_ten
   FROM (((public.thiet_bi_ket_noi k
     JOIN public.thiet_bi t1 ON ((t1.id = k.tu_thiet_bi_id)))
     JOIN public.thiet_bi t2 ON ((t2.id = k.den_thiet_bi_id)))
     LEFT JOIN public.dm_don_vi dv ON ((dv.id = k.don_vi_id_snapshot)));


--
-- Name: vat_tu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vat_tu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_vat_tu text,
    ten text NOT NULL,
    loai text DEFAULT 'DU_PHONG'::text NOT NULL,
    don_vi_tinh text DEFAULT 'cái'::text NOT NULL,
    don_gia numeric DEFAULT 0 NOT NULL,
    muc_ton_toi_thieu numeric DEFAULT 0 NOT NULL,
    model_id uuid,
    nha_cung_cap_id uuid,
    don_vi_id uuid,
    ghi_chu text,
    kich_hoat boolean DEFAULT true NOT NULL,
    created_by uuid DEFAULT public.current_uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT vat_tu_loai_check CHECK ((loai = ANY (ARRAY['DU_PHONG'::text, 'TIEU_HAO'::text])))
);


--
-- Name: v_ton_kho; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_ton_kho WITH (security_invoker='true') AS
 SELECT g.vat_tu_id,
    g.kho_id,
    vt.ten AS ten_vat_tu,
    vt.ma_vat_tu,
    vt.loai,
    vt.don_vi_tinh,
    vt.muc_ton_toi_thieu,
    k.ten AS ten_kho,
    g.don_vi_id,
    sum(g.hieu_ung) AS ton_kho
   FROM ((public.kho_giao_dich g
     JOIN public.vat_tu vt ON ((vt.id = g.vat_tu_id)))
     JOIN public.kho k ON ((k.id = g.kho_id)))
  GROUP BY g.vat_tu_id, g.kho_id, vt.ten, vt.ma_vat_tu, vt.loai, vt.don_vi_tinh, vt.muc_ton_toi_thieu, k.ten, g.don_vi_id;


--
-- Name: v_ton_kho_canh_bao; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_ton_kho_canh_bao WITH (security_invoker='true') AS
 SELECT vt.id AS vat_tu_id,
    vt.ten AS ten_vat_tu,
    vt.ma_vat_tu,
    vt.loai,
    vt.don_vi_tinh,
    vt.muc_ton_toi_thieu,
    vt.don_vi_id,
    COALESCE(sum(g.hieu_ung), (0)::numeric) AS tong_ton
   FROM (public.vat_tu vt
     LEFT JOIN public.kho_giao_dich g ON ((g.vat_tu_id = vt.id)))
  WHERE (vt.kich_hoat = true)
  GROUP BY vt.id, vt.ten, vt.ma_vat_tu, vt.loai, vt.don_vi_tinh, vt.muc_ton_toi_thieu, vt.don_vi_id
 HAVING (COALESCE(sum(g.hieu_ung), (0)::numeric) < vt.muc_ton_toi_thieu);


--
-- Name: van_de; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.van_de (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ma_van_de text,
    tieu_de text NOT NULL,
    mo_ta text,
    nguyen_nhan_goc text,
    bien_phap_khac_phuc text,
    trang_thai text DEFAULT 'moi'::text NOT NULL,
    muc_do text DEFAULT 'trung_binh'::text NOT NULL,
    thiet_bi_id uuid,
    he_thong_id uuid,
    don_vi_id_snapshot uuid,
    created_by uuid DEFAULT public.current_uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: v_van_de; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_van_de WITH (security_invoker='on') AS
 SELECT vd.id,
    vd.ma_van_de,
    vd.tieu_de,
    vd.mo_ta,
    vd.nguyen_nhan_goc,
    vd.bien_phap_khac_phuc,
    vd.trang_thai,
    vd.muc_do,
    vd.thiet_bi_id,
    vd.he_thong_id,
    vd.don_vi_id_snapshot,
    vd.created_by,
    vd.created_at,
    vd.updated_at,
    tb.ma_thiet_bi AS thiet_bi_ma,
    tb.ten_thiet_bi AS thiet_bi_ten,
    ht.ten AS he_thong_ten,
    dv.ten AS don_vi_ten,
    ( SELECT count(*) AS count
           FROM public.su_co sc
          WHERE (sc.van_de_id = vd.id)) AS so_su_co,
    ( SELECT count(*) AS count
           FROM public.cong_viec_bao_tri cv
          WHERE (cv.van_de_id = vd.id)) AS so_thay_doi
   FROM (((public.van_de vd
     LEFT JOIN public.thiet_bi tb ON ((tb.id = vd.thiet_bi_id)))
     LEFT JOIN public.dm_he_thong ht ON ((ht.id = vd.he_thong_id)))
     LEFT JOIN public.dm_don_vi dv ON ((dv.id = vd.don_vi_id_snapshot)));


--
-- Name: van_de_ma_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.van_de_ma_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vi_tri_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vi_tri_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vi_tri_ma text NOT NULL,
    don_vi text,
    loai text DEFAULT 'anh'::text NOT NULL,
    ten_tep text NOT NULL,
    duong_dan text NOT NULL,
    mo_ta text,
    kich_thuoc bigint,
    content_type text,
    created_by uuid DEFAULT public.current_uid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    vi_do double precision,
    kinh_do double precision,
    do_chinh_xac double precision,
    chup_luc timestamp with time zone,
    CONSTRAINT vi_tri_media_loai_check CHECK ((loai = ANY (ARRAY['anh'::text, 'pano360'::text, 'model3d'::text])))
);


--
-- Name: COLUMN vi_tri_media.vi_do; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vi_tri_media.vi_do IS 'Vĩ độ (latitude) nơi chụp ảnh, lấy từ GPS thiết bị';


--
-- Name: COLUMN vi_tri_media.kinh_do; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vi_tri_media.kinh_do IS 'Kinh độ (longitude) nơi chụp ảnh, lấy từ GPS thiết bị';


--
-- Name: COLUMN vi_tri_media.do_chinh_xac; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vi_tri_media.do_chinh_xac IS 'Độ chính xác GPS (mét)';


--
-- Name: COLUMN vi_tri_media.chup_luc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vi_tri_media.chup_luc IS 'Thời điểm chụp/ghi nhận vị trí (client timestamp)';


--
-- Name: webauthn_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id text NOT NULL,
    public_key text NOT NULL,
    counter bigint DEFAULT 0 NOT NULL,
    transports text[],
    device_type text,
    backed_up boolean DEFAULT false NOT NULL,
    device_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: weekly_report_import; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weekly_report_import (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    don_vi text,
    so_van_ban text,
    ngay_ky text,
    tuan_tu_ngay text,
    tuan_den_ngay text,
    tieu_de text,
    file_name text,
    file_size integer,
    n_incidents_detected integer DEFAULT 0 NOT NULL,
    n_hong_hoc_detected integer DEFAULT 0 NOT NULL,
    n_incidents_created integer DEFAULT 0 NOT NULL,
    n_hong_hoc_created integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'success'::text NOT NULL,
    error_message text,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by uuid,
    created_by_name text,
    don_vi_ma text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: r2_access_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.r2_access_log ALTER COLUMN id SET DEFAULT nextval('public.r2_access_log_id_seq'::regclass);


--
-- Name: access_request access_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_request
    ADD CONSTRAINT access_request_pkey PRIMARY KEY (id);


--
-- Name: ai_config ai_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_config
    ADD CONSTRAINT ai_config_pkey PRIMARY KEY (id);


--
-- Name: ai_conversation ai_conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversation
    ADD CONSTRAINT ai_conversation_pkey PRIMARY KEY (id);


--
-- Name: ai_message ai_message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_message
    ADD CONSTRAINT ai_message_pkey PRIMARY KEY (id);


--
-- Name: anomaly_alert anomaly_alert_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anomaly_alert
    ADD CONSTRAINT anomaly_alert_pkey PRIMARY KEY (id);


--
-- Name: app_cai_dat app_cai_dat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_cai_dat
    ADD CONSTRAINT app_cai_dat_pkey PRIMARY KEY (khoa);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: auth_event_log auth_event_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_event_log
    ADD CONSTRAINT auth_event_log_pkey PRIMARY KEY (id);


--
-- Name: backup_lich_su backup_lich_su_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_lich_su
    ADD CONSTRAINT backup_lich_su_pkey PRIMARY KEY (id);


--
-- Name: ban_giao ban_giao_ma_ban_giao_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ban_giao
    ADD CONSTRAINT ban_giao_ma_ban_giao_key UNIQUE (ma_ban_giao);


--
-- Name: ban_giao ban_giao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ban_giao
    ADD CONSTRAINT ban_giao_pkey PRIMARY KEY (id);


--
-- Name: bang_cot_tuy_chinh bang_cot_tuy_chinh_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bang_cot_tuy_chinh
    ADD CONSTRAINT bang_cot_tuy_chinh_pkey PRIMARY KEY (id);


--
-- Name: bang_cot_tuy_chinh bang_cot_tuy_chinh_user_id_bang_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bang_cot_tuy_chinh
    ADD CONSTRAINT bang_cot_tuy_chinh_user_id_bang_key_key UNIQUE (user_id, bang_key);


--
-- Name: bao_cao_annotation bao_cao_annotation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bao_cao_annotation
    ADD CONSTRAINT bao_cao_annotation_pkey PRIMARY KEY (id);


--
-- Name: bao_tri_chinh_sach bao_tri_chinh_sach_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bao_tri_chinh_sach
    ADD CONSTRAINT bao_tri_chinh_sach_pkey PRIMARY KEY (id);


--
-- Name: bao_tri bao_tri_ma_bao_tri_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bao_tri
    ADD CONSTRAINT bao_tri_ma_bao_tri_key UNIQUE (ma_bao_tri);


--
-- Name: bao_tri bao_tri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bao_tri
    ADD CONSTRAINT bao_tri_pkey PRIMARY KEY (id);


--
-- Name: canh_bao_het_han_log canh_bao_het_han_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canh_bao_het_han_log
    ADD CONSTRAINT canh_bao_het_han_log_pkey PRIMARY KEY (id);


--
-- Name: cay_node_edit cay_node_edit_kind_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cay_node_edit
    ADD CONSTRAINT cay_node_edit_kind_ma_key UNIQUE (kind, ma);


--
-- Name: cay_node_edit cay_node_edit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cay_node_edit
    ADD CONSTRAINT cay_node_edit_pkey PRIMARY KEY (id);


--
-- Name: cay_thay_doi cay_thay_doi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cay_thay_doi
    ADD CONSTRAINT cay_thay_doi_pkey PRIMARY KEY (id);


--
-- Name: change_request change_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.change_request
    ADD CONSTRAINT change_request_pkey PRIMARY KEY (id);


--
-- Name: chung_chi_thiet_bi chung_chi_thiet_bi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chung_chi_thiet_bi
    ADD CONSTRAINT chung_chi_thiet_bi_pkey PRIMARY KEY (id);


--
-- Name: cong_viec_bao_tri cong_viec_bao_tri_ma_cong_viec_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cong_viec_bao_tri
    ADD CONSTRAINT cong_viec_bao_tri_ma_cong_viec_key UNIQUE (ma_cong_viec);


--
-- Name: cong_viec_bao_tri cong_viec_bao_tri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cong_viec_bao_tri
    ADD CONSTRAINT cong_viec_bao_tri_pkey PRIMARY KEY (id);


--
-- Name: conversation_participant conversation_participant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participant
    ADD CONSTRAINT conversation_participant_pkey PRIMARY KEY (conversation_id, user_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: du_an_cong_van_lien_ket dacvlk_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_van_lien_ket
    ADD CONSTRAINT dacvlk_unique UNIQUE (tu_id, den_id, loai);


--
-- Name: dinh_nghia_truong dinh_nghia_truong_ap_dung_cho_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dinh_nghia_truong
    ADD CONSTRAINT dinh_nghia_truong_ap_dung_cho_key_key UNIQUE (ap_dung_cho, key);


--
-- Name: dinh_nghia_truong dinh_nghia_truong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dinh_nghia_truong
    ADD CONSTRAINT dinh_nghia_truong_pkey PRIMARY KEY (id);


--
-- Name: dm_dac_tinh dm_dac_tinh_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_dac_tinh
    ADD CONSTRAINT dm_dac_tinh_ma_key UNIQUE (ma);


--
-- Name: dm_dac_tinh dm_dac_tinh_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_dac_tinh
    ADD CONSTRAINT dm_dac_tinh_pkey PRIMARY KEY (id);


--
-- Name: dm_danh_gia_nien_han dm_danh_gia_nien_han_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_danh_gia_nien_han
    ADD CONSTRAINT dm_danh_gia_nien_han_ma_key UNIQUE (ma);


--
-- Name: dm_danh_gia_nien_han dm_danh_gia_nien_han_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_danh_gia_nien_han
    ADD CONSTRAINT dm_danh_gia_nien_han_pkey PRIMARY KEY (id);


--
-- Name: dm_don_vi dm_don_vi_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_don_vi
    ADD CONSTRAINT dm_don_vi_ma_key UNIQUE (ma);


--
-- Name: dm_don_vi dm_don_vi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_don_vi
    ADD CONSTRAINT dm_don_vi_pkey PRIMARY KEY (id);


--
-- Name: dm_he_thong dm_he_thong_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_he_thong
    ADD CONSTRAINT dm_he_thong_ma_key UNIQUE (ma);


--
-- Name: dm_he_thong dm_he_thong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_he_thong
    ADD CONSTRAINT dm_he_thong_pkey PRIMARY KEY (id);


--
-- Name: dm_loai_ban_quyen dm_loai_ban_quyen_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_ban_quyen
    ADD CONSTRAINT dm_loai_ban_quyen_ma_key UNIQUE (ma);


--
-- Name: dm_loai_ban_quyen dm_loai_ban_quyen_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_ban_quyen
    ADD CONSTRAINT dm_loai_ban_quyen_pkey PRIMARY KEY (id);


--
-- Name: dm_loai_giay_phep dm_loai_giay_phep_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_giay_phep
    ADD CONSTRAINT dm_loai_giay_phep_ma_key UNIQUE (ma);


--
-- Name: dm_loai_giay_phep dm_loai_giay_phep_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_giay_phep
    ADD CONSTRAINT dm_loai_giay_phep_pkey PRIMARY KEY (id);


--
-- Name: dm_loai_lien_ket dm_loai_lien_ket_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_lien_ket
    ADD CONSTRAINT dm_loai_lien_ket_ma_key UNIQUE (ma);


--
-- Name: dm_loai_lien_ket dm_loai_lien_ket_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_lien_ket
    ADD CONSTRAINT dm_loai_lien_ket_pkey PRIMARY KEY (id);


--
-- Name: dm_loai_thiet_bi dm_loai_thiet_bi_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_thiet_bi
    ADD CONSTRAINT dm_loai_thiet_bi_ma_key UNIQUE (ma);


--
-- Name: dm_loai_thiet_bi dm_loai_thiet_bi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_thiet_bi
    ADD CONSTRAINT dm_loai_thiet_bi_pkey PRIMARY KEY (id);


--
-- Name: dm_model_dac_tinh dm_model_dac_tinh_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_model_dac_tinh
    ADD CONSTRAINT dm_model_dac_tinh_pkey PRIMARY KEY (model_id, dac_tinh_id);


--
-- Name: dm_model dm_model_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_model
    ADD CONSTRAINT dm_model_pkey PRIMARY KEY (id);


--
-- Name: dm_nha_cung_cap dm_nha_cung_cap_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nha_cung_cap
    ADD CONSTRAINT dm_nha_cung_cap_ma_key UNIQUE (ma);


--
-- Name: dm_nha_cung_cap dm_nha_cung_cap_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nha_cung_cap
    ADD CONSTRAINT dm_nha_cung_cap_pkey PRIMARY KEY (id);


--
-- Name: dm_nha_san_xuat dm_nha_san_xuat_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nha_san_xuat
    ADD CONSTRAINT dm_nha_san_xuat_ma_key UNIQUE (ma);


--
-- Name: dm_nha_san_xuat dm_nha_san_xuat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nha_san_xuat
    ADD CONSTRAINT dm_nha_san_xuat_pkey PRIMARY KEY (id);


--
-- Name: dm_nhom_he_thong dm_nhom_he_thong_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nhom_he_thong
    ADD CONSTRAINT dm_nhom_he_thong_ma_key UNIQUE (ma);


--
-- Name: dm_nhom_he_thong dm_nhom_he_thong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nhom_he_thong
    ADD CONSTRAINT dm_nhom_he_thong_pkey PRIMARY KEY (id);


--
-- Name: dm_noi_cap dm_noi_cap_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_noi_cap
    ADD CONSTRAINT dm_noi_cap_ma_key UNIQUE (ma);


--
-- Name: dm_noi_cap dm_noi_cap_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_noi_cap
    ADD CONSTRAINT dm_noi_cap_pkey PRIMARY KEY (id);


--
-- Name: dm_phan_loai dm_phan_loai_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_phan_loai
    ADD CONSTRAINT dm_phan_loai_ma_key UNIQUE (ma);


--
-- Name: dm_phan_loai dm_phan_loai_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_phan_loai
    ADD CONSTRAINT dm_phan_loai_pkey PRIMARY KEY (id);


--
-- Name: dm_to_chuc dm_to_chuc_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_to_chuc
    ADD CONSTRAINT dm_to_chuc_ma_key UNIQUE (ma);


--
-- Name: dm_to_chuc dm_to_chuc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_to_chuc
    ADD CONSTRAINT dm_to_chuc_pkey PRIMARY KEY (id);


--
-- Name: dm_trang_thai_thiet_bi dm_trang_thai_thiet_bi_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_trang_thai_thiet_bi
    ADD CONSTRAINT dm_trang_thai_thiet_bi_ma_key UNIQUE (ma);


--
-- Name: dm_trang_thai_thiet_bi dm_trang_thai_thiet_bi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_trang_thai_thiet_bi
    ADD CONSTRAINT dm_trang_thai_thiet_bi_pkey PRIMARY KEY (id);


--
-- Name: dm_vi_tri dm_vi_tri_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_vi_tri
    ADD CONSTRAINT dm_vi_tri_ma_key UNIQUE (ma);


--
-- Name: dm_vi_tri dm_vi_tri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_vi_tri
    ADD CONSTRAINT dm_vi_tri_pkey PRIMARY KEY (id);


--
-- Name: dong_gop_diem dong_gop_diem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dong_gop_diem
    ADD CONSTRAINT dong_gop_diem_pkey PRIMARY KEY (id);


--
-- Name: dot_bao_duong_audit_log dot_bao_duong_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_audit_log
    ADD CONSTRAINT dot_bao_duong_audit_log_pkey PRIMARY KEY (id);


--
-- Name: dot_bao_duong_bien_ban dot_bao_duong_bien_ban_hang_muc_id_form_submission_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_bien_ban
    ADD CONSTRAINT dot_bao_duong_bien_ban_hang_muc_id_form_submission_id_key UNIQUE (hang_muc_id, form_submission_id);


--
-- Name: dot_bao_duong_bien_ban dot_bao_duong_bien_ban_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_bien_ban
    ADD CONSTRAINT dot_bao_duong_bien_ban_pkey PRIMARY KEY (id);


--
-- Name: dot_bao_duong_han dot_bao_duong_han_dot_id_don_vi_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_han
    ADD CONSTRAINT dot_bao_duong_han_dot_id_don_vi_id_key UNIQUE (dot_id, don_vi_id);


--
-- Name: dot_bao_duong_han dot_bao_duong_han_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_han
    ADD CONSTRAINT dot_bao_duong_han_pkey PRIMARY KEY (id);


--
-- Name: dot_bao_duong_hang_muc dot_bao_duong_hang_muc_dot_id_he_thong_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_hang_muc
    ADD CONSTRAINT dot_bao_duong_hang_muc_dot_id_he_thong_id_key UNIQUE (dot_id, he_thong_id);


--
-- Name: dot_bao_duong_hang_muc dot_bao_duong_hang_muc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_hang_muc
    ADD CONSTRAINT dot_bao_duong_hang_muc_pkey PRIMARY KEY (id);


--
-- Name: dot_bao_duong dot_bao_duong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong
    ADD CONSTRAINT dot_bao_duong_pkey PRIMARY KEY (id);


--
-- Name: dot_bao_duong_su_co dot_bao_duong_su_co_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_su_co
    ADD CONSTRAINT dot_bao_duong_su_co_pkey PRIMARY KEY (id);


--
-- Name: dot_bao_duong_tep dot_bao_duong_tep_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_tep
    ADD CONSTRAINT dot_bao_duong_tep_pkey PRIMARY KEY (id);


--
-- Name: du_an_cong_van_lien_ket du_an_cong_van_lien_ket_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_van_lien_ket
    ADD CONSTRAINT du_an_cong_van_lien_ket_pkey PRIMARY KEY (id);


--
-- Name: du_an_cong_van du_an_cong_van_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_van
    ADD CONSTRAINT du_an_cong_van_pkey PRIMARY KEY (id);


--
-- Name: du_an_cong_van_tep du_an_cong_van_tep_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_van_tep
    ADD CONSTRAINT du_an_cong_van_tep_pkey PRIMARY KEY (id);


--
-- Name: du_an_cong_viec_phoi_hop du_an_cong_viec_phoi_hop_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_viec_phoi_hop
    ADD CONSTRAINT du_an_cong_viec_phoi_hop_pkey PRIMARY KEY (cong_viec_id, user_id);


--
-- Name: du_an_cong_viec du_an_cong_viec_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_viec
    ADD CONSTRAINT du_an_cong_viec_pkey PRIMARY KEY (id);


--
-- Name: du_an du_an_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an
    ADD CONSTRAINT du_an_ma_key UNIQUE (ma);


--
-- Name: du_an_moc du_an_moc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_moc
    ADD CONSTRAINT du_an_moc_pkey PRIMARY KEY (id);


--
-- Name: du_an du_an_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an
    ADD CONSTRAINT du_an_pkey PRIMARY KEY (id);


--
-- Name: feature_usage_log feature_usage_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_usage_log
    ADD CONSTRAINT feature_usage_log_pkey PRIMARY KEY (id);


--
-- Name: field_set_item field_set_item_field_set_id_field_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.field_set_item
    ADD CONSTRAINT field_set_item_field_set_id_field_key_key UNIQUE (field_set_id, field_key);


--
-- Name: field_set_item field_set_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.field_set_item
    ADD CONSTRAINT field_set_item_pkey PRIMARY KEY (id);


--
-- Name: field_set field_set_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.field_set
    ADD CONSTRAINT field_set_pkey PRIMARY KEY (id);


--
-- Name: form_check_item form_check_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_check_item
    ADD CONSTRAINT form_check_item_pkey PRIMARY KEY (id);


--
-- Name: form_check_item form_check_item_template_id_item_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_check_item
    ADD CONSTRAINT form_check_item_template_id_item_code_key UNIQUE (template_id, item_code);


--
-- Name: form_field form_field_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_field
    ADD CONSTRAINT form_field_pkey PRIMARY KEY (id);


--
-- Name: form_field form_field_template_id_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_field
    ADD CONSTRAINT form_field_template_id_key_key UNIQUE (template_id, key);


--
-- Name: form_section form_section_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_section
    ADD CONSTRAINT form_section_pkey PRIMARY KEY (id);


--
-- Name: form_section form_section_template_id_ma_section_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_section
    ADD CONSTRAINT form_section_template_id_ma_section_key UNIQUE (template_id, ma_section);


--
-- Name: form_sign_otp form_sign_otp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_sign_otp
    ADD CONSTRAINT form_sign_otp_pkey PRIMARY KEY (id);


--
-- Name: form_submission_item_result form_submission_item_result_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_item_result
    ADD CONSTRAINT form_submission_item_result_pkey PRIMARY KEY (id);


--
-- Name: form_submission_item_result form_submission_item_result_submission_id_item_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_item_result
    ADD CONSTRAINT form_submission_item_result_submission_id_item_code_key UNIQUE (submission_id, item_code);


--
-- Name: form_submission form_submission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission
    ADD CONSTRAINT form_submission_pkey PRIMARY KEY (id);


--
-- Name: form_submission_signature form_submission_signature_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_signature
    ADD CONSTRAINT form_submission_signature_pkey PRIMARY KEY (id);


--
-- Name: form_submission_thiet_bi form_submission_thiet_bi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_thiet_bi
    ADD CONSTRAINT form_submission_thiet_bi_pkey PRIMARY KEY (submission_id, thiet_bi_id);


--
-- Name: form_template form_template_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template
    ADD CONSTRAINT form_template_code_key UNIQUE (code);


--
-- Name: form_template_he_thong form_template_he_thong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_he_thong
    ADD CONSTRAINT form_template_he_thong_pkey PRIMARY KEY (id);


--
-- Name: form_template_he_thong form_template_he_thong_template_id_he_thong_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_he_thong
    ADD CONSTRAINT form_template_he_thong_template_id_he_thong_id_key UNIQUE (template_id, he_thong_id);


--
-- Name: form_template_include form_template_include_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_include
    ADD CONSTRAINT form_template_include_pkey PRIMARY KEY (id);


--
-- Name: form_template form_template_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template
    ADD CONSTRAINT form_template_pkey PRIMARY KEY (id);


--
-- Name: form_template_version form_template_version_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_version
    ADD CONSTRAINT form_template_version_pkey PRIMARY KEY (id);


--
-- Name: form_template_version form_template_version_template_id_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_version
    ADD CONSTRAINT form_template_version_template_id_version_key UNIQUE (template_id, version);


--
-- Name: form_template_include ftinc_unique_child; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_include
    ADD CONSTRAINT ftinc_unique_child UNIQUE (parent_version_id, child_version_id);


--
-- Name: gan_chuc_nang gan_chuc_nang_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gan_chuc_nang
    ADD CONSTRAINT gan_chuc_nang_pkey PRIMARY KEY (id);


--
-- Name: gan_linh_kien gan_linh_kien_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gan_linh_kien
    ADD CONSTRAINT gan_linh_kien_pkey PRIMARY KEY (id);


--
-- Name: giay_phep_khai_thac giay_phep_khai_thac_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giay_phep_khai_thac
    ADD CONSTRAINT giay_phep_khai_thac_pkey PRIMARY KEY (id);


--
-- Name: giay_phep giay_phep_ma_giay_phep_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giay_phep
    ADD CONSTRAINT giay_phep_ma_giay_phep_key UNIQUE (ma_giay_phep);


--
-- Name: giay_phep giay_phep_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giay_phep
    ADD CONSTRAINT giay_phep_pkey PRIMARY KEY (id);


--
-- Name: he_thong_thanh_phan he_thong_thanh_phan_he_thong_id_ma_thanh_phan_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_thanh_phan
    ADD CONSTRAINT he_thong_thanh_phan_he_thong_id_ma_thanh_phan_key UNIQUE (he_thong_id, ma_thanh_phan);


--
-- Name: he_thong_thanh_phan he_thong_thanh_phan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_thanh_phan
    ADD CONSTRAINT he_thong_thanh_phan_pkey PRIMARY KEY (id);


--
-- Name: he_thong_truong he_thong_truong_he_thong_id_field_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_truong
    ADD CONSTRAINT he_thong_truong_he_thong_id_field_key_key UNIQUE (he_thong_id, field_key);


--
-- Name: he_thong_truong he_thong_truong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_truong
    ADD CONSTRAINT he_thong_truong_pkey PRIMARY KEY (id);


--
-- Name: hong_hoc hong_hoc_ma_hong_hoc_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hong_hoc
    ADD CONSTRAINT hong_hoc_ma_hong_hoc_key UNIQUE (ma_hong_hoc);


--
-- Name: hong_hoc hong_hoc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hong_hoc
    ADD CONSTRAINT hong_hoc_pkey PRIMARY KEY (id);


--
-- Name: import_alias import_alias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_alias
    ADD CONSTRAINT import_alias_pkey PRIMARY KEY (id);


--
-- Name: import_batch import_batch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_batch
    ADD CONSTRAINT import_batch_pkey PRIMARY KEY (id);


--
-- Name: import_item import_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_item
    ADD CONSTRAINT import_item_pkey PRIMARY KEY (id);


--
-- Name: kho_giao_dich kho_giao_dich_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho_giao_dich
    ADD CONSTRAINT kho_giao_dich_pkey PRIMARY KEY (id);


--
-- Name: kho kho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho
    ADD CONSTRAINT kho_pkey PRIMARY KEY (id);


--
-- Name: kiem_ke kiem_ke_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kiem_ke
    ADD CONSTRAINT kiem_ke_pkey PRIMARY KEY (id);


--
-- Name: lien_ket_he_thong lien_ket_he_thong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_ket_he_thong
    ADD CONSTRAINT lien_ket_he_thong_pkey PRIMARY KEY (id);


--
-- Name: lien_ket_khe lien_ket_khe_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_ket_khe
    ADD CONSTRAINT lien_ket_khe_pkey PRIMARY KEY (id);


--
-- Name: luu_tru_health_log luu_tru_health_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.luu_tru_health_log
    ADD CONSTRAINT luu_tru_health_log_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: model_tai_lieu model_tai_lieu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_tai_lieu
    ADD CONSTRAINT model_tai_lieu_pkey PRIMARY KEY (id);


--
-- Name: nhan_vien nhan_vien_ma_nhan_vien_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhan_vien
    ADD CONSTRAINT nhan_vien_ma_nhan_vien_key UNIQUE (ma_nhan_vien);


--
-- Name: nhan_vien nhan_vien_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhan_vien
    ADD CONSTRAINT nhan_vien_pkey PRIMARY KEY (id);


--
-- Name: nhiem_vu_nhap_lieu nhiem_vu_nhap_lieu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhiem_vu_nhap_lieu
    ADD CONSTRAINT nhiem_vu_nhap_lieu_pkey PRIMARY KEY (id);


--
-- Name: node_note node_note_node_type_node_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.node_note
    ADD CONSTRAINT node_note_node_type_node_id_key UNIQUE (node_type, node_id);


--
-- Name: node_note node_note_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.node_note
    ADD CONSTRAINT node_note_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: phan_mem_ban_quyen_cap_phat phan_mem_ban_quyen_cap_phat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phan_mem_ban_quyen_cap_phat
    ADD CONSTRAINT phan_mem_ban_quyen_cap_phat_pkey PRIMARY KEY (id);


--
-- Name: phan_mem_ban_quyen phan_mem_ban_quyen_ma_ban_quyen_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phan_mem_ban_quyen
    ADD CONSTRAINT phan_mem_ban_quyen_ma_ban_quyen_key UNIQUE (ma_ban_quyen);


--
-- Name: phan_mem_ban_quyen phan_mem_ban_quyen_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phan_mem_ban_quyen
    ADD CONSTRAINT phan_mem_ban_quyen_pkey PRIMARY KEY (id);


--
-- Name: phan_mem_ban_quyen_tep phan_mem_ban_quyen_tep_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phan_mem_ban_quyen_tep
    ADD CONSTRAINT phan_mem_ban_quyen_tep_pkey PRIMARY KEY (id);


--
-- Name: pm_cong_viec pm_cong_viec_chinh_sach_id_doi_tuong_id_ky_hieu_han_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_cong_viec
    ADD CONSTRAINT pm_cong_viec_chinh_sach_id_doi_tuong_id_ky_hieu_han_key UNIQUE (chinh_sach_id, doi_tuong_id, ky_hieu_han);


--
-- Name: pm_cong_viec pm_cong_viec_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_cong_viec
    ADD CONSTRAINT pm_cong_viec_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: r2_access_log r2_access_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.r2_access_log
    ADD CONSTRAINT r2_access_log_pkey PRIMARY KEY (id);


--
-- Name: r2_cau_hinh r2_cau_hinh_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.r2_cau_hinh
    ADD CONSTRAINT r2_cau_hinh_pkey PRIMARY KEY (id);


--
-- Name: r2_file r2_file_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.r2_file
    ADD CONSTRAINT r2_file_key_key UNIQUE (key);


--
-- Name: r2_file r2_file_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.r2_file
    ADD CONSTRAINT r2_file_pkey PRIMARY KEY (id);


--
-- Name: role_permission role_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_pkey PRIMARY KEY (role, module, action);


--
-- Name: search_index search_index_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_index
    ADD CONSTRAINT search_index_pkey PRIMARY KEY (loai, id);


--
-- Name: so_do_he_thong so_do_he_thong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.so_do_he_thong
    ADD CONSTRAINT so_do_he_thong_pkey PRIMARY KEY (id);


--
-- Name: so_do_tep_dinh_kem so_do_tep_dinh_kem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.so_do_tep_dinh_kem
    ADD CONSTRAINT so_do_tep_dinh_kem_pkey PRIMARY KEY (id);


--
-- Name: so_do_thu_vien_hinh so_do_thu_vien_hinh_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.so_do_thu_vien_hinh
    ADD CONSTRAINT so_do_thu_vien_hinh_pkey PRIMARY KEY (id);


--
-- Name: su_co_lich_su su_co_lich_su_doi_tuong_bang_doi_tuong_id_buoc_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.su_co_lich_su
    ADD CONSTRAINT su_co_lich_su_doi_tuong_bang_doi_tuong_id_buoc_key UNIQUE (doi_tuong_bang, doi_tuong_id, buoc);


--
-- Name: su_co_lich_su su_co_lich_su_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.su_co_lich_su
    ADD CONSTRAINT su_co_lich_su_pkey PRIMARY KEY (id);


--
-- Name: su_co su_co_ma_su_co_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.su_co
    ADD CONSTRAINT su_co_ma_su_co_key UNIQUE (ma_su_co);


--
-- Name: su_co su_co_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.su_co
    ADD CONSTRAINT su_co_pkey PRIMARY KEY (id);


--
-- Name: supabase_ngoai_job_bang supabase_ngoai_job_bang_job_id_ten_bang_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supabase_ngoai_job_bang
    ADD CONSTRAINT supabase_ngoai_job_bang_job_id_ten_bang_key UNIQUE (job_id, ten_bang);


--
-- Name: supabase_ngoai_job_bang supabase_ngoai_job_bang_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supabase_ngoai_job_bang
    ADD CONSTRAINT supabase_ngoai_job_bang_pkey PRIMARY KEY (id);


--
-- Name: supabase_ngoai_job supabase_ngoai_job_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supabase_ngoai_job
    ADD CONSTRAINT supabase_ngoai_job_pkey PRIMARY KEY (id);


--
-- Name: supabase_ngoai supabase_ngoai_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supabase_ngoai
    ADD CONSTRAINT supabase_ngoai_pkey PRIMARY KEY (id);


--
-- Name: system_signing_key system_signing_key_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_signing_key
    ADD CONSTRAINT system_signing_key_pkey PRIMARY KEY (id);


--
-- Name: telegram_da_gui telegram_da_gui_loai_ref_id_chat_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_da_gui
    ADD CONSTRAINT telegram_da_gui_loai_ref_id_chat_id_key UNIQUE (loai, ref_id, chat_id);


--
-- Name: telegram_da_gui telegram_da_gui_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_da_gui
    ADD CONSTRAINT telegram_da_gui_pkey PRIMARY KEY (id);


--
-- Name: telegram_subscriber telegram_subscriber_chat_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_subscriber
    ADD CONSTRAINT telegram_subscriber_chat_id_key UNIQUE (chat_id);


--
-- Name: telegram_subscriber telegram_subscriber_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_subscriber
    ADD CONSTRAINT telegram_subscriber_pkey PRIMARY KEY (id);


--
-- Name: thiet_bi_cap_phat thiet_bi_cap_phat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_cap_phat
    ADD CONSTRAINT thiet_bi_cap_phat_pkey PRIMARY KEY (id);


--
-- Name: thiet_bi_do_dac thiet_bi_do_dac_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_do_dac
    ADD CONSTRAINT thiet_bi_do_dac_pkey PRIMARY KEY (id);


--
-- Name: thiet_bi_he_thong_tuong_thich thiet_bi_he_thong_tuong_thich_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_he_thong_tuong_thich
    ADD CONSTRAINT thiet_bi_he_thong_tuong_thich_pkey PRIMARY KEY (id);


--
-- Name: thiet_bi_he_thong_tuong_thich thiet_bi_he_thong_tuong_thich_thiet_bi_id_he_thong_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_he_thong_tuong_thich
    ADD CONSTRAINT thiet_bi_he_thong_tuong_thich_thiet_bi_id_he_thong_id_key UNIQUE (thiet_bi_id, he_thong_id);


--
-- Name: thiet_bi_ket_noi thiet_bi_ket_noi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_ket_noi
    ADD CONSTRAINT thiet_bi_ket_noi_pkey PRIMARY KEY (id);


--
-- Name: thiet_bi_khe_linh_kien thiet_bi_khe_linh_kien_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_khe_linh_kien
    ADD CONSTRAINT thiet_bi_khe_linh_kien_pkey PRIMARY KEY (id);


--
-- Name: thiet_bi_khe_linh_kien thiet_bi_khe_linh_kien_thiet_bi_id_ma_khe_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_khe_linh_kien
    ADD CONSTRAINT thiet_bi_khe_linh_kien_thiet_bi_id_ma_khe_key UNIQUE (thiet_bi_id, ma_khe);


--
-- Name: thiet_bi thiet_bi_ma_thiet_bi_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_ma_thiet_bi_key UNIQUE (ma_thiet_bi);


--
-- Name: thiet_bi thiet_bi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_pkey PRIMARY KEY (id);


--
-- Name: thiet_bi_tep_dinh_kem thiet_bi_tep_dinh_kem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_tep_dinh_kem
    ADD CONSTRAINT thiet_bi_tep_dinh_kem_pkey PRIMARY KEY (id);


--
-- Name: thiet_bi_vong_doi thiet_bi_vong_doi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_vong_doi
    ADD CONSTRAINT thiet_bi_vong_doi_pkey PRIMARY KEY (id);


--
-- Name: thong_bao_cau_hinh thong_bao_cau_hinh_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thong_bao_cau_hinh
    ADD CONSTRAINT thong_bao_cau_hinh_pkey PRIMARY KEY (id);


--
-- Name: thong_bao_email_queue thong_bao_email_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thong_bao_email_queue
    ADD CONSTRAINT thong_bao_email_queue_pkey PRIMARY KEY (id);


--
-- Name: thong_bao thong_bao_khoa_chong_trung_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thong_bao
    ADD CONSTRAINT thong_bao_khoa_chong_trung_key UNIQUE (khoa_chong_trung);


--
-- Name: thong_bao thong_bao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thong_bao
    ADD CONSTRAINT thong_bao_pkey PRIMARY KEY (id);


--
-- Name: ticket_comment ticket_comment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_comment
    ADD CONSTRAINT ticket_comment_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: user_layout_prefs user_layout_prefs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_layout_prefs
    ADD CONSTRAINT user_layout_prefs_pkey PRIMARY KEY (user_id, key);


--
-- Name: user_pinned user_pinned_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_pinned
    ADD CONSTRAINT user_pinned_pkey PRIMARY KEY (user_id, path);


--
-- Name: user_recent user_recent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_recent
    ADD CONSTRAINT user_recent_pkey PRIMARY KEY (user_id, path);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_scope user_scope_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_scope
    ADD CONSTRAINT user_scope_pkey PRIMARY KEY (id);


--
-- Name: van_de van_de_ma_van_de_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.van_de
    ADD CONSTRAINT van_de_ma_van_de_key UNIQUE (ma_van_de);


--
-- Name: van_de van_de_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.van_de
    ADD CONSTRAINT van_de_pkey PRIMARY KEY (id);


--
-- Name: vat_tu vat_tu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vat_tu
    ADD CONSTRAINT vat_tu_pkey PRIMARY KEY (id);


--
-- Name: vi_tri_media vi_tri_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vi_tri_media
    ADD CONSTRAINT vi_tri_media_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_credential_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_credential_id_key UNIQUE (credential_id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: weekly_report_import weekly_report_import_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_report_import
    ADD CONSTRAINT weekly_report_import_pkey PRIMARY KEY (id);


--
-- Name: ai_conversation_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_conversation_user_idx ON public.ai_conversation USING btree (user_id, updated_at DESC);


--
-- Name: ai_message_conv_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_message_conv_idx ON public.ai_message USING btree (conversation_id, created_at);


--
-- Name: anomaly_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX anomaly_status_idx ON public.anomaly_alert USING btree (status, created_at DESC);


--
-- Name: audit_log_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_created_at_idx ON public.audit_log USING btree (created_at DESC);


--
-- Name: audit_log_entity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_entity_idx ON public.audit_log USING btree (entity, created_at DESC);


--
-- Name: audit_log_severity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_severity_idx ON public.audit_log USING btree (severity, created_at DESC);


--
-- Name: audit_log_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_user_id_idx ON public.audit_log USING btree (user_id);


--
-- Name: audit_log_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_user_idx ON public.audit_log USING btree (user_id, created_at DESC);


--
-- Name: auth_event_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_event_user_idx ON public.auth_event_log USING btree (user_id, created_at DESC);


--
-- Name: ban_giao_thiet_bi_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ban_giao_thiet_bi_id_idx ON public.ban_giao USING btree (thiet_bi_id);


--
-- Name: bao_tri_thanh_phan_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bao_tri_thanh_phan_id_idx ON public.bao_tri USING btree (thanh_phan_id);


--
-- Name: bao_tri_thiet_bi_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bao_tri_thiet_bi_id_idx ON public.bao_tri USING btree (thiet_bi_id);


--
-- Name: dm_dac_tinh_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_dac_tinh_merged_into_idx ON public.dm_dac_tinh USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_danh_gia_nien_han_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_danh_gia_nien_han_merged_into_idx ON public.dm_danh_gia_nien_han USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_don_vi_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_don_vi_merged_into_idx ON public.dm_don_vi USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_he_thong_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_he_thong_merged_into_idx ON public.dm_he_thong USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_loai_giay_phep_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_loai_giay_phep_merged_into_idx ON public.dm_loai_giay_phep USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_loai_lien_ket_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_loai_lien_ket_merged_into_idx ON public.dm_loai_lien_ket USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_loai_thiet_bi_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_loai_thiet_bi_merged_into_idx ON public.dm_loai_thiet_bi USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_model_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_model_merged_into_idx ON public.dm_model USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_nha_cung_cap_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_nha_cung_cap_merged_into_idx ON public.dm_nha_cung_cap USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_nha_san_xuat_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_nha_san_xuat_merged_into_idx ON public.dm_nha_san_xuat USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_nhom_he_thong_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_nhom_he_thong_merged_into_idx ON public.dm_nhom_he_thong USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_noi_cap_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_noi_cap_merged_into_idx ON public.dm_noi_cap USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_phan_loai_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_phan_loai_merged_into_idx ON public.dm_phan_loai USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_to_chuc_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_to_chuc_merged_into_idx ON public.dm_to_chuc USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_trang_thai_thiet_bi_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_trang_thai_thiet_bi_merged_into_idx ON public.dm_trang_thai_thiet_bi USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_vi_tri_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_vi_tri_merged_into_idx ON public.dm_vi_tri USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: feature_usage_feat_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_usage_feat_idx ON public.feature_usage_log USING btree (feature, created_at DESC);


--
-- Name: feature_usage_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_usage_user_idx ON public.feature_usage_log USING btree (user_id, created_at DESC);


--
-- Name: form_field_template_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_field_template_idx ON public.form_field USING btree (template_id, "position");


--
-- Name: form_sub_tb_thiet_bi_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_sub_tb_thiet_bi_idx ON public.form_submission_thiet_bi USING btree (thiet_bi_id);


--
-- Name: form_submission_created_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_submission_created_by_idx ON public.form_submission USING btree (created_by, created_at DESC);


--
-- Name: form_submission_don_vi_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_submission_don_vi_idx ON public.form_submission USING btree (don_vi_id, status);


--
-- Name: form_submission_search_trgm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_submission_search_trgm_idx ON public.form_submission USING gin (search_text extensions.gin_trgm_ops);


--
-- Name: form_submission_search_tsv_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_submission_search_tsv_idx ON public.form_submission USING gin (search_tsv);


--
-- Name: form_submission_template_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_submission_template_idx ON public.form_submission USING btree (template_id, status, created_at DESC);


--
-- Name: form_submission_thiet_bi_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_submission_thiet_bi_idx ON public.form_submission USING btree (thiet_bi_id);


--
-- Name: form_template_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_template_active_idx ON public.form_template USING btree (active, code);


--
-- Name: giay_phep_search_trgm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX giay_phep_search_trgm_idx ON public.giay_phep USING gin (search_text extensions.gin_trgm_ops);


--
-- Name: giay_phep_search_tsv_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX giay_phep_search_tsv_idx ON public.giay_phep USING gin (search_tsv);


--
-- Name: he_thong_thanh_phan_deleted_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX he_thong_thanh_phan_deleted_at_idx ON public.he_thong_thanh_phan USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: hong_hoc_thanh_phan_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hong_hoc_thanh_phan_id_idx ON public.hong_hoc USING btree (thanh_phan_id);


--
-- Name: hong_hoc_thiet_bi_hong_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hong_hoc_thiet_bi_hong_id_idx ON public.hong_hoc USING btree (thiet_bi_hong_id);


--
-- Name: idx_audit_log_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_created ON public.audit_log USING btree (created_at DESC);


--
-- Name: idx_audit_log_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_user_created ON public.audit_log USING btree (user_id, created_at DESC);


--
-- Name: idx_ban_giao_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ban_giao_ngay ON public.ban_giao USING btree (ngay_nhan DESC);


--
-- Name: idx_bao_cao_annotation_he_thong; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bao_cao_annotation_he_thong ON public.bao_cao_annotation USING btree (he_thong_id);


--
-- Name: idx_bao_cao_annotation_thoi_diem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bao_cao_annotation_thoi_diem ON public.bao_cao_annotation USING btree (thoi_diem);


--
-- Name: idx_bao_tri_chinh_sach_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bao_tri_chinh_sach_loai ON public.bao_tri_chinh_sach USING btree (loai_thiet_bi_id);


--
-- Name: idx_bao_tri_chinh_sach_nguoi_phu_trach_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bao_tri_chinh_sach_nguoi_phu_trach_id ON public.bao_tri_chinh_sach USING btree (nguoi_phu_trach_id);


--
-- Name: idx_bao_tri_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bao_tri_ngay ON public.bao_tri USING btree (ngay_bat_dau DESC);


--
-- Name: idx_bao_tri_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bao_tri_trang_thai ON public.bao_tri USING btree (trang_thai);


--
-- Name: idx_change_request_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_change_request_created_at ON public.change_request USING btree (created_at DESC);


--
-- Name: idx_change_request_nguoi_tao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_change_request_nguoi_tao ON public.change_request USING btree (nguoi_tao);


--
-- Name: idx_change_request_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_change_request_pending ON public.change_request USING btree (trang_thai) WHERE (trang_thai = 'pending'::public.change_request_status);


--
-- Name: idx_chung_chi_het_han; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chung_chi_het_han ON public.chung_chi_thiet_bi USING btree (ngay_het_han);


--
-- Name: idx_chung_chi_tb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chung_chi_tb ON public.chung_chi_thiet_bi USING btree (thiet_bi_id);


--
-- Name: idx_cong_viec_bao_tri_bao_tri_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cong_viec_bao_tri_bao_tri_id ON public.cong_viec_bao_tri USING btree (bao_tri_id);


--
-- Name: idx_cong_viec_bao_tri_chinh_sach_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cong_viec_bao_tri_chinh_sach_id ON public.cong_viec_bao_tri USING btree (chinh_sach_id);


--
-- Name: idx_cong_viec_bao_tri_he_thong_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cong_viec_bao_tri_he_thong_id ON public.cong_viec_bao_tri USING btree (he_thong_id);


--
-- Name: idx_cong_viec_bao_tri_su_co_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cong_viec_bao_tri_su_co_id ON public.cong_viec_bao_tri USING btree (su_co_id);


--
-- Name: idx_cong_viec_bao_tri_van_de_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cong_viec_bao_tri_van_de_id ON public.cong_viec_bao_tri USING btree (van_de_id);


--
-- Name: idx_cp_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cp_user ON public.conversation_participant USING btree (user_id);


--
-- Name: idx_cv_du_an; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cv_du_an ON public.du_an_cong_viec USING btree (du_an_id);


--
-- Name: idx_cv_moc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cv_moc ON public.du_an_cong_viec USING btree (moc_id);


--
-- Name: idx_cv_nguoi_xu_ly; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cv_nguoi_xu_ly ON public.du_an_cong_viec USING btree (nguoi_xu_ly_chinh);


--
-- Name: idx_cvbt_den_han; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cvbt_den_han ON public.cong_viec_bao_tri USING btree (ngay_den_han);


--
-- Name: idx_cvbt_don_vi_snap; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cvbt_don_vi_snap ON public.cong_viec_bao_tri USING btree (don_vi_id_snapshot);


--
-- Name: idx_cvbt_thiet_bi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cvbt_thiet_bi ON public.cong_viec_bao_tri USING btree (thiet_bi_id);


--
-- Name: idx_cvbt_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cvbt_trang_thai ON public.cong_viec_bao_tri USING btree (trang_thai);


--
-- Name: idx_dacv_du_an; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dacv_du_an ON public.du_an_cong_van USING btree (du_an_id);


--
-- Name: idx_dacv_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dacv_ngay ON public.du_an_cong_van USING btree (ngay_ban_hanh);


--
-- Name: idx_dacv_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dacv_parent ON public.du_an_cong_van USING btree (parent_id);


--
-- Name: idx_dacvlk_den; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dacvlk_den ON public.du_an_cong_van_lien_ket USING btree (den_id);


--
-- Name: idx_dacvlk_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dacvlk_tu ON public.du_an_cong_van_lien_ket USING btree (tu_id);


--
-- Name: idx_dacvt_cong_van; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dacvt_cong_van ON public.du_an_cong_van_tep USING btree (cong_van_id);


--
-- Name: idx_dm_don_vi_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_don_vi_parent ON public.dm_don_vi USING btree (parent_id);


--
-- Name: idx_dm_he_thong_ma_tai_san_bravo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_he_thong_ma_tai_san_bravo ON public.dm_he_thong USING btree (ma_tai_san_bravo);


--
-- Name: idx_dm_he_thong_nhom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_he_thong_nhom ON public.dm_he_thong USING btree (nhom_he_thong_id);


--
-- Name: idx_dm_he_thong_phan_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_he_thong_phan_loai ON public.dm_he_thong USING btree (phan_loai_id);


--
-- Name: idx_dm_he_thong_to_chuc_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_he_thong_to_chuc_id ON public.dm_he_thong USING btree (to_chuc_id);


--
-- Name: idx_dm_model_field_set_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_model_field_set_id ON public.dm_model USING btree (field_set_id);


--
-- Name: idx_dm_model_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_model_loai ON public.dm_model USING btree (loai_thiet_bi_id);


--
-- Name: idx_dm_model_nsx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_model_nsx ON public.dm_model USING btree (nha_san_xuat_id);


--
-- Name: idx_dm_nhom_he_thong_phan_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_nhom_he_thong_phan_loai ON public.dm_nhom_he_thong USING btree (phan_loai_id);


--
-- Name: idx_dm_to_chuc_to_chuc_cha_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_to_chuc_to_chuc_cha_id ON public.dm_to_chuc USING btree (to_chuc_cha_id);


--
-- Name: idx_dm_vi_tri_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_vi_tri_parent ON public.dm_vi_tri USING btree (parent_id);


--
-- Name: idx_dmht_attrs_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dmht_attrs_gin ON public.dm_he_thong USING gin (attrs jsonb_path_ops);


--
-- Name: idx_dnt_apdungcho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dnt_apdungcho ON public.dinh_nghia_truong USING btree (ap_dung_cho, thu_tu);


--
-- Name: idx_du_an_don_vi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_du_an_don_vi ON public.du_an USING btree (don_vi_id);


--
-- Name: idx_du_an_quan_ly; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_du_an_quan_ly ON public.du_an USING btree (quan_ly_id);


--
-- Name: idx_duan_attrs_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_duan_attrs_gin ON public.du_an USING gin (attrs jsonb_path_ops);


--
-- Name: idx_form_check_item_metric_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_check_item_metric_key ON public.form_check_item USING btree (metric_key) WHERE (metric_key IS NOT NULL);


--
-- Name: idx_form_check_item_section; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_check_item_section ON public.form_check_item USING btree (section_id);


--
-- Name: idx_form_check_item_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_check_item_template ON public.form_check_item USING btree (template_id);


--
-- Name: idx_form_sign_otp_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_sign_otp_active ON public.form_sign_otp USING btree (submission_id, user_id) WHERE (consumed_at IS NULL);


--
-- Name: idx_form_sign_otp_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_sign_otp_user ON public.form_sign_otp USING btree (user_id, submission_id, created_at DESC);


--
-- Name: idx_form_submission_he_thong_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_submission_he_thong_id ON public.form_submission USING btree (he_thong_id);


--
-- Name: idx_form_submission_template_version_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_submission_template_version_id ON public.form_submission USING btree (template_version_id);


--
-- Name: idx_form_tpl_ht_he_thong; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_tpl_ht_he_thong ON public.form_template_he_thong USING btree (he_thong_id);


--
-- Name: idx_form_tpl_ht_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_tpl_ht_template ON public.form_template_he_thong USING btree (template_id);


--
-- Name: idx_fsir_he_thong_metric; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fsir_he_thong_metric ON public.form_submission_item_result USING btree (he_thong_id, metric_key) WHERE (he_thong_id IS NOT NULL);


--
-- Name: idx_fsir_metric_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fsir_metric_time ON public.form_submission_item_result USING btree (metric_key, submitted_at DESC) WHERE (metric_key IS NOT NULL);


--
-- Name: idx_fsir_submission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fsir_submission ON public.form_submission_item_result USING btree (submission_id);


--
-- Name: idx_fsir_thanh_phan_metric; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fsir_thanh_phan_metric ON public.form_submission_item_result USING btree (thanh_phan_id, metric_key) WHERE (thanh_phan_id IS NOT NULL);


--
-- Name: idx_fss_signer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fss_signer ON public.form_submission_signature USING btree (signer_user_id);


--
-- Name: idx_fss_submission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fss_submission ON public.form_submission_signature USING btree (submission_id);


--
-- Name: idx_ftinc_child; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ftinc_child ON public.form_template_include USING btree (child_version_id);


--
-- Name: idx_ftinc_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ftinc_parent ON public.form_template_include USING btree (parent_version_id, "position");


--
-- Name: idx_ftv_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ftv_template ON public.form_template_version USING btree (template_id);


--
-- Name: idx_gan_chuc_nang_hong_hoc_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gan_chuc_nang_hong_hoc_id ON public.gan_chuc_nang USING btree (hong_hoc_id);


--
-- Name: idx_gan_chuc_nang_thiet_bi_open; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gan_chuc_nang_thiet_bi_open ON public.gan_chuc_nang USING btree (thiet_bi_id) WHERE (den_ngay IS NULL);


--
-- Name: idx_gan_linh_kien_hong_hoc_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gan_linh_kien_hong_hoc_id ON public.gan_linh_kien USING btree (hong_hoc_id);


--
-- Name: idx_gcn_thanh_phan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gcn_thanh_phan ON public.gan_chuc_nang USING btree (thanh_phan_id);


--
-- Name: idx_gcn_thanh_phan_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gcn_thanh_phan_active ON public.gan_chuc_nang USING btree (thanh_phan_id) WHERE (den_ngay IS NULL);


--
-- Name: idx_gcn_thiet_bi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gcn_thiet_bi ON public.gan_chuc_nang USING btree (thiet_bi_id);


--
-- Name: idx_gcn_thiet_bi_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gcn_thiet_bi_active ON public.gan_chuc_nang USING btree (thiet_bi_id) WHERE (den_ngay IS NULL);


--
-- Name: idx_giay_phep_het_han; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_giay_phep_het_han ON public.giay_phep USING btree (ngay_het_han);


--
-- Name: idx_giay_phep_khai_thac_he_thong_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_giay_phep_khai_thac_he_thong_id ON public.giay_phep_khai_thac USING btree (he_thong_id);


--
-- Name: idx_giay_phep_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_giay_phep_loai ON public.giay_phep USING btree (loai_giay_phep_id);


--
-- Name: idx_giay_phep_noi_cap; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_giay_phep_noi_cap ON public.giay_phep USING btree (noi_cap_id);


--
-- Name: idx_giay_phep_thiet_bi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_giay_phep_thiet_bi ON public.giay_phep USING btree (thiet_bi_id);


--
-- Name: idx_glk_khe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_glk_khe ON public.gan_linh_kien USING btree (khe_id);


--
-- Name: idx_glk_linh_kien; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_glk_linh_kien ON public.gan_linh_kien USING btree (linh_kien_id);


--
-- Name: idx_gpkt_attrs_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gpkt_attrs_gin ON public.giay_phep_khai_thac USING gin (attrs jsonb_path_ops);


--
-- Name: idx_he_thong_thanh_phan_loai_thiet_bi_yeu_cau; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_he_thong_thanh_phan_loai_thiet_bi_yeu_cau ON public.he_thong_thanh_phan USING btree (loai_thiet_bi_yeu_cau);


--
-- Name: idx_he_thong_thanh_phan_trang_thai_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_he_thong_thanh_phan_trang_thai_id ON public.he_thong_thanh_phan USING btree (trang_thai_id);


--
-- Name: idx_he_thong_thanh_phan_vi_tri_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_he_thong_thanh_phan_vi_tri_id ON public.he_thong_thanh_phan USING btree (vi_tri_id);


--
-- Name: idx_hong_hoc_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hong_hoc_ngay ON public.hong_hoc USING btree (ngay_hong DESC);


--
-- Name: idx_hong_hoc_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hong_hoc_trang_thai ON public.hong_hoc USING btree (trang_thai);


--
-- Name: idx_hong_hoc_trang_thai_moi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hong_hoc_trang_thai_moi ON public.hong_hoc USING btree (trang_thai_moi);


--
-- Name: idx_ht_don_vi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ht_don_vi ON public.dm_he_thong USING btree (don_vi_id);


--
-- Name: idx_ht_nhom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ht_nhom ON public.dm_he_thong USING btree (nhom_he_thong_id);


--
-- Name: idx_htp_he_thong; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_htp_he_thong ON public.he_thong_thanh_phan USING btree (he_thong_id);


--
-- Name: idx_htp_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_htp_parent ON public.he_thong_thanh_phan USING btree (thanh_phan_cha);


--
-- Name: idx_http_cha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_http_cha ON public.he_thong_thanh_phan USING btree (thanh_phan_cha);


--
-- Name: idx_http_he_thong; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_http_he_thong ON public.he_thong_thanh_phan USING btree (he_thong_id);


--
-- Name: idx_import_alias_canonical; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_import_alias_canonical ON public.import_alias USING btree (canonical_id);


--
-- Name: idx_import_alias_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_import_alias_lookup ON public.import_alias USING btree (entity, alias_norm);


--
-- Name: idx_import_batch_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_import_batch_hash ON public.import_batch USING btree (file_hash);


--
-- Name: idx_import_batch_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_import_batch_owner ON public.import_batch USING btree (created_by, created_at DESC);


--
-- Name: idx_import_item_apply; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_import_item_apply ON public.import_item USING btree (batch_id, status, applied_at);


--
-- Name: idx_import_item_batch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_import_item_batch ON public.import_item USING btree (batch_id, sheet, row_index);


--
-- Name: idx_kgd_kho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kgd_kho ON public.kho_giao_dich USING btree (kho_id);


--
-- Name: idx_kgd_nhom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kgd_nhom ON public.kho_giao_dich USING btree (nhom_ct);


--
-- Name: idx_kgd_vat_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kgd_vat_tu ON public.kho_giao_dich USING btree (vat_tu_id);


--
-- Name: idx_khe_lk_cha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_khe_lk_cha ON public.thiet_bi_khe_linh_kien USING btree (khe_cha);


--
-- Name: idx_khe_lk_thiet_bi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_khe_lk_thiet_bi ON public.thiet_bi_khe_linh_kien USING btree (thiet_bi_id);


--
-- Name: idx_kho_don_vi_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kho_don_vi_id ON public.kho USING btree (don_vi_id);


--
-- Name: idx_kho_giao_dich_lien_ket_cong_viec_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kho_giao_dich_lien_ket_cong_viec_id ON public.kho_giao_dich USING btree (lien_ket_cong_viec_id);


--
-- Name: idx_kho_giao_dich_lien_ket_hong_hoc_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kho_giao_dich_lien_ket_hong_hoc_id ON public.kho_giao_dich USING btree (lien_ket_hong_hoc_id);


--
-- Name: idx_kho_giao_dich_lien_ket_su_co_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kho_giao_dich_lien_ket_su_co_id ON public.kho_giao_dich USING btree (lien_ket_su_co_id);


--
-- Name: idx_kho_vi_tri_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kho_vi_tri_id ON public.kho USING btree (vi_tri_id);


--
-- Name: idx_kiem_ke_thiet_bi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kiem_ke_thiet_bi ON public.kiem_ke USING btree (thiet_bi_id, thoi_diem DESC);


--
-- Name: idx_lkht_dich; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lkht_dich ON public.lien_ket_he_thong USING btree (he_thong_dich_id);


--
-- Name: idx_lkht_don_vi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lkht_don_vi ON public.lien_ket_he_thong USING btree (don_vi_id_snapshot);


--
-- Name: idx_lkht_nguon; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lkht_nguon ON public.lien_ket_he_thong USING btree (he_thong_nguon_id);


--
-- Name: idx_lkk_dich; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lkk_dich ON public.lien_ket_khe USING btree (khe_dich_id);


--
-- Name: idx_lkk_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lkk_loai ON public.lien_ket_khe USING btree (loai_lien_ket_id);


--
-- Name: idx_lkk_nguon; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lkk_nguon ON public.lien_ket_khe USING btree (khe_nguon_id);


--
-- Name: idx_luu_tru_health_log_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_luu_tru_health_log_time ON public.luu_tru_health_log USING btree (backend, created_at DESC);


--
-- Name: idx_messages_conv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conv ON public.messages USING btree (conversation_id, created_at);


--
-- Name: idx_moc_du_an; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moc_du_an ON public.du_an_moc USING btree (du_an_id);


--
-- Name: idx_model_tai_lieu_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_model_tai_lieu_model ON public.model_tai_lieu USING btree (model_id);


--
-- Name: idx_node_note_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_node_note_lookup ON public.node_note USING btree (node_type, node_id);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: idx_notifications_user_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, created_at DESC) WHERE (read_at IS NULL);


--
-- Name: idx_phoi_hop_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phoi_hop_user ON public.du_an_cong_viec_phoi_hop USING btree (user_id);


--
-- Name: idx_pm_cong_viec_doi_tuong; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_cong_viec_doi_tuong ON public.pm_cong_viec USING btree (doi_tuong_type, doi_tuong_id);


--
-- Name: idx_pm_cong_viec_don_vi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_cong_viec_don_vi ON public.pm_cong_viec USING btree (don_vi_id);


--
-- Name: idx_pm_cong_viec_han; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_cong_viec_han ON public.pm_cong_viec USING btree (han);


--
-- Name: idx_pm_cong_viec_han_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_cong_viec_han_trang_thai ON public.pm_cong_viec USING btree (han, trang_thai);


--
-- Name: idx_pm_cong_viec_nguoi_phu_trach; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_cong_viec_nguoi_phu_trach ON public.pm_cong_viec USING btree (nguoi_phu_trach_id, trang_thai);


--
-- Name: idx_pm_cong_viec_phu_trach; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_cong_viec_phu_trach ON public.pm_cong_viec USING btree (nguoi_phu_trach_id);


--
-- Name: idx_pm_cong_viec_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_cong_viec_trang_thai ON public.pm_cong_viec USING btree (trang_thai);


--
-- Name: idx_pmbq_cp_thiet_bi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pmbq_cp_thiet_bi ON public.phan_mem_ban_quyen_cap_phat USING btree (thiet_bi_id);


--
-- Name: idx_pmbq_don_vi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pmbq_don_vi ON public.phan_mem_ban_quyen USING btree (don_vi_id);


--
-- Name: idx_pmbq_het_han; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pmbq_het_han ON public.phan_mem_ban_quyen USING btree (ngay_het_han);


--
-- Name: idx_pmbq_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pmbq_loai ON public.phan_mem_ban_quyen USING btree (loai_ban_quyen_id);


--
-- Name: idx_pmbq_tep_bq; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pmbq_tep_bq ON public.phan_mem_ban_quyen_tep USING btree (ban_quyen_id);


--
-- Name: idx_sn_job_bang_job; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sn_job_bang_job ON public.supabase_ngoai_job_bang USING btree (job_id);


--
-- Name: idx_sn_job_ngoai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sn_job_ngoai ON public.supabase_ngoai_job USING btree (ngoai_id, created_at DESC);


--
-- Name: idx_so_do_don_vi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_so_do_don_vi ON public.so_do_he_thong USING btree (don_vi_id);


--
-- Name: idx_su_co_at_bao_cao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_su_co_at_bao_cao ON public.su_co USING btree (at_bao_cao);


--
-- Name: idx_su_co_lich_su_obj_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_su_co_lich_su_obj_at ON public.su_co_lich_su USING btree (doi_tuong_bang, doi_tuong_id, at DESC);


--
-- Name: idx_su_co_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_su_co_ngay ON public.su_co USING btree (ngay_phat_hien DESC);


--
-- Name: idx_su_co_thiet_bi_dxl; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_su_co_thiet_bi_dxl ON public.su_co USING btree (thiet_bi_id, at_bat_dau_xu_ly);


--
-- Name: idx_su_co_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_su_co_trang_thai ON public.su_co USING btree (trang_thai);


--
-- Name: idx_su_co_trang_thai_moi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_su_co_trang_thai_moi ON public.su_co USING btree (trang_thai_moi);


--
-- Name: idx_su_co_trang_thai_open; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_su_co_trang_thai_open ON public.su_co USING btree (trang_thai) WHERE (trang_thai = ANY (ARRAY['bao_cao'::text, 'tiep_nhan'::text, 'dang_xu_ly'::text, 'cho_vat_tu'::text]));


--
-- Name: idx_tb_don_vi_new; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tb_don_vi_new ON public.thiet_bi USING btree (don_vi_id);


--
-- Name: idx_tbkn_den; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tbkn_den ON public.thiet_bi_ket_noi USING btree (den_thiet_bi_id);


--
-- Name: idx_tbkn_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tbkn_tu ON public.thiet_bi_ket_noi USING btree (tu_thiet_bi_id);


--
-- Name: idx_telegram_da_gui_sent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_telegram_da_gui_sent ON public.telegram_da_gui USING btree (sent_at DESC);


--
-- Name: idx_thiet_bi_attrs_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_attrs_gin ON public.thiet_bi USING gin (attrs jsonb_path_ops);


--
-- Name: idx_thiet_bi_cap_phat_don_vi_giu_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_cap_phat_don_vi_giu_id ON public.thiet_bi_cap_phat USING btree (don_vi_giu_id);


--
-- Name: idx_thiet_bi_cap_phat_tb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_cap_phat_tb ON public.thiet_bi_cap_phat USING btree (thiet_bi_id, thoi_diem DESC);


--
-- Name: idx_thiet_bi_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_created ON public.thiet_bi USING btree (created_at DESC);


--
-- Name: idx_thiet_bi_danh_gia_nien_han_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_danh_gia_nien_han_id ON public.thiet_bi USING btree (danh_gia_nien_han_id);


--
-- Name: idx_thiet_bi_do_dac_chi_so; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_do_dac_chi_so ON public.thiet_bi_do_dac USING btree (chi_so);


--
-- Name: idx_thiet_bi_do_dac_tb_thoi_diem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_do_dac_tb_thoi_diem ON public.thiet_bi_do_dac USING btree (thiet_bi_id, thoi_diem DESC);


--
-- Name: idx_thiet_bi_don_vi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_don_vi ON public.thiet_bi USING btree (don_vi_id);


--
-- Name: idx_thiet_bi_don_vi_giu_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_don_vi_giu_id ON public.thiet_bi USING btree (don_vi_giu_id);


--
-- Name: idx_thiet_bi_don_vi_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_don_vi_id ON public.thiet_bi USING btree (don_vi_id);


--
-- Name: idx_thiet_bi_don_vi_quan_ly_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_don_vi_quan_ly_id ON public.thiet_bi USING btree (don_vi_quan_ly_id);


--
-- Name: idx_thiet_bi_field_set_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_field_set_id ON public.thiet_bi USING btree (field_set_id);


--
-- Name: idx_thiet_bi_he_thong; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_he_thong ON public.thiet_bi USING btree (he_thong_id);


--
-- Name: idx_thiet_bi_khe_linh_kien_loai_thiet_bi_yeu_cau; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_khe_linh_kien_loai_thiet_bi_yeu_cau ON public.thiet_bi_khe_linh_kien USING btree (loai_thiet_bi_yeu_cau);


--
-- Name: idx_thiet_bi_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_loai ON public.thiet_bi USING btree (loai_thiet_bi_id);


--
-- Name: idx_thiet_bi_ma; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_ma ON public.thiet_bi USING btree (ma_thiet_bi);


--
-- Name: idx_thiet_bi_ma_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_ma_search ON public.thiet_bi USING gin (to_tsvector('simple'::regconfig, ((((((COALESCE(ma_thiet_bi, ''::text) || ' '::text) || COALESCE(ten_thiet_bi, ''::text)) || ' '::text) || COALESCE(ma_serial, ''::text)) || ' '::text) || COALESCE(model, ''::text))));


--
-- Name: idx_thiet_bi_ma_tai_san_bravo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_ma_tai_san_bravo ON public.thiet_bi USING btree (ma_tai_san_bravo);


--
-- Name: idx_thiet_bi_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_model ON public.thiet_bi USING btree (model_id);


--
-- Name: idx_thiet_bi_nha_cung_cap_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_nha_cung_cap_id ON public.thiet_bi USING btree (nha_cung_cap_id);


--
-- Name: idx_thiet_bi_nhom_he_thong_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_nhom_he_thong_id ON public.thiet_bi USING btree (nhom_he_thong_id);


--
-- Name: idx_thiet_bi_nsx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_nsx ON public.thiet_bi USING btree (nha_san_xuat_id);


--
-- Name: idx_thiet_bi_phan_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_phan_loai ON public.thiet_bi USING btree (phan_loai_id);


--
-- Name: idx_thiet_bi_search_tsv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_search_tsv ON public.thiet_bi USING gin (search_tsv);


--
-- Name: idx_thiet_bi_tep_thiet_bi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_tep_thiet_bi ON public.thiet_bi_tep_dinh_kem USING btree (thiet_bi_id);


--
-- Name: idx_thiet_bi_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_trang_thai ON public.thiet_bi USING btree (trang_thai_id);


--
-- Name: idx_thiet_bi_trang_thai_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_trang_thai_id ON public.thiet_bi USING btree (trang_thai_id);


--
-- Name: idx_thiet_bi_vi_tri_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_vi_tri_id ON public.thiet_bi USING btree (vi_tri_id);


--
-- Name: idx_thiet_bi_vong_doi_den_trang_thai_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_vong_doi_den_trang_thai_id ON public.thiet_bi_vong_doi USING btree (den_trang_thai_id);


--
-- Name: idx_thiet_bi_vong_doi_tb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_vong_doi_tb ON public.thiet_bi_vong_doi USING btree (thiet_bi_id, thoi_diem DESC);


--
-- Name: idx_thiet_bi_vong_doi_tu_trang_thai_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_vong_doi_tu_trang_thai_id ON public.thiet_bi_vong_doi USING btree (tu_trang_thai_id);


--
-- Name: idx_ticket_comment_ticket; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ticket_comment_ticket ON public.ticket_comment USING btree (ticket_id, created_at);


--
-- Name: idx_tickets_assigned_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_assigned_to ON public.tickets USING btree (assigned_to);


--
-- Name: idx_tickets_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_created_by ON public.tickets USING btree (created_by);


--
-- Name: idx_tickets_he_thong_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_he_thong_id ON public.tickets USING btree (he_thong_id);


--
-- Name: idx_tickets_su_co_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_su_co_id ON public.tickets USING btree (su_co_id);


--
-- Name: idx_tickets_thiet_bi_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_thiet_bi_id ON public.tickets USING btree (thiet_bi_id);


--
-- Name: idx_tickets_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_trang_thai ON public.tickets USING btree (trang_thai);


--
-- Name: idx_user_pinned_user_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_pinned_user_order ON public.user_pinned USING btree (user_id, "order");


--
-- Name: idx_user_recent_user_viewed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_recent_user_viewed ON public.user_recent USING btree (user_id, viewed_at DESC);


--
-- Name: idx_user_scope_don_vi_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_scope_don_vi_id ON public.user_scope USING btree (don_vi_id);


--
-- Name: idx_user_scope_to_chuc_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_scope_to_chuc_id ON public.user_scope USING btree (to_chuc_id);


--
-- Name: idx_van_de_he_thong_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_van_de_he_thong_id ON public.van_de USING btree (he_thong_id);


--
-- Name: idx_van_de_thiet_bi_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_van_de_thiet_bi_id ON public.van_de USING btree (thiet_bi_id);


--
-- Name: idx_vat_tu_don_vi_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vat_tu_don_vi_id ON public.vat_tu USING btree (don_vi_id);


--
-- Name: idx_vat_tu_model_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vat_tu_model_id ON public.vat_tu USING btree (model_id);


--
-- Name: idx_vat_tu_nha_cung_cap_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vat_tu_nha_cung_cap_id ON public.vat_tu USING btree (nha_cung_cap_id);


--
-- Name: idx_webauthn_credentials_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webauthn_credentials_user ON public.webauthn_credentials USING btree (user_id);


--
-- Name: ix_dbd_audit_dot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_dbd_audit_dot ON public.dot_bao_duong_audit_log USING btree (dot_id, created_at DESC);


--
-- Name: ix_dbd_audit_hm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_dbd_audit_hm ON public.dot_bao_duong_audit_log USING btree (hang_muc_id, created_at DESC);


--
-- Name: ix_dbd_hm_dot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_dbd_hm_dot ON public.dot_bao_duong_hang_muc USING btree (dot_id);


--
-- Name: ix_dbd_hm_dv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_dbd_hm_dv ON public.dot_bao_duong_hang_muc USING btree (don_vi_id);


--
-- Name: ix_lkht_dich_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_lkht_dich_active ON public.lien_ket_he_thong USING btree (he_thong_dich_id) WHERE (hieu_luc_den IS NULL);


--
-- Name: ix_lkht_hieuluc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_lkht_hieuluc ON public.lien_ket_he_thong USING btree (hieu_luc_tu, hieu_luc_den);


--
-- Name: ix_lkht_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_lkht_loai ON public.lien_ket_he_thong USING btree (loai_lien_ket_id);


--
-- Name: ix_lkht_nguon_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_lkht_nguon_active ON public.lien_ket_he_thong USING btree (he_thong_nguon_id) WHERE (hieu_luc_den IS NULL);


--
-- Name: ix_lkk_hieuluc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_lkk_hieuluc ON public.lien_ket_khe USING btree (hieu_luc_tu, hieu_luc_den);


--
-- Name: ix_mdt_dac_tinh; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mdt_dac_tinh ON public.dm_model_dac_tinh USING btree (dac_tinh_id);


--
-- Name: ix_wri_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_wri_created_at ON public.weekly_report_import USING btree (created_at DESC);


--
-- Name: ix_wri_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_wri_created_by ON public.weekly_report_import USING btree (created_by);


--
-- Name: mv_asset_anomaly_asset_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX mv_asset_anomaly_asset_id_idx ON public.mv_asset_anomaly USING btree (asset_id);


--
-- Name: mv_asset_anomaly_z_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mv_asset_anomaly_z_idx ON public.mv_asset_anomaly USING btree (z_score);


--
-- Name: mv_dashboard_overview_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX mv_dashboard_overview_uniq ON public.mv_dashboard_overview USING btree (((payload ->> 'refreshed_at'::text)));


--
-- Name: r2_file_status_exp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX r2_file_status_exp_idx ON public.r2_file USING btree (status, expires_at);


--
-- Name: r2_file_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX r2_file_user_idx ON public.r2_file USING btree (user_id, created_at DESC);


--
-- Name: r2_log_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX r2_log_key_idx ON public.r2_access_log USING btree (key, created_at DESC);


--
-- Name: r2_log_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX r2_log_user_idx ON public.r2_access_log USING btree (user_id, created_at DESC);


--
-- Name: search_index_loai_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX search_index_loai_idx ON public.search_index USING btree (loai);


--
-- Name: search_index_ma_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX search_index_ma_trgm ON public.search_index USING gin (public.f_unaccent(COALESCE(ma, ''::text)) extensions.gin_trgm_ops);


--
-- Name: search_index_tieude_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX search_index_tieude_trgm ON public.search_index USING gin (public.f_unaccent(tieu_de) extensions.gin_trgm_ops);


--
-- Name: search_index_tsv_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX search_index_tsv_idx ON public.search_index USING gin (tsv);


--
-- Name: so_do_tep_so_do_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX so_do_tep_so_do_id_idx ON public.so_do_tep_dinh_kem USING btree (so_do_id);


--
-- Name: su_co_thanh_phan_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX su_co_thanh_phan_id_idx ON public.su_co USING btree (thanh_phan_id);


--
-- Name: su_co_thiet_bi_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX su_co_thiet_bi_id_idx ON public.su_co USING btree (thiet_bi_id);


--
-- Name: su_co_van_de_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX su_co_van_de_id_idx ON public.su_co USING btree (van_de_id);


--
-- Name: supabase_ngoai_mot_kich_hoat; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX supabase_ngoai_mot_kich_hoat ON public.supabase_ngoai USING btree (kich_hoat) WHERE kich_hoat;


--
-- Name: thiet_bi_search_trgm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX thiet_bi_search_trgm_idx ON public.thiet_bi USING gin (search_text extensions.gin_trgm_ops);


--
-- Name: thiet_bi_search_tsv_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX thiet_bi_search_tsv_idx ON public.thiet_bi USING gin (search_tsv);


--
-- Name: thong_bao_cau_hinh_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX thong_bao_cau_hinh_uniq ON public.thong_bao_cau_hinh USING btree (scope, COALESCE(don_vi_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(loai, ''::text));


--
-- Name: thong_bao_den_han_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX thong_bao_den_han_idx ON public.thong_bao USING btree (den_han_at);


--
-- Name: thong_bao_don_vi_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX thong_bao_don_vi_idx ON public.thong_bao USING btree (don_vi_id, da_doc);


--
-- Name: thong_bao_email_queue_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX thong_bao_email_queue_status_idx ON public.thong_bao_email_queue USING btree (trang_thai, created_at);


--
-- Name: thong_bao_nguoi_nhan_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX thong_bao_nguoi_nhan_idx ON public.thong_bao USING btree (nguoi_nhan, da_doc, created_at DESC);


--
-- Name: uq_canh_bao_het_han_log_khoa; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_canh_bao_het_han_log_khoa ON public.canh_bao_het_han_log USING btree (khoa);


--
-- Name: uq_gcn_thanh_phan_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_gcn_thanh_phan_active ON public.gan_chuc_nang USING btree (thanh_phan_id) WHERE (den_ngay IS NULL);


--
-- Name: uq_glk_khe_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_glk_khe_active ON public.gan_linh_kien USING btree (khe_id) WHERE (den_ngay IS NULL);


--
-- Name: uq_glk_linh_kien_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_glk_linh_kien_active ON public.gan_linh_kien USING btree (linh_kien_id) WHERE (den_ngay IS NULL);


--
-- Name: uq_import_alias; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_import_alias ON public.import_alias USING btree (entity, COALESCE(scope, ''::text), alias_norm);


--
-- Name: uq_pmbq_cap_phat_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_pmbq_cap_phat_active ON public.phan_mem_ban_quyen_cap_phat USING btree (ban_quyen_id, thiet_bi_id) WHERE (ngay_thu_hoi IS NULL);


--
-- Name: uq_thiet_bi_ket_noi; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_thiet_bi_ket_noi ON public.thiet_bi_ket_noi USING btree (tu_thiet_bi_id, den_thiet_bi_id, COALESCE(tu_cong, ''::text), COALESCE(den_cong, ''::text), loai);


--
-- Name: user_scope_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_scope_uniq ON public.user_scope USING btree (user_id, COALESCE(to_chuc_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(don_vi_id, '00000000-0000-0000-0000-000000000000'::uuid));


--
-- Name: user_scope_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_scope_user_idx ON public.user_scope USING btree (user_id);


--
-- Name: ux_lkht_canh_hieu_luc; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_lkht_canh_hieu_luc ON public.lien_ket_he_thong USING btree (he_thong_nguon_id, he_thong_dich_id, loai_lien_ket_id, lop) WHERE (hieu_luc_den IS NULL);


--
-- Name: ux_lkk_canh_hieu_luc; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_lkk_canh_hieu_luc ON public.lien_ket_khe USING btree (khe_nguon_id, khe_dich_id, loai_lien_ket_id) WHERE (hieu_luc_den IS NULL);


--
-- Name: vi_tri_media_vi_tri_ma_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vi_tri_media_vi_tri_ma_idx ON public.vi_tri_media USING btree (vi_tri_ma);


--
-- Name: ai_config ai_config_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ai_config_set_updated_at BEFORE UPDATE ON public.ai_config FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: ai_conversation ai_conversation_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ai_conversation_set_updated_at BEFORE UPDATE ON public.ai_conversation FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_don_vi audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_don_vi FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_he_thong audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_loai_giay_phep audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_loai_giay_phep FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_loai_thiet_bi audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_loai_thiet_bi FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_nha_cung_cap audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_nha_cung_cap FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_nha_san_xuat audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_nha_san_xuat FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_nhom_he_thong audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_nhom_he_thong FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_noi_cap audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_noi_cap FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_trang_thai_thiet_bi audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_trang_thai_thiet_bi FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_vi_tri audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_vi_tri FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: form_field audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.form_field FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: form_submission audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.form_submission FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: form_submission_thiet_bi audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.form_submission_thiet_bi FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: form_template audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.form_template FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: giay_phep audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.giay_phep FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: profiles audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: thiet_bi audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.thiet_bi FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: thiet_bi_tep_dinh_kem audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.thiet_bi_tep_dinh_kem FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: user_roles audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_loai_lien_ket audit_trg_dm_loai_lien_ket; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg_dm_loai_lien_ket AFTER INSERT OR DELETE OR UPDATE ON public.dm_loai_lien_ket FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: lien_ket_he_thong audit_trg_lien_ket_he_thong; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg_lien_ket_he_thong AFTER INSERT OR DELETE OR UPDATE ON public.lien_ket_he_thong FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: lien_ket_khe audit_trg_lien_ket_khe; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg_lien_ket_khe AFTER INSERT OR DELETE OR UPDATE ON public.lien_ket_khe FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: bao_tri bao_tri_3lop; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER bao_tri_3lop BEFORE INSERT OR UPDATE ON public.bao_tri FOR EACH ROW EXECUTE FUNCTION public.trg_bao_tri_3lop();


--
-- Name: cong_viec_bao_tri cvbt_ma_before_ins; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER cvbt_ma_before_ins BEFORE INSERT ON public.cong_viec_bao_tri FOR EACH ROW EXECUTE FUNCTION public.trg_cvbt_ma();


--
-- Name: cong_viec_bao_tri cvbt_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER cvbt_updated_at BEFORE UPDATE ON public.cong_viec_bao_tri FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dot_bao_duong_bien_ban dbd_bb_audit_del; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER dbd_bb_audit_del AFTER DELETE ON public.dot_bao_duong_bien_ban FOR EACH ROW EXECUTE FUNCTION public.trg_dbd_bb_audit();


--
-- Name: dot_bao_duong_bien_ban dbd_bb_audit_ins; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER dbd_bb_audit_ins AFTER INSERT ON public.dot_bao_duong_bien_ban FOR EACH ROW EXECUTE FUNCTION public.trg_dbd_bb_audit();


--
-- Name: dot_bao_duong_hang_muc dbd_hm_audit_ins; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER dbd_hm_audit_ins AFTER INSERT ON public.dot_bao_duong_hang_muc FOR EACH ROW EXECUTE FUNCTION public.trg_dbd_hm_audit();


--
-- Name: dot_bao_duong_hang_muc dbd_hm_audit_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER dbd_hm_audit_upd AFTER UPDATE ON public.dot_bao_duong_hang_muc FOR EACH ROW EXECUTE FUNCTION public.trg_dbd_hm_audit();


--
-- Name: gan_chuc_nang gcn_sync_thiet_bi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER gcn_sync_thiet_bi BEFORE INSERT OR UPDATE ON public.gan_chuc_nang FOR EACH ROW EXECUTE FUNCTION public.trg_sync_thiet_bi_from_thanh_phan();


--
-- Name: gan_linh_kien glk_before; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER glk_before BEFORE INSERT OR UPDATE ON public.gan_linh_kien FOR EACH ROW EXECUTE FUNCTION public.trg_glk_before();


--
-- Name: dm_he_thong he_thong_cascade_don_vi_tai_san; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER he_thong_cascade_don_vi_tai_san AFTER UPDATE OF don_vi_id ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.trg_cascade_he_thong_don_vi_to_tai_san();


--
-- Name: hong_hoc hong_hoc_3lop; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER hong_hoc_3lop BEFORE INSERT OR UPDATE ON public.hong_hoc FOR EACH ROW EXECUTE FUNCTION public.trg_hong_hoc_3lop();


--
-- Name: he_thong_thanh_phan http_before; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER http_before BEFORE UPDATE ON public.he_thong_thanh_phan FOR EACH ROW EXECUTE FUNCTION public.trg_http_before();


--
-- Name: he_thong_thanh_phan http_sync_device; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER http_sync_device AFTER UPDATE OF vi_tri_id, trang_thai_id, don_vi_id_snapshot, he_thong_id ON public.he_thong_thanh_phan FOR EACH ROW EXECUTE FUNCTION public.trg_http_sync_device();


--
-- Name: he_thong_thanh_phan http_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER http_touch BEFORE UPDATE ON public.he_thong_thanh_phan FOR EACH ROW EXECUTE FUNCTION public.trg_http_touch();


--
-- Name: import_alias import_alias_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER import_alias_set_updated_at BEFORE UPDATE ON public.import_alias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: import_batch import_batch_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER import_batch_set_updated_at BEFORE UPDATE ON public.import_batch FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: kho_giao_dich kgd_before_ins; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kgd_before_ins BEFORE INSERT ON public.kho_giao_dich FOR EACH ROW EXECUTE FUNCTION public.trg_kgd_before_ins();


--
-- Name: thiet_bi_khe_linh_kien khe_lk_guard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER khe_lk_guard BEFORE UPDATE ON public.thiet_bi_khe_linh_kien FOR EACH ROW EXECUTE FUNCTION public.trg_khe_lk_before_update();


--
-- Name: kho kho_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kho_updated_at BEFORE UPDATE ON public.kho FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: su_co su_co_3lop; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER su_co_3lop BEFORE INSERT OR UPDATE ON public.su_co FOR EACH ROW EXECUTE FUNCTION public.trg_su_co_3lop();


--
-- Name: supabase_ngoai supabase_ngoai_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER supabase_ngoai_updated_at BEFORE UPDATE ON public.supabase_ngoai FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: thiet_bi_ket_noi tbkn_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tbkn_audit AFTER INSERT OR DELETE OR UPDATE ON public.thiet_bi_ket_noi FOR EACH ROW EXECUTE FUNCTION public.trg_tbkn_audit();


--
-- Name: thiet_bi_ket_noi tbkn_before; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tbkn_before BEFORE INSERT OR UPDATE ON public.thiet_bi_ket_noi FOR EACH ROW EXECUTE FUNCTION public.trg_tbkn_before();


--
-- Name: he_thong_thanh_phan thanh_phan_cascade_vi_tri; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER thanh_phan_cascade_vi_tri AFTER UPDATE OF vi_tri_id ON public.he_thong_thanh_phan FOR EACH ROW EXECUTE FUNCTION public.trg_cascade_thanh_phan_vi_tri();


--
-- Name: thong_bao_cau_hinh thong_bao_cau_hinh_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER thong_bao_cau_hinh_updated_at BEFORE UPDATE ON public.thong_bao_cau_hinh FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: thong_bao thong_bao_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER thong_bao_updated_at BEFORE UPDATE ON public.thong_bao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_log trg_audit_bulk_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_bulk_delete AFTER INSERT ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.trg_detect_bulk_delete();


--
-- Name: he_thong_thanh_phan trg_audit_he_thong_thanh_phan; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_he_thong_thanh_phan AFTER INSERT OR DELETE OR UPDATE ON public.he_thong_thanh_phan FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: backup_lich_su trg_backup_lich_su_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_backup_lich_su_updated BEFORE UPDATE ON public.backup_lich_su FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bang_cot_tuy_chinh trg_bang_cot_tuy_chinh_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_bang_cot_tuy_chinh_updated_at BEFORE UPDATE ON public.bang_cot_tuy_chinh FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bao_cao_annotation trg_bao_cao_annotation_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_bao_cao_annotation_updated BEFORE UPDATE ON public.bao_cao_annotation FOR EACH ROW EXECUTE FUNCTION public.tg_bao_cao_annotation_updated();


--
-- Name: bao_tri_chinh_sach trg_bao_tri_chinh_sach_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_bao_tri_chinh_sach_updated BEFORE UPDATE ON public.bao_tri_chinh_sach FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_he_thong trg_cascade_he_thong_don_vi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cascade_he_thong_don_vi AFTER UPDATE OF don_vi_id ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.cascade_he_thong_don_vi();


--
-- Name: cay_node_edit trg_cay_node_edit_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cay_node_edit_updated_at BEFORE UPDATE ON public.cay_node_edit FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: change_request trg_change_request_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_change_request_touch BEFORE UPDATE ON public.change_request FOR EACH ROW EXECUTE FUNCTION public.tg_change_request_touch();


--
-- Name: cay_thay_doi trg_ctd_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ctd_updated BEFORE UPDATE ON public.cay_thay_doi FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: du_an_cong_viec trg_cv_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cv_audit AFTER INSERT OR DELETE OR UPDATE ON public.du_an_cong_viec FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: du_an_cong_viec trg_cv_notify; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cv_notify AFTER INSERT OR UPDATE ON public.du_an_cong_viec FOR EACH ROW EXECUTE FUNCTION public.notify_cong_viec_change();


--
-- Name: du_an_cong_viec trg_cv_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cv_updated BEFORE UPDATE ON public.du_an_cong_viec FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: du_an_cong_van trg_dacv_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dacv_updated BEFORE UPDATE ON public.du_an_cong_van FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: du_an_cong_van_lien_ket trg_dacvlk_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dacvlk_updated BEFORE UPDATE ON public.du_an_cong_van_lien_ket FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: du_an_cong_van_tep trg_dacvt_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dacvt_updated BEFORE UPDATE ON public.du_an_cong_van_tep FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dot_bao_duong_han trg_dbd_han_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dbd_han_upd BEFORE UPDATE ON public.dot_bao_duong_han FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dot_bao_duong_hang_muc trg_dbd_hm_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dbd_hm_upd BEFORE UPDATE ON public.dot_bao_duong_hang_muc FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dot_bao_duong trg_dbd_upd; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dbd_upd BEFORE UPDATE ON public.dot_bao_duong FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dm_dac_tinh trg_dm_dac_tinh_gen_ma; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_dac_tinh_gen_ma BEFORE INSERT ON public.dm_dac_tinh FOR EACH ROW EXECUTE FUNCTION public._gen_ma_dac_tinh();


--
-- Name: dm_dac_tinh trg_dm_dac_tinh_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_dac_tinh_updated_at BEFORE UPDATE ON public.dm_dac_tinh FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dm_don_vi trg_dm_don_vi_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_don_vi_updated_at BEFORE UPDATE ON public.dm_don_vi FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_he_thong trg_dm_he_thong_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_he_thong_updated_at BEFORE UPDATE ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_loai_ban_quyen trg_dm_loai_ban_quyen_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_loai_ban_quyen_updated_at BEFORE UPDATE ON public.dm_loai_ban_quyen FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dm_loai_giay_phep trg_dm_loai_giay_phep_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_loai_giay_phep_updated_at BEFORE UPDATE ON public.dm_loai_giay_phep FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_loai_lien_ket trg_dm_loai_lien_ket_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_loai_lien_ket_updated_at BEFORE UPDATE ON public.dm_loai_lien_ket FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_loai_thiet_bi trg_dm_loai_thiet_bi_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_loai_thiet_bi_updated_at BEFORE UPDATE ON public.dm_loai_thiet_bi FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_model trg_dm_model_propagate; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_model_propagate AFTER UPDATE ON public.dm_model FOR EACH ROW EXECUTE FUNCTION public.dm_model_propagate_to_thiet_bi();


--
-- Name: dm_nha_cung_cap trg_dm_nha_cung_cap_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_nha_cung_cap_updated_at BEFORE UPDATE ON public.dm_nha_cung_cap FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_nha_san_xuat trg_dm_nha_san_xuat_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_nha_san_xuat_updated_at BEFORE UPDATE ON public.dm_nha_san_xuat FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_nhom_he_thong trg_dm_nhom_he_thong_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_nhom_he_thong_updated_at BEFORE UPDATE ON public.dm_nhom_he_thong FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_danh_gia_nien_han trg_dm_nien_han_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_nien_han_updated_at BEFORE UPDATE ON public.dm_danh_gia_nien_han FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_noi_cap trg_dm_noi_cap_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_noi_cap_updated_at BEFORE UPDATE ON public.dm_noi_cap FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_to_chuc trg_dm_to_chuc_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_to_chuc_updated_at BEFORE UPDATE ON public.dm_to_chuc FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dm_trang_thai_thiet_bi trg_dm_trang_thai_thiet_bi_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_trang_thai_thiet_bi_updated_at BEFORE UPDATE ON public.dm_trang_thai_thiet_bi FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_vi_tri trg_dm_vi_tri_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_vi_tri_updated_at BEFORE UPDATE ON public.dm_vi_tri FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dinh_nghia_truong trg_dnt_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dnt_updated_at BEFORE UPDATE ON public.dinh_nghia_truong FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: du_an trg_du_an_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_du_an_audit AFTER INSERT OR DELETE OR UPDATE ON public.du_an FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: du_an trg_du_an_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_du_an_updated BEFORE UPDATE ON public.du_an FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: field_set_item trg_field_set_item_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_field_set_item_updated_at BEFORE UPDATE ON public.field_set_item FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: field_set trg_field_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_field_set_updated_at BEFORE UPDATE ON public.field_set FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: form_check_item trg_form_check_item_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_form_check_item_updated BEFORE UPDATE ON public.form_check_item FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: form_field trg_form_field_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_form_field_updated_at BEFORE UPDATE ON public.form_field FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: form_section trg_form_section_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_form_section_updated BEFORE UPDATE ON public.form_section FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: form_submission trg_form_submission_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_form_submission_updated_at BEFORE UPDATE ON public.form_submission FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: form_template trg_form_template_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_form_template_updated_at BEFORE UPDATE ON public.form_template FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: form_submission_item_result trg_fsir_enrich; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_fsir_enrich BEFORE INSERT OR UPDATE ON public.form_submission_item_result FOR EACH ROW EXECUTE FUNCTION public.fsir_enrich();


--
-- Name: form_submission_item_result trg_fsir_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_fsir_updated BEFORE UPDATE ON public.form_submission_item_result FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: form_template_include trg_ftinc_parent_draft; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ftinc_parent_draft BEFORE INSERT OR DELETE OR UPDATE ON public.form_template_include FOR EACH ROW EXECUTE FUNCTION public.ftinc_parent_must_be_draft();


--
-- Name: form_template_version trg_ftv_lock_published; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ftv_lock_published BEFORE UPDATE ON public.form_template_version FOR EACH ROW EXECUTE FUNCTION public.ftv_lock_published();


--
-- Name: form_template_version trg_ftv_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ftv_updated_at BEFORE UPDATE ON public.form_template_version FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: giay_phep trg_giay_phep_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_giay_phep_updated_at BEFORE UPDATE ON public.giay_phep FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: giay_phep_khai_thac trg_gpkt_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_gpkt_updated_at BEFORE UPDATE ON public.giay_phep_khai_thac FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_he_thong trg_he_thong_cascade_thiet_bi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_he_thong_cascade_thiet_bi AFTER UPDATE ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.he_thong_cascade_thiet_bi();


--
-- Name: dm_he_thong trg_he_thong_completeness; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_he_thong_completeness BEFORE INSERT OR UPDATE ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.trg_update_completeness();


--
-- Name: dm_he_thong trg_he_thong_sync_phan_loai; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_he_thong_sync_phan_loai BEFORE INSERT OR UPDATE OF nhom_he_thong_id, phan_loai_id ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.he_thong_sync_phan_loai();


--
-- Name: he_thong_truong trg_htt_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_htt_updated BEFORE UPDATE ON public.he_thong_truong FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: thiet_bi_khe_linh_kien trg_khe_lk_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_khe_lk_updated_at BEFORE UPDATE ON public.thiet_bi_khe_linh_kien FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lien_ket_he_thong trg_lien_ket_he_thong_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lien_ket_he_thong_updated_at BEFORE UPDATE ON public.lien_ket_he_thong FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lien_ket_khe trg_lien_ket_khe_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lien_ket_khe_updated_at BEFORE UPDATE ON public.lien_ket_khe FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lien_ket_he_thong trg_lkht_snapshot_don_vi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lkht_snapshot_don_vi BEFORE INSERT ON public.lien_ket_he_thong FOR EACH ROW EXECUTE FUNCTION public.lkht_snapshot_don_vi();


--
-- Name: lien_ket_khe trg_lkk_snapshot_don_vi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lkk_snapshot_don_vi BEFORE INSERT ON public.lien_ket_khe FOR EACH ROW EXECUTE FUNCTION public.lkk_snapshot_don_vi();


--
-- Name: du_an_moc trg_moc_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_moc_updated BEFORE UPDATE ON public.du_an_moc FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: model_tai_lieu trg_model_tai_lieu_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_model_tai_lieu_updated BEFORE UPDATE ON public.model_tai_lieu FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: nhan_vien trg_nhan_vien_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_nhan_vien_updated_at BEFORE UPDATE ON public.nhan_vien FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dm_nhom_he_thong trg_nhom_cascade_phan_loai; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_nhom_cascade_phan_loai AFTER UPDATE OF phan_loai_id ON public.dm_nhom_he_thong FOR EACH ROW EXECUTE FUNCTION public.nhom_cascade_phan_loai();


--
-- Name: node_note trg_node_note_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_node_note_touch BEFORE UPDATE ON public.node_note FOR EACH ROW EXECUTE FUNCTION public.tg_node_note_touch();


--
-- Name: messages trg_notify_message; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notify_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_message();


--
-- Name: ticket_comment trg_notify_ticket_comment; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notify_ticket_comment AFTER INSERT ON public.ticket_comment FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_comment();


--
-- Name: tickets trg_notify_ticket_new; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notify_ticket_new AFTER INSERT ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_new();


--
-- Name: tickets trg_notify_ticket_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notify_ticket_update AFTER UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_update();


--
-- Name: pm_cong_viec trg_pm_cong_viec_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pm_cong_viec_updated_at BEFORE UPDATE ON public.pm_cong_viec FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: phan_mem_ban_quyen trg_pmbq_auto_ma; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pmbq_auto_ma BEFORE INSERT ON public.phan_mem_ban_quyen FOR EACH ROW EXECUTE FUNCTION public.pmbq_auto_ma();


--
-- Name: phan_mem_ban_quyen_cap_phat trg_pmbq_check_seats; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pmbq_check_seats BEFORE INSERT OR UPDATE ON public.phan_mem_ban_quyen_cap_phat FOR EACH ROW EXECUTE FUNCTION public.pmbq_check_seats();


--
-- Name: phan_mem_ban_quyen_cap_phat trg_pmbq_cp_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pmbq_cp_updated_at BEFORE UPDATE ON public.phan_mem_ban_quyen_cap_phat FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: phan_mem_ban_quyen_tep trg_pmbq_tep_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pmbq_tep_updated_at BEFORE UPDATE ON public.phan_mem_ban_quyen_tep FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: phan_mem_ban_quyen trg_pmbq_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pmbq_updated_at BEFORE UPDATE ON public.phan_mem_ban_quyen FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles trg_protect_profile_privileged_fields; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_profile_privileged_fields BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();


--
-- Name: ban_giao trg_search_index_ban_giao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_ban_giao AFTER INSERT OR DELETE OR UPDATE ON public.ban_giao FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('ban_giao');


--
-- Name: bao_tri trg_search_index_bao_tri; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_bao_tri AFTER INSERT OR DELETE OR UPDATE ON public.bao_tri FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('bao_tri');


--
-- Name: cong_viec_bao_tri trg_search_index_cong_viec_bao_tri; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_cong_viec_bao_tri AFTER INSERT OR DELETE OR UPDATE ON public.cong_viec_bao_tri FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('cong_viec_bao_tri');


--
-- Name: dm_he_thong trg_search_index_dm_he_thong; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_dm_he_thong AFTER INSERT OR DELETE OR UPDATE ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('dm_he_thong');


--
-- Name: giay_phep_khai_thac trg_search_index_giay_phep_khai_thac; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_giay_phep_khai_thac AFTER INSERT OR DELETE OR UPDATE ON public.giay_phep_khai_thac FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('giay_phep_khai_thac');


--
-- Name: hong_hoc trg_search_index_hong_hoc; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_hong_hoc AFTER INSERT OR DELETE OR UPDATE ON public.hong_hoc FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('hong_hoc');


--
-- Name: su_co trg_search_index_su_co; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_su_co AFTER INSERT OR DELETE OR UPDATE ON public.su_co FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('su_co');


--
-- Name: thiet_bi trg_search_index_thiet_bi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_thiet_bi AFTER INSERT OR DELETE OR UPDATE ON public.thiet_bi FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('thiet_bi');


--
-- Name: van_de trg_search_index_van_de; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_van_de AFTER INSERT OR DELETE OR UPDATE ON public.van_de FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('van_de');


--
-- Name: vat_tu trg_search_index_vat_tu; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_vat_tu AFTER INSERT OR DELETE OR UPDATE ON public.vat_tu FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('vat_tu');


--
-- Name: supabase_ngoai_job_bang trg_sn_job_bang_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sn_job_bang_updated BEFORE UPDATE ON public.supabase_ngoai_job_bang FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: supabase_ngoai_job trg_sn_job_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sn_job_updated BEFORE UPDATE ON public.supabase_ngoai_job FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: so_do_he_thong trg_so_do_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_so_do_updated_at BEFORE UPDATE ON public.so_do_he_thong FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: thiet_bi trg_sync_taxonomy_thiet_bi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_taxonomy_thiet_bi BEFORE INSERT OR UPDATE OF he_thong_id, nhom_he_thong_id, phan_loai_id ON public.thiet_bi FOR EACH ROW EXECUTE FUNCTION public.sync_taxonomy_thiet_bi();


--
-- Name: he_thong_thanh_phan trg_sync_thanh_phan_don_vi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_thanh_phan_don_vi BEFORE INSERT OR UPDATE OF he_thong_id ON public.he_thong_thanh_phan FOR EACH ROW EXECUTE FUNCTION public.sync_thanh_phan_don_vi();


--
-- Name: telegram_subscriber trg_tele_sub_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tele_sub_updated BEFORE UPDATE ON public.telegram_subscriber FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: thiet_bi_tep_dinh_kem trg_tep_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tep_updated BEFORE UPDATE ON public.thiet_bi_tep_dinh_kem FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: thiet_bi trg_thiet_bi_completeness; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_thiet_bi_completeness BEFORE INSERT OR UPDATE ON public.thiet_bi FOR EACH ROW EXECUTE FUNCTION public.trg_update_completeness();


--
-- Name: thiet_bi trg_thiet_bi_inherit_model; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_thiet_bi_inherit_model BEFORE INSERT OR UPDATE OF model_id ON public.thiet_bi FOR EACH ROW EXECUTE FUNCTION public.thiet_bi_inherit_model();


--
-- Name: thiet_bi trg_thiet_bi_sync_hierarchy; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_thiet_bi_sync_hierarchy BEFORE INSERT OR UPDATE ON public.thiet_bi FOR EACH ROW EXECUTE FUNCTION public.thiet_bi_sync_hierarchy();


--
-- Name: thiet_bi trg_thiet_bi_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_thiet_bi_updated_at BEFORE UPDATE ON public.thiet_bi FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: thiet_bi trg_thiet_bi_vong_doi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_thiet_bi_vong_doi AFTER UPDATE OF trang_thai_id ON public.thiet_bi FOR EACH ROW EXECUTE FUNCTION public.log_thiet_bi_vong_doi();


--
-- Name: tickets trg_tickets_sla; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tickets_sla BEFORE INSERT OR UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.trg_ticket_sla();


--
-- Name: tickets trg_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: user_layout_prefs trg_touch_user_layout_prefs; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_touch_user_layout_prefs BEFORE UPDATE ON public.user_layout_prefs FOR EACH ROW EXECUTE FUNCTION public.touch_user_layout_prefs();


--
-- Name: dm_he_thong trg_validate_dm_he_thong_taxonomy; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validate_dm_he_thong_taxonomy BEFORE INSERT OR UPDATE OF nhom_he_thong_id, phan_loai_id ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.validate_dm_he_thong_taxonomy();


--
-- Name: dm_he_thong trg_validate_he_thong_don_vi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validate_he_thong_don_vi BEFORE INSERT OR UPDATE ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.validate_he_thong_don_vi();


--
-- Name: gan_chuc_nang trg_validate_thiet_bi_he_thong_khi_lap; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validate_thiet_bi_he_thong_khi_lap BEFORE INSERT OR UPDATE ON public.gan_chuc_nang FOR EACH ROW EXECUTE FUNCTION public.validate_thiet_bi_he_thong_khi_lap();


--
-- Name: van_de trg_van_de_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_van_de_audit AFTER INSERT OR DELETE OR UPDATE ON public.van_de FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: van_de trg_van_de_ma; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_van_de_ma BEFORE INSERT ON public.van_de FOR EACH ROW EXECUTE FUNCTION public.gen_ma_van_de();


--
-- Name: van_de trg_van_de_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_van_de_updated BEFORE UPDATE ON public.van_de FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_model update_dm_model_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dm_model_updated_at BEFORE UPDATE ON public.dm_model FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dm_phan_loai update_dm_phan_loai_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dm_phan_loai_updated_at BEFORE UPDATE ON public.dm_phan_loai FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vat_tu vat_tu_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER vat_tu_updated_at BEFORE UPDATE ON public.vat_tu FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cay_node_edit zz_audit_row; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER zz_audit_row AFTER INSERT OR DELETE OR UPDATE ON public.cay_node_edit FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: du_an zz_audit_row; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER zz_audit_row AFTER INSERT OR DELETE OR UPDATE ON public.du_an FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: du_an_cong_viec zz_audit_row; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER zz_audit_row AFTER INSERT OR DELETE OR UPDATE ON public.du_an_cong_viec FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: du_an_moc zz_audit_row; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER zz_audit_row AFTER INSERT OR DELETE OR UPDATE ON public.du_an_moc FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: so_do_he_thong zz_audit_row; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER zz_audit_row AFTER INSERT OR DELETE OR UPDATE ON public.so_do_he_thong FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: so_do_tep_dinh_kem zz_audit_row; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER zz_audit_row AFTER INSERT OR DELETE OR UPDATE ON public.so_do_tep_dinh_kem FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: ai_message ai_message_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_message
    ADD CONSTRAINT ai_message_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.ai_conversation(id) ON DELETE CASCADE;


--
-- Name: bao_cao_annotation bao_cao_annotation_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bao_cao_annotation
    ADD CONSTRAINT bao_cao_annotation_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;


--
-- Name: bao_cao_annotation bao_cao_annotation_tao_boi_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bao_cao_annotation
    ADD CONSTRAINT bao_cao_annotation_tao_boi_fkey FOREIGN KEY (tao_boi) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: bao_tri_chinh_sach bao_tri_chinh_sach_loai_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bao_tri_chinh_sach
    ADD CONSTRAINT bao_tri_chinh_sach_loai_thiet_bi_id_fkey FOREIGN KEY (loai_thiet_bi_id) REFERENCES public.dm_loai_thiet_bi(id) ON DELETE CASCADE;


--
-- Name: bao_tri_chinh_sach bao_tri_chinh_sach_nguoi_phu_trach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bao_tri_chinh_sach
    ADD CONSTRAINT bao_tri_chinh_sach_nguoi_phu_trach_id_fkey FOREIGN KEY (nguoi_phu_trach_id) REFERENCES public.nhan_vien(id) ON DELETE SET NULL;


--
-- Name: change_request change_request_nguoi_tao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.change_request
    ADD CONSTRAINT change_request_nguoi_tao_fkey FOREIGN KEY (nguoi_tao) REFERENCES auth.users(id);


--
-- Name: change_request change_request_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.change_request
    ADD CONSTRAINT change_request_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id);


--
-- Name: chung_chi_thiet_bi chung_chi_thiet_bi_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chung_chi_thiet_bi
    ADD CONSTRAINT chung_chi_thiet_bi_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: cong_viec_bao_tri cong_viec_bao_tri_bao_tri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cong_viec_bao_tri
    ADD CONSTRAINT cong_viec_bao_tri_bao_tri_id_fkey FOREIGN KEY (bao_tri_id) REFERENCES public.bao_tri(id) ON DELETE SET NULL;


--
-- Name: cong_viec_bao_tri cong_viec_bao_tri_chinh_sach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cong_viec_bao_tri
    ADD CONSTRAINT cong_viec_bao_tri_chinh_sach_id_fkey FOREIGN KEY (chinh_sach_id) REFERENCES public.bao_tri_chinh_sach(id) ON DELETE SET NULL;


--
-- Name: cong_viec_bao_tri cong_viec_bao_tri_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cong_viec_bao_tri
    ADD CONSTRAINT cong_viec_bao_tri_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;


--
-- Name: cong_viec_bao_tri cong_viec_bao_tri_su_co_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cong_viec_bao_tri
    ADD CONSTRAINT cong_viec_bao_tri_su_co_id_fkey FOREIGN KEY (su_co_id) REFERENCES public.su_co(id) ON DELETE SET NULL;


--
-- Name: cong_viec_bao_tri cong_viec_bao_tri_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cong_viec_bao_tri
    ADD CONSTRAINT cong_viec_bao_tri_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: cong_viec_bao_tri cong_viec_bao_tri_van_de_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cong_viec_bao_tri
    ADD CONSTRAINT cong_viec_bao_tri_van_de_id_fkey FOREIGN KEY (van_de_id) REFERENCES public.van_de(id) ON DELETE SET NULL;


--
-- Name: conversation_participant conversation_participant_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participant
    ADD CONSTRAINT conversation_participant_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: dm_dac_tinh dm_dac_tinh_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_dac_tinh
    ADD CONSTRAINT dm_dac_tinh_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_dac_tinh(id) ON DELETE SET NULL;


--
-- Name: dm_danh_gia_nien_han dm_danh_gia_nien_han_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_danh_gia_nien_han
    ADD CONSTRAINT dm_danh_gia_nien_han_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_danh_gia_nien_han(id) ON DELETE SET NULL;


--
-- Name: dm_don_vi dm_don_vi_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_don_vi
    ADD CONSTRAINT dm_don_vi_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: dm_don_vi dm_don_vi_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_don_vi
    ADD CONSTRAINT dm_don_vi_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: dm_he_thong dm_he_thong_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_he_thong
    ADD CONSTRAINT dm_he_thong_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: dm_he_thong dm_he_thong_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_he_thong
    ADD CONSTRAINT dm_he_thong_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;


--
-- Name: dm_he_thong dm_he_thong_nhom_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_he_thong
    ADD CONSTRAINT dm_he_thong_nhom_he_thong_id_fkey FOREIGN KEY (nhom_he_thong_id) REFERENCES public.dm_nhom_he_thong(id) ON DELETE SET NULL;


--
-- Name: dm_he_thong dm_he_thong_phan_loai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_he_thong
    ADD CONSTRAINT dm_he_thong_phan_loai_id_fkey FOREIGN KEY (phan_loai_id) REFERENCES public.dm_phan_loai(id) ON DELETE SET NULL;


--
-- Name: dm_he_thong dm_he_thong_to_chuc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_he_thong
    ADD CONSTRAINT dm_he_thong_to_chuc_id_fkey FOREIGN KEY (to_chuc_id) REFERENCES public.dm_to_chuc(id) ON DELETE SET NULL;


--
-- Name: dm_loai_giay_phep dm_loai_giay_phep_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_giay_phep
    ADD CONSTRAINT dm_loai_giay_phep_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_loai_giay_phep(id) ON DELETE SET NULL;


--
-- Name: dm_loai_lien_ket dm_loai_lien_ket_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_lien_ket
    ADD CONSTRAINT dm_loai_lien_ket_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_loai_lien_ket(id) ON DELETE SET NULL;


--
-- Name: dm_loai_thiet_bi dm_loai_thiet_bi_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_thiet_bi
    ADD CONSTRAINT dm_loai_thiet_bi_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_loai_thiet_bi(id) ON DELETE SET NULL;


--
-- Name: dm_model_dac_tinh dm_model_dac_tinh_dac_tinh_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_model_dac_tinh
    ADD CONSTRAINT dm_model_dac_tinh_dac_tinh_id_fkey FOREIGN KEY (dac_tinh_id) REFERENCES public.dm_dac_tinh(id) ON DELETE RESTRICT;


--
-- Name: dm_model_dac_tinh dm_model_dac_tinh_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_model_dac_tinh
    ADD CONSTRAINT dm_model_dac_tinh_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.dm_model(id) ON DELETE CASCADE;


--
-- Name: dm_model dm_model_field_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_model
    ADD CONSTRAINT dm_model_field_set_id_fkey FOREIGN KEY (field_set_id) REFERENCES public.field_set(id) ON DELETE SET NULL;


--
-- Name: dm_model dm_model_loai_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_model
    ADD CONSTRAINT dm_model_loai_thiet_bi_id_fkey FOREIGN KEY (loai_thiet_bi_id) REFERENCES public.dm_loai_thiet_bi(id) ON DELETE SET NULL;


--
-- Name: dm_model dm_model_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_model
    ADD CONSTRAINT dm_model_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_model(id) ON DELETE SET NULL;


--
-- Name: dm_model dm_model_nha_san_xuat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_model
    ADD CONSTRAINT dm_model_nha_san_xuat_id_fkey FOREIGN KEY (nha_san_xuat_id) REFERENCES public.dm_nha_san_xuat(id) ON DELETE SET NULL;


--
-- Name: dm_nha_cung_cap dm_nha_cung_cap_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nha_cung_cap
    ADD CONSTRAINT dm_nha_cung_cap_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_nha_cung_cap(id) ON DELETE SET NULL;


--
-- Name: dm_nha_san_xuat dm_nha_san_xuat_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nha_san_xuat
    ADD CONSTRAINT dm_nha_san_xuat_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_nha_san_xuat(id) ON DELETE SET NULL;


--
-- Name: dm_nhom_he_thong dm_nhom_he_thong_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nhom_he_thong
    ADD CONSTRAINT dm_nhom_he_thong_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_nhom_he_thong(id) ON DELETE SET NULL;


--
-- Name: dm_nhom_he_thong dm_nhom_he_thong_phan_loai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nhom_he_thong
    ADD CONSTRAINT dm_nhom_he_thong_phan_loai_id_fkey FOREIGN KEY (phan_loai_id) REFERENCES public.dm_phan_loai(id) ON DELETE SET NULL;


--
-- Name: dm_noi_cap dm_noi_cap_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_noi_cap
    ADD CONSTRAINT dm_noi_cap_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_noi_cap(id) ON DELETE SET NULL;


--
-- Name: dm_phan_loai dm_phan_loai_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_phan_loai
    ADD CONSTRAINT dm_phan_loai_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_phan_loai(id) ON DELETE SET NULL;


--
-- Name: dm_to_chuc dm_to_chuc_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_to_chuc
    ADD CONSTRAINT dm_to_chuc_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_to_chuc(id) ON DELETE SET NULL;


--
-- Name: dm_to_chuc dm_to_chuc_to_chuc_cha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_to_chuc
    ADD CONSTRAINT dm_to_chuc_to_chuc_cha_id_fkey FOREIGN KEY (to_chuc_cha_id) REFERENCES public.dm_to_chuc(id) ON DELETE SET NULL;


--
-- Name: dm_trang_thai_thiet_bi dm_trang_thai_thiet_bi_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_trang_thai_thiet_bi
    ADD CONSTRAINT dm_trang_thai_thiet_bi_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_trang_thai_thiet_bi(id) ON DELETE SET NULL;


--
-- Name: dm_vi_tri dm_vi_tri_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_vi_tri
    ADD CONSTRAINT dm_vi_tri_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_vi_tri(id) ON DELETE SET NULL;


--
-- Name: dm_vi_tri dm_vi_tri_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_vi_tri
    ADD CONSTRAINT dm_vi_tri_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.dm_vi_tri(id) ON DELETE SET NULL;


--
-- Name: dong_gop_diem dong_gop_diem_change_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dong_gop_diem
    ADD CONSTRAINT dong_gop_diem_change_request_id_fkey FOREIGN KEY (change_request_id) REFERENCES public.change_request(id);


--
-- Name: dong_gop_diem dong_gop_diem_nhiem_vu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dong_gop_diem
    ADD CONSTRAINT dong_gop_diem_nhiem_vu_id_fkey FOREIGN KEY (nhiem_vu_id) REFERENCES public.nhiem_vu_nhap_lieu(id);


--
-- Name: dong_gop_diem dong_gop_diem_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dong_gop_diem
    ADD CONSTRAINT dong_gop_diem_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: dot_bao_duong_audit_log dot_bao_duong_audit_log_dot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_audit_log
    ADD CONSTRAINT dot_bao_duong_audit_log_dot_id_fkey FOREIGN KEY (dot_id) REFERENCES public.dot_bao_duong(id) ON DELETE CASCADE;


--
-- Name: dot_bao_duong_audit_log dot_bao_duong_audit_log_hang_muc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_audit_log
    ADD CONSTRAINT dot_bao_duong_audit_log_hang_muc_id_fkey FOREIGN KEY (hang_muc_id) REFERENCES public.dot_bao_duong_hang_muc(id) ON DELETE CASCADE;


--
-- Name: dot_bao_duong_bien_ban dot_bao_duong_bien_ban_form_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_bien_ban
    ADD CONSTRAINT dot_bao_duong_bien_ban_form_submission_id_fkey FOREIGN KEY (form_submission_id) REFERENCES public.form_submission(id) ON DELETE CASCADE;


--
-- Name: dot_bao_duong_bien_ban dot_bao_duong_bien_ban_hang_muc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_bien_ban
    ADD CONSTRAINT dot_bao_duong_bien_ban_hang_muc_id_fkey FOREIGN KEY (hang_muc_id) REFERENCES public.dot_bao_duong_hang_muc(id) ON DELETE CASCADE;


--
-- Name: dot_bao_duong_han dot_bao_duong_han_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_han
    ADD CONSTRAINT dot_bao_duong_han_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id);


--
-- Name: dot_bao_duong_han dot_bao_duong_han_dot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_han
    ADD CONSTRAINT dot_bao_duong_han_dot_id_fkey FOREIGN KEY (dot_id) REFERENCES public.dot_bao_duong(id) ON DELETE CASCADE;


--
-- Name: dot_bao_duong_hang_muc dot_bao_duong_hang_muc_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_hang_muc
    ADD CONSTRAINT dot_bao_duong_hang_muc_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: dot_bao_duong_hang_muc dot_bao_duong_hang_muc_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_hang_muc
    ADD CONSTRAINT dot_bao_duong_hang_muc_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id);


--
-- Name: dot_bao_duong_hang_muc dot_bao_duong_hang_muc_dot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_hang_muc
    ADD CONSTRAINT dot_bao_duong_hang_muc_dot_id_fkey FOREIGN KEY (dot_id) REFERENCES public.dot_bao_duong(id) ON DELETE CASCADE;


--
-- Name: dot_bao_duong_hang_muc dot_bao_duong_hang_muc_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_hang_muc
    ADD CONSTRAINT dot_bao_duong_hang_muc_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id);


--
-- Name: dot_bao_duong_hang_muc dot_bao_duong_hang_muc_nguoi_thuc_hien_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_hang_muc
    ADD CONSTRAINT dot_bao_duong_hang_muc_nguoi_thuc_hien_fkey FOREIGN KEY (nguoi_thuc_hien) REFERENCES auth.users(id);


--
-- Name: dot_bao_duong_hang_muc dot_bao_duong_hang_muc_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_hang_muc
    ADD CONSTRAINT dot_bao_duong_hang_muc_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id);


--
-- Name: dot_bao_duong dot_bao_duong_nguoi_tao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong
    ADD CONSTRAINT dot_bao_duong_nguoi_tao_fkey FOREIGN KEY (nguoi_tao) REFERENCES auth.users(id);


--
-- Name: dot_bao_duong_su_co dot_bao_duong_su_co_hang_muc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_su_co
    ADD CONSTRAINT dot_bao_duong_su_co_hang_muc_id_fkey FOREIGN KEY (hang_muc_id) REFERENCES public.dot_bao_duong_hang_muc(id) ON DELETE CASCADE;


--
-- Name: dot_bao_duong_su_co dot_bao_duong_su_co_hong_hoc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_su_co
    ADD CONSTRAINT dot_bao_duong_su_co_hong_hoc_id_fkey FOREIGN KEY (hong_hoc_id) REFERENCES public.hong_hoc(id) ON DELETE CASCADE;


--
-- Name: dot_bao_duong_su_co dot_bao_duong_su_co_su_co_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_su_co
    ADD CONSTRAINT dot_bao_duong_su_co_su_co_id_fkey FOREIGN KEY (su_co_id) REFERENCES public.su_co(id) ON DELETE CASCADE;


--
-- Name: dot_bao_duong_tep dot_bao_duong_tep_hang_muc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_tep
    ADD CONSTRAINT dot_bao_duong_tep_hang_muc_id_fkey FOREIGN KEY (hang_muc_id) REFERENCES public.dot_bao_duong_hang_muc(id) ON DELETE CASCADE;


--
-- Name: dot_bao_duong_tep dot_bao_duong_tep_nguoi_up_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dot_bao_duong_tep
    ADD CONSTRAINT dot_bao_duong_tep_nguoi_up_fkey FOREIGN KEY (nguoi_up) REFERENCES auth.users(id);


--
-- Name: du_an_cong_van du_an_cong_van_du_an_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_van
    ADD CONSTRAINT du_an_cong_van_du_an_id_fkey FOREIGN KEY (du_an_id) REFERENCES public.du_an(id) ON DELETE CASCADE;


--
-- Name: du_an_cong_van_lien_ket du_an_cong_van_lien_ket_den_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_van_lien_ket
    ADD CONSTRAINT du_an_cong_van_lien_ket_den_id_fkey FOREIGN KEY (den_id) REFERENCES public.du_an_cong_van(id) ON DELETE CASCADE;


--
-- Name: du_an_cong_van_lien_ket du_an_cong_van_lien_ket_tu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_van_lien_ket
    ADD CONSTRAINT du_an_cong_van_lien_ket_tu_id_fkey FOREIGN KEY (tu_id) REFERENCES public.du_an_cong_van(id) ON DELETE CASCADE;


--
-- Name: du_an_cong_van du_an_cong_van_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_van
    ADD CONSTRAINT du_an_cong_van_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.du_an_cong_van(id) ON DELETE SET NULL;


--
-- Name: du_an_cong_van_tep du_an_cong_van_tep_cong_van_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_van_tep
    ADD CONSTRAINT du_an_cong_van_tep_cong_van_id_fkey FOREIGN KEY (cong_van_id) REFERENCES public.du_an_cong_van(id) ON DELETE CASCADE;


--
-- Name: du_an_cong_viec du_an_cong_viec_du_an_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_viec
    ADD CONSTRAINT du_an_cong_viec_du_an_id_fkey FOREIGN KEY (du_an_id) REFERENCES public.du_an(id) ON DELETE CASCADE;


--
-- Name: du_an_cong_viec du_an_cong_viec_moc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_viec
    ADD CONSTRAINT du_an_cong_viec_moc_id_fkey FOREIGN KEY (moc_id) REFERENCES public.du_an_moc(id) ON DELETE CASCADE;


--
-- Name: du_an_cong_viec_phoi_hop du_an_cong_viec_phoi_hop_cong_viec_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_viec_phoi_hop
    ADD CONSTRAINT du_an_cong_viec_phoi_hop_cong_viec_id_fkey FOREIGN KEY (cong_viec_id) REFERENCES public.du_an_cong_viec(id) ON DELETE CASCADE;


--
-- Name: du_an du_an_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an
    ADD CONSTRAINT du_an_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: du_an_moc du_an_moc_du_an_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_moc
    ADD CONSTRAINT du_an_moc_du_an_id_fkey FOREIGN KEY (du_an_id) REFERENCES public.du_an(id) ON DELETE CASCADE;


--
-- Name: field_set_item field_set_item_field_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.field_set_item
    ADD CONSTRAINT field_set_item_field_set_id_fkey FOREIGN KEY (field_set_id) REFERENCES public.field_set(id) ON DELETE CASCADE;


--
-- Name: form_check_item form_check_item_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_check_item
    ADD CONSTRAINT form_check_item_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.form_section(id) ON DELETE CASCADE;


--
-- Name: form_check_item form_check_item_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_check_item
    ADD CONSTRAINT form_check_item_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_template(id) ON DELETE CASCADE;


--
-- Name: form_field form_field_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_field
    ADD CONSTRAINT form_field_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_template(id) ON DELETE CASCADE;


--
-- Name: form_section form_section_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_section
    ADD CONSTRAINT form_section_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_template(id) ON DELETE CASCADE;


--
-- Name: form_sign_otp form_sign_otp_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_sign_otp
    ADD CONSTRAINT form_sign_otp_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.form_submission(id) ON DELETE CASCADE;


--
-- Name: form_sign_otp form_sign_otp_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_sign_otp
    ADD CONSTRAINT form_sign_otp_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: form_submission form_submission_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission
    ADD CONSTRAINT form_submission_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: form_submission form_submission_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission
    ADD CONSTRAINT form_submission_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id);


--
-- Name: form_submission_item_result form_submission_item_result_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_item_result
    ADD CONSTRAINT form_submission_item_result_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.form_submission(id) ON DELETE CASCADE;


--
-- Name: form_submission_signature form_submission_signature_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_signature
    ADD CONSTRAINT form_submission_signature_key_id_fkey FOREIGN KEY (key_id) REFERENCES public.system_signing_key(id);


--
-- Name: form_submission_signature form_submission_signature_signer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_signature
    ADD CONSTRAINT form_submission_signature_signer_user_id_fkey FOREIGN KEY (signer_user_id) REFERENCES auth.users(id);


--
-- Name: form_submission_signature form_submission_signature_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_signature
    ADD CONSTRAINT form_submission_signature_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.form_submission(id) ON DELETE CASCADE;


--
-- Name: form_submission form_submission_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission
    ADD CONSTRAINT form_submission_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_template(id) ON DELETE RESTRICT;


--
-- Name: form_submission form_submission_template_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission
    ADD CONSTRAINT form_submission_template_version_id_fkey FOREIGN KEY (template_version_id) REFERENCES public.form_template_version(id);


--
-- Name: form_submission form_submission_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission
    ADD CONSTRAINT form_submission_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE SET NULL;


--
-- Name: form_submission_thiet_bi form_submission_thiet_bi_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_thiet_bi
    ADD CONSTRAINT form_submission_thiet_bi_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.form_submission(id) ON DELETE CASCADE;


--
-- Name: form_submission_thiet_bi form_submission_thiet_bi_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_thiet_bi
    ADD CONSTRAINT form_submission_thiet_bi_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: form_template_he_thong form_template_he_thong_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_he_thong
    ADD CONSTRAINT form_template_he_thong_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE CASCADE;


--
-- Name: form_template_he_thong form_template_he_thong_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_he_thong
    ADD CONSTRAINT form_template_he_thong_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_template(id) ON DELETE CASCADE;


--
-- Name: form_template_include form_template_include_child_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_include
    ADD CONSTRAINT form_template_include_child_version_id_fkey FOREIGN KEY (child_version_id) REFERENCES public.form_template_version(id) ON DELETE RESTRICT;


--
-- Name: form_template_include form_template_include_parent_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_include
    ADD CONSTRAINT form_template_include_parent_version_id_fkey FOREIGN KEY (parent_version_id) REFERENCES public.form_template_version(id) ON DELETE CASCADE;


--
-- Name: form_template_version form_template_version_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_version
    ADD CONSTRAINT form_template_version_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_template(id) ON DELETE CASCADE;


--
-- Name: form_submission_item_result fsir_he_thong_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_item_result
    ADD CONSTRAINT fsir_he_thong_fk FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;


--
-- Name: form_submission_item_result fsir_thanh_phan_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_item_result
    ADD CONSTRAINT fsir_thanh_phan_fk FOREIGN KEY (thanh_phan_id) REFERENCES public.he_thong_thanh_phan(id) ON DELETE SET NULL;


--
-- Name: form_submission_item_result fsir_thiet_bi_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_item_result
    ADD CONSTRAINT fsir_thiet_bi_fk FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE SET NULL;


--
-- Name: gan_chuc_nang gan_chuc_nang_hong_hoc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gan_chuc_nang
    ADD CONSTRAINT gan_chuc_nang_hong_hoc_id_fkey FOREIGN KEY (hong_hoc_id) REFERENCES public.hong_hoc(id) ON DELETE SET NULL;


--
-- Name: gan_chuc_nang gan_chuc_nang_thanh_phan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gan_chuc_nang
    ADD CONSTRAINT gan_chuc_nang_thanh_phan_id_fkey FOREIGN KEY (thanh_phan_id) REFERENCES public.he_thong_thanh_phan(id) ON DELETE CASCADE;


--
-- Name: gan_chuc_nang gan_chuc_nang_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gan_chuc_nang
    ADD CONSTRAINT gan_chuc_nang_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE RESTRICT;


--
-- Name: gan_linh_kien gan_linh_kien_hong_hoc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gan_linh_kien
    ADD CONSTRAINT gan_linh_kien_hong_hoc_id_fkey FOREIGN KEY (hong_hoc_id) REFERENCES public.hong_hoc(id) ON DELETE SET NULL;


--
-- Name: gan_linh_kien gan_linh_kien_khe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gan_linh_kien
    ADD CONSTRAINT gan_linh_kien_khe_id_fkey FOREIGN KEY (khe_id) REFERENCES public.thiet_bi_khe_linh_kien(id) ON DELETE CASCADE;


--
-- Name: gan_linh_kien gan_linh_kien_linh_kien_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gan_linh_kien
    ADD CONSTRAINT gan_linh_kien_linh_kien_id_fkey FOREIGN KEY (linh_kien_id) REFERENCES public.thiet_bi(id) ON DELETE RESTRICT;


--
-- Name: giay_phep_khai_thac giay_phep_khai_thac_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giay_phep_khai_thac
    ADD CONSTRAINT giay_phep_khai_thac_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: giay_phep_khai_thac giay_phep_khai_thac_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giay_phep_khai_thac
    ADD CONSTRAINT giay_phep_khai_thac_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;


--
-- Name: giay_phep giay_phep_loai_giay_phep_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giay_phep
    ADD CONSTRAINT giay_phep_loai_giay_phep_id_fkey FOREIGN KEY (loai_giay_phep_id) REFERENCES public.dm_loai_giay_phep(id) ON DELETE SET NULL;


--
-- Name: giay_phep giay_phep_noi_cap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giay_phep
    ADD CONSTRAINT giay_phep_noi_cap_id_fkey FOREIGN KEY (noi_cap_id) REFERENCES public.dm_noi_cap(id) ON DELETE SET NULL;


--
-- Name: giay_phep giay_phep_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giay_phep
    ADD CONSTRAINT giay_phep_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: he_thong_thanh_phan he_thong_thanh_phan_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_thanh_phan
    ADD CONSTRAINT he_thong_thanh_phan_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE CASCADE;


--
-- Name: he_thong_thanh_phan he_thong_thanh_phan_loai_thiet_bi_yeu_cau_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_thanh_phan
    ADD CONSTRAINT he_thong_thanh_phan_loai_thiet_bi_yeu_cau_fkey FOREIGN KEY (loai_thiet_bi_yeu_cau) REFERENCES public.dm_loai_thiet_bi(id) ON DELETE SET NULL;


--
-- Name: he_thong_thanh_phan he_thong_thanh_phan_thanh_phan_cha_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_thanh_phan
    ADD CONSTRAINT he_thong_thanh_phan_thanh_phan_cha_fkey FOREIGN KEY (thanh_phan_cha) REFERENCES public.he_thong_thanh_phan(id) ON DELETE CASCADE;


--
-- Name: he_thong_thanh_phan he_thong_thanh_phan_trang_thai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_thanh_phan
    ADD CONSTRAINT he_thong_thanh_phan_trang_thai_id_fkey FOREIGN KEY (trang_thai_id) REFERENCES public.dm_trang_thai_thiet_bi(id) ON DELETE SET NULL;


--
-- Name: he_thong_thanh_phan he_thong_thanh_phan_vi_tri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_thanh_phan
    ADD CONSTRAINT he_thong_thanh_phan_vi_tri_id_fkey FOREIGN KEY (vi_tri_id) REFERENCES public.dm_vi_tri(id) ON DELETE SET NULL;


--
-- Name: import_item import_item_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_item
    ADD CONSTRAINT import_item_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.import_batch(id) ON DELETE CASCADE;


--
-- Name: kho kho_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho
    ADD CONSTRAINT kho_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: kho_giao_dich kho_giao_dich_kho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho_giao_dich
    ADD CONSTRAINT kho_giao_dich_kho_id_fkey FOREIGN KEY (kho_id) REFERENCES public.kho(id) ON DELETE RESTRICT;


--
-- Name: kho_giao_dich kho_giao_dich_lien_ket_cong_viec_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho_giao_dich
    ADD CONSTRAINT kho_giao_dich_lien_ket_cong_viec_id_fkey FOREIGN KEY (lien_ket_cong_viec_id) REFERENCES public.cong_viec_bao_tri(id) ON DELETE SET NULL;


--
-- Name: kho_giao_dich kho_giao_dich_lien_ket_hong_hoc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho_giao_dich
    ADD CONSTRAINT kho_giao_dich_lien_ket_hong_hoc_id_fkey FOREIGN KEY (lien_ket_hong_hoc_id) REFERENCES public.hong_hoc(id) ON DELETE SET NULL;


--
-- Name: kho_giao_dich kho_giao_dich_lien_ket_su_co_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho_giao_dich
    ADD CONSTRAINT kho_giao_dich_lien_ket_su_co_id_fkey FOREIGN KEY (lien_ket_su_co_id) REFERENCES public.su_co(id) ON DELETE SET NULL;


--
-- Name: kho_giao_dich kho_giao_dich_vat_tu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho_giao_dich
    ADD CONSTRAINT kho_giao_dich_vat_tu_id_fkey FOREIGN KEY (vat_tu_id) REFERENCES public.vat_tu(id) ON DELETE RESTRICT;


--
-- Name: kho kho_vi_tri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho
    ADD CONSTRAINT kho_vi_tri_id_fkey FOREIGN KEY (vi_tri_id) REFERENCES public.dm_vi_tri(id) ON DELETE SET NULL;


--
-- Name: kiem_ke kiem_ke_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kiem_ke
    ADD CONSTRAINT kiem_ke_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: lien_ket_he_thong lien_ket_he_thong_he_thong_dich_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_ket_he_thong
    ADD CONSTRAINT lien_ket_he_thong_he_thong_dich_id_fkey FOREIGN KEY (he_thong_dich_id) REFERENCES public.dm_he_thong(id) ON DELETE CASCADE;


--
-- Name: lien_ket_he_thong lien_ket_he_thong_he_thong_nguon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_ket_he_thong
    ADD CONSTRAINT lien_ket_he_thong_he_thong_nguon_id_fkey FOREIGN KEY (he_thong_nguon_id) REFERENCES public.dm_he_thong(id) ON DELETE CASCADE;


--
-- Name: lien_ket_he_thong lien_ket_he_thong_loai_lien_ket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_ket_he_thong
    ADD CONSTRAINT lien_ket_he_thong_loai_lien_ket_id_fkey FOREIGN KEY (loai_lien_ket_id) REFERENCES public.dm_loai_lien_ket(id) ON DELETE RESTRICT;


--
-- Name: lien_ket_khe lien_ket_khe_khe_dich_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_ket_khe
    ADD CONSTRAINT lien_ket_khe_khe_dich_id_fkey FOREIGN KEY (khe_dich_id) REFERENCES public.he_thong_thanh_phan(id) ON DELETE CASCADE;


--
-- Name: lien_ket_khe lien_ket_khe_khe_nguon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_ket_khe
    ADD CONSTRAINT lien_ket_khe_khe_nguon_id_fkey FOREIGN KEY (khe_nguon_id) REFERENCES public.he_thong_thanh_phan(id) ON DELETE CASCADE;


--
-- Name: lien_ket_khe lien_ket_khe_loai_lien_ket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_ket_khe
    ADD CONSTRAINT lien_ket_khe_loai_lien_ket_id_fkey FOREIGN KEY (loai_lien_ket_id) REFERENCES public.dm_loai_lien_ket(id) ON DELETE RESTRICT;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: model_tai_lieu model_tai_lieu_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_tai_lieu
    ADD CONSTRAINT model_tai_lieu_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.dm_model(id) ON DELETE CASCADE;


--
-- Name: nhiem_vu_nhap_lieu nhiem_vu_nhap_lieu_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhiem_vu_nhap_lieu
    ADD CONSTRAINT nhiem_vu_nhap_lieu_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id);


--
-- Name: nhiem_vu_nhap_lieu nhiem_vu_nhap_lieu_nguoi_nhan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhiem_vu_nhap_lieu
    ADD CONSTRAINT nhiem_vu_nhap_lieu_nguoi_nhan_fkey FOREIGN KEY (nguoi_nhan) REFERENCES auth.users(id);


--
-- Name: phan_mem_ban_quyen_cap_phat phan_mem_ban_quyen_cap_phat_ban_quyen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phan_mem_ban_quyen_cap_phat
    ADD CONSTRAINT phan_mem_ban_quyen_cap_phat_ban_quyen_id_fkey FOREIGN KEY (ban_quyen_id) REFERENCES public.phan_mem_ban_quyen(id) ON DELETE CASCADE;


--
-- Name: phan_mem_ban_quyen_cap_phat phan_mem_ban_quyen_cap_phat_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phan_mem_ban_quyen_cap_phat
    ADD CONSTRAINT phan_mem_ban_quyen_cap_phat_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: phan_mem_ban_quyen phan_mem_ban_quyen_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phan_mem_ban_quyen
    ADD CONSTRAINT phan_mem_ban_quyen_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: phan_mem_ban_quyen phan_mem_ban_quyen_loai_ban_quyen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phan_mem_ban_quyen
    ADD CONSTRAINT phan_mem_ban_quyen_loai_ban_quyen_id_fkey FOREIGN KEY (loai_ban_quyen_id) REFERENCES public.dm_loai_ban_quyen(id) ON DELETE SET NULL;


--
-- Name: phan_mem_ban_quyen phan_mem_ban_quyen_nha_cung_cap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phan_mem_ban_quyen
    ADD CONSTRAINT phan_mem_ban_quyen_nha_cung_cap_id_fkey FOREIGN KEY (nha_cung_cap_id) REFERENCES public.dm_nha_cung_cap(id) ON DELETE SET NULL;


--
-- Name: phan_mem_ban_quyen_tep phan_mem_ban_quyen_tep_ban_quyen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phan_mem_ban_quyen_tep
    ADD CONSTRAINT phan_mem_ban_quyen_tep_ban_quyen_id_fkey FOREIGN KEY (ban_quyen_id) REFERENCES public.phan_mem_ban_quyen(id) ON DELETE CASCADE;


--
-- Name: pm_cong_viec pm_cong_viec_bao_tri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_cong_viec
    ADD CONSTRAINT pm_cong_viec_bao_tri_id_fkey FOREIGN KEY (bao_tri_id) REFERENCES public.bao_tri(id) ON DELETE SET NULL;


--
-- Name: pm_cong_viec pm_cong_viec_chinh_sach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_cong_viec
    ADD CONSTRAINT pm_cong_viec_chinh_sach_id_fkey FOREIGN KEY (chinh_sach_id) REFERENCES public.bao_tri_chinh_sach(id) ON DELETE CASCADE;


--
-- Name: pm_cong_viec pm_cong_viec_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_cong_viec
    ADD CONSTRAINT pm_cong_viec_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: pm_cong_viec pm_cong_viec_nguoi_phu_trach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_cong_viec
    ADD CONSTRAINT pm_cong_viec_nguoi_phu_trach_id_fkey FOREIGN KEY (nguoi_phu_trach_id) REFERENCES public.nhan_vien(id) ON DELETE SET NULL;


--
-- Name: so_do_he_thong so_do_he_thong_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.so_do_he_thong
    ADD CONSTRAINT so_do_he_thong_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: so_do_tep_dinh_kem so_do_tep_dinh_kem_so_do_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.so_do_tep_dinh_kem
    ADD CONSTRAINT so_do_tep_dinh_kem_so_do_id_fkey FOREIGN KEY (so_do_id) REFERENCES public.so_do_he_thong(id) ON DELETE CASCADE;


--
-- Name: supabase_ngoai_job_bang supabase_ngoai_job_bang_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supabase_ngoai_job_bang
    ADD CONSTRAINT supabase_ngoai_job_bang_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.supabase_ngoai_job(id) ON DELETE CASCADE;


--
-- Name: supabase_ngoai_job supabase_ngoai_job_ngoai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supabase_ngoai_job
    ADD CONSTRAINT supabase_ngoai_job_ngoai_id_fkey FOREIGN KEY (ngoai_id) REFERENCES public.supabase_ngoai(id) ON DELETE CASCADE;


--
-- Name: thiet_bi_cap_phat thiet_bi_cap_phat_don_vi_giu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_cap_phat
    ADD CONSTRAINT thiet_bi_cap_phat_don_vi_giu_id_fkey FOREIGN KEY (don_vi_giu_id) REFERENCES public.dm_don_vi(id);


--
-- Name: thiet_bi_cap_phat thiet_bi_cap_phat_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_cap_phat
    ADD CONSTRAINT thiet_bi_cap_phat_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: thiet_bi thiet_bi_danh_gia_nien_han_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_danh_gia_nien_han_id_fkey FOREIGN KEY (danh_gia_nien_han_id) REFERENCES public.dm_danh_gia_nien_han(id) ON DELETE SET NULL;


--
-- Name: thiet_bi_do_dac thiet_bi_do_dac_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_do_dac
    ADD CONSTRAINT thiet_bi_do_dac_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: thiet_bi thiet_bi_don_vi_giu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_don_vi_giu_id_fkey FOREIGN KEY (don_vi_giu_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: thiet_bi thiet_bi_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: thiet_bi thiet_bi_don_vi_quan_ly_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_don_vi_quan_ly_id_fkey FOREIGN KEY (don_vi_quan_ly_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: thiet_bi thiet_bi_field_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_field_set_id_fkey FOREIGN KEY (field_set_id) REFERENCES public.field_set(id) ON DELETE SET NULL;


--
-- Name: thiet_bi thiet_bi_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;


--
-- Name: thiet_bi_he_thong_tuong_thich thiet_bi_he_thong_tuong_thich_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_he_thong_tuong_thich
    ADD CONSTRAINT thiet_bi_he_thong_tuong_thich_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE CASCADE;


--
-- Name: thiet_bi_he_thong_tuong_thich thiet_bi_he_thong_tuong_thich_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_he_thong_tuong_thich
    ADD CONSTRAINT thiet_bi_he_thong_tuong_thich_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: thiet_bi_ket_noi thiet_bi_ket_noi_den_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_ket_noi
    ADD CONSTRAINT thiet_bi_ket_noi_den_thiet_bi_id_fkey FOREIGN KEY (den_thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: thiet_bi_ket_noi thiet_bi_ket_noi_tu_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_ket_noi
    ADD CONSTRAINT thiet_bi_ket_noi_tu_thiet_bi_id_fkey FOREIGN KEY (tu_thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: thiet_bi_khe_linh_kien thiet_bi_khe_linh_kien_khe_cha_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_khe_linh_kien
    ADD CONSTRAINT thiet_bi_khe_linh_kien_khe_cha_fkey FOREIGN KEY (khe_cha) REFERENCES public.thiet_bi_khe_linh_kien(id) ON DELETE CASCADE;


--
-- Name: thiet_bi_khe_linh_kien thiet_bi_khe_linh_kien_loai_thiet_bi_yeu_cau_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_khe_linh_kien
    ADD CONSTRAINT thiet_bi_khe_linh_kien_loai_thiet_bi_yeu_cau_fkey FOREIGN KEY (loai_thiet_bi_yeu_cau) REFERENCES public.dm_loai_thiet_bi(id) ON DELETE SET NULL;


--
-- Name: thiet_bi_khe_linh_kien thiet_bi_khe_linh_kien_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_khe_linh_kien
    ADD CONSTRAINT thiet_bi_khe_linh_kien_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: thiet_bi thiet_bi_loai_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_loai_thiet_bi_id_fkey FOREIGN KEY (loai_thiet_bi_id) REFERENCES public.dm_loai_thiet_bi(id) ON DELETE SET NULL;


--
-- Name: thiet_bi thiet_bi_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.dm_model(id) ON DELETE RESTRICT;


--
-- Name: thiet_bi thiet_bi_nha_cung_cap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_nha_cung_cap_id_fkey FOREIGN KEY (nha_cung_cap_id) REFERENCES public.dm_nha_cung_cap(id) ON DELETE RESTRICT;


--
-- Name: thiet_bi thiet_bi_nha_san_xuat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_nha_san_xuat_id_fkey FOREIGN KEY (nha_san_xuat_id) REFERENCES public.dm_nha_san_xuat(id) ON DELETE RESTRICT;


--
-- Name: thiet_bi thiet_bi_nhom_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_nhom_he_thong_id_fkey FOREIGN KEY (nhom_he_thong_id) REFERENCES public.dm_nhom_he_thong(id) ON DELETE SET NULL;


--
-- Name: thiet_bi thiet_bi_phan_loai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_phan_loai_id_fkey FOREIGN KEY (phan_loai_id) REFERENCES public.dm_phan_loai(id) ON DELETE SET NULL;


--
-- Name: thiet_bi_tep_dinh_kem thiet_bi_tep_dinh_kem_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_tep_dinh_kem
    ADD CONSTRAINT thiet_bi_tep_dinh_kem_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: thiet_bi thiet_bi_trang_thai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_trang_thai_id_fkey FOREIGN KEY (trang_thai_id) REFERENCES public.dm_trang_thai_thiet_bi(id) ON DELETE SET NULL;


--
-- Name: thiet_bi thiet_bi_vi_tri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_vi_tri_id_fkey FOREIGN KEY (vi_tri_id) REFERENCES public.dm_vi_tri(id) ON DELETE SET NULL;


--
-- Name: thiet_bi_vong_doi thiet_bi_vong_doi_den_trang_thai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_vong_doi
    ADD CONSTRAINT thiet_bi_vong_doi_den_trang_thai_id_fkey FOREIGN KEY (den_trang_thai_id) REFERENCES public.dm_trang_thai_thiet_bi(id);


--
-- Name: thiet_bi_vong_doi thiet_bi_vong_doi_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_vong_doi
    ADD CONSTRAINT thiet_bi_vong_doi_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: thiet_bi_vong_doi thiet_bi_vong_doi_tu_trang_thai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_vong_doi
    ADD CONSTRAINT thiet_bi_vong_doi_tu_trang_thai_id_fkey FOREIGN KEY (tu_trang_thai_id) REFERENCES public.dm_trang_thai_thiet_bi(id);


--
-- Name: thong_bao_cau_hinh thong_bao_cau_hinh_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thong_bao_cau_hinh
    ADD CONSTRAINT thong_bao_cau_hinh_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE CASCADE;


--
-- Name: thong_bao thong_bao_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thong_bao
    ADD CONSTRAINT thong_bao_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: thong_bao_email_queue thong_bao_email_queue_thong_bao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thong_bao_email_queue
    ADD CONSTRAINT thong_bao_email_queue_thong_bao_id_fkey FOREIGN KEY (thong_bao_id) REFERENCES public.thong_bao(id) ON DELETE CASCADE;


--
-- Name: ticket_comment ticket_comment_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_comment
    ADD CONSTRAINT ticket_comment_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: tickets tickets_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_su_co_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_su_co_id_fkey FOREIGN KEY (su_co_id) REFERENCES public.su_co(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE SET NULL;


--
-- Name: user_layout_prefs user_layout_prefs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_layout_prefs
    ADD CONSTRAINT user_layout_prefs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_pinned user_pinned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_pinned
    ADD CONSTRAINT user_pinned_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_recent user_recent_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_recent
    ADD CONSTRAINT user_recent_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_scope user_scope_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_scope
    ADD CONSTRAINT user_scope_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE CASCADE;


--
-- Name: user_scope user_scope_to_chuc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_scope
    ADD CONSTRAINT user_scope_to_chuc_id_fkey FOREIGN KEY (to_chuc_id) REFERENCES public.dm_to_chuc(id) ON DELETE CASCADE;


--
-- Name: van_de van_de_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.van_de
    ADD CONSTRAINT van_de_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;


--
-- Name: van_de van_de_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.van_de
    ADD CONSTRAINT van_de_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE SET NULL;


--
-- Name: vat_tu vat_tu_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vat_tu
    ADD CONSTRAINT vat_tu_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: vat_tu vat_tu_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vat_tu
    ADD CONSTRAINT vat_tu_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.dm_model(id) ON DELETE SET NULL;


--
-- Name: vat_tu vat_tu_nha_cung_cap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vat_tu
    ADD CONSTRAINT vat_tu_nha_cung_cap_id_fkey FOREIGN KEY (nha_cung_cap_id) REFERENCES public.dm_nha_cung_cap(id) ON DELETE SET NULL;


--
-- Name: backup_lich_su Admin ghi lịch sử backup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin ghi lịch sử backup" ON public.backup_lich_su FOR INSERT TO authenticated WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: backup_lich_su Admin sửa lịch sử backup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin sửa lịch sử backup" ON public.backup_lich_su FOR UPDATE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: supabase_ngoai_job_bang Admin xem chi tiet phien; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin xem chi tiet phien" ON public.supabase_ngoai_job_bang FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: backup_lich_su Admin xem lịch sử backup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin xem lịch sử backup" ON public.backup_lich_su FOR SELECT TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: luu_tru_health_log Admin xem nhat ky health check; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin xem nhat ky health check" ON public.luu_tru_health_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: supabase_ngoai_job Admin xem phien di chuyen; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin xem phien di chuyen" ON public.supabase_ngoai_job FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: backup_lich_su Admin xoá lịch sử backup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin xoá lịch sử backup" ON public.backup_lich_su FOR DELETE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: thiet_bi_he_thong_tuong_thich Allow authenticated users to manage compatibility; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to manage compatibility" ON public.thiet_bi_he_thong_tuong_thich TO authenticated USING (true) WITH CHECK (true);


--
-- Name: thiet_bi_he_thong_tuong_thich Allow authenticated users to read compatibility; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to read compatibility" ON public.thiet_bi_he_thong_tuong_thich FOR SELECT TO authenticated USING (true);


--
-- Name: cay_node_edit Managers can delete node edits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can delete node edits" ON public.cay_node_edit FOR DELETE TO authenticated USING (public.can_manage_equipment(public.current_uid()));


--
-- Name: cay_node_edit Managers can insert node edits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can insert node edits" ON public.cay_node_edit FOR INSERT TO authenticated WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: cay_node_edit Managers can update node edits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can update node edits" ON public.cay_node_edit FOR UPDATE TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: thiet_bi_cap_phat Quản lý thiết bị ghi lịch sử cấp phát; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Quản lý thiết bị ghi lịch sử cấp phát" ON public.thiet_bi_cap_phat FOR INSERT TO authenticated WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: thiet_bi_cap_phat Quản trị sửa lịch sử cấp phát; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Quản trị sửa lịch sử cấp phát" ON public.thiet_bi_cap_phat FOR UPDATE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: thiet_bi_cap_phat Quản trị xoá lịch sử cấp phát; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Quản trị xoá lịch sử cấp phát" ON public.thiet_bi_cap_phat FOR DELETE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: webauthn_credentials Users can delete their own passkeys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own passkeys" ON public.webauthn_credentials FOR DELETE TO authenticated USING ((public.current_uid() = user_id));


--
-- Name: nhiem_vu_nhap_lieu Users can see their assigned tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can see their assigned tasks" ON public.nhiem_vu_nhap_lieu FOR SELECT TO authenticated USING (((nguoi_nhan = auth.uid()) OR (nguoi_nhan IS NULL)));


--
-- Name: dong_gop_diem Users can see their scores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can see their scores" ON public.dong_gop_diem FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: nhiem_vu_nhap_lieu Users can update their assigned tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their assigned tasks" ON public.nhiem_vu_nhap_lieu FOR UPDATE TO authenticated USING ((nguoi_nhan = auth.uid()));


--
-- Name: webauthn_credentials Users can view their own passkeys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own passkeys" ON public.webauthn_credentials FOR SELECT TO authenticated USING ((public.current_uid() = user_id));


--
-- Name: bang_cot_tuy_chinh Users manage their own column prefs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage their own column prefs" ON public.bang_cot_tuy_chinh TO authenticated USING ((public.current_uid() = user_id)) WITH CHECK ((public.current_uid() = user_id));


--
-- Name: thiet_bi_cap_phat Xem lịch sử cấp phát theo phạm vi thiết bị; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Xem lịch sử cấp phát theo phạm vi thiết bị" ON public.thiet_bi_cap_phat FOR SELECT TO authenticated USING (public.can_view_thiet_bi(thiet_bi_id, public.current_uid()));


--
-- Name: access_request; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.access_request ENABLE ROW LEVEL SECURITY;

--
-- Name: field_set admin manage field_set; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admin manage field_set" ON public.field_set TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: field_set_item admin manage field_set_item; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admin manage field_set_item" ON public.field_set_item TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: he_thong_truong admin manage he_thong_truong; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admin manage he_thong_truong" ON public.he_thong_truong TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: cay_thay_doi admin update cay_thay_doi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admin update cay_thay_doi" ON public.cay_thay_doi FOR UPDATE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: auth_event_log ae_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ae_read ON public.auth_event_log FOR SELECT TO authenticated USING (((user_id = public.current_uid()) OR (target_user_id = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: ai_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_config ai_config_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_config_admin_all ON public.ai_config TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: ai_conversation; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_conversation ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_conversation ai_conversation_owner_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_conversation_owner_all ON public.ai_conversation TO authenticated USING (((public.current_uid() = user_id) OR public.has_role(public.current_uid(), 'admin'::public.app_role))) WITH CHECK ((public.current_uid() = user_id));


--
-- Name: ai_message; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_message ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_message ai_message_owner_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_message_owner_all ON public.ai_message TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.ai_conversation c
  WHERE ((c.id = ai_message.conversation_id) AND ((c.user_id = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.ai_conversation c
  WHERE ((c.id = ai_message.conversation_id) AND (c.user_id = public.current_uid())))));


--
-- Name: anomaly_alert an_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY an_admin_update ON public.anomaly_alert FOR UPDATE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: anomaly_alert an_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY an_read ON public.anomaly_alert FOR SELECT TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: bao_cao_annotation annotation_delete_owner_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY annotation_delete_owner_or_admin ON public.bao_cao_annotation FOR DELETE TO authenticated USING (((tao_boi = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role)));


--
-- Name: bao_cao_annotation annotation_insert_kt_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY annotation_insert_kt_admin ON public.bao_cao_annotation FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role)));


--
-- Name: bao_cao_annotation annotation_select_scoped; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY annotation_select_scoped ON public.bao_cao_annotation FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (tao_boi = auth.uid()) OR ((he_thong_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.thiet_bi tb
  WHERE ((tb.he_thong_id = bao_cao_annotation.he_thong_id) AND public.can_view_thiet_bi(tb.id, public.current_uid()))
 LIMIT 1))))));


--
-- Name: bao_cao_annotation annotation_update_owner_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY annotation_update_owner_or_admin ON public.bao_cao_annotation FOR UPDATE TO authenticated USING (((tao_boi = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role))) WITH CHECK (((tao_boi = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role)));


--
-- Name: anomaly_alert; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.anomaly_alert ENABLE ROW LEVEL SECURITY;

--
-- Name: app_cai_dat; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_cai_dat ENABLE ROW LEVEL SECURITY;

--
-- Name: app_cai_dat app_cai_dat_admin_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY app_cai_dat_admin_delete ON public.app_cai_dat FOR DELETE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: app_cai_dat app_cai_dat_admin_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY app_cai_dat_admin_insert ON public.app_cai_dat FOR INSERT TO authenticated WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: app_cai_dat app_cai_dat_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY app_cai_dat_admin_update ON public.app_cai_dat FOR UPDATE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: app_cai_dat app_cai_dat_read_mgr; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY app_cai_dat_read_mgr ON public.app_cai_dat FOR SELECT TO authenticated USING (public.can_manage_equipment(public.current_uid()));


--
-- Name: access_request ar_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ar_admin_update ON public.access_request FOR UPDATE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: access_request ar_owner_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ar_owner_insert ON public.access_request FOR INSERT TO authenticated WITH CHECK ((user_id = public.current_uid()));


--
-- Name: access_request ar_owner_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ar_owner_read ON public.access_request FOR SELECT TO authenticated USING (((user_id = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: audit_log audit_admin_kt_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_admin_kt_select_all ON public.audit_log FOR SELECT TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log audit_self_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_self_select ON public.audit_log FOR SELECT TO authenticated USING ((user_id = public.current_uid()));


--
-- Name: audit_log audit_system_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_system_insert ON public.audit_log FOR INSERT TO authenticated WITH CHECK (((user_id IS NULL) OR (user_id = public.current_uid())));


--
-- Name: auth_event_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.auth_event_log ENABLE ROW LEVEL SECURITY;

--
-- Name: backup_lich_su; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.backup_lich_su ENABLE ROW LEVEL SECURITY;

--
-- Name: ban_giao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ban_giao ENABLE ROW LEVEL SECURITY;

--
-- Name: ban_giao ban_giao_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ban_giao_select ON public.ban_giao FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((thiet_bi_id IS NOT NULL) AND public.can_view_thiet_bi(thiet_bi_id, public.current_uid())))));


--
-- Name: ban_giao ban_giao_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ban_giao_write ON public.ban_giao TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role))) WITH CHECK ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: bang_cot_tuy_chinh; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bang_cot_tuy_chinh ENABLE ROW LEVEL SECURITY;

--
-- Name: bao_cao_annotation; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bao_cao_annotation ENABLE ROW LEVEL SECURITY;

--
-- Name: bao_tri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bao_tri ENABLE ROW LEVEL SECURITY;

--
-- Name: bao_tri_chinh_sach; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bao_tri_chinh_sach ENABLE ROW LEVEL SECURITY;

--
-- Name: bao_tri_chinh_sach bao_tri_chinh_sach_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bao_tri_chinh_sach_select ON public.bao_tri_chinh_sach FOR SELECT USING (public.is_active_user(public.current_uid()));


--
-- Name: bao_tri_chinh_sach bao_tri_chinh_sach_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bao_tri_chinh_sach_write ON public.bao_tri_chinh_sach USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: bao_tri bao_tri_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bao_tri_select ON public.bao_tri FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((thiet_bi_id IS NOT NULL) AND public.can_view_thiet_bi(thiet_bi_id, public.current_uid())))));


--
-- Name: bao_tri bao_tri_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bao_tri_write ON public.bao_tri TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role))) WITH CHECK ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: canh_bao_het_han_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.canh_bao_het_han_log ENABLE ROW LEVEL SECURITY;

--
-- Name: canh_bao_het_han_log canh_bao_log_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY canh_bao_log_read ON public.canh_bao_het_han_log FOR SELECT TO authenticated USING (public.can_manage_equipment(public.current_uid()));


--
-- Name: cay_node_edit; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cay_node_edit ENABLE ROW LEVEL SECURITY;

--
-- Name: cay_node_edit cay_node_edit_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cay_node_edit_select ON public.cay_node_edit FOR SELECT TO authenticated USING ((public.can_manage_equipment(public.current_uid()) OR (created_by = public.current_uid())));


--
-- Name: cay_thay_doi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cay_thay_doi ENABLE ROW LEVEL SECURITY;

--
-- Name: change_request; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.change_request ENABLE ROW LEVEL SECURITY;

--
-- Name: chung_chi_thiet_bi chung_chi_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chung_chi_read ON public.chung_chi_thiet_bi FOR SELECT TO authenticated USING ((public.can_manage_equipment(public.current_uid()) OR (EXISTS ( SELECT 1
   FROM public.thiet_bi tb
  WHERE ((tb.id = chung_chi_thiet_bi.thiet_bi_id) AND (NOT (tb.don_vi_quan_ly_id IS DISTINCT FROM public.get_user_don_vi_id(public.current_uid()))))))));


--
-- Name: chung_chi_thiet_bi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chung_chi_thiet_bi ENABLE ROW LEVEL SECURITY;

--
-- Name: chung_chi_thiet_bi chung_chi_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chung_chi_write ON public.chung_chi_thiet_bi TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: cong_viec_bao_tri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cong_viec_bao_tri ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations conv_insert_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY conv_insert_self ON public.conversations FOR INSERT TO authenticated WITH CHECK ((created_by = public.current_uid()));


--
-- Name: conversations conv_select_participant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY conv_select_participant ON public.conversations FOR SELECT TO authenticated USING (((created_by = public.current_uid()) OR public.is_conv_participant(id, public.current_uid())));


--
-- Name: conversations conv_update_creator; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY conv_update_creator ON public.conversations FOR UPDATE TO authenticated USING (((created_by = public.current_uid()) OR public.is_conv_participant(id, public.current_uid())));


--
-- Name: conversation_participant; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversation_participant ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: conversation_participant cp_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cp_delete_own ON public.conversation_participant FOR DELETE TO authenticated USING ((user_id = public.current_uid()));


--
-- Name: conversation_participant cp_insert_self_or_creator; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cp_insert_self_or_creator ON public.conversation_participant FOR INSERT TO authenticated WITH CHECK (((user_id = public.current_uid()) OR (EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.id = conversation_participant.conversation_id) AND (c.created_by = public.current_uid()))))));


--
-- Name: conversation_participant cp_select_own_convs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cp_select_own_convs ON public.conversation_participant FOR SELECT TO authenticated USING (((user_id = public.current_uid()) OR public.is_conv_participant(conversation_id, public.current_uid())));


--
-- Name: conversation_participant cp_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cp_update_own ON public.conversation_participant FOR UPDATE TO authenticated USING ((user_id = public.current_uid()));


--
-- Name: change_request cr_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cr_insert ON public.change_request FOR INSERT TO authenticated WITH CHECK (((nguoi_tao = auth.uid()) AND (trang_thai = 'pending'::public.change_request_status) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role))));


--
-- Name: change_request cr_no_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cr_no_delete ON public.change_request FOR DELETE TO authenticated USING (false);


--
-- Name: change_request cr_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cr_select ON public.change_request FOR SELECT TO authenticated USING (((nguoi_tao = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role)));


--
-- Name: change_request cr_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cr_update ON public.change_request FOR UPDATE TO authenticated USING (((public.has_role(auth.uid(), 'admin'::public.app_role) AND (nguoi_tao <> auth.uid())) OR ((nguoi_tao = auth.uid()) AND (trang_thai = 'pending'::public.change_request_status)))) WITH CHECK (((public.has_role(auth.uid(), 'admin'::public.app_role) AND (nguoi_tao <> auth.uid())) OR ((nguoi_tao = auth.uid()) AND (trang_thai = ANY (ARRAY['pending'::public.change_request_status, 'cancelled'::public.change_request_status])))));


--
-- Name: du_an_cong_viec cv_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cv_delete ON public.du_an_cong_viec FOR DELETE TO authenticated USING ((public.can_manage_du_an(du_an_id, public.current_uid()) OR (created_by = public.current_uid())));


--
-- Name: du_an_cong_viec cv_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cv_insert ON public.du_an_cong_viec FOR INSERT TO authenticated WITH CHECK ((public.can_manage_du_an(du_an_id, public.current_uid()) OR public.has_role(public.current_uid(), 'to_truong'::public.app_role) OR public.has_role(public.current_uid(), 'quan_ly_du_an'::public.app_role)));


--
-- Name: du_an_cong_viec cv_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cv_select ON public.du_an_cong_viec FOR SELECT TO authenticated USING (public.can_access_du_an(du_an_id, public.current_uid()));


--
-- Name: du_an_cong_viec cv_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cv_update ON public.du_an_cong_viec FOR UPDATE TO authenticated USING (public.can_edit_cong_viec(id, public.current_uid())) WITH CHECK (public.can_edit_cong_viec(id, public.current_uid()));


--
-- Name: cong_viec_bao_tri cvbt_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cvbt_select ON public.cong_viec_bao_tri FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((thiet_bi_id IS NOT NULL) AND public.can_view_thiet_bi(thiet_bi_id, public.current_uid())) OR ((don_vi_id_snapshot IS NOT NULL) AND (don_vi_id_snapshot = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: cong_viec_bao_tri cvbt_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cvbt_write ON public.cong_viec_bao_tri TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: du_an_cong_van dacv_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dacv_select ON public.du_an_cong_van FOR SELECT TO authenticated USING (public.can_access_du_an(du_an_id, public.current_uid()));


--
-- Name: du_an_cong_van dacv_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dacv_write ON public.du_an_cong_van TO authenticated USING (public.can_manage_du_an(du_an_id, public.current_uid())) WITH CHECK (public.can_manage_du_an(du_an_id, public.current_uid()));


--
-- Name: du_an_cong_van_lien_ket dacvlk_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dacvlk_select ON public.du_an_cong_van_lien_ket FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.du_an_cong_van cv
  WHERE ((cv.id = du_an_cong_van_lien_ket.tu_id) AND public.can_access_du_an(cv.du_an_id, public.current_uid())))));


--
-- Name: du_an_cong_van_lien_ket dacvlk_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dacvlk_write ON public.du_an_cong_van_lien_ket TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.du_an_cong_van cv
  WHERE ((cv.id = du_an_cong_van_lien_ket.tu_id) AND public.can_manage_du_an(cv.du_an_id, public.current_uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.du_an_cong_van cv
  WHERE ((cv.id = du_an_cong_van_lien_ket.tu_id) AND public.can_manage_du_an(cv.du_an_id, public.current_uid())))));


--
-- Name: du_an_cong_van_tep dacvt_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dacvt_select ON public.du_an_cong_van_tep FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.du_an_cong_van cv
  WHERE ((cv.id = du_an_cong_van_tep.cong_van_id) AND public.can_access_du_an(cv.du_an_id, public.current_uid())))));


--
-- Name: du_an_cong_van_tep dacvt_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dacvt_write ON public.du_an_cong_van_tep TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.du_an_cong_van cv
  WHERE ((cv.id = du_an_cong_van_tep.cong_van_id) AND public.can_manage_du_an(cv.du_an_id, public.current_uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.du_an_cong_van cv
  WHERE ((cv.id = du_an_cong_van_tep.cong_van_id) AND public.can_manage_du_an(cv.du_an_id, public.current_uid())))));


--
-- Name: dot_bao_duong_audit_log dbd_audit_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dbd_audit_insert ON public.dot_bao_duong_audit_log FOR INSERT TO authenticated WITH CHECK (((actor = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.dot_bao_duong_hang_muc h
  WHERE ((h.id = dot_bao_duong_audit_log.hang_muc_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR (h.don_vi_id = public.get_user_don_vi_id(auth.uid())) OR (dot_bao_duong_audit_log.don_vi_id = public.get_user_don_vi_id(auth.uid()))))))));


--
-- Name: dot_bao_duong_audit_log dbd_audit_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dbd_audit_select ON public.dot_bao_duong_audit_log FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR (don_vi_id = public.get_user_don_vi_id(auth.uid()))));


--
-- Name: dot_bao_duong_bien_ban dbd_bb_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dbd_bb_all ON public.dot_bao_duong_bien_ban TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.dot_bao_duong_hang_muc h
  WHERE ((h.id = dot_bao_duong_bien_ban.hang_muc_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR (h.don_vi_id = public.get_user_don_vi_id(auth.uid()))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.dot_bao_duong_hang_muc h
  WHERE ((h.id = dot_bao_duong_bien_ban.hang_muc_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR (h.don_vi_id = public.get_user_don_vi_id(auth.uid())))))));


--
-- Name: dot_bao_duong_han dbd_han_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dbd_han_read ON public.dot_bao_duong_han FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role)));


--
-- Name: dot_bao_duong_han dbd_han_write_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dbd_han_write_kt ON public.dot_bao_duong_han TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role)));


--
-- Name: dot_bao_duong_hang_muc dbd_hm_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dbd_hm_read ON public.dot_bao_duong_hang_muc FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR (don_vi_id = public.get_user_don_vi_id(auth.uid()))));


--
-- Name: dot_bao_duong_hang_muc dbd_hm_write_dv; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dbd_hm_write_dv ON public.dot_bao_duong_hang_muc TO authenticated USING (((don_vi_id = public.get_user_don_vi_id(auth.uid())) AND (duyet_trang_thai <> 'da_duyet'::text) AND (EXISTS ( SELECT 1
   FROM public.dot_bao_duong d
  WHERE ((d.id = dot_bao_duong_hang_muc.dot_id) AND (d.trang_thai <> ALL (ARRAY['dong'::public.dot_bao_duong_trang_thai, 'huy'::public.dot_bao_duong_trang_thai]))))))) WITH CHECK (((don_vi_id = public.get_user_don_vi_id(auth.uid())) AND (duyet_trang_thai <> 'da_duyet'::text) AND (EXISTS ( SELECT 1
   FROM public.dot_bao_duong d
  WHERE ((d.id = dot_bao_duong_hang_muc.dot_id) AND (d.trang_thai <> ALL (ARRAY['dong'::public.dot_bao_duong_trang_thai, 'huy'::public.dot_bao_duong_trang_thai])))))));


--
-- Name: dot_bao_duong_hang_muc dbd_hm_write_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dbd_hm_write_kt ON public.dot_bao_duong_hang_muc TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role)));


--
-- Name: dot_bao_duong dbd_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dbd_read ON public.dot_bao_duong FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR (EXISTS ( SELECT 1
   FROM public.dot_bao_duong_hang_muc h
  WHERE ((h.dot_id = dot_bao_duong.id) AND (h.don_vi_id = public.get_user_don_vi_id(auth.uid())))))));


--
-- Name: dot_bao_duong_su_co dbd_sc_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dbd_sc_all ON public.dot_bao_duong_su_co TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.dot_bao_duong_hang_muc h
  WHERE ((h.id = dot_bao_duong_su_co.hang_muc_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR (h.don_vi_id = public.get_user_don_vi_id(auth.uid()))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.dot_bao_duong_hang_muc h
  WHERE ((h.id = dot_bao_duong_su_co.hang_muc_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR (h.don_vi_id = public.get_user_don_vi_id(auth.uid())))))));


--
-- Name: dot_bao_duong_tep dbd_tep_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dbd_tep_all ON public.dot_bao_duong_tep TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.dot_bao_duong_hang_muc h
  WHERE ((h.id = dot_bao_duong_tep.hang_muc_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR (h.don_vi_id = public.get_user_don_vi_id(auth.uid()))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.dot_bao_duong_hang_muc h
  WHERE ((h.id = dot_bao_duong_tep.hang_muc_id) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR (h.don_vi_id = public.get_user_don_vi_id(auth.uid())))))));


--
-- Name: dinh_nghia_truong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dinh_nghia_truong ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_dac_tinh; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_dac_tinh ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_dac_tinh dm_dac_tinh_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dm_dac_tinh_read_active ON public.dm_dac_tinh FOR SELECT USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_dac_tinh dm_dac_tinh_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dm_dac_tinh_write_manager ON public.dm_dac_tinh USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_danh_gia_nien_han; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_danh_gia_nien_han ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_don_vi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_don_vi ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_he_thong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_he_thong ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_he_thong dm_he_thong_read_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dm_he_thong_read_scope ON public.dm_he_thong FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (don_vi_id IS NULL) OR (don_vi_id = public.get_user_don_vi_id(public.current_uid())))));


--
-- Name: dm_loai_ban_quyen; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_loai_ban_quyen ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_loai_ban_quyen dm_loai_ban_quyen_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dm_loai_ban_quyen_read ON public.dm_loai_ban_quyen FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_loai_ban_quyen dm_loai_ban_quyen_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dm_loai_ban_quyen_write ON public.dm_loai_ban_quyen TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_loai_giay_phep; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_loai_giay_phep ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_loai_lien_ket; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_loai_lien_ket ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_loai_thiet_bi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_loai_thiet_bi ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_model; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_model ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_model_dac_tinh; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_model_dac_tinh ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_model_dac_tinh dm_model_dac_tinh_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dm_model_dac_tinh_read_active ON public.dm_model_dac_tinh FOR SELECT USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_model_dac_tinh dm_model_dac_tinh_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dm_model_dac_tinh_write_manager ON public.dm_model_dac_tinh USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_nha_cung_cap; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_nha_cung_cap ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_nha_san_xuat; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_nha_san_xuat ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_nhom_he_thong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_nhom_he_thong ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_noi_cap; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_noi_cap ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_phan_loai; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_phan_loai ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_to_chuc; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_to_chuc ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_trang_thai_thiet_bi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_trang_thai_thiet_bi ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_vi_tri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_vi_tri ENABLE ROW LEVEL SECURITY;

--
-- Name: dinh_nghia_truong dnt_read_mgr; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dnt_read_mgr ON public.dinh_nghia_truong FOR SELECT TO authenticated USING (public.can_manage_equipment(public.current_uid()));


--
-- Name: dinh_nghia_truong dnt_write_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dnt_write_admin ON public.dinh_nghia_truong TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: dong_gop_diem; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dong_gop_diem ENABLE ROW LEVEL SECURITY;

--
-- Name: dot_bao_duong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dot_bao_duong ENABLE ROW LEVEL SECURITY;

--
-- Name: dot_bao_duong_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dot_bao_duong_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: dot_bao_duong_bien_ban; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dot_bao_duong_bien_ban ENABLE ROW LEVEL SECURITY;

--
-- Name: dot_bao_duong_han; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dot_bao_duong_han ENABLE ROW LEVEL SECURITY;

--
-- Name: dot_bao_duong_hang_muc; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dot_bao_duong_hang_muc ENABLE ROW LEVEL SECURITY;

--
-- Name: dot_bao_duong_su_co; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dot_bao_duong_su_co ENABLE ROW LEVEL SECURITY;

--
-- Name: dot_bao_duong_tep; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dot_bao_duong_tep ENABLE ROW LEVEL SECURITY;

--
-- Name: dot_bao_duong dot_bd_write_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dot_bd_write_kt ON public.dot_bao_duong TO authenticated USING (((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role)) AND ((trang_thai <> 'dong'::public.dot_bao_duong_trang_thai) OR public.has_role(auth.uid(), 'admin'::public.app_role)))) WITH CHECK (((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role)) AND ((trang_thai <> 'dong'::public.dot_bao_duong_trang_thai) OR public.has_role(auth.uid(), 'admin'::public.app_role))));


--
-- Name: du_an; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.du_an ENABLE ROW LEVEL SECURITY;

--
-- Name: du_an_cong_van; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.du_an_cong_van ENABLE ROW LEVEL SECURITY;

--
-- Name: du_an_cong_van_lien_ket; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.du_an_cong_van_lien_ket ENABLE ROW LEVEL SECURITY;

--
-- Name: du_an_cong_van_tep; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.du_an_cong_van_tep ENABLE ROW LEVEL SECURITY;

--
-- Name: du_an_cong_viec; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.du_an_cong_viec ENABLE ROW LEVEL SECURITY;

--
-- Name: du_an_cong_viec_phoi_hop; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.du_an_cong_viec_phoi_hop ENABLE ROW LEVEL SECURITY;

--
-- Name: du_an du_an_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY du_an_delete ON public.du_an FOR DELETE TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR (nguoi_tao_id = public.current_uid())));


--
-- Name: du_an du_an_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY du_an_insert ON public.du_an FOR INSERT TO authenticated WITH CHECK (((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'quan_ly_du_an'::public.app_role)) AND (nguoi_tao_id = public.current_uid())));


--
-- Name: du_an_moc; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.du_an_moc ENABLE ROW LEVEL SECURITY;

--
-- Name: du_an du_an_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY du_an_select ON public.du_an FOR SELECT TO authenticated USING (public.can_access_du_an(id, public.current_uid()));


--
-- Name: du_an du_an_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY du_an_update ON public.du_an FOR UPDATE TO authenticated USING (public.can_manage_du_an(id, public.current_uid())) WITH CHECK (public.can_manage_du_an(id, public.current_uid()));


--
-- Name: feature_usage_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feature_usage_log ENABLE ROW LEVEL SECURITY;

--
-- Name: field_set; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.field_set ENABLE ROW LEVEL SECURITY;

--
-- Name: field_set_item; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.field_set_item ENABLE ROW LEVEL SECURITY;

--
-- Name: form_check_item; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_check_item ENABLE ROW LEVEL SECURITY;

--
-- Name: form_check_item form_check_item_manage_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_check_item_manage_kt ON public.form_check_item TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: form_check_item form_check_item_select_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_check_item_select_active ON public.form_check_item FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: form_field; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_field ENABLE ROW LEVEL SECURITY;

--
-- Name: form_field form_field_manage_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_field_manage_kt ON public.form_field TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: form_field form_field_select_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_field_select_active ON public.form_field FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: form_section; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_section ENABLE ROW LEVEL SECURITY;

--
-- Name: form_section form_section_manage_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_section_manage_kt ON public.form_section TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: form_section form_section_select_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_section_select_active ON public.form_section FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: form_sign_otp; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_sign_otp ENABLE ROW LEVEL SECURITY;

--
-- Name: form_submission_thiet_bi form_sub_tb_select_by_parent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_sub_tb_select_by_parent ON public.form_submission_thiet_bi FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.form_submission s
  WHERE ((s.id = form_submission_thiet_bi.submission_id) AND public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (s.created_by = public.current_uid()) OR ((s.status <> 'draft'::public.form_submission_status) AND (s.don_vi_id IS NOT NULL) AND (s.don_vi_id = public.get_user_don_vi_id(public.current_uid()))))))));


--
-- Name: form_submission_thiet_bi form_sub_tb_write_by_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_sub_tb_write_by_owner ON public.form_submission_thiet_bi TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.form_submission s
  WHERE ((s.id = form_submission_thiet_bi.submission_id) AND (((s.created_by = public.current_uid()) AND (s.status = ANY (ARRAY['draft'::public.form_submission_status, 'returned'::public.form_submission_status]))) OR public.can_manage_equipment(public.current_uid())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.form_submission s
  WHERE ((s.id = form_submission_thiet_bi.submission_id) AND (((s.created_by = public.current_uid()) AND (s.status = ANY (ARRAY['draft'::public.form_submission_status, 'submitted'::public.form_submission_status, 'returned'::public.form_submission_status]))) OR public.can_manage_equipment(public.current_uid()))))));


--
-- Name: form_submission; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_submission ENABLE ROW LEVEL SECURITY;

--
-- Name: form_submission form_submission_delete_own_draft; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_submission_delete_own_draft ON public.form_submission FOR DELETE TO authenticated USING ((((created_by = public.current_uid()) AND (status = 'draft'::public.form_submission_status)) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: form_submission form_submission_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_submission_insert_own ON public.form_submission FOR INSERT TO authenticated WITH CHECK ((public.is_active_user(public.current_uid()) AND (created_by = public.current_uid())));


--
-- Name: form_submission_item_result; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_submission_item_result ENABLE ROW LEVEL SECURITY;

--
-- Name: form_submission form_submission_select_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_submission_select_scope ON public.form_submission FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (created_by = public.current_uid()) OR ((status <> 'draft'::public.form_submission_status) AND (don_vi_id IS NOT NULL) AND (don_vi_id = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: form_submission_signature; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_submission_signature ENABLE ROW LEVEL SECURITY;

--
-- Name: form_submission_thiet_bi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_submission_thiet_bi ENABLE ROW LEVEL SECURITY;

--
-- Name: form_submission form_submission_update_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_submission_update_kt ON public.form_submission FOR UPDATE TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: form_submission form_submission_update_own_draft; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_submission_update_own_draft ON public.form_submission FOR UPDATE TO authenticated USING (((created_by = public.current_uid()) AND (status = ANY (ARRAY['draft'::public.form_submission_status, 'returned'::public.form_submission_status])))) WITH CHECK (((created_by = public.current_uid()) AND (status = ANY (ARRAY['draft'::public.form_submission_status, 'submitted'::public.form_submission_status, 'returned'::public.form_submission_status]))));


--
-- Name: form_template; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_template ENABLE ROW LEVEL SECURITY;

--
-- Name: form_template_he_thong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_template_he_thong ENABLE ROW LEVEL SECURITY;

--
-- Name: form_template_include; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_template_include ENABLE ROW LEVEL SECURITY;

--
-- Name: form_template form_template_manage_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_template_manage_kt ON public.form_template TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: form_template form_template_select_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_template_select_active ON public.form_template FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: form_template_version; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_template_version ENABLE ROW LEVEL SECURITY;

--
-- Name: form_template_he_thong form_tpl_ht_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_tpl_ht_manage ON public.form_template_he_thong USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: form_template_he_thong form_tpl_ht_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_tpl_ht_select ON public.form_template_he_thong FOR SELECT USING (public.is_active_user(public.current_uid()));


--
-- Name: form_submission_item_result fsir_select_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fsir_select_scope ON public.form_submission_item_result FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.form_submission s
  WHERE ((s.id = form_submission_item_result.submission_id) AND public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (s.created_by = public.current_uid()) OR ((s.status <> 'draft'::public.form_submission_status) AND (s.don_vi_id IS NOT NULL) AND (s.don_vi_id = public.get_user_don_vi_id(public.current_uid()))))))));


--
-- Name: form_submission_item_result fsir_write_owner_or_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fsir_write_owner_or_kt ON public.form_submission_item_result TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.form_submission s
  WHERE ((s.id = form_submission_item_result.submission_id) AND (public.can_manage_equipment(public.current_uid()) OR ((s.created_by = public.current_uid()) AND (s.status = ANY (ARRAY['draft'::public.form_submission_status, 'submitted'::public.form_submission_status, 'returned'::public.form_submission_status])))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.form_submission s
  WHERE ((s.id = form_submission_item_result.submission_id) AND (public.can_manage_equipment(public.current_uid()) OR ((s.created_by = public.current_uid()) AND (s.status = ANY (ARRAY['draft'::public.form_submission_status, 'submitted'::public.form_submission_status, 'returned'::public.form_submission_status]))))))));


--
-- Name: form_submission_signature fss_read_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fss_read_scope ON public.form_submission_signature FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.form_submission s
  WHERE ((s.id = form_submission_signature.submission_id) AND public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (s.created_by = public.current_uid()) OR ((s.status <> 'draft'::public.form_submission_status) AND (s.don_vi_id IS NOT NULL) AND (s.don_vi_id = public.get_user_don_vi_id(public.current_uid()))))))));


--
-- Name: form_submission_signature fss_write_service_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fss_write_service_only ON public.form_submission_signature FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: form_template_include ftinc_manage_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ftinc_manage_kt ON public.form_template_include TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: form_template_include ftinc_select_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ftinc_select_active ON public.form_template_include FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: form_template_version ftv_manage_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ftv_manage_kt ON public.form_template_version TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: form_template_version ftv_select_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ftv_select_active ON public.form_template_version FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: feature_usage_log fu_owner_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fu_owner_read ON public.feature_usage_log FOR SELECT TO authenticated USING (((user_id = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: gan_chuc_nang; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gan_chuc_nang ENABLE ROW LEVEL SECURITY;

--
-- Name: gan_linh_kien; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gan_linh_kien ENABLE ROW LEVEL SECURITY;

--
-- Name: gan_chuc_nang gcn_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY gcn_select ON public.gan_chuc_nang FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(thiet_bi_id, public.current_uid()) OR ((don_vi_id_snapshot IS NOT NULL) AND (don_vi_id_snapshot = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: gan_chuc_nang gcn_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY gcn_write_manager ON public.gan_chuc_nang TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: giay_phep; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.giay_phep ENABLE ROW LEVEL SECURITY;

--
-- Name: giay_phep_khai_thac; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.giay_phep_khai_thac ENABLE ROW LEVEL SECURITY;

--
-- Name: giay_phep giay_phep_read_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY giay_phep_read_scope ON public.giay_phep FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (EXISTS ( SELECT 1
   FROM public.thiet_bi tb
  WHERE ((tb.id = giay_phep.thiet_bi_id) AND (NOT (tb.don_vi_quan_ly_id IS DISTINCT FROM public.get_user_don_vi_id(public.current_uid())))))))));


--
-- Name: giay_phep giay_phep_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY giay_phep_write_manager ON public.giay_phep TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: gan_linh_kien glk_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY glk_select ON public.gan_linh_kien FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(linh_kien_id, public.current_uid()) OR ((don_vi_id_snapshot IS NOT NULL) AND (don_vi_id_snapshot = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: gan_linh_kien glk_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY glk_write_manager ON public.gan_linh_kien USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: giay_phep_khai_thac gpkt_read_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY gpkt_read_scope ON public.giay_phep_khai_thac FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (he_thong_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.dm_he_thong h
  WHERE ((h.id = giay_phep_khai_thac.he_thong_id) AND ((h.don_vi_id IS NULL) OR (h.don_vi_id = public.get_user_don_vi_id(public.current_uid())))))))));


--
-- Name: giay_phep_khai_thac gpkt_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY gpkt_write_manager ON public.giay_phep_khai_thac TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: he_thong_thanh_phan; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.he_thong_thanh_phan ENABLE ROW LEVEL SECURITY;

--
-- Name: he_thong_truong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.he_thong_truong ENABLE ROW LEVEL SECURITY;

--
-- Name: hong_hoc; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hong_hoc ENABLE ROW LEVEL SECURITY;

--
-- Name: hong_hoc hong_hoc_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hong_hoc_select ON public.hong_hoc FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((thiet_bi_hong_id IS NOT NULL) AND public.can_view_thiet_bi(thiet_bi_hong_id, public.current_uid())))));


--
-- Name: hong_hoc hong_hoc_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hong_hoc_write ON public.hong_hoc TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role))) WITH CHECK ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: he_thong_thanh_phan htp_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY htp_select ON public.he_thong_thanh_phan FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((don_vi_id_snapshot IS NOT NULL) AND (don_vi_id_snapshot = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: he_thong_thanh_phan htp_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY htp_write_manager ON public.he_thong_thanh_phan USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: import_alias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.import_alias ENABLE ROW LEVEL SECURITY;

--
-- Name: import_alias import_alias_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_alias_delete ON public.import_alias FOR DELETE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: import_alias import_alias_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_alias_insert ON public.import_alias FOR INSERT TO authenticated WITH CHECK ((public.has_role(public.current_uid(), 'admin'::public.app_role) AND (confirmed_by = public.current_uid())));


--
-- Name: import_alias import_alias_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_alias_select ON public.import_alias FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: import_alias import_alias_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_alias_update ON public.import_alias FOR UPDATE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: import_batch; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.import_batch ENABLE ROW LEVEL SECURITY;

--
-- Name: import_batch import_batch_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_batch_delete ON public.import_batch FOR DELETE TO authenticated USING (((created_by = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: import_batch import_batch_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_batch_insert ON public.import_batch FOR INSERT TO authenticated WITH CHECK ((public.has_role(public.current_uid(), 'admin'::public.app_role) AND (created_by = public.current_uid())));


--
-- Name: import_batch import_batch_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_batch_select ON public.import_batch FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND ((created_by = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role))));


--
-- Name: import_batch import_batch_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_batch_update ON public.import_batch FOR UPDATE TO authenticated USING (((created_by = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role))) WITH CHECK (((created_by = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: import_item; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.import_item ENABLE ROW LEVEL SECURITY;

--
-- Name: import_item import_item_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_item_select ON public.import_item FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND public.can_view_import_batch(batch_id, public.current_uid())));


--
-- Name: import_item import_item_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_item_write ON public.import_item TO authenticated USING (public.can_view_import_batch(batch_id, public.current_uid())) WITH CHECK (public.can_view_import_batch(batch_id, public.current_uid()));


--
-- Name: cay_thay_doi insert cay_thay_doi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "insert cay_thay_doi" ON public.cay_thay_doi FOR INSERT TO authenticated WITH CHECK ((public.can_manage_equipment(public.current_uid()) AND (nguoi_tao = public.current_uid())));


--
-- Name: kho_giao_dich kgd_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kgd_insert ON public.kho_giao_dich FOR INSERT TO authenticated WITH CHECK ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (don_vi_id = public.get_user_don_vi_id(public.current_uid())))));


--
-- Name: kho_giao_dich kgd_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kgd_select ON public.kho_giao_dich FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (don_vi_id IS NULL) OR (don_vi_id = public.get_user_don_vi_id(public.current_uid())))));


--
-- Name: thiet_bi_khe_linh_kien khe_lk_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY khe_lk_select ON public.thiet_bi_khe_linh_kien FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(thiet_bi_id, public.current_uid()))));


--
-- Name: thiet_bi_khe_linh_kien khe_lk_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY khe_lk_write_manager ON public.thiet_bi_khe_linh_kien USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: kho; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kho ENABLE ROW LEVEL SECURITY;

--
-- Name: kho_giao_dich; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kho_giao_dich ENABLE ROW LEVEL SECURITY;

--
-- Name: kho kho_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kho_select ON public.kho FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (don_vi_id IS NULL) OR (don_vi_id = public.get_user_don_vi_id(public.current_uid())))));


--
-- Name: kho kho_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kho_write ON public.kho USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: kiem_ke; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kiem_ke ENABLE ROW LEVEL SECURITY;

--
-- Name: kiem_ke kiem_ke_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kiem_ke_select ON public.kiem_ke FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(thiet_bi_id, public.current_uid()))));


--
-- Name: kiem_ke kiem_ke_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kiem_ke_write ON public.kiem_ke TO authenticated USING ((public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(thiet_bi_id, public.current_uid()))) WITH CHECK ((public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(thiet_bi_id, public.current_uid())));


--
-- Name: lien_ket_he_thong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lien_ket_he_thong ENABLE ROW LEVEL SECURITY;

--
-- Name: lien_ket_khe; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lien_ket_khe ENABLE ROW LEVEL SECURITY;

--
-- Name: lien_ket_he_thong lkht_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lkht_select ON public.lien_ket_he_thong FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((don_vi_id_snapshot IS NOT NULL) AND (don_vi_id_snapshot = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: lien_ket_he_thong lkht_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lkht_write_manager ON public.lien_ket_he_thong TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: lien_ket_khe lkk_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lkk_select ON public.lien_ket_khe FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((don_vi_id_snapshot IS NOT NULL) AND (don_vi_id_snapshot = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: lien_ket_khe lkk_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lkk_write_manager ON public.lien_ket_khe TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_loai_lien_ket llk_lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY llk_lookup_read_active ON public.dm_loai_lien_ket FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_loai_lien_ket llk_lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY llk_lookup_write_manager ON public.dm_loai_lien_ket TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_don_vi lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_don_vi FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_loai_giay_phep lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_loai_giay_phep FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_loai_thiet_bi lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_loai_thiet_bi FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_model lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_model FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_nha_cung_cap lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_nha_cung_cap FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_nha_san_xuat lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_nha_san_xuat FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_nhom_he_thong lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_nhom_he_thong FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_noi_cap lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_noi_cap FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_phan_loai lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_phan_loai FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_trang_thai_thiet_bi lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_trang_thai_thiet_bi FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_vi_tri lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_vi_tri FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_don_vi lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_don_vi TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_he_thong lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_he_thong TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_loai_giay_phep lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_loai_giay_phep TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_loai_thiet_bi lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_loai_thiet_bi TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_model lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_model TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_nha_cung_cap lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_nha_cung_cap TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_nha_san_xuat lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_nha_san_xuat TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_nhom_he_thong lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_nhom_he_thong TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_noi_cap lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_noi_cap TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_phan_loai lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_phan_loai TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_trang_thai_thiet_bi lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_trang_thai_thiet_bi TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_vi_tri lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_vi_tri TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: luu_tru_health_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.luu_tru_health_log ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: du_an_moc moc_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY moc_delete ON public.du_an_moc FOR DELETE TO authenticated USING (public.can_manage_du_an(du_an_id, public.current_uid()));


--
-- Name: du_an_moc moc_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY moc_insert ON public.du_an_moc FOR INSERT TO authenticated WITH CHECK (public.can_manage_du_an(du_an_id, public.current_uid()));


--
-- Name: du_an_moc moc_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY moc_select ON public.du_an_moc FOR SELECT TO authenticated USING (public.can_access_du_an(du_an_id, public.current_uid()));


--
-- Name: du_an_moc moc_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY moc_update ON public.du_an_moc FOR UPDATE TO authenticated USING (public.can_manage_du_an(du_an_id, public.current_uid())) WITH CHECK (public.can_manage_du_an(du_an_id, public.current_uid()));


--
-- Name: model_tai_lieu; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.model_tai_lieu ENABLE ROW LEVEL SECURITY;

--
-- Name: model_tai_lieu model_tai_lieu quan ly; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "model_tai_lieu quan ly" ON public.model_tai_lieu TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role))) WITH CHECK ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: model_tai_lieu model_tai_lieu_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY model_tai_lieu_select ON public.model_tai_lieu FOR SELECT TO authenticated USING (public.can_manage_equipment(public.current_uid()));


--
-- Name: messages msg_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY msg_delete_own ON public.messages FOR DELETE TO authenticated USING ((sender_id = public.current_uid()));


--
-- Name: messages msg_insert_participant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY msg_insert_participant ON public.messages FOR INSERT TO authenticated WITH CHECK (((sender_id = public.current_uid()) AND public.is_conv_participant(conversation_id, public.current_uid())));


--
-- Name: messages msg_select_participant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY msg_select_participant ON public.messages FOR SELECT TO authenticated USING (public.is_conv_participant(conversation_id, public.current_uid()));


--
-- Name: dm_danh_gia_nien_han nh_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nh_read_active ON public.dm_danh_gia_nien_han FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_danh_gia_nien_han nh_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nh_write_manager ON public.dm_danh_gia_nien_han TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: nhan_vien; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nhan_vien ENABLE ROW LEVEL SECURITY;

--
-- Name: nhan_vien nhan_vien write admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "nhan_vien write admin" ON public.nhan_vien TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role))) WITH CHECK ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: nhan_vien nhan_vien_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nhan_vien_select ON public.nhan_vien FOR SELECT TO authenticated USING (public.can_manage_equipment(public.current_uid()));


--
-- Name: nhiem_vu_nhap_lieu; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nhiem_vu_nhap_lieu ENABLE ROW LEVEL SECURITY;

--
-- Name: node_note; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.node_note ENABLE ROW LEVEL SECURITY;

--
-- Name: node_note node_note_delete_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY node_note_delete_admin ON public.node_note FOR DELETE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: node_note node_note_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY node_note_insert_auth ON public.node_note FOR INSERT TO authenticated WITH CHECK (((public.current_uid() IS NOT NULL) AND (updated_by = public.current_uid())));


--
-- Name: node_note node_note_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY node_note_select ON public.node_note FOR SELECT TO authenticated USING (public.can_manage_equipment(public.current_uid()));


--
-- Name: node_note node_note_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY node_note_update_auth ON public.node_note FOR UPDATE TO authenticated USING ((public.can_manage_equipment(public.current_uid()) OR (updated_by = public.current_uid()))) WITH CHECK ((updated_by = public.current_uid()));


--
-- Name: notifications notif_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notif_delete_own ON public.notifications FOR DELETE TO authenticated USING ((user_id = public.current_uid()));


--
-- Name: notifications notif_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notif_select_own ON public.notifications FOR SELECT TO authenticated USING ((user_id = public.current_uid()));


--
-- Name: notifications notif_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notif_update_own ON public.notifications FOR UPDATE TO authenticated USING ((user_id = public.current_uid()));


--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: form_sign_otp otp_own_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY otp_own_insert ON public.form_sign_otp FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: form_sign_otp otp_own_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY otp_own_select ON public.form_sign_otp FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: form_sign_otp otp_own_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY otp_own_update ON public.form_sign_otp FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_pinned own pinned delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own pinned delete" ON public.user_pinned FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_pinned own pinned insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own pinned insert" ON public.user_pinned FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_pinned own pinned select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own pinned select" ON public.user_pinned FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_pinned own pinned update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own pinned update" ON public.user_pinned FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_layout_prefs own prefs delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own prefs delete" ON public.user_layout_prefs FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_layout_prefs own prefs insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own prefs insert" ON public.user_layout_prefs FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_layout_prefs own prefs select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own prefs select" ON public.user_layout_prefs FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_layout_prefs own prefs update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own prefs update" ON public.user_layout_prefs FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_recent own recent delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own recent delete" ON public.user_recent FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_recent own recent insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own recent insert" ON public.user_recent FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_recent own recent select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own recent select" ON public.user_recent FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_recent own recent update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own recent update" ON public.user_recent FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: phan_mem_ban_quyen; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.phan_mem_ban_quyen ENABLE ROW LEVEL SECURITY;

--
-- Name: phan_mem_ban_quyen_cap_phat; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.phan_mem_ban_quyen_cap_phat ENABLE ROW LEVEL SECURITY;

--
-- Name: phan_mem_ban_quyen_tep; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.phan_mem_ban_quyen_tep ENABLE ROW LEVEL SECURITY;

--
-- Name: du_an_cong_viec_phoi_hop phoi_hop_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY phoi_hop_delete ON public.du_an_cong_viec_phoi_hop FOR DELETE TO authenticated USING (public.can_edit_cong_viec(cong_viec_id, public.current_uid()));


--
-- Name: du_an_cong_viec_phoi_hop phoi_hop_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY phoi_hop_insert ON public.du_an_cong_viec_phoi_hop FOR INSERT TO authenticated WITH CHECK (public.can_edit_cong_viec(cong_viec_id, public.current_uid()));


--
-- Name: du_an_cong_viec_phoi_hop phoi_hop_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY phoi_hop_select ON public.du_an_cong_viec_phoi_hop FOR SELECT TO authenticated USING (((user_id = public.current_uid()) OR (EXISTS ( SELECT 1
   FROM public.du_an_cong_viec c
  WHERE ((c.id = du_an_cong_viec_phoi_hop.cong_viec_id) AND public.can_access_du_an(c.du_an_id, public.current_uid()))))));


--
-- Name: pm_cong_viec; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pm_cong_viec ENABLE ROW LEVEL SECURITY;

--
-- Name: pm_cong_viec pm_cv_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pm_cv_select ON public.pm_cong_viec FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR (don_vi_id IN ( SELECT user_scope.don_vi_id
   FROM public.user_scope
  WHERE (user_scope.user_id = auth.uid())))));


--
-- Name: pm_cong_viec pm_cv_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pm_cv_update ON public.pm_cong_viec FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR (don_vi_id IN ( SELECT user_scope.don_vi_id
   FROM public.user_scope
  WHERE (user_scope.user_id = auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR (don_vi_id IN ( SELECT user_scope.don_vi_id
   FROM public.user_scope
  WHERE (user_scope.user_id = auth.uid())))));


--
-- Name: phan_mem_ban_quyen_cap_phat pmbq_cp_read_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pmbq_cp_read_scope ON public.phan_mem_ban_quyen_cap_phat FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (EXISTS ( SELECT 1
   FROM public.phan_mem_ban_quyen bq
  WHERE ((bq.id = phan_mem_ban_quyen_cap_phat.ban_quyen_id) AND (public.can_manage_equipment(public.current_uid()) OR ((bq.don_vi_id IS NOT NULL) AND (bq.don_vi_id = public.get_user_don_vi_id(public.current_uid())))))))));


--
-- Name: phan_mem_ban_quyen_cap_phat pmbq_cp_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pmbq_cp_write_manager ON public.phan_mem_ban_quyen_cap_phat TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: phan_mem_ban_quyen pmbq_read_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pmbq_read_scope ON public.phan_mem_ban_quyen FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((don_vi_id IS NOT NULL) AND (don_vi_id = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: phan_mem_ban_quyen_tep pmbq_tep_read_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pmbq_tep_read_scope ON public.phan_mem_ban_quyen_tep FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (EXISTS ( SELECT 1
   FROM public.phan_mem_ban_quyen bq
  WHERE ((bq.id = phan_mem_ban_quyen_tep.ban_quyen_id) AND (public.can_manage_equipment(public.current_uid()) OR (bq.don_vi_id IS NULL) OR (bq.don_vi_id = public.get_user_don_vi_id(public.current_uid()))))))));


--
-- Name: phan_mem_ban_quyen_tep pmbq_tep_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pmbq_tep_write_manager ON public.phan_mem_ban_quyen_tep TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: phan_mem_ban_quyen pmbq_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pmbq_write_manager ON public.phan_mem_ban_quyen TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_admin_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_admin_select_all ON public.profiles FOR SELECT TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: profiles profiles_admin_update_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_admin_update_all ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: profiles profiles_self_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_self_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK ((id = public.current_uid()));


--
-- Name: profiles profiles_self_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_self_select ON public.profiles FOR SELECT TO authenticated USING ((id = public.current_uid()));


--
-- Name: profiles profiles_self_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE USING ((id = public.current_uid())) WITH CHECK ((id = public.current_uid()));


--
-- Name: r2_access_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.r2_access_log ENABLE ROW LEVEL SECURITY;

--
-- Name: r2_cau_hinh; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.r2_cau_hinh ENABLE ROW LEVEL SECURITY;

--
-- Name: r2_cau_hinh r2_cau_hinh_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY r2_cau_hinh_admin_all ON public.r2_cau_hinh TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: r2_file; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.r2_file ENABLE ROW LEVEL SECURITY;

--
-- Name: r2_file r2_file_owner_del; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY r2_file_owner_del ON public.r2_file FOR DELETE TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: r2_file r2_file_owner_ins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY r2_file_owner_ins ON public.r2_file FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: r2_file r2_file_owner_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY r2_file_owner_select ON public.r2_file FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: r2_file r2_file_owner_upd; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY r2_file_owner_upd ON public.r2_file FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: r2_access_log r2_log_admin_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY r2_log_admin_select ON public.r2_access_log FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: cay_thay_doi read cay_thay_doi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "read cay_thay_doi" ON public.cay_thay_doi FOR SELECT TO authenticated USING ((public.can_manage_equipment(public.current_uid()) OR (nguoi_tao = public.current_uid())));


--
-- Name: field_set read field_set; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "read field_set" ON public.field_set FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: field_set_item read field_set_item; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "read field_set_item" ON public.field_set_item FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: he_thong_truong read he_thong_truong; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "read he_thong_truong" ON public.he_thong_truong FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: role_permission role_perm_admin_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY role_perm_admin_write ON public.role_permission TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: role_permission role_perm_read_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY role_perm_read_admin ON public.role_permission FOR SELECT TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: role_permission; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_permission ENABLE ROW LEVEL SECURITY;

--
-- Name: search_index; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.search_index ENABLE ROW LEVEL SECURITY;

--
-- Name: search_index search_index_read_mgr; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY search_index_read_mgr ON public.search_index FOR SELECT TO authenticated USING (public.can_manage_equipment(public.current_uid()));


--
-- Name: supabase_ngoai service role only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service role only" ON public.supabase_ngoai TO service_role USING (true) WITH CHECK (true);


--
-- Name: system_signing_key signing_key_service_role_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY signing_key_service_role_only ON public.system_signing_key USING (false) WITH CHECK (false);


--
-- Name: so_do_he_thong so_do_delete_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY so_do_delete_scope ON public.so_do_he_thong FOR DELETE TO authenticated USING ((public.can_manage_equipment(public.current_uid()) OR (created_by = public.current_uid()) OR ((don_vi_ma IS NOT NULL) AND (don_vi_ma = public.get_user_don_vi_ma(public.current_uid())))));


--
-- Name: so_do_he_thong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.so_do_he_thong ENABLE ROW LEVEL SECURITY;

--
-- Name: so_do_he_thong so_do_insert_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY so_do_insert_scope ON public.so_do_he_thong FOR INSERT TO authenticated WITH CHECK ((public.is_active_user(public.current_uid()) AND (created_by = public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((don_vi_ma IS NOT NULL) AND (don_vi_ma = public.get_user_don_vi_ma(public.current_uid()))))));


--
-- Name: so_do_he_thong so_do_read_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY so_do_read_scope ON public.so_do_he_thong FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (created_by = public.current_uid()) OR ((don_vi_ma IS NOT NULL) AND (don_vi_ma = public.get_user_don_vi_ma(public.current_uid()))))));


--
-- Name: so_do_tep_dinh_kem so_do_tep_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY so_do_tep_delete ON public.so_do_tep_dinh_kem FOR DELETE TO authenticated USING ((public.can_access_so_do(so_do_id, public.current_uid()) AND ((created_by = public.current_uid()) OR public.can_manage_equipment(public.current_uid()))));


--
-- Name: so_do_tep_dinh_kem; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.so_do_tep_dinh_kem ENABLE ROW LEVEL SECURITY;

--
-- Name: so_do_tep_dinh_kem so_do_tep_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY so_do_tep_insert ON public.so_do_tep_dinh_kem FOR INSERT TO authenticated WITH CHECK (((created_by = public.current_uid()) AND public.can_access_so_do(so_do_id, public.current_uid())));


--
-- Name: so_do_tep_dinh_kem so_do_tep_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY so_do_tep_read ON public.so_do_tep_dinh_kem FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND public.can_access_so_do(so_do_id, public.current_uid())));


--
-- Name: so_do_thu_vien_hinh; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.so_do_thu_vien_hinh ENABLE ROW LEVEL SECURITY;

--
-- Name: so_do_he_thong so_do_update_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY so_do_update_scope ON public.so_do_he_thong FOR UPDATE TO authenticated USING ((public.can_manage_equipment(public.current_uid()) OR (created_by = public.current_uid()) OR ((don_vi_ma IS NOT NULL) AND (don_vi_ma = public.get_user_don_vi_ma(public.current_uid()))))) WITH CHECK ((public.can_manage_equipment(public.current_uid()) OR (created_by = public.current_uid()) OR ((don_vi_ma IS NOT NULL) AND (don_vi_ma = public.get_user_don_vi_ma(public.current_uid())))));


--
-- Name: su_co; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.su_co ENABLE ROW LEVEL SECURITY;

--
-- Name: su_co_lich_su; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.su_co_lich_su ENABLE ROW LEVEL SECURITY;

--
-- Name: su_co_lich_su su_co_lich_su_no_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY su_co_lich_su_no_write ON public.su_co_lich_su TO authenticated USING (false) WITH CHECK (false);


--
-- Name: su_co_lich_su su_co_lich_su_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY su_co_lich_su_select ON public.su_co_lich_su FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((doi_tuong_bang = 'su_co'::text) AND (EXISTS ( SELECT 1
   FROM public.su_co s
  WHERE ((s.id = su_co_lich_su.doi_tuong_id) AND (s.thiet_bi_id IS NOT NULL) AND public.can_view_thiet_bi(s.thiet_bi_id, public.current_uid()))))) OR ((doi_tuong_bang = 'hong_hoc'::text) AND (EXISTS ( SELECT 1
   FROM public.hong_hoc h
  WHERE ((h.id = su_co_lich_su.doi_tuong_id) AND (h.thiet_bi_hong_id IS NOT NULL) AND public.can_view_thiet_bi(h.thiet_bi_hong_id, public.current_uid()))))))));


--
-- Name: su_co su_co_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY su_co_select ON public.su_co FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((thiet_bi_id IS NOT NULL) AND public.can_view_thiet_bi(thiet_bi_id, public.current_uid())))));


--
-- Name: su_co su_co_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY su_co_write ON public.su_co TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role))) WITH CHECK ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: supabase_ngoai; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supabase_ngoai ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_ngoai_job; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supabase_ngoai_job ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_ngoai_job_bang; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supabase_ngoai_job_bang ENABLE ROW LEVEL SECURITY;

--
-- Name: system_signing_key; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_signing_key ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi_ket_noi tbkn_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tbkn_insert ON public.thiet_bi_ket_noi FOR INSERT WITH CHECK ((public.is_active_user(public.current_uid()) AND public.can_view_thiet_bi(tu_thiet_bi_id, public.current_uid()) AND public.can_view_thiet_bi(den_thiet_bi_id, public.current_uid())));


--
-- Name: thiet_bi_ket_noi tbkn_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tbkn_select ON public.thiet_bi_ket_noi FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(tu_thiet_bi_id, public.current_uid()) OR public.can_view_thiet_bi(den_thiet_bi_id, public.current_uid()) OR ((don_vi_id_snapshot IS NOT NULL) AND (don_vi_id_snapshot = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: thiet_bi_ket_noi tbkn_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tbkn_write_manager ON public.thiet_bi_ket_noi USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: ticket_comment tc_delete_own_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tc_delete_own_or_admin ON public.ticket_comment FOR DELETE TO authenticated USING (((user_id = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: ticket_comment tc_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tc_insert ON public.ticket_comment FOR INSERT TO authenticated WITH CHECK (((user_id = public.current_uid()) AND public.can_access_ticket(ticket_id, public.current_uid())));


--
-- Name: ticket_comment tc_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tc_select ON public.ticket_comment FOR SELECT TO authenticated USING (public.can_access_ticket(ticket_id, public.current_uid()));


--
-- Name: telegram_da_gui tele_dagui_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tele_dagui_select_admin ON public.telegram_da_gui FOR SELECT TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: telegram_subscriber tele_sub_delete_own_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tele_sub_delete_own_or_admin ON public.telegram_subscriber FOR DELETE TO authenticated USING (((public.current_uid() = user_id) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: telegram_subscriber tele_sub_insert_self_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tele_sub_insert_self_or_admin ON public.telegram_subscriber FOR INSERT TO authenticated WITH CHECK (((public.current_uid() = user_id) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: telegram_subscriber tele_sub_select_own_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tele_sub_select_own_or_admin ON public.telegram_subscriber FOR SELECT TO authenticated USING (((public.current_uid() = user_id) OR (public.current_uid() = created_by) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: telegram_subscriber tele_sub_update_own_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tele_sub_update_own_or_admin ON public.telegram_subscriber FOR UPDATE TO authenticated USING (((public.current_uid() = user_id) OR public.has_role(public.current_uid(), 'admin'::public.app_role))) WITH CHECK (((public.current_uid() = user_id) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: telegram_da_gui; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.telegram_da_gui ENABLE ROW LEVEL SECURITY;

--
-- Name: telegram_subscriber; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.telegram_subscriber ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi_tep_dinh_kem tep_select_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tep_select_scope ON public.thiet_bi_tep_dinh_kem FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (EXISTS ( SELECT 1
   FROM public.thiet_bi tb
  WHERE ((tb.id = thiet_bi_tep_dinh_kem.thiet_bi_id) AND (NOT (tb.don_vi_quan_ly_id IS DISTINCT FROM public.get_user_don_vi_id(public.current_uid())))))))));


--
-- Name: thiet_bi_tep_dinh_kem tep_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tep_write_manager ON public.thiet_bi_tep_dinh_kem TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: thiet_bi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thiet_bi ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi_cap_phat; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thiet_bi_cap_phat ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi_do_dac; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thiet_bi_do_dac ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi_do_dac thiet_bi_do_dac_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thiet_bi_do_dac_select ON public.thiet_bi_do_dac FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(thiet_bi_id, public.current_uid()))));


--
-- Name: thiet_bi_do_dac thiet_bi_do_dac_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thiet_bi_do_dac_write ON public.thiet_bi_do_dac USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: thiet_bi_he_thong_tuong_thich; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thiet_bi_he_thong_tuong_thich ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi_ket_noi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thiet_bi_ket_noi ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi_khe_linh_kien; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thiet_bi_khe_linh_kien ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi thiet_bi_read_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thiet_bi_read_scope ON public.thiet_bi FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (don_vi_quan_ly_id = public.get_user_don_vi_id(public.current_uid())) OR (don_vi_id = public.get_user_don_vi_id(public.current_uid())))));


--
-- Name: thiet_bi_tep_dinh_kem; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thiet_bi_tep_dinh_kem ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi_vong_doi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thiet_bi_vong_doi ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi_vong_doi thiet_bi_vong_doi_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thiet_bi_vong_doi_select ON public.thiet_bi_vong_doi FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(thiet_bi_id, public.current_uid()))));


--
-- Name: thiet_bi_vong_doi thiet_bi_vong_doi_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thiet_bi_vong_doi_write ON public.thiet_bi_vong_doi USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: thiet_bi thiet_bi_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thiet_bi_write_manager ON public.thiet_bi TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: thong_bao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thong_bao ENABLE ROW LEVEL SECURITY;

--
-- Name: thong_bao_cau_hinh; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thong_bao_cau_hinh ENABLE ROW LEVEL SECURITY;

--
-- Name: thong_bao_cau_hinh thong_bao_cau_hinh_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thong_bao_cau_hinh_read ON public.thong_bao_cau_hinh FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR (don_vi_id = public.get_user_don_vi_id(auth.uid())) OR (don_vi_id IS NULL)));


--
-- Name: thong_bao_cau_hinh thong_bao_cau_hinh_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thong_bao_cau_hinh_write ON public.thong_bao_cau_hinh TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: thong_bao_email_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thong_bao_email_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: thong_bao_email_queue thong_bao_email_queue_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thong_bao_email_queue_admin ON public.thong_bao_email_queue FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: thong_bao thong_bao_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thong_bao_select ON public.thong_bao FOR SELECT TO authenticated USING (((nguoi_nhan = auth.uid()) OR ((nguoi_nhan IS NULL) AND (don_vi_id IN ( SELECT user_scope.don_vi_id
   FROM public.user_scope
  WHERE (user_scope.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: thong_bao thong_bao_update_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thong_bao_update_read ON public.thong_bao FOR UPDATE TO authenticated USING (((nguoi_nhan = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR ((nguoi_nhan IS NULL) AND (don_vi_id IN ( SELECT user_scope.don_vi_id
   FROM public.user_scope
  WHERE (user_scope.user_id = auth.uid())))))) WITH CHECK (((nguoi_nhan = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR ((nguoi_nhan IS NULL) AND (don_vi_id IN ( SELECT user_scope.don_vi_id
   FROM public.user_scope
  WHERE (user_scope.user_id = auth.uid()))))));


--
-- Name: so_do_thu_vien_hinh thu_vien_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thu_vien_delete ON public.so_do_thu_vien_hinh FOR DELETE TO authenticated USING (((created_by = public.current_uid()) OR public.can_manage_equipment(public.current_uid())));


--
-- Name: so_do_thu_vien_hinh thu_vien_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thu_vien_insert ON public.so_do_thu_vien_hinh FOR INSERT TO authenticated WITH CHECK ((public.is_active_user(public.current_uid()) AND (created_by = public.current_uid())));


--
-- Name: so_do_thu_vien_hinh thu_vien_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thu_vien_read ON public.so_do_thu_vien_hinh FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: ticket_comment; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ticket_comment ENABLE ROW LEVEL SECURITY;

--
-- Name: tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: tickets tickets_delete_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tickets_delete_admin ON public.tickets FOR DELETE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: tickets tickets_insert_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tickets_insert_self ON public.tickets FOR INSERT TO authenticated WITH CHECK ((created_by = public.current_uid()));


--
-- Name: tickets tickets_select_own_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tickets_select_own_or_admin ON public.tickets FOR SELECT TO authenticated USING (((created_by = public.current_uid()) OR (assigned_to = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: tickets tickets_update_own_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tickets_update_own_or_admin ON public.tickets FOR UPDATE TO authenticated USING (((created_by = public.current_uid()) OR (assigned_to = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: dm_to_chuc to_chuc_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY to_chuc_read_active ON public.dm_to_chuc FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_to_chuc to_chuc_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY to_chuc_write_manager ON public.dm_to_chuc TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: user_layout_prefs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_layout_prefs ENABLE ROW LEVEL SECURITY;

--
-- Name: user_pinned; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_pinned ENABLE ROW LEVEL SECURITY;

--
-- Name: user_recent; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_recent ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles user_roles_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_roles_admin_all ON public.user_roles TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: user_roles user_roles_admin_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_roles_admin_select_all ON public.user_roles FOR SELECT TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: user_roles user_roles_self_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_roles_self_select ON public.user_roles FOR SELECT TO authenticated USING ((user_id = public.current_uid()));


--
-- Name: user_scope; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_scope ENABLE ROW LEVEL SECURITY;

--
-- Name: user_scope user_scope_admin_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_scope_admin_write ON public.user_scope TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: user_scope user_scope_self_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_scope_self_read ON public.user_scope FOR SELECT TO authenticated USING (((user_id = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: van_de; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.van_de ENABLE ROW LEVEL SECURITY;

--
-- Name: van_de van_de_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY van_de_select ON public.van_de FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((thiet_bi_id IS NOT NULL) AND public.can_view_thiet_bi(thiet_bi_id, public.current_uid())) OR ((don_vi_id_snapshot IS NOT NULL) AND (don_vi_id_snapshot = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: van_de van_de_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY van_de_write ON public.van_de TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: vat_tu; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vat_tu ENABLE ROW LEVEL SECURITY;

--
-- Name: vat_tu vat_tu_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vat_tu_select ON public.vat_tu FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (don_vi_id IS NULL) OR (don_vi_id = public.get_user_don_vi_id(public.current_uid())))));


--
-- Name: vat_tu vat_tu_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vat_tu_write ON public.vat_tu USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: vi_tri_media; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vi_tri_media ENABLE ROW LEVEL SECURITY;

--
-- Name: vi_tri_media vi_tri_media_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vi_tri_media_delete ON public.vi_tri_media FOR DELETE TO authenticated USING (((created_by = public.current_uid()) OR public.can_manage_equipment(public.current_uid())));


--
-- Name: vi_tri_media vi_tri_media_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vi_tri_media_insert ON public.vi_tri_media FOR INSERT TO authenticated WITH CHECK (((created_by = public.current_uid()) AND public.is_active_user(public.current_uid())));


--
-- Name: vi_tri_media vi_tri_media_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vi_tri_media_read ON public.vi_tri_media FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: vi_tri_media vi_tri_media_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vi_tri_media_update ON public.vi_tri_media FOR UPDATE TO authenticated USING (((created_by = public.current_uid()) OR public.can_manage_equipment(public.current_uid())));


--
-- Name: webauthn_credentials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

--
-- Name: weekly_report_import; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.weekly_report_import ENABLE ROW LEVEL SECURITY;

--
-- Name: weekly_report_import wri_insert_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY wri_insert_self ON public.weekly_report_import FOR INSERT TO authenticated WITH CHECK (((created_by = auth.uid()) OR (created_by IS NULL)));


--
-- Name: weekly_report_import wri_select_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY wri_select_scope ON public.weekly_report_import FOR SELECT TO authenticated USING (((created_by = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR ((don_vi_ma IS NOT NULL) AND (don_vi_ma = public.get_user_don_vi_ma(auth.uid())))));


--
-- PostgreSQL database dump complete
--

\unrestrict CmS8kCR51KBn0tfTCyUYARe8XzalJfuUad5FzeNUuTaiJNGgnLLAJWgsrIcvh7r

