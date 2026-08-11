CREATE OR REPLACE FUNCTION public.ghi_su_co_atomic(p_payload jsonb) RETURNS jsonb
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
    IF v_dev->>'id' IS NULL OR v_dev->>'id' = '' THEN
        RAISE EXCEPTION 'Mỗi thiết bị trong danh sách sự cố phải có ID hợp lệ';
    END IF;

    v_i := v_i + 1;
    INSERT INTO public.su_co (
      ma_su_co, thiet_bi, thiet_bi_id, he_thong, he_thong_id, don_vi,
      ngay_phat_hien, nguoi_bao_cao, muc_do, anh_huong_dhb, hien_tuong,
      nguyen_nhan, bien_phap_xu_ly, trang_thai, ma_nhom_bc, bao_cao_ban_dau,
      van_de_id, nguoi_bao_cao_id, at_bao_cao
    ) VALUES (
      v_ma_nhom || '-' || lpad(v_i::text, 2, '0'),
      v_dev->>'ma_thiet_bi',
      (v_dev->>'id')::uuid,
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

CREATE OR REPLACE FUNCTION public.ghi_bao_duong_atomic(p_payload jsonb) RETURNS jsonb
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
  v_ket_qua text;
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

  v_ket_qua := nullif(p_payload->>'ket_qua', '');
  IF v_ket_qua IS NULL THEN
    v_ket_qua := nullif(p_payload->>'bottom_result', '');
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
    IF v_dev->>'id' IS NULL OR v_dev->>'id' = '' THEN
        RAISE EXCEPTION 'Mỗi thiết bị trong danh sách bảo trì phải có ID hợp lệ';
    END IF;

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
      (v_dev->>'id')::uuid,
      nullif(p_payload->>'he_thong_ten',''),
      nullif(v_sub->>'he_thong_id','')::uuid,
      nullif(v_dev->>'don_vi',''),
      nullif(p_payload->>'loai_bao_tri',''),
      nullif(p_payload->>'ngay_bat_dau','')::date,
      nullif(p_payload->>'ngay_hoan_thanh','')::date,
      v_ket_qua,
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

CREATE OR REPLACE FUNCTION public.ghi_hong_hoc_atomic(p_payload jsonb) RETURNS jsonb
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
    IF v_ma_tb IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy tài sản hỏng có ID %', v_tbid;
    END IF;

    INSERT INTO public.hong_hoc (
      ma_hong_hoc, thiet_bi_hong, thiet_bi_hong_id, he_thong_id, thanh_phan_id,
      su_co, ngay_hong, bo_phan_hong, mo_ta_hong_hoc, phuong_an,
      thiet_bi_thay_the, thiet_bi_thay_the_id, nguoi_thuc_hien, don_vi_thuc_hien,
      trang_thai, nguoi_bao_cao_id, at_bao_cao
    ) VALUES (
      CASE WHEN v_i = 1 THEN v_ma ELSE v_ma || '-' || lpad(v_i::text,2,'0') END,
      v_ma_tb, v_tbid,
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

CREATE OR REPLACE FUNCTION public.promote_ticket_to_su_co(p_ticket_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_t public.tickets;
  v_uid uuid := auth.uid();
  v_id uuid;
  v_ma_nhom text;
  v_payload jsonb;
BEGIN
  SELECT * INTO v_t FROM public.tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy ticket'; END IF;

  v_ma_nhom := 'SC-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 4));

  v_payload := jsonb_build_object(
    'ma_nhom_bc', v_ma_nhom,
    'ngay_phat_hien', v_t.created_at,
    'nguoi_bao_cao', v_t.nguoi_bao_cao,
    'muc_do', v_t.muc_do,
    'anh_huong_dhb', 'Có',
    'hien_tuong', v_t.mo_ta,
    'van_de_id', v_t.van_de_id,
    'trang_thai', 'Mới',
    'devices', jsonb_build_array(
      jsonb_build_object(
        'id', v_t.thiet_bi_id,
        'ma_thiet_bi', v_t.thiet_bi,
        'he_thong_id', v_t.he_thong_id,
        'he_thong_ten', (SELECT ten FROM public.he_thong WHERE id = v_t.he_thong_id)
      )
    )
  );

  SELECT (x->'ids'->>0)::uuid INTO v_id FROM public.ghi_su_co_atomic(v_payload) x;

  UPDATE public.tickets
     SET status = 'promoted', su_co_id = v_id, updated_at = now()
   WHERE id = p_ticket_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.dashboard_activity_feed(p_don_vi_ids uuid[] DEFAULT NULL::uuid[], p_limit integer DEFAULT 20) RETURNS TABLE(at timestamp with time zone, loai text, tieu_de text, ref_route text, ref_id uuid)
    LANGUAGE sql STABLE
    AS $$
  (SELECT ngay_phat_hien, 'su_co'::text, ('Sự cố: ' || COALESCE(thiet_bi, ma_su_co)), '/su-co'::text, id
     FROM public.su_co 
     WHERE (p_don_vi_ids IS NULL OR thiet_bi_id IN (SELECT id FROM public.thiet_bi WHERE don_vi_id = ANY(p_don_vi_ids)))
     ORDER BY ngay_phat_hien DESC LIMIT p_limit)
  UNION ALL
  (SELECT updated_at, 'bao_tri'::text, ('Bảo trì: ' || COALESCE(thiet_bi, ma_bao_tri)), '/bao-tri'::text, id
     FROM public.bao_tri 
     WHERE ngay_hoan_thanh IS NOT NULL 
       AND (p_don_vi_ids IS NULL OR thiet_bi_id IN (SELECT id FROM public.thiet_bi WHERE don_vi_id = ANY(p_don_vi_ids)))
     ORDER BY updated_at DESC LIMIT p_limit)
  UNION ALL
  (SELECT created_at, 'ban_giao'::text, 'Bàn giao thiết bị', '/ban-giao'::text, id
     FROM public.ban_giao ORDER BY created_at DESC LIMIT p_limit)
  UNION ALL
  (SELECT thoi_diem, 'kiem_ke'::text, 'Kiểm kê thiết bị', '/kiem-ke'::text, id
     FROM public.kiem_ke ORDER BY thoi_diem DESC LIMIT p_limit)
  ORDER BY 1 DESC LIMIT p_limit;
$$;
