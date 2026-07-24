-- 1) Cho phép pham_vi = 'thiet_bi' (trường khai riêng cho một thiết bị/thành phần)
CREATE OR REPLACE FUNCTION public.he_thong_truong_validate()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 2) Áp dụng thay đổi cây: nhận biết scope (he_thong | thiet_bi)
CREATE OR REPLACE FUNCTION public._cay_apply(_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r public.cay_thay_doi;
  snap jsonb := '{}'::jsonb;
  v_to_nhom uuid;
  v_to_lv uuid;
  v_to_nh_key text;
  v_to_nh_ten text;
  v_ids uuid[];
  v_dev_ma text;
  v_to_ht uuid;
  v_ht_nhom uuid;
  v_ht_lv uuid;
  v_scope text;
  v_pham_vi text;
BEGIN
  SELECT * INTO r FROM public.cay_thay_doi WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Khong tim thay thay doi'; END IF;
  IF r.da_ap_dung THEN RETURN jsonb_build_object('ok', true, 'noop', true); END IF;

  IF r.loai = 'move_system' THEN
    v_to_nhom := NULLIF(r.payload->>'to_nhom_id','')::uuid;
    v_to_lv := NULLIF(r.payload->>'to_lv_id','')::uuid;
    v_to_nh_key := NULLIF(r.payload->>'to_nh_key','');
    v_to_nh_ten := NULLIF(r.payload->>'to_nh_ten','');

    SELECT jsonb_build_object(
      'he_thong', (SELECT jsonb_build_object('nhom_he_thong_id', nhom_he_thong_id, 'linh_vuc_id', linh_vuc_id)
                   FROM public.dm_he_thong WHERE id = r.he_thong_id::uuid),
      'thiet_bi', (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'nhom_he_thong_id', nhom_he_thong_id, 'linh_vuc_id', linh_vuc_id)), '[]'::jsonb)
                   FROM public.thiet_bi WHERE he_thong_id = r.he_thong_id::uuid),
      'node_edit', (SELECT to_jsonb(c) FROM public.cay_node_edit c WHERE c.kind = 'ht' AND c.ma = r.he_thong_id LIMIT 1)
    ) INTO snap;

    UPDATE public.dm_he_thong
      SET nhom_he_thong_id = COALESCE(v_to_nhom, nhom_he_thong_id),
          linh_vuc_id = COALESCE(v_to_lv, linh_vuc_id)
      WHERE id = r.he_thong_id::uuid;

    UPDATE public.thiet_bi
      SET nhom_he_thong_id = COALESCE(v_to_nhom, nhom_he_thong_id),
          linh_vuc_id = COALESCE(v_to_lv, linh_vuc_id)
      WHERE he_thong_id = r.he_thong_id::uuid;

    IF v_to_nh_key IS NOT NULL THEN
      INSERT INTO public.cay_node_edit(kind, ma, ten, du_lieu, created_by)
      VALUES ('ht', r.he_thong_id, NULL,
        jsonb_build_object('manual_nh_key', v_to_nh_key, 'manual_nh_ten', COALESCE(v_to_nh_ten, v_to_nh_key)),
        r.nguoi_tao)
      ON CONFLICT (kind, ma) DO UPDATE
        SET du_lieu = COALESCE(public.cay_node_edit.du_lieu, '{}'::jsonb)
          || jsonb_build_object('manual_nh_key', v_to_nh_key, 'manual_nh_ten', COALESCE(v_to_nh_ten, v_to_nh_key)),
            updated_at = now();
    END IF;

  ELSIF r.loai = 'move_systems' THEN
    v_to_nhom := NULLIF(r.payload->>'to_nhom_id','')::uuid;
    v_to_lv := NULLIF(r.payload->>'to_lv_id','')::uuid;
    SELECT array_agg(x::uuid) INTO v_ids
      FROM jsonb_array_elements_text(COALESCE(r.payload->'system_ids','[]'::jsonb)) x;

    SELECT jsonb_build_object(
      'he_thong', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'nhom_he_thong_id', nhom_he_thong_id, 'linh_vuc_id', linh_vuc_id))
                   FROM public.dm_he_thong WHERE id = ANY(v_ids)), '[]'::jsonb),
      'thiet_bi', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'nhom_he_thong_id', nhom_he_thong_id, 'linh_vuc_id', linh_vuc_id))
                   FROM public.thiet_bi WHERE he_thong_id = ANY(v_ids)), '[]'::jsonb)
    ) INTO snap;

    UPDATE public.dm_he_thong
      SET nhom_he_thong_id = COALESCE(v_to_nhom, nhom_he_thong_id),
          linh_vuc_id = COALESCE(v_to_lv, linh_vuc_id)
      WHERE id = ANY(v_ids);

    UPDATE public.thiet_bi
      SET nhom_he_thong_id = COALESCE(v_to_nhom, nhom_he_thong_id),
          linh_vuc_id = COALESCE(v_to_lv, linh_vuc_id)
      WHERE he_thong_id = ANY(v_ids);

  ELSIF r.loai = 'move_device' THEN
    v_dev_ma := r.payload->>'device_ma';
    v_to_ht := NULLIF(r.payload->>'to_ht_id','')::uuid;
    SELECT nhom_he_thong_id, linh_vuc_id INTO v_ht_nhom, v_ht_lv
      FROM public.dm_he_thong WHERE id = v_to_ht;

    SELECT jsonb_build_object('thiet_bi',
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'he_thong_id', he_thong_id, 'nhom_he_thong_id', nhom_he_thong_id, 'linh_vuc_id', linh_vuc_id))
       FROM public.thiet_bi WHERE ma_thiet_bi = v_dev_ma), '[]'::jsonb)) INTO snap;

    UPDATE public.thiet_bi
      SET he_thong_id = v_to_ht,
          nhom_he_thong_id = COALESCE(v_ht_nhom, nhom_he_thong_id),
          linh_vuc_id = COALESCE(v_ht_lv, linh_vuc_id)
      WHERE ma_thiet_bi = v_dev_ma;

  ELSIF r.loai = 'custom_fields' THEN
    v_scope := COALESCE(r.payload->>'scope','he_thong');
    v_pham_vi := CASE WHEN v_scope = 'thiet_bi' THEN 'thiet_bi' ELSE 'he_thong' END;

    SELECT jsonb_build_object('he_thong_truong',
      COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.he_thong_truong t WHERE t.he_thong_id = r.he_thong_id), '[]'::jsonb)
    ) INTO snap;
    DELETE FROM public.he_thong_truong WHERE he_thong_id = r.he_thong_id;
    INSERT INTO public.he_thong_truong
      (he_thong_id, field_key, nhan, kieu, tuy_chon, thu_tu,
       help_text, bat_buoc, rang_buoc, mac_dinh, nhom_field,
       pham_vi, ap_dung_lop, ap_dung_id, hoat_dong, created_by)
    SELECT r.he_thong_id, f->>'field_key', f->>'nhan', COALESCE(f->>'kieu','text'),
           COALESCE(f->'tuy_chon','[]'::jsonb), COALESCE((f->>'thu_tu')::int, 0),
           NULLIF(f->>'help_text',''),
           COALESCE((f->>'bat_buoc')::boolean, false),
           COALESCE(f->'rang_buoc','{}'::jsonb),
           CASE WHEN f ? 'mac_dinh' AND f->'mac_dinh' <> 'null'::jsonb THEN f->'mac_dinh' ELSE NULL END,
           NULLIF(f->>'nhom_field',''),
           v_pham_vi, 'thiet_bi', r.he_thong_id, true,
           r.nguoi_tao
    FROM jsonb_array_elements(COALESCE(r.payload->'fields','[]'::jsonb)) f
    WHERE COALESCE(f->>'field_key','') <> '';

  ELSE
    RAISE EXCEPTION 'Loai thay doi khong ho tro: %', r.loai;
  END IF;

  UPDATE public.cay_thay_doi
    SET snapshot_cu = snap, da_ap_dung = true, trang_thai = 'da_duyet'
    WHERE id = _id;
  RETURN jsonb_build_object('ok', true);
END;
$function$;

-- 3) Tra cứu định nghĩa trường: thêm phạm vi theo từng thiết bị (ưu tiên cao nhất)
CREATE OR REPLACE FUNCTION public.resolve_field_definitions(_thiet_bi_id uuid)
 RETURNS TABLE(field_key text, nhan text, kieu text, tuy_chon jsonb, pham_vi text, uu_tien integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH tb AS (
    SELECT he_thong_id, nhom_he_thong_id, linh_vuc_id, ma_thiet_bi
    FROM public.thiet_bi WHERE id = _thiet_bi_id
  ),
  matched AS (
    SELECT r.field_key, r.nhan, r.kieu, r.tuy_chon, r.pham_vi,
      CASE r.pham_vi
        WHEN 'thiet_bi' THEN 0
        WHEN 'he_thong' THEN 1
        WHEN 'nhom'     THEN 2
        WHEN 'linh_vuc' THEN 3
        WHEN 'toan_cuc' THEN 4
        ELSE 9
      END AS uu_tien
    FROM public.he_thong_truong r, tb
    WHERE r.hoat_dong = true AND r.ap_dung_lop = 'thiet_bi'
      AND (
        r.pham_vi = 'toan_cuc'
        OR (r.pham_vi = 'thiet_bi' AND r.ap_dung_id = tb.ma_thiet_bi)
        OR (r.pham_vi = 'he_thong' AND r.ap_dung_id = tb.he_thong_id::text)
        OR (r.pham_vi = 'linh_vuc' AND r.ap_dung_id = tb.linh_vuc_id::text)
        OR (r.pham_vi = 'nhom'     AND r.ap_dung_id = tb.nhom_he_thong_id::text)
      )
  )
  SELECT DISTINCT ON (field_key)
    field_key, nhan, kieu, tuy_chon, pham_vi, uu_tien
  FROM matched
  ORDER BY field_key, uu_tien ASC;
$function$;