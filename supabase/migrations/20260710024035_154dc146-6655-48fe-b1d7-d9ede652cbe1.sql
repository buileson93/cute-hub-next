-- View hợp nhất các mục sắp hết hạn: bảo hành thiết bị + giấy phép.
-- SECURITY INVOKER để tôn trọng RLS của bảng gốc (thiet_bi, giay_phep).
CREATE OR REPLACE VIEW public.v_sap_het_han
WITH (security_invoker = true) AS
  SELECT
    'bao_hanh'::text AS loai,
    t.id AS thiet_bi_id,
    COALESCE(t.ten_thiet_bi, t.ma_thiet_bi) AS ten,
    t.han_bao_hanh AS ngay_het_han,
    (t.han_bao_hanh - CURRENT_DATE) AS so_ngay_con_lai
  FROM public.thiet_bi t
  WHERE t.han_bao_hanh IS NOT NULL
  UNION ALL
  SELECT
    'giay_phep'::text AS loai,
    g.thiet_bi_id,
    COALESCE(g.so_giay_phep, g.ma_giay_phep) AS ten,
    g.ngay_het_han,
    (g.ngay_het_han - CURRENT_DATE) AS so_ngay_con_lai
  FROM public.giay_phep g
  WHERE g.ngay_het_han IS NOT NULL;

GRANT SELECT ON public.v_sap_het_han TO authenticated;
GRANT SELECT ON public.v_sap_het_han TO service_role;