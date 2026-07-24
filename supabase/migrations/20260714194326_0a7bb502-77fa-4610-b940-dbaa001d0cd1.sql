
-- Task 32 — Bulk actions RPCs (SECURITY DEFINER + guard) + audit qua import_batch(source='ui_bulk').

-- Cho phép source='ui_bulk' để đánh dấu vết audit các lô thao tác trên UI.
ALTER TABLE public.import_batch DROP CONSTRAINT IF EXISTS import_batch_source_chk;
ALTER TABLE public.import_batch ADD CONSTRAINT import_batch_source_chk
  CHECK (source IN ('allinone', 'csv', 'ui_bulk'));

-- Helper: tạo audit batch cho một lô ui_bulk.
CREATE OR REPLACE FUNCTION public._bulk_audit_batch(
  p_scope text,
  p_action text,
  p_count int,
  p_summary jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.import_batch(created_by, file_name, file_hash, source, scope, status, summary)
  VALUES (
    auth.uid(),
    format('ui_bulk:%s:%s', p_scope, p_action),
    encode(gen_random_bytes(16), 'hex'),
    'ui_bulk',
    p_scope,
    'committed',
    coalesce(p_summary, '{}'::jsonb) || jsonb_build_object('so_luong', p_count, 'action', p_action)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ---- Bulk chuyển trạng thái sự cố ----
CREATE OR REPLACE FUNCTION public.bulk_chuyen_trang_thai_su_co(
  p_ids uuid[],
  p_trang_thai text,
  p_nguon text DEFAULT 'ui_bulk'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_ok int := 0;
  v_skip int := 0;
  v_ids_ok uuid[] := '{}';
  v_ids_skip uuid[] := '{}';
  v_hien_tai text;
  v_hop_le boolean;
  v_mo_khac_phuc text;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Không có quyền chuyển trạng thái sự cố';
  END IF;

  FOREACH v_id IN ARRAY p_ids LOOP
    SELECT trang_thai, thoi_diem_khac_phuc INTO v_hien_tai, v_mo_khac_phuc
      FROM public.su_co WHERE id = v_id;
    IF v_hien_tai IS NULL THEN
      v_skip := v_skip + 1; v_ids_skip := array_append(v_ids_skip, v_id); CONTINUE;
    END IF;

    v_hop_le := (v_hien_tai, p_trang_thai) IN (
      ('Mới', 'Đang xử lý'), ('Mới', 'Đã khắc phục'), ('Mới', 'Đóng'),
      ('Đang xử lý', 'Đã khắc phục'), ('Đang xử lý', 'Đóng'), ('Đang xử lý', 'Mới'),
      ('Đã khắc phục', 'Đóng'), ('Đã khắc phục', 'Đang xử lý'),
      ('Đóng', 'Đang xử lý')
    );
    IF NOT v_hop_le THEN
      v_skip := v_skip + 1; v_ids_skip := array_append(v_ids_skip, v_id); CONTINUE;
    END IF;
    IF p_trang_thai = 'Đã khắc phục' AND (v_mo_khac_phuc IS NULL OR btrim(v_mo_khac_phuc) = '') THEN
      v_skip := v_skip + 1; v_ids_skip := array_append(v_ids_skip, v_id); CONTINUE;
    END IF;

    UPDATE public.su_co SET trang_thai = p_trang_thai, updated_at = now() WHERE id = v_id;
    v_ok := v_ok + 1; v_ids_ok := array_append(v_ids_ok, v_id);
  END LOOP;

  PERFORM public._bulk_audit_batch('su_co', 'chuyen_trang_thai', v_ok,
    jsonb_build_object('trang_thai', p_trang_thai, 'ids_ok', v_ids_ok, 'ids_skip', v_ids_skip));

  RETURN jsonb_build_object('ap_dung', v_ok, 'bo_qua', v_skip);
END;
$$;

-- ---- Bulk chuyển trạng thái công việc ----
CREATE OR REPLACE FUNCTION public.bulk_chuyen_trang_thai_cong_viec(
  p_ids uuid[],
  p_trang_thai text,
  p_nguon text DEFAULT 'ui_bulk'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_ok int := 0;
  v_skip int := 0;
  v_ids_ok uuid[] := '{}';
  v_ids_skip uuid[] := '{}';
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')
          OR public.has_role(auth.uid(), 'ktv') OR public.has_role(auth.uid(), 'to_truong')) THEN
    RAISE EXCEPTION 'Không có quyền chuyển trạng thái công việc';
  END IF;

  FOREACH v_id IN ARRAY p_ids LOOP
    UPDATE public.cong_viec_bao_tri
       SET trang_thai = p_trang_thai, updated_at = now()
     WHERE id = v_id;
    IF FOUND THEN
      v_ok := v_ok + 1; v_ids_ok := array_append(v_ids_ok, v_id);
    ELSE
      v_skip := v_skip + 1; v_ids_skip := array_append(v_ids_skip, v_id);
    END IF;
  END LOOP;

  PERFORM public._bulk_audit_batch('cong_viec', 'chuyen_trang_thai', v_ok,
    jsonb_build_object('trang_thai', p_trang_thai, 'ids_ok', v_ids_ok, 'ids_skip', v_ids_skip));

  RETURN jsonb_build_object('ap_dung', v_ok, 'bo_qua', v_skip);
END;
$$;

-- ---- Bulk gán field cho thiết bị (whitelist FK) ----
CREATE OR REPLACE FUNCTION public.bulk_gan_field_thiet_bi(
  p_ids uuid[],
  p_field text,
  p_gia_tri text,
  p_nguon text DEFAULT 'ui_bulk'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ok int := 0;
  v_allowed constant text[] := ARRAY[
    'dm_loai_id', 'dm_he_thong_id', 'dm_don_vi_id', 'dm_vi_tri_id',
    'dm_nhom_he_thong_id', 'dm_linh_vuc_id', 'nguoi_phu_trach'
  ];
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Không có quyền gán trường cho thiết bị';
  END IF;
  IF NOT (p_field = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Trường "%" không được phép gán hàng loạt', p_field;
  END IF;

  EXECUTE format(
    'UPDATE public.thiet_bi SET %I = $1::uuid, updated_at = now() WHERE id = ANY($2)',
    p_field
  ) USING nullif(p_gia_tri, '')::uuid, p_ids;
  GET DIAGNOSTICS v_ok = ROW_COUNT;

  PERFORM public._bulk_audit_batch('thiet_bi', 'gan_field:' || p_field, v_ok,
    jsonb_build_object('field', p_field, 'gia_tri', p_gia_tri, 'ids', p_ids));

  RETURN jsonb_build_object('ap_dung', v_ok, 'bo_qua', array_length(p_ids, 1) - v_ok);
END;
$$;

-- ---- Bulk gán field cho vật tư (whitelist FK) ----
CREATE OR REPLACE FUNCTION public.bulk_gan_field_vat_tu(
  p_ids uuid[],
  p_field text,
  p_gia_tri text,
  p_nguon text DEFAULT 'ui_bulk'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ok int := 0;
  v_allowed constant text[] := ARRAY['dm_nha_san_xuat_id', 'dm_don_vi_id'];
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Không có quyền gán trường cho vật tư';
  END IF;
  IF NOT (p_field = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Trường "%" không được phép gán hàng loạt', p_field;
  END IF;

  EXECUTE format(
    'UPDATE public.vat_tu SET %I = $1::uuid, updated_at = now() WHERE id = ANY($2)',
    p_field
  ) USING nullif(p_gia_tri, '')::uuid, p_ids;
  GET DIAGNOSTICS v_ok = ROW_COUNT;

  PERFORM public._bulk_audit_batch('vat_tu', 'gan_field:' || p_field, v_ok,
    jsonb_build_object('field', p_field, 'gia_tri', p_gia_tri, 'ids', p_ids));

  RETURN jsonb_build_object('ap_dung', v_ok, 'bo_qua', array_length(p_ids, 1) - v_ok);
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_chuyen_trang_thai_su_co(uuid[], text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_chuyen_trang_thai_cong_viec(uuid[], text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_gan_field_thiet_bi(uuid[], text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_gan_field_vat_tu(uuid[], text, text, text) TO authenticated;
