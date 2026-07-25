
DROP TABLE IF EXISTS public._dbg_tmp;

DROP POLICY IF EXISTS fss_read_via_submission ON public.form_submission_signature;
DROP POLICY IF EXISTS fss_read_scope ON public.form_submission_signature;
CREATE POLICY fss_read_scope ON public.form_submission_signature
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.form_submission s
    WHERE s.id = form_submission_signature.submission_id
      AND is_active_user(current_uid())
      AND (
        can_manage_equipment(current_uid())
        OR s.created_by = current_uid()
        OR (
          s.status <> 'draft'::form_submission_status
          AND s.don_vi_id IS NOT NULL
          AND s.don_vi_id = get_user_don_vi_id(current_uid())
        )
      )
  ));

CREATE OR REPLACE FUNCTION public._try_date(txt text)
RETURNS date LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE d date;
BEGIN
  IF txt IS NULL OR btrim(txt) = '' THEN RETURN NULL; END IF;
  BEGIN d := to_date(txt, 'DD/MM/YYYY'); RETURN d; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN d := to_date(txt, 'YYYY-MM-DD'); RETURN d; EXCEPTION WHEN OTHERS THEN NULL; END;
  RETURN NULL;
END $$;
GRANT EXECUTE ON FUNCTION public._try_date(text) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.dashboard_brief_today(
  p_don_vi_ids uuid[] DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER STABLE AS $$
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
GRANT EXECUTE ON FUNCTION public.dashboard_brief_today(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.dashboard_health(
  p_don_vi_ids uuid[] DEFAULT NULL,
  p_from date DEFAULT (CURRENT_DATE - 30),
  p_to date DEFAULT CURRENT_DATE
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER STABLE AS $$
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
GRANT EXECUTE ON FUNCTION public.dashboard_health(uuid[], date, date) TO authenticated;

CREATE OR REPLACE FUNCTION public.dashboard_su_co_heatmap(
  p_don_vi_ids uuid[] DEFAULT NULL, p_days int DEFAULT 90
) RETURNS TABLE(dow int, hour int, so_luong int)
LANGUAGE sql SECURITY INVOKER STABLE AS $$
  SELECT EXTRACT(DOW FROM (ngay_phat_hien AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int,
         EXTRACT(HOUR FROM (ngay_phat_hien AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int,
         count(*)::int
    FROM public.su_co
   WHERE ngay_phat_hien >= now() - make_interval(days => p_days)
   GROUP BY 1, 2 ORDER BY 1, 2;
$$;
GRANT EXECUTE ON FUNCTION public.dashboard_su_co_heatmap(uuid[], int) TO authenticated;

CREATE OR REPLACE FUNCTION public.dashboard_expiry_timeline(
  p_don_vi_ids uuid[] DEFAULT NULL, p_days int DEFAULT 90
) RETURNS TABLE(loai text, ref_id uuid, ten text, ngay_het date, days_left int)
LANGUAGE sql SECURITY INVOKER STABLE AS $$
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
GRANT EXECUTE ON FUNCTION public.dashboard_expiry_timeline(uuid[], int) TO authenticated;

CREATE OR REPLACE FUNCTION public.dashboard_top_thiet_bi_hong_lap(
  p_don_vi_ids uuid[] DEFAULT NULL, p_limit int DEFAULT 5
) RETURNS TABLE(thiet_bi_id uuid, ma text, ten text, so_lan int, mttr_h numeric)
LANGUAGE sql SECURITY INVOKER STABLE AS $$
  SELECT s.thiet_bi_id, t.ma_thiet_bi, t.ten_thiet_bi, count(*)::int,
         round(COALESCE(avg(EXTRACT(EPOCH FROM (s.thoi_diem_khac_phuc - s.ngay_phat_hien))/3600.0)
                        FILTER (WHERE s.thoi_diem_khac_phuc IS NOT NULL), 0)::numeric, 1)
    FROM public.su_co s LEFT JOIN public.thiet_bi t ON t.id = s.thiet_bi_id
   WHERE s.thiet_bi_id IS NOT NULL AND s.ngay_phat_hien >= now() - interval '90 days'
   GROUP BY s.thiet_bi_id, t.ma_thiet_bi, t.ten_thiet_bi
  HAVING count(*) >= 2
   ORDER BY 4 DESC, 5 DESC LIMIT p_limit;
$$;
GRANT EXECUTE ON FUNCTION public.dashboard_top_thiet_bi_hong_lap(uuid[], int) TO authenticated;

CREATE OR REPLACE FUNCTION public.dashboard_activity_feed(
  p_don_vi_ids uuid[] DEFAULT NULL, p_limit int DEFAULT 20
) RETURNS TABLE(at timestamptz, loai text, tieu_de text, ref_route text, ref_id uuid)
LANGUAGE sql SECURITY INVOKER STABLE AS $$
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
GRANT EXECUTE ON FUNCTION public.dashboard_activity_feed(uuid[], int) TO authenticated;

DROP FUNCTION IF EXISTS public.dashboard_top_he_thong_su_co(uuid[], int);
CREATE OR REPLACE FUNCTION public.dashboard_top_he_thong_su_co(
  p_don_vi_ids uuid[] DEFAULT NULL, p_limit int DEFAULT 5
) RETURNS TABLE(he_thong_id uuid, ten_he_thong text, so_su_co_mo int, mttr_h numeric)
LANGUAGE sql SECURITY INVOKER STABLE AS $$
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
GRANT EXECUTE ON FUNCTION public.dashboard_top_he_thong_su_co(uuid[], int) TO authenticated;
