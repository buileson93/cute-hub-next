SET search_path = public, pg_catalog;
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
  v_he_thong_id uuid;
  v_ma text;
BEGIN
  -- Chỉ kiểm tra khi bản ghi lắp còn hiệu lực (chưa tháo)
  IF NEW.den_ngay IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT he_thong_id, ma_thiet_bi INTO v_he_thong_id, v_ma
  FROM public.thiet_bi
  WHERE id = NEW.thiet_bi_id;

  IF v_he_thong_id IS NULL THEN
    RAISE EXCEPTION 'Tài sản % chưa gán hệ thống — không thể lắp vào thành phần. Vui lòng cập nhật hệ thống cho tài sản trước.', COALESCE(v_ma, NEW.thiet_bi_id::text)
      USING ERRCODE = 'check_violation';
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
-- Name: _dbg_tmp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._dbg_tmp (
    msg text
);


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
    deactivated_at timestamp with time zone
);

ALTER TABLE ONLY public.dm_he_thong REPLICA IDENTITY FULL;


--
-- Name: COLUMN dm_he_thong.ma_tai_san_bravo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dm_he_thong.ma_tai_san_bravo IS 'Mã tài sản Bravo (cột vật lý cố định, áp dụng cho mọi hệ thống)';


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
    deactivated_at timestamp with time zone
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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
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
    luu_tru boolean DEFAULT false NOT NULL
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
    updated_at timestamp with time zone DEFAULT now() NOT NULL
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
            'Giấy phép khai thác'::text,
            'GPKT'::text,
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


