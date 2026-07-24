-- ============================================================================
-- T14 — Hợp nhất giấy phép / tuân thủ vào MỘT read model duy nhất.
-- Trước T14: trang Giấy phép đọc `giay_phep_khai_thac`, còn widget/sắp-hết-hạn
-- đọc `giay_phep`. Hai nguồn -> đếm trùng, cảnh báo mâu thuẫn.
-- Sau T14: view v_giay_phep là nguồn chuẩn; mọi UI đọc chung. Không xoá bảng cũ.
-- ============================================================================

-- 1. Hàm chuẩn hoá ngày kiểu Việt Nam (dd/mm/yyyy | yyyy-mm-dd | yyyy) -> date.
CREATE OR REPLACE FUNCTION public.parse_vn_date(t text)
RETURNS date
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN t IS NULL OR btrim(t) = '' THEN NULL
    WHEN btrim(t) ~ '^\d{4}-\d{2}-\d{2}' THEN substr(btrim(t), 1, 10)::date
    WHEN btrim(t) ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN to_date(btrim(t), 'DD/MM/YYYY')
    WHEN btrim(t) ~ '^\d{4}$' THEN to_date(btrim(t) || '-12-31', 'YYYY-MM-DD')
    ELSE NULL
  END;
$$;
GRANT EXECUTE ON FUNCTION public.parse_vn_date(text) TO authenticated, anon, service_role;

-- 2. Read model hợp nhất: một dòng = một document giấy phép, chuẩn cột.
--    security_invoker = tôn trọng RLS của bảng gốc theo người truy vấn.
CREATE OR REPLACE VIEW public.v_giay_phep
WITH (security_invoker = on) AS
WITH base AS (
  -- (a) Giấy phép chuẩn hoá, gắn thiết bị.
  SELECT
    g.id,
    'giay_phep'::text                              AS nguon,
    COALESCE(g.so_giay_phep, g.ma_giay_phep)       AS so_giay_phep,
    g.ma_giay_phep,
    COALESCE(lg.ten, 'Giấy phép')                  AS loai,
    lg.ma                                          AS loai_ma,
    g.ngay_cap                                     AS ngay_cap,
    g.ngay_het_han                                 AS ngay_het_han,
    nc.ten                                         AS noi_cap,
    g.file_giay_phep                               AS file_url,
    g.ghi_chu                                      AS ghi_chu,
    NULL::text                                     AS gp_cu,
    'thiet_bi'::text                               AS pham_vi,
    g.thiet_bi_id                                  AS thiet_bi_id,
    NULL::uuid                                     AS he_thong_id,
    tb.don_vi_id                                   AS don_vi_id,
    dv.ma                                          AS don_vi_ma,
    dv.ten                                         AS don_vi_ten,
    COALESCE(tb.ten_thiet_bi, tb.ma_thiet_bi)      AS ten_doi_tuong,
    NULL::text                                     AS kieu_thiet_bi,
    g.created_at, g.updated_at
  FROM public.giay_phep g
  LEFT JOIN public.dm_loai_giay_phep lg ON lg.id = g.loai_giay_phep_id
  LEFT JOIN public.dm_noi_cap        nc ON nc.id = g.noi_cap_id
  LEFT JOIN public.thiet_bi          tb ON tb.id = g.thiet_bi_id
  LEFT JOIN public.dm_don_vi         dv ON dv.id = tb.don_vi_id

  UNION ALL

  -- (b) Giấy phép khai thác, gắn hệ thống (FK link thắng phần mô tả text).
  SELECT
    k.id,
    'gpkt'::text,
    k.gp_so,
    k.gp_so,
    'Giấy phép khai thác',
    'GPKT',
    public.parse_vn_date(k.gp_ngay),
    public.parse_vn_date(k.gp_han),
    k.dia_diem,
    NULL::text,
    k.muc_dich,
    k.gp_cu,
    'he_thong'::text,
    NULL::uuid,
    k.he_thong_id,
    ht.don_vi_id,
    dv.ma,
    COALESCE(dv.ten, k.don_vi),
    COALESCE(k.ten_he_thong_theo_gp, ht.ten),
    k.kieu_thiet_bi,
    k.created_at, k.updated_at
  FROM public.giay_phep_khai_thac k
  LEFT JOIN public.dm_he_thong ht ON ht.id = k.he_thong_id
  LEFT JOIN public.dm_don_vi   dv ON dv.id = ht.don_vi_id
)
SELECT
  b.*,
  (b.ngay_het_han - CURRENT_DATE) AS so_ngay_con_lai,
  CASE
    WHEN b.ngay_het_han IS NULL              THEN 'none'
    WHEN b.ngay_het_han <  CURRENT_DATE      THEN 'expired'
    WHEN b.ngay_het_han <= CURRENT_DATE + 60 THEN 'expiring'
    ELSE 'valid'
  END AS trang_thai,
  -- Bị thay thế nếu có document khác trỏ gp_cu về số của dòng này (renewal history).
  EXISTS (
    SELECT 1 FROM base b2
    WHERE b2.gp_cu IS NOT NULL
      AND b2.id <> b.id
      AND btrim(b2.gp_cu) = btrim(b.so_giay_phep)
  ) AS bi_thay_the
FROM base b;

GRANT SELECT ON public.v_giay_phep TO authenticated, service_role;

-- 3. Sắp hết hạn: dùng chung nguồn hợp nhất, loại document đã bị thay thế.
CREATE OR REPLACE VIEW public.v_sap_het_han
WITH (security_invoker = on) AS
SELECT
  'bao_hanh'::text AS loai,
  t.id             AS thiet_bi_id,
  COALESCE(t.ten_thiet_bi, t.ma_thiet_bi) AS ten,
  t.han_bao_hanh   AS ngay_het_han,
  (t.han_bao_hanh - CURRENT_DATE) AS so_ngay_con_lai
FROM public.thiet_bi t
WHERE t.han_bao_hanh IS NOT NULL

UNION ALL

SELECT
  'giay_phep'::text,
  v.thiet_bi_id,
  COALESCE(v.so_giay_phep, v.ten_doi_tuong) AS ten,
  v.ngay_het_han,
  v.so_ngay_con_lai
FROM public.v_giay_phep v
WHERE v.ngay_het_han IS NOT NULL
  AND v.bi_thay_the = false;

GRANT SELECT ON public.v_sap_het_han TO authenticated, service_role;