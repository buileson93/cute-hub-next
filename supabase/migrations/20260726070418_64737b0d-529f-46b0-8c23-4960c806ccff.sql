-- RPC: KPI + timeline lịch sử tài sản của một Thành phần hệ thống.
-- Chỉ thêm 2 hàm mới; không tạo bảng/view mới nên KHÔNG cần GRANT bảng
-- (tránh grant timeout). Grant EXECUTE cho authenticated + service_role.

CREATE OR REPLACE FUNCTION public.thanh_phan_kpi(_tp_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_so_su_co_12m int := 0;
  v_so_su_co_mo  int := 0;
  v_so_bao_tri_12m int := 0;
  v_so_hong_hoc  int := 0;
  v_so_gan_tong  int := 0;
  v_so_gan_active int := 0;
  v_mtbf_days   numeric;
  v_mttr_hours  numeric;
  v_ti_le_dat   numeric;
  v_by_month    jsonb;
BEGIN
  IF _tp_id IS NULL THEN RETURN '{}'::jsonb; END IF;

  -- Sự cố: đếm trong 12 tháng + đang mở.
  SELECT
    count(*) FILTER (WHERE ngay_phat_hien >= (now() - interval '12 months')),
    count(*) FILTER (WHERE trang_thai IN ('moi','dang_xu_ly') OR thoi_diem_khac_phuc IS NULL)
  INTO v_so_su_co_12m, v_so_su_co_mo
  FROM su_co WHERE thanh_phan_id = _tp_id;

  -- MTBF (ngày) = khoảng giữa các lần sự cố trong 12 tháng.
  SELECT CASE WHEN count(*) > 1
      THEN EXTRACT(EPOCH FROM (max(ngay_phat_hien) - min(ngay_phat_hien))) / 86400.0 / (count(*) - 1)
      ELSE NULL END
  INTO v_mtbf_days
  FROM su_co
  WHERE thanh_phan_id = _tp_id
    AND ngay_phat_hien >= (now() - interval '12 months');

  -- MTTR (giờ) = thời gian TB từ phát hiện đến khắc phục.
  SELECT avg(EXTRACT(EPOCH FROM (thoi_diem_khac_phuc - ngay_phat_hien)) / 3600.0)
  INTO v_mttr_hours
  FROM su_co
  WHERE thanh_phan_id = _tp_id
    AND thoi_diem_khac_phuc IS NOT NULL
    AND ngay_phat_hien IS NOT NULL
    AND ngay_phat_hien >= (now() - interval '12 months');

  -- Bảo dưỡng 12 tháng.
  SELECT count(*) INTO v_so_bao_tri_12m
  FROM bao_tri
  WHERE thanh_phan_id = _tp_id
    AND coalesce(ngay_bat_dau, ngay_hoan_thanh) >= (now() - interval '12 months');

  -- Hỏng hóc (tổng).
  SELECT count(*) INTO v_so_hong_hoc
  FROM hong_hoc WHERE thanh_phan_id = _tp_id;

  -- Số lần gắn tài sản.
  SELECT count(*), count(*) FILTER (WHERE den_ngay IS NULL)
  INTO v_so_gan_tong, v_so_gan_active
  FROM gan_chuc_nang WHERE thanh_phan_id = _tp_id;

  -- Tỉ lệ Đạt của các phiếu bảo dưỡng liên kết thành phần này (nếu có form_submission_item_result).
  SELECT CASE WHEN count(*) > 0
      THEN 100.0 * count(*) FILTER (WHERE ket_qua = 'dat') / count(*)
      ELSE NULL END
  INTO v_ti_le_dat
  FROM form_submission_item_result
  WHERE thanh_phan_id = _tp_id AND ket_qua IS NOT NULL;

  -- Chuỗi sự cố theo tháng (12 tháng gần nhất).
  SELECT coalesce(jsonb_agg(jsonb_build_object('thang', thang, 'so_su_co', c) ORDER BY thang), '[]'::jsonb)
  INTO v_by_month
  FROM (
    SELECT to_char(date_trunc('month', ngay_phat_hien), 'YYYY-MM') AS thang, count(*) AS c
    FROM su_co
    WHERE thanh_phan_id = _tp_id
      AND ngay_phat_hien >= (now() - interval '12 months')
    GROUP BY 1
  ) t;

  RETURN jsonb_build_object(
    'so_su_co_12m', v_so_su_co_12m,
    'so_su_co_mo',  v_so_su_co_mo,
    'so_bao_tri_12m', v_so_bao_tri_12m,
    'so_hong_hoc',  v_so_hong_hoc,
    'so_gan_tong',  v_so_gan_tong,
    'so_gan_active', v_so_gan_active,
    'mtbf_days',    v_mtbf_days,
    'mttr_hours',   v_mttr_hours,
    'ti_le_dat',    v_ti_le_dat,
    'su_co_by_month', v_by_month
  );
END;
$$;

REVOKE ALL ON FUNCTION public.thanh_phan_kpi(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.thanh_phan_kpi(uuid) TO authenticated, service_role;


-- RPC: lịch sử gắn/tháo tài sản của một Thành phần (cho khối Timeline).
CREATE OR REPLACE FUNCTION public.thanh_phan_tai_san_history(_tp_id uuid)
RETURNS TABLE (
  gan_id uuid,
  thiet_bi_id uuid,
  ma_thiet_bi text,
  ten_thiet_bi text,
  ma_serial text,
  tu_ngay timestamptz,
  den_ngay timestamptz,
  ly_do text,
  ghi_chu text,
  dang_lap boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT g.id, g.thiet_bi_id,
         tb.ma_thiet_bi, tb.ten_thiet_bi, tb.ma_serial,
         g.tu_ngay, g.den_ngay, g.ly_do, g.ghi_chu,
         (g.den_ngay IS NULL) AS dang_lap
  FROM gan_chuc_nang g
  JOIN thiet_bi tb ON tb.id = g.thiet_bi_id
  WHERE g.thanh_phan_id = _tp_id
  ORDER BY g.tu_ngay DESC NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.thanh_phan_tai_san_history(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.thanh_phan_tai_san_history(uuid) TO authenticated, service_role;