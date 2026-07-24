
-- =========================================================================
-- Fix ghi_hong_hoc_atomic(jsonb) — dùng đúng cột của bảng hong_hoc
-- =========================================================================
CREATE OR REPLACE FUNCTION public.ghi_hong_hoc_atomic(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_ids jsonb := '[]'::jsonb;
  v_first_id uuid := NULL;
  v_hh_id uuid;
  v_dev_id uuid;
  v_dev_row record;
  v_thay_row record;
  v_ma_hh text := p_payload->>'ma_hong_hoc';
  v_devs jsonb := p_payload->'thiet_bi_hong_ids';
  v_i int := 0;
  v_multi boolean;
  v_vt jsonb;
  v_tt text := COALESCE(NULLIF(p_payload->>'trang_thai',''),'Mới');
  v_thay_id uuid := NULLIF(p_payload->>'thiet_bi_thay_the_id','')::uuid;
  v_ht_id uuid := NULLIF(p_payload->>'he_thong_id','')::uuid;
  v_tp_id uuid := NULLIF(p_payload->>'thanh_phan_id','')::uuid;
  v_su_co_ma text := NULLIF(p_payload->>'su_co','');
  v_pa text := p_payload->>'phuong_an';
  v_nguoi text[] := ARRAY[]::text[];
BEGIN
  IF v_ma_hh IS NULL OR v_ma_hh = '' THEN RAISE EXCEPTION 'ma_hong_hoc bắt buộc'; END IF;
  IF v_devs IS NULL OR jsonb_array_length(v_devs) = 0 THEN
    RAISE EXCEPTION 'thiet_bi_hong_ids rỗng';
  END IF;
  v_multi := jsonb_array_length(v_devs) > 1;

  IF (p_payload->'nguoi_thuc_hien') IS NOT NULL AND jsonb_typeof(p_payload->'nguoi_thuc_hien') = 'array' THEN
    SELECT COALESCE(array_agg(x), ARRAY[]::text[]) INTO v_nguoi
    FROM (SELECT jsonb_array_elements_text(p_payload->'nguoi_thuc_hien') AS x) t
    WHERE x IS NOT NULL AND x <> '';
  END IF;

  -- Snapshot thiết bị thay thế (nếu có)
  IF v_thay_id IS NOT NULL THEN
    SELECT ma_thiet_bi INTO v_thay_row FROM public.thiet_bi WHERE id = v_thay_id;
  END IF;

  FOR v_dev_id IN SELECT (jsonb_array_elements_text(v_devs))::uuid LOOP
    v_i := v_i + 1;
    SELECT id, ma_thiet_bi, ten_thiet_bi, don_vi INTO v_dev_row
    FROM public.thiet_bi WHERE id = v_dev_id LIMIT 1;

    INSERT INTO public.hong_hoc (
      ma_hong_hoc,
      thiet_bi_hong_id, thiet_bi_hong,
      thiet_bi_thay_the_id, thiet_bi_thay_the,
      he_thong_id, thanh_phan_id,
      ngay_hong, bo_phan_hong, mo_ta_hong_hoc, phuong_an,
      su_co, trang_thai, nguoi_thuc_hien,
      snapshot_ma_thiet_bi, snapshot_ten_thiet_bi,
      snapshot_he_thong, snapshot_don_vi,
      created_by
    ) VALUES (
      CASE WHEN v_multi THEN v_ma_hh || '-' || lpad(v_i::text,2,'0') ELSE v_ma_hh END,
      v_dev_row.id,
      v_dev_row.ma_thiet_bi,
      v_thay_id,
      v_thay_row.ma_thiet_bi,
      v_ht_id,
      v_tp_id,
      (p_payload->>'ngay_hong')::date,
      NULLIF(p_payload->>'bo_phan_hong',''),
      p_payload->>'mo_ta_hong_hoc',
      v_pa,
      v_su_co_ma,
      v_tt,
      v_nguoi,
      v_dev_row.ma_thiet_bi,
      v_dev_row.ten_thiet_bi,
      NULLIF(p_payload->>'he_thong_ten',''),
      v_dev_row.don_vi,
      v_uid
    )
    RETURNING id INTO v_hh_id;
    IF v_first_id IS NULL THEN v_first_id := v_hh_id; END IF;
    v_ids := v_ids || to_jsonb(v_hh_id);
  END LOOP;

  -- Vật tư tiêu hao
  IF (p_payload->'vat_tu') IS NOT NULL AND jsonb_array_length(p_payload->'vat_tu') > 0 THEN
    FOR v_vt IN SELECT jsonb_array_elements(p_payload->'vat_tu') LOOP
      PERFORM public.kho_xuat(
        (v_vt->>'kho_id')::uuid,
        (v_vt->>'vat_tu_id')::uuid,
        (v_vt->>'so_luong')::numeric,
        'hong_hoc',
        v_first_id,
        v_uid
      );
    END LOOP;
  END IF;

  -- Cập nhật liên kết lên su_co (nếu có mã)
  IF v_su_co_ma IS NOT NULL THEN
    UPDATE public.su_co SET lien_ket_hong_hoc = v_ma_hh WHERE ma_su_co = v_su_co_ma;
  END IF;

  RETURN jsonb_build_object('ids', v_ids, 'ma_hong_hoc', v_ma_hh);
END;
$$;

REVOKE ALL ON FUNCTION public.ghi_hong_hoc_atomic(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ghi_hong_hoc_atomic(jsonb) TO authenticated;


-- =========================================================================
-- Fix ghi_bao_duong_atomic(jsonb) — item_results nhận đúng cột thực
-- payload.item_results: mảng object khớp cột form_submission_item_result
--   (submission_id sẽ được RPC set — client chỉ cần các trường còn lại)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.ghi_bao_duong_atomic(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_sub jsonb := p_payload->'submission';
  v_sub_id uuid;
  v_dev jsonb;
  v_i int := 0;
  v_bt_id uuid;
  v_first_bt uuid := NULL;
  v_bt_ids jsonb := '[]'::jsonb;
  v_ma_base text := p_payload->>'ma_base';
  v_nguoi text[];
  v_nguoi_raw jsonb := p_payload->'nguoi_thuc_hien';
  v_vt jsonb;
  v_ht_id uuid := NULLIF(v_sub->>'he_thong_id','')::uuid;
  v_ht_ten text := NULLIF(p_payload->>'he_thong_ten','');
  v_items jsonb := p_payload->'item_results';
BEGIN
  IF v_sub IS NULL THEN RAISE EXCEPTION 'submission bắt buộc'; END IF;
  IF v_ma_base IS NULL OR v_ma_base = '' THEN RAISE EXCEPTION 'ma_base bắt buộc'; END IF;
  IF (p_payload->'devices') IS NULL OR jsonb_array_length(p_payload->'devices') = 0 THEN
    RAISE EXCEPTION 'devices rỗng';
  END IF;

  IF v_nguoi_raw IS NOT NULL AND jsonb_typeof(v_nguoi_raw) = 'array' THEN
    SELECT COALESCE(array_agg(x), ARRAY[]::text[]) INTO v_nguoi
    FROM (SELECT jsonb_array_elements_text(v_nguoi_raw) AS x) t
    WHERE x IS NOT NULL AND x <> '';
  ELSE
    SELECT COALESCE(array_agg(trim(s)), ARRAY[]::text[]) INTO v_nguoi
    FROM regexp_split_to_table(COALESCE(v_nguoi_raw #>> '{}',''),',') s
    WHERE trim(s) <> '';
  END IF;
  v_nguoi := COALESCE(v_nguoi, ARRAY[]::text[]);

  INSERT INTO public.form_submission (
    template_id, template_code, template_version, template_snapshot,
    he_thong_id, created_by, status, submitted_at, tieu_de, data,
    template_version_id
  ) VALUES (
    (v_sub->>'template_id')::uuid,
    v_sub->>'template_code',
    (v_sub->>'template_version')::int,
    v_sub->'template_snapshot',
    v_ht_id,
    v_uid,
    'submitted',
    COALESCE((v_sub->>'submitted_at')::timestamptz, now()),
    v_sub->>'tieu_de',
    COALESCE(v_sub->'data','{}'::jsonb),
    NULLIF(v_sub->>'template_version_id','')::uuid
  )
  RETURNING id INTO v_sub_id;

  -- Kết quả từng mục: client gửi đúng schema, RPC gán submission_id.
  IF v_items IS NOT NULL AND jsonb_typeof(v_items) = 'array' AND jsonb_array_length(v_items) > 0 THEN
    INSERT INTO public.form_submission_item_result
    SELECT (r).*
    FROM (
      SELECT jsonb_populate_record(
        NULL::public.form_submission_item_result,
        (elem || jsonb_build_object('submission_id', v_sub_id))
      ) AS r
      FROM jsonb_array_elements(v_items) elem
    ) x;
  END IF;

  FOR v_dev IN SELECT jsonb_array_elements(p_payload->'devices') LOOP
    v_i := v_i + 1;

    INSERT INTO public.form_submission_thiet_bi (submission_id, thiet_bi_id)
    VALUES (v_sub_id, (v_dev->>'id')::uuid)
    ON CONFLICT (submission_id, thiet_bi_id) DO NOTHING;

    INSERT INTO public.bao_tri (
      ma_bao_tri, thiet_bi, thiet_bi_id, he_thong, he_thong_id, don_vi,
      loai_bao_tri, ngay_bat_dau, ngay_hoan_thanh, mo_ta_cong_viec,
      ket_qua, nguoi_thuc_hien, don_vi_thuc_hien, trang_thai,
      created_by, form_submission_id
    ) VALUES (
      v_ma_base || '-' || lpad(v_i::text, 2, '0'),
      v_dev->>'ma_thiet_bi',
      (v_dev->>'id')::uuid,
      v_ht_ten,
      v_ht_id,
      NULLIF(v_dev->>'don_vi',''),
      p_payload->>'loai_bao_tri',
      (p_payload->>'ngay_bat_dau')::date,
      NULLIF(p_payload->>'ngay_hoan_thanh','')::date,
      COALESCE(NULLIF(p_payload->>'mo_ta_cong_viec',''), v_sub->>'tieu_de'),
      NULLIF(p_payload->>'ket_qua',''),
      v_nguoi,
      p_payload->>'don_vi_thuc_hien',
      p_payload->>'trang_thai',
      v_uid,
      v_sub_id
    )
    RETURNING id INTO v_bt_id;
    IF v_first_bt IS NULL THEN v_first_bt := v_bt_id; END IF;
    v_bt_ids := v_bt_ids || to_jsonb(v_bt_id);
  END LOOP;

  IF (p_payload->'vat_tu') IS NOT NULL AND jsonb_array_length(p_payload->'vat_tu') > 0 THEN
    FOR v_vt IN SELECT jsonb_array_elements(p_payload->'vat_tu') LOOP
      PERFORM public.kho_xuat(
        (v_vt->>'kho_id')::uuid,
        (v_vt->>'vat_tu_id')::uuid,
        (v_vt->>'so_luong')::numeric,
        'bao_tri',
        v_first_bt,
        v_uid
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'submission_id', v_sub_id,
    'bao_tri_ids', v_bt_ids
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ghi_bao_duong_atomic(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ghi_bao_duong_atomic(jsonb) TO authenticated;
