-- 1) Cột bổ sung cho giấy phép khai thác (idempotent)
ALTER TABLE public.giay_phep_khai_thac
  ADD COLUMN IF NOT EXISTS file_gpkt text,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- 2) Cấu hình R2
CREATE TABLE IF NOT EXISTS public.r2_cau_hinh (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  endpoint text,
  account_id text,
  bucket_name text,
  key_prefix text,
  public_base_url text,
  access_key_id text,
  secret_access_key text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.r2_cau_hinh TO service_role;
ALTER TABLE public.r2_cau_hinh ENABLE ROW LEVEL SECURITY;
INSERT INTO public.r2_cau_hinh (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 3) Nhật ký health check lưu trữ
CREATE TABLE IF NOT EXISTS public.luu_tru_health_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backend text NOT NULL CHECK (backend IN ('cloud','r2')),
  ok boolean NOT NULL,
  latency_ms integer,
  message text,
  error_code text,
  detail jsonb,
  nguon text NOT NULL DEFAULT 'manual',
  checked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.luu_tru_health_log TO authenticated;
GRANT ALL ON public.luu_tru_health_log TO service_role;
ALTER TABLE public.luu_tru_health_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin xem nhat ky health check" ON public.luu_tru_health_log;
CREATE POLICY "Admin xem nhat ky health check"
  ON public.luu_tru_health_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_luu_tru_health_log_time
  ON public.luu_tru_health_log (backend, created_at DESC);

-- 4) Backend ngoài + phiên di chuyển
CREATE TABLE IF NOT EXISTS public.supabase_ngoai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ten text NOT NULL,
  url text NOT NULL,
  publishable_key text NOT NULL,
  service_role_key text,
  ghi_chu text,
  kich_hoat boolean NOT NULL DEFAULT false,
  kiem_tra_luc timestamptz,
  kiem_tra_ket_qua jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.supabase_ngoai TO service_role;
ALTER TABLE public.supabase_ngoai ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service role only" ON public.supabase_ngoai;
CREATE POLICY "service role only" ON public.supabase_ngoai
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE UNIQUE INDEX IF NOT EXISTS supabase_ngoai_mot_kich_hoat ON public.supabase_ngoai ((kich_hoat)) WHERE kich_hoat;
DROP TRIGGER IF EXISTS supabase_ngoai_updated_at ON public.supabase_ngoai;
CREATE TRIGGER supabase_ngoai_updated_at
  BEFORE UPDATE ON public.supabase_ngoai
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.supabase_ngoai_job (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ngoai_id uuid NOT NULL REFERENCES public.supabase_ngoai(id) ON DELETE CASCADE,
  che_do text NOT NULL DEFAULT 'that' CHECK (che_do IN ('dry_run','that')),
  trang_thai text NOT NULL DEFAULT 'dang_chay' CHECK (trang_thai IN ('dang_chay','tam_dung','hoan_thanh','that_bai','da_hoan_tac')),
  tong_dong bigint NOT NULL DEFAULT 0,
  da_chuyen bigint NOT NULL DEFAULT 0,
  bat_dau timestamptz NOT NULL DEFAULT now(),
  ket_thuc timestamptz,
  loi text,
  nhat_ky jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.supabase_ngoai_job_bang (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.supabase_ngoai_job(id) ON DELETE CASCADE,
  ten_bang text NOT NULL,
  tong_dong bigint NOT NULL DEFAULT 0,
  da_chuyen bigint NOT NULL DEFAULT 0,
  offset_tiep bigint NOT NULL DEFAULT 0,
  dich_dong_truoc bigint,
  trang_thai text NOT NULL DEFAULT 'cho' CHECK (trang_thai IN ('cho','dang_chay','hoan_thanh','that_bai','bo_qua')),
  loi text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, ten_bang)
);
CREATE INDEX IF NOT EXISTS idx_sn_job_ngoai ON public.supabase_ngoai_job(ngoai_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sn_job_bang_job ON public.supabase_ngoai_job_bang(job_id);
GRANT SELECT ON public.supabase_ngoai_job TO authenticated;
GRANT SELECT ON public.supabase_ngoai_job_bang TO authenticated;
GRANT ALL ON public.supabase_ngoai_job TO service_role;
GRANT ALL ON public.supabase_ngoai_job_bang TO service_role;
ALTER TABLE public.supabase_ngoai_job ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supabase_ngoai_job_bang ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin xem phien di chuyen" ON public.supabase_ngoai_job;
CREATE POLICY "Admin xem phien di chuyen" ON public.supabase_ngoai_job
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admin xem chi tiet phien" ON public.supabase_ngoai_job_bang;
CREATE POLICY "Admin xem chi tiet phien" ON public.supabase_ngoai_job_bang
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS trg_sn_job_updated ON public.supabase_ngoai_job;
CREATE TRIGGER trg_sn_job_updated BEFORE UPDATE ON public.supabase_ngoai_job
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_sn_job_bang_updated ON public.supabase_ngoai_job_bang;
CREATE TRIGGER trg_sn_job_bang_updated BEFORE UPDATE ON public.supabase_ngoai_job_bang
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Hàm ghi nguyên tử
CREATE OR REPLACE FUNCTION public.ghi_su_co_atomic(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.ghi_su_co_atomic(
  p_thiet_bi_id uuid,
  p_hien_tuong text,
  p_ngay_phat_hien timestamptz DEFAULT NULL,
  p_vat_tu jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.ghi_bao_duong_atomic(
  p_thiet_bi_id uuid,
  p_mo_ta text,
  p_ngay_bat_dau timestamptz DEFAULT NULL,
  p_vat_tu jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.ghi_hong_hoc_atomic(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.ghi_hong_hoc_atomic(
  p_thiet_bi_id uuid,
  p_mo_ta_hong_hoc text,
  p_ngay_hong timestamptz DEFAULT NULL,
  p_vat_tu jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

REVOKE ALL ON FUNCTION public.ghi_su_co_atomic(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ghi_su_co_atomic(uuid, text, timestamptz, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ghi_bao_duong_atomic(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ghi_bao_duong_atomic(uuid, text, timestamptz, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ghi_hong_hoc_atomic(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ghi_hong_hoc_atomic(uuid, text, timestamptz, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ghi_su_co_atomic(jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ghi_su_co_atomic(uuid, text, timestamptz, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ghi_bao_duong_atomic(jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ghi_bao_duong_atomic(uuid, text, timestamptz, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ghi_hong_hoc_atomic(jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ghi_hong_hoc_atomic(uuid, text, timestamptz, jsonb) TO authenticated, service_role;

-- 6) Khôi phục dữ liệu theo bảng (admin)
CREATE OR REPLACE FUNCTION public.admin_restore_table(p_table text, p_rows jsonb, p_truncate boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

REVOKE ALL ON FUNCTION public.admin_restore_table(text, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_restore_table(text, jsonb, boolean) TO authenticated, service_role;

-- 7) Ảnh chụp cấu trúc + sinh DDL đồng bộ
CREATE OR REPLACE FUNCTION public.mirats_schema_snapshot()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

REVOKE ALL ON FUNCTION public.mirats_schema_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mirats_schema_snapshot() TO service_role;

CREATE OR REPLACE FUNCTION public.mirats_ddl_dong_bo()
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

REVOKE ALL ON FUNCTION public.mirats_ddl_dong_bo() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mirats_ddl_dong_bo() TO service_role;

-- 8) Chính sách truy cập tệp lưu trữ (idempotent)
DO $$
DECLARE b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['giay-phep-khai-thac','thiet-bi-hinh-anh','thiet-bi-tai-lieu','model-tai-lieu','model-anh','vi-tri-media','chu-ky','form-attachments','nha-san-xuat-logo','chat-files','su-co-images','form-pdf']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b||'_select');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b||'_insert');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b||'_update');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', b||'_delete');
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR SELECT TO authenticated USING (bucket_id = %L)', b||'_select', b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %L)', b||'_insert', b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = %L) WITH CHECK (bucket_id = %L)', b||'_update', b, b);
    EXECUTE format('CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated USING (bucket_id = %L)', b||'_delete', b);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
CREATE POLICY "avatars_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "database_backups_admin_all" ON storage.objects;
CREATE POLICY "database_backups_admin_all" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'database-backups' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'database-backups' AND public.has_role(auth.uid(), 'admin'));