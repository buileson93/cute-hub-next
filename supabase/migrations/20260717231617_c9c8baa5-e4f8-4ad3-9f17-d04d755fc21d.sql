
-- =====================================================================
-- N1 phase 2 — Merge danh mục
-- Spec: docs/superpowers/specs/n1-danh-muc-quality.md §5-6
-- =====================================================================

-- 1) Bổ sung cột merged_into + deactivated_at cho 16 bảng danh mục
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'dm_don_vi','dm_vi_tri','dm_loai_thiet_bi','dm_nha_san_xuat',
    'dm_nha_cung_cap','dm_model','dm_nhom_he_thong','dm_he_thong',
    'dm_phan_loai','dm_dac_tinh','dm_noi_cap','dm_loai_giay_phep',
    'dm_loai_lien_ket','dm_trang_thai_thiet_bi','dm_danh_gia_nien_han',
    'dm_to_chuc'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format(
      'ALTER TABLE public.%I
         ADD COLUMN IF NOT EXISTS merged_into uuid REFERENCES public.%I(id) ON DELETE SET NULL,
         ADD COLUMN IF NOT EXISTS deactivated_at timestamptz',
      t, t
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I(merged_into) WHERE merged_into IS NOT NULL',
      t || '_merged_into_idx', t
    );
  END LOOP;
END$$;

-- 2) Bản đồ tham chiếu (MERGE_REF_MAP) — jsonb literal đồng bộ với src/lib/mirats/danh-muc-quality.ts
CREATE OR REPLACE FUNCTION public._danh_muc_merge_ref_map()
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
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

REVOKE ALL ON FUNCTION public._danh_muc_merge_ref_map() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._danh_muc_merge_ref_map() TO authenticated, service_role;

-- 3) RPC merge_danh_muc
CREATE OR REPLACE FUNCTION public.merge_danh_muc(
  p_entity text,
  p_keep_id uuid,
  p_drop_id uuid,
  p_ly_do text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.merge_danh_muc(text, uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.merge_danh_muc(text, uuid, uuid, text) TO authenticated, service_role;

-- 4) RPC undo_merge_danh_muc — hoàn tác trong 24h
CREATE OR REPLACE FUNCTION public.undo_merge_danh_muc(
  p_entity text,
  p_drop_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.undo_merge_danh_muc(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.undo_merge_danh_muc(text, uuid) TO authenticated, service_role;
