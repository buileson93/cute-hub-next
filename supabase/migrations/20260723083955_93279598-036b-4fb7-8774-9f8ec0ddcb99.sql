CREATE OR REPLACE FUNCTION public.reliability_by_scope(
  p_scope     text,
  p_scope_ids uuid[],
  p_from      timestamptz DEFAULT (now() - INTERVAL '90 days'),
  p_to        timestamptz DEFAULT now()
)
RETURNS TABLE(
  scope_id        uuid,
  downtime_s      bigint,
  failures        int,
  failures_closed int,
  operational_s   bigint,
  mtbf_h          numeric,
  mttr_h          numeric,
  availability    numeric
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_scope NOT IN ('thiet_bi','thanh_phan','he_thong','don_vi') THEN
    RAISE EXCEPTION 'p_scope không hợp lệ: %', p_scope;
  END IF;

  RETURN QUERY
  WITH
  device_scope AS (
    SELECT
      t.id AS thiet_bi_id,
      CASE p_scope
        WHEN 'thiet_bi'   THEN t.id
        WHEN 'thanh_phan' THEN gcn.thanh_phan_id
        WHEN 'he_thong'   THEN htp.he_thong_id
        WHEN 'don_vi'     THEN t.don_vi_id
      END AS scope_id
    FROM thiet_bi t
    LEFT JOIN gan_chuc_nang gcn
      ON p_scope IN ('thanh_phan','he_thong') AND gcn.thiet_bi_id = t.id AND gcn.den_ngay IS NULL
    LEFT JOIN he_thong_thanh_phan htp
      ON p_scope = 'he_thong' AND htp.id = gcn.thanh_phan_id
  ),
  device_scope_filt AS (
    SELECT DISTINCT thiet_bi_id, scope_id
    FROM device_scope
    WHERE scope_id IS NOT NULL
      AND (p_scope_ids IS NULL OR scope_id = ANY(p_scope_ids))
  ),
  events AS (
    SELECT DISTINCT
      dsf.scope_id,
      s.id                                                       AS su_co_id,
      s.at_bat_dau_xu_ly                                         AS d_start,
      s.at_hoan_thanh                                            AS d_end
    FROM su_co s
    JOIN device_scope_filt dsf ON dsf.thiet_bi_id = s.thiet_bi_id
    WHERE s.at_bat_dau_xu_ly IS NOT NULL
      AND s.at_bat_dau_xu_ly <= p_to
      AND (s.at_hoan_thanh IS NULL OR s.at_hoan_thanh >= p_from)
  ),
  clipped AS (
    SELECT
      scope_id,
      su_co_id,
      d_start, d_end,
      GREATEST(
        0,
        EXTRACT(EPOCH FROM (
          LEAST(COALESCE(d_end, p_to), p_to) - GREATEST(d_start, p_from)
        ))
      )::bigint AS downtime_s_i
    FROM events
  ),
  agg AS (
    SELECT
      c.scope_id,
      SUM(c.downtime_s_i)::bigint                                                     AS downtime_s,
      SUM(CASE WHEN c.d_start BETWEEN p_from AND p_to THEN 1 ELSE 0 END)::int          AS failures,
      SUM(CASE WHEN c.d_end IS NOT NULL AND c.d_end BETWEEN p_from AND p_to THEN 1 ELSE 0 END)::int AS failures_closed
    FROM clipped c
    GROUP BY c.scope_id
  ),
  device_count AS (
    SELECT scope_id, COUNT(DISTINCT thiet_bi_id)::bigint AS n_dev
    FROM device_scope_filt
    GROUP BY scope_id
  )
  SELECT
    dc.scope_id,
    COALESCE(a.downtime_s, 0)                                       AS downtime_s,
    COALESCE(a.failures, 0)                                         AS failures,
    COALESCE(a.failures_closed, 0)                                  AS failures_closed,
    (EXTRACT(EPOCH FROM (p_to - p_from))::bigint * dc.n_dev)        AS operational_s,
    CASE WHEN COALESCE(a.failures,0) = 0 THEN NULL
         ELSE ROUND(
           GREATEST(0, (EXTRACT(EPOCH FROM (p_to - p_from))::numeric * dc.n_dev) - COALESCE(a.downtime_s,0))
           / (COALESCE(a.failures,1)::numeric * 3600), 2)
    END                                                             AS mtbf_h,
    CASE WHEN COALESCE(a.failures_closed,0) = 0 THEN NULL
         ELSE ROUND(COALESCE(a.downtime_s,0)::numeric / (a.failures_closed::numeric * 3600), 2)
    END                                                             AS mttr_h,
    CASE WHEN dc.n_dev = 0 OR (p_to <= p_from) THEN NULL
         ELSE ROUND(GREATEST(0,
           1 - COALESCE(a.downtime_s,0)::numeric
             / (EXTRACT(EPOCH FROM (p_to - p_from))::numeric * dc.n_dev)
         ), 4)
    END                                                             AS availability
  FROM device_count dc
  LEFT JOIN agg a USING (scope_id);
END;
$$;

REVOKE ALL ON FUNCTION public.reliability_by_scope(text, uuid[], timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reliability_by_scope(text, uuid[], timestamptz, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.reliability_top_worst(
  p_don_vi_ids uuid[] DEFAULT NULL,
  p_from       timestamptz DEFAULT (now() - INTERVAL '90 days'),
  p_to         timestamptz DEFAULT now(),
  p_limit      int DEFAULT 5
)
RETURNS TABLE(
  thiet_bi_id     uuid,
  ma_thiet_bi     text,
  ten_thiet_bi    text,
  downtime_s      bigint,
  failures        int,
  mttr_h          numeric,
  availability    numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH scope_ids AS (
    SELECT t.id
    FROM thiet_bi t
    WHERE (p_don_vi_ids IS NULL OR t.don_vi_id = ANY(p_don_vi_ids))
  ),
  r AS (
    SELECT * FROM public.reliability_by_scope(
      'thiet_bi',
      (SELECT array_agg(id) FROM scope_ids),
      p_from, p_to
    )
  )
  SELECT
    t.id                                     AS thiet_bi_id,
    t.ma_thiet_bi,
    COALESCE(NULLIF(t.ten_thiet_bi,''), t.ma_thiet_bi) AS ten_thiet_bi,
    r.downtime_s,
    r.failures,
    r.mttr_h,
    r.availability
  FROM r
  JOIN thiet_bi t ON t.id = r.scope_id
  WHERE r.failures > 0
  ORDER BY r.availability NULLS LAST, r.mttr_h DESC NULLS LAST
  LIMIT GREATEST(p_limit, 1);
$$;

REVOKE ALL ON FUNCTION public.reliability_top_worst(uuid[], timestamptz, timestamptz, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reliability_top_worst(uuid[], timestamptz, timestamptz, int) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_su_co_thiet_bi_dxl ON public.su_co (thiet_bi_id, at_bat_dau_xu_ly);
CREATE INDEX IF NOT EXISTS idx_gan_chuc_nang_thiet_bi_open ON public.gan_chuc_nang (thiet_bi_id) WHERE den_ngay IS NULL;