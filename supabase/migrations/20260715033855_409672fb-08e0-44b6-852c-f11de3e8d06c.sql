
-- =========================================================================
-- Task 50 — Overloads nhận jsonb payload cho ghi_*_atomic (giữ signature cũ)
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1) SỰ CỐ — jsonb overload
-- payload: {
--   ma_nhom_bc, ngay_phat_hien, nguoi_bao_cao, muc_do, anh_huong_dhb,
--   hien_tuong, nguyen_nhan?, bien_phap_xu_ly?, bao_cao_ban_dau?,
--   van_de_id?, trang_thai?,
--   devices: [{ id, ma_thiet_bi, don_vi?, he_thong_id?, he_thong_ten? }],
--   vat_tu?: [{ vat_tu_id, kho_id, so_luong }]
-- }
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ghi_su_co_atomic(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dev jsonb;
  v_i int := 0;
  v_id uuid;
  v_ids jsonb := '[]'::jsonb;
  v_vd_raw text := NULLIF(p_payload->>'van_de_id','');
  v_vd uuid := NULL;
  v_first_id uuid := NULL;
  v_ma_nhom text := p_payload->>'ma_nhom_bc';
  v_trang_thai text := COALESCE(NULLIF(p_payload->>'trang_thai',''),'Mới');
  v_vt jsonb;
  v_uid uuid := auth.uid();
BEGIN
  IF v_ma_nhom IS NULL OR v_ma_nhom = '' THEN
    RAISE EXCEPTION 'ma_nhom_bc bắt buộc';
  END IF;
  IF (p_payload->'devices') IS NULL OR jsonb_array_length(p_payload->'devices') = 0 THEN
    RAISE EXCEPTION 'devices rỗng';
  END IF;
  IF v_vd_raw IS NOT NULL THEN v_vd := v_vd_raw::uuid; END IF;

  FOR v_dev IN SELECT jsonb_array_elements(p_payload->'devices') LOOP
    v_i := v_i + 1;
    INSERT INTO public.su_co (
      ma_su_co, thiet_bi, thiet_bi_id, he_thong, he_thong_id, don_vi,
      ngay_phat_hien, nguoi_bao_cao, muc_do, anh_huong_dhb, hien_tuong,
      nguyen_nhan, bien_phap_xu_ly, trang_thai, ma_nhom_bc,
      bao_cao_ban_dau, van_de_id
    ) VALUES (
      v_ma_nhom || '-' || lpad(v_i::text, 2, '0'),
      v_dev->>'ma_thiet_bi',
      (v_dev->>'id')::uuid,
      NULLIF(v_dev->>'he_thong_ten',''),
      NULLIF(v_dev->>'he_thong_id','')::uuid,
      NULLIF(v_dev->>'don_vi',''),
      (p_payload->>'ngay_phat_hien')::date,
      p_payload->>'nguoi_bao_cao',
      p_payload->>'muc_do',
      p_payload->>'anh_huong_dhb',
      p_payload->>'hien_tuong',
      NULLIF(p_payload->>'nguyen_nhan',''),
      NULLIF(p_payload->>'bien_phap_xu_ly',''),
      v_trang_thai,
      v_ma_nhom,
      p_payload->'bao_cao_ban_dau',
      v_vd
    )
    RETURNING id INTO v_id;
    IF v_first_id IS NULL THEN v_first_id := v_id; END IF;
    v_ids := v_ids || to_jsonb(v_id);
  END LOOP;

  -- Vật tư tiêu hao (nếu có) — gắn nguồn su_co (dùng dòng đầu)
  IF (p_payload->'vat_tu') IS NOT NULL AND jsonb_array_length(p_payload->'vat_tu') > 0 THEN
    FOR v_vt IN SELECT jsonb_array_elements(p_payload->'vat_tu') LOOP
      PERFORM public.kho_xuat(
        (v_vt->>'kho_id')::uuid,
        (v_vt->>'vat_tu_id')::uuid,
        (v_vt->>'so_luong')::numeric,
        'su_co',
        v_first_id,
        v_uid
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('ids', v_ids, 'ma_nhom_bc', v_ma_nhom);
END;
$$;

REVOKE ALL ON FUNCTION public.ghi_su_co_atomic(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ghi_su_co_atomic(jsonb) TO authenticated;

-- -------------------------------------------------------------------------
-- 2) BẢO DƯỠNG — jsonb overload
-- payload: {
--   submission: { template_id, template_code, template_version,
--                 template_snapshot, he_thong_id, tieu_de, data },
--   ma_base, loai_bao_tri, ngay_bat_dau, ngay_hoan_thanh?, ket_qua?,
--   trang_thai, nguoi_thuc_hien (text | array), don_vi_thuc_hien,
--   he_thong_ten,
--   devices: [{ id, ma_thiet_bi, don_vi? }],
--   item_results?: [{ item_id, ket_qua, ghi_chu?, gia_tri? }],
--   vat_tu?: [{ vat_tu_id, kho_id, so_luong }]
-- }
-- -------------------------------------------------------------------------
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
  v_item jsonb;
  v_vt jsonb;
  v_ht_id uuid := NULLIF(v_sub->>'he_thong_id','')::uuid;
  v_ht_ten text := NULLIF(p_payload->>'he_thong_ten','');
BEGIN
  IF v_sub IS NULL THEN RAISE EXCEPTION 'submission bắt buộc'; END IF;
  IF v_ma_base IS NULL OR v_ma_base = '' THEN RAISE EXCEPTION 'ma_base bắt buộc'; END IF;
  IF (p_payload->'devices') IS NULL OR jsonb_array_length(p_payload->'devices') = 0 THEN
    RAISE EXCEPTION 'devices rỗng';
  END IF;

  -- Chuẩn hoá nguoi_thuc_hien -> text[]
  IF jsonb_typeof(v_nguoi_raw) = 'array' THEN
    SELECT array_agg(x) INTO v_nguoi
    FROM (SELECT trim(y::text, '"') AS x FROM jsonb_array_elements(v_nguoi_raw) y) t
    WHERE x IS NOT NULL AND x <> '';
  ELSE
    SELECT array_agg(trim(s)) INTO v_nguoi
    FROM regexp_split_to_table(COALESCE(v_nguoi_raw #>> '{}', ''), ',') s
    WHERE trim(s) <> '';
  END IF;
  v_nguoi := COALESCE(v_nguoi, ARRAY[]::text[]);

  -- 2a. form_submission
  INSERT INTO public.form_submission (
    template_id, template_code, template_version, template_snapshot,
    he_thong_id, created_by, status, submitted_at, tieu_de, data
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
    COALESCE(v_sub->'data','{}'::jsonb)
  )
  RETURNING id INTO v_sub_id;

  -- 2b. form_submission_item_result
  IF (p_payload->'item_results') IS NOT NULL THEN
    FOR v_item IN SELECT jsonb_array_elements(p_payload->'item_results') LOOP
      INSERT INTO public.form_submission_item_result (
        submission_id, item_id, ket_qua, ghi_chu, gia_tri
      ) VALUES (
        v_sub_id,
        (v_item->>'item_id')::uuid,
        v_item->>'ket_qua',
        NULLIF(v_item->>'ghi_chu',''),
        v_item->'gia_tri'
      );
    END LOOP;
  END IF;

  -- 2c. bao_tri + form_submission_thiet_bi (mỗi thiết bị)
  FOR v_dev IN SELECT jsonb_array_elements(p_payload->'devices') LOOP
    v_i := v_i + 1;

    INSERT INTO public.form_submission_thiet_bi (submission_id, thiet_bi_id)
    VALUES (v_sub_id, (v_dev->>'id')::uuid)
    ON CONFLICT DO NOTHING;

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

  -- 2d. Vật tư tiêu hao
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

-- -------------------------------------------------------------------------
-- 3) HỎNG HÓC — jsonb overload
-- payload: {
--   ma_hong_hoc, su_co_id?, he_thong_id?, he_thong_ten?, thanh_phan_id?,
--   ngay_hong, mo_ta_hong_hoc, phuong_an, thiet_bi_hong_ids: [uuid],
--   thiet_bi_thay_the_id?, linh_kien_hong?, ghi_chu?, trang_thai?,
--   vat_tu?: [{ vat_tu_id, kho_id, so_luong }]
-- }
-- -------------------------------------------------------------------------
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
  v_ma_hh text := p_payload->>'ma_hong_hoc';
  v_devs jsonb := p_payload->'thiet_bi_hong_ids';
  v_i int := 0;
  v_vt jsonb;
  v_tt text := COALESCE(NULLIF(p_payload->>'trang_thai',''),'Mới');
  v_thay_the uuid := NULLIF(p_payload->>'thiet_bi_thay_the_id','')::uuid;
BEGIN
  IF v_ma_hh IS NULL OR v_ma_hh = '' THEN RAISE EXCEPTION 'ma_hong_hoc bắt buộc'; END IF;
  IF v_devs IS NULL OR jsonb_array_length(v_devs) = 0 THEN
    RAISE EXCEPTION 'thiet_bi_hong_ids rỗng';
  END IF;

  FOR v_dev_id IN
    SELECT (jsonb_array_elements_text(v_devs))::uuid
  LOOP
    v_i := v_i + 1;
    SELECT id, ma_thiet_bi, don_vi INTO v_dev_row
    FROM public.thiet_bi WHERE id = v_dev_id LIMIT 1;

    INSERT INTO public.hong_hoc (
      ma_hong_hoc, thiet_bi_id, thiet_bi, don_vi,
      he_thong_id, he_thong, thanh_phan_id,
      ngay_hong, mo_ta_hong_hoc, phuong_an,
      thiet_bi_thay_the_id, linh_kien_hong, ghi_chu,
      su_co_id, trang_thai, created_by
    ) VALUES (
      v_ma_hh || CASE WHEN jsonb_array_length(v_devs) > 1
                      THEN '-' || lpad(v_i::text,2,'0') ELSE '' END,
      v_dev_row.id,
      v_dev_row.ma_thiet_bi,
      v_dev_row.don_vi,
      NULLIF(p_payload->>'he_thong_id','')::uuid,
      NULLIF(p_payload->>'he_thong_ten',''),
      NULLIF(p_payload->>'thanh_phan_id','')::uuid,
      (p_payload->>'ngay_hong')::date,
      p_payload->>'mo_ta_hong_hoc',
      p_payload->>'phuong_an',
      v_thay_the,
      NULLIF(p_payload->>'linh_kien_hong',''),
      NULLIF(p_payload->>'ghi_chu',''),
      NULLIF(p_payload->>'su_co_id','')::uuid,
      v_tt,
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

  RETURN jsonb_build_object('ids', v_ids, 'ma_hong_hoc', v_ma_hh);
END;
$$;

REVOKE ALL ON FUNCTION public.ghi_hong_hoc_atomic(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ghi_hong_hoc_atomic(jsonb) TO authenticated;
