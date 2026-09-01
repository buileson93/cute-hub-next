ALTER TABLE public.hong_hoc ADD COLUMN IF NOT EXISTS su_co_id uuid REFERENCES public.su_co(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_hong_hoc_su_co_id ON public.hong_hoc(su_co_id);

CREATE OR REPLACE FUNCTION public.ghi_hong_hoc_atomic(p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_ma text := nullif(p_payload->>'ma_hong_hoc','');
  v_tbid uuid; v_id uuid; v_ids uuid[] := '{}'; v_i int := 0;
  v_vt jsonb; v_ma_tb text; v_don_vi text; v_nguoi text[];
  v_tt_ma text; v_su_co_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Chưa đăng nhập'; END IF;
  IF has_role(v_uid, 'readonly'::app_role) AND NOT has_role(v_uid, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Tài khoản chỉ đọc không được ghi hỏng hóc';
  END IF;
  IF v_ma IS NULL THEN RAISE EXCEPTION 'Thiếu ma_hong_hoc'; END IF;

  SELECT array_agg(x) INTO v_nguoi
    FROM jsonb_array_elements_text(coalesce(p_payload->'nguoi_thuc_hien','[]'::jsonb)) x;

  v_su_co_id := nullif(p_payload->>'su_co_id','')::uuid;
  IF v_su_co_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.su_co WHERE id = v_su_co_id) THEN
    RAISE EXCEPTION 'Không tìm thấy sự cố có ID %', v_su_co_id;
  END IF;

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
      su_co, su_co_id, ngay_hong, bo_phan_hong, mo_ta_hong_hoc, phuong_an,
      thiet_bi_thay_the, thiet_bi_thay_the_id, nguoi_thuc_hien, don_vi_thuc_hien,
      trang_thai, nguoi_bao_cao_id, at_bao_cao
    ) VALUES (
      CASE WHEN v_i = 1 THEN v_ma ELSE v_ma || '-' || lpad(v_i::text,2,'0') END,
      v_ma_tb, v_tbid,
      nullif(p_payload->>'he_thong_id','')::uuid,
      nullif(p_payload->>'thanh_phan_id','')::uuid,
      nullif(p_payload->>'su_co',''),
      v_su_co_id,
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
$function$;