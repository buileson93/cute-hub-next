-- =========================================================================
-- N8 Dashboard KPI — 4 aggregate functions, SECURITY INVOKER (respect RLS)
-- =========================================================================

-- Trạng thái "đang khai thác": ma = 'DANG_KHAI_THAC'
-- Trạng thái "ngừng/hỏng":    ma IN ('NGUNG_KHAI_THAC','HONG','THANH_LY')
-- Sự cố đang mở (N6):         trang_thai IN ('bao_cao','tiep_nhan','dang_xu_ly','cho_vat_tu')

-- --- 5.1 dashboard_kpis ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.dashboard_kpis(
  p_don_vi_ids uuid[] DEFAULT NULL,
  p_from date DEFAULT (current_date - INTERVAL '30 days')::date,
  p_to   date DEFAULT current_date
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH
  tt AS (
    SELECT id, ma FROM dm_trang_thai_thiet_bi
  ),
  tb AS (
    SELECT t.id, t.don_vi_id, t.trang_thai_id
    FROM thiet_bi t
    WHERE (p_don_vi_ids IS NULL OR t.don_vi_id = ANY(p_don_vi_ids))
  ),
  sc AS (
    SELECT s.id, s.trang_thai, s.at_bao_cao, s.he_thong_id
    FROM su_co s
    LEFT JOIN dm_he_thong h ON h.id = s.he_thong_id
    WHERE (p_don_vi_ids IS NULL OR h.don_vi_id = ANY(p_don_vi_ids))
  ),
  pm AS (
    SELECT p.id, p.han, p.trang_thai, p.hoan_thanh_at, p.don_vi_id
    FROM pm_cong_viec p
    WHERE (p_don_vi_ids IS NULL OR p.don_vi_id = ANY(p_don_vi_ids))
  ),
  she AS (
    SELECT v.so_ngay_con_lai FROM v_sap_het_han v
  ),
  gp AS (
    SELECT g.so_ngay_con_lai, g.don_vi_id FROM v_giay_phep g
    WHERE (p_don_vi_ids IS NULL OR g.don_vi_id = ANY(p_don_vi_ids))
  )
  SELECT jsonb_build_object(
    'tong_tai_san',      (SELECT count(*) FROM tb),
    'dang_hoat_dong',    (SELECT count(*) FROM tb JOIN tt ON tt.id = tb.trang_thai_id WHERE tt.ma = 'DANG_KHAI_THAC'),
    'ngung_khai_thac',   (SELECT count(*) FROM tb JOIN tt ON tt.id = tb.trang_thai_id WHERE tt.ma IN ('NGUNG_KHAI_THAC','HONG','THANH_LY')),
    'su_co_mo',          (SELECT count(*) FROM sc WHERE trang_thai IN ('bao_cao','tiep_nhan','dang_xu_ly','cho_vat_tu')),
    'su_co_moi',         (SELECT count(*) FROM sc WHERE at_bao_cao::date BETWEEN p_from AND p_to),
    'pm_den_han',        (SELECT count(*) FROM pm WHERE hoan_thanh_at IS NULL AND han BETWEEN current_date AND (current_date + INTERVAL '7 days')::date),
    'pm_qua_han',        (SELECT count(*) FROM pm WHERE hoan_thanh_at IS NULL AND han < current_date),
    'sap_het_han',       (SELECT count(*) FROM she WHERE so_ngay_con_lai BETWEEN 0 AND 30),
    'qua_han_giay_phep', (SELECT count(*) FROM gp WHERE so_ngay_con_lai < 0)
  );
$$;

REVOKE ALL ON FUNCTION public.dashboard_kpis(uuid[], date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dashboard_kpis(uuid[], date, date) TO authenticated;

-- --- 5.2 dashboard_su_co_by_month ----------------------------------------
CREATE OR REPLACE FUNCTION public.dashboard_su_co_by_month(
  p_don_vi_ids uuid[] DEFAULT NULL,
  p_months int DEFAULT 12
)
RETURNS TABLE(thang date, muc_do text, so_luong int)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH bucket AS (
    SELECT (date_trunc('month', (current_date - make_interval(months => g))) AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS thang
    FROM generate_series(0, GREATEST(p_months, 1) - 1) g
  )
  SELECT
    b.thang,
    COALESCE(NULLIF(TRIM(s.muc_do), ''), 'khac') AS muc_do,
    count(s.id)::int AS so_luong
  FROM bucket b
  LEFT JOIN su_co s
    ON date_trunc('month', COALESCE(s.at_bao_cao, s.created_at) AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = b.thang
   AND (
        p_don_vi_ids IS NULL
     OR EXISTS (SELECT 1 FROM dm_he_thong h WHERE h.id = s.he_thong_id AND h.don_vi_id = ANY(p_don_vi_ids))
   )
  GROUP BY b.thang, COALESCE(NULLIF(TRIM(s.muc_do), ''), 'khac')
  ORDER BY b.thang;
$$;

REVOKE ALL ON FUNCTION public.dashboard_su_co_by_month(uuid[], int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dashboard_su_co_by_month(uuid[], int) TO authenticated;

-- --- 5.3 dashboard_asset_status ------------------------------------------
CREATE OR REPLACE FUNCTION public.dashboard_asset_status(
  p_don_vi_ids uuid[] DEFAULT NULL
)
RETURNS TABLE(trang_thai_ma text, ten text, so_luong int)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(tt.ma, 'KHONG_XAC_DINH')  AS trang_thai_ma,
    COALESCE(tt.ten, 'Không xác định') AS ten,
    count(t.id)::int                    AS so_luong
  FROM thiet_bi t
  LEFT JOIN dm_trang_thai_thiet_bi tt ON tt.id = t.trang_thai_id
  WHERE (p_don_vi_ids IS NULL OR t.don_vi_id = ANY(p_don_vi_ids))
  GROUP BY tt.ma, tt.ten
  ORDER BY count(t.id) DESC;
$$;

REVOKE ALL ON FUNCTION public.dashboard_asset_status(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dashboard_asset_status(uuid[]) TO authenticated;

-- --- 5.4 dashboard_top_he_thong_su_co ------------------------------------
CREATE OR REPLACE FUNCTION public.dashboard_top_he_thong_su_co(
  p_don_vi_ids uuid[] DEFAULT NULL,
  p_limit int DEFAULT 5
)
RETURNS TABLE(he_thong_id uuid, ten_he_thong text, so_su_co_mo int)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    h.id                       AS he_thong_id,
    COALESCE(h.ten, '(không tên)') AS ten_he_thong,
    count(s.id)::int           AS so_su_co_mo
  FROM su_co s
  JOIN dm_he_thong h ON h.id = s.he_thong_id
  WHERE s.trang_thai IN ('bao_cao','tiep_nhan','dang_xu_ly','cho_vat_tu')
    AND (p_don_vi_ids IS NULL OR h.don_vi_id = ANY(p_don_vi_ids))
  GROUP BY h.id, h.ten
  ORDER BY count(s.id) DESC
  LIMIT GREATEST(p_limit, 1);
$$;

REVOKE ALL ON FUNCTION public.dashboard_top_he_thong_su_co(uuid[], int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dashboard_top_he_thong_su_co(uuid[], int) TO authenticated;

-- --- Index gợi ý (idempotent) --------------------------------------------
CREATE INDEX IF NOT EXISTS idx_su_co_at_bao_cao ON public.su_co (at_bao_cao);
CREATE INDEX IF NOT EXISTS idx_su_co_trang_thai_open ON public.su_co (trang_thai)
  WHERE trang_thai IN ('bao_cao','tiep_nhan','dang_xu_ly','cho_vat_tu');
CREATE INDEX IF NOT EXISTS idx_thiet_bi_trang_thai_id ON public.thiet_bi (trang_thai_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_don_vi_id ON public.thiet_bi (don_vi_id);
CREATE INDEX IF NOT EXISTS idx_pm_cong_viec_han ON public.pm_cong_viec (han) WHERE hoan_thanh_at IS NULL;