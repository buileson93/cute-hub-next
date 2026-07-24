
-- T07: Báo cáo đối soát dữ liệu (read-only). Không UPDATE/DELETE, không chọn giá trị thắng.

CREATE OR REPLACE VIEW public.v_doi_soat_du_lieu AS
SELECT 'HIERARCHY_NHOM'::text AS loai_conflict, 'thiet_bi'::text AS bang, tb.id AS id, tb.ma_thiet_bi AS ma,
  ('thiet_bi.nhom_he_thong_id=' || COALESCE(tb.nhom_he_thong_id::text,'∅')
    || ' ≠ he_thong.nhom_he_thong_id=' || COALESCE(ht.nhom_he_thong_id::text,'∅'))::text AS chi_tiet
FROM public.thiet_bi tb JOIN public.dm_he_thong ht ON ht.id = tb.he_thong_id
WHERE tb.nhom_he_thong_id IS DISTINCT FROM ht.nhom_he_thong_id

UNION ALL
SELECT 'HIERARCHY_PHAN_LOAI','thiet_bi', tb.id, tb.ma_thiet_bi,
  ('thiet_bi.phan_loai_id=' || COALESCE(tb.phan_loai_id::text,'∅')
    || ' ≠ he_thong.phan_loai_id=' || COALESCE(ht.phan_loai_id::text,'∅'))
FROM public.thiet_bi tb JOIN public.dm_he_thong ht ON ht.id = tb.he_thong_id
WHERE tb.phan_loai_id IS DISTINCT FROM ht.phan_loai_id

UNION ALL
SELECT 'SYSTEM_PHAN_LOAI','dm_he_thong', ht.id, ht.ma,
  ('he_thong.phan_loai_id=' || COALESCE(ht.phan_loai_id::text,'∅')
    || ' ≠ nhom.phan_loai_id=' || COALESCE(nh.phan_loai_id::text,'∅'))
FROM public.dm_he_thong ht JOIN public.dm_nhom_he_thong nh ON nh.id = ht.nhom_he_thong_id
WHERE ht.phan_loai_id IS DISTINCT FROM nh.phan_loai_id

UNION ALL
SELECT 'MODEL_TEXT','thiet_bi', tb.id, tb.ma_thiet_bi,
  ('model(text)="' || COALESCE(tb.model,'∅') || '" ≠ dm_model="' || COALESCE(m.ten,'∅') || '"')
FROM public.thiet_bi tb JOIN public.dm_model m ON m.id = tb.model_id
WHERE tb.model IS NOT NULL AND btrim(tb.model) <> '' AND tb.model IS DISTINCT FROM m.ten

UNION ALL
SELECT 'MFR_TEXT','thiet_bi', tb.id, tb.ma_thiet_bi,
  ('nha_san_xuat(text)="' || COALESCE(tb.nha_san_xuat,'∅') || '" ≠ dm_nha_san_xuat="' || COALESCE(nsx.ten,'∅') || '"')
FROM public.thiet_bi tb JOIN public.dm_nha_san_xuat nsx ON nsx.id = tb.nha_san_xuat_id
WHERE tb.nha_san_xuat IS NOT NULL AND btrim(tb.nha_san_xuat) <> '' AND tb.nha_san_xuat IS DISTINCT FROM nsx.ten

UNION ALL
SELECT 'SUPPLIER_TEXT','thiet_bi', tb.id, tb.ma_thiet_bi,
  ('nha_cung_cap(text)="' || COALESCE(tb.nha_cung_cap,'∅') || '" ≠ dm_nha_cung_cap="' || COALESCE(ncc.ten,'∅') || '"')
FROM public.thiet_bi tb JOIN public.dm_nha_cung_cap ncc ON ncc.id = tb.nha_cung_cap_id
WHERE tb.nha_cung_cap IS NOT NULL AND btrim(tb.nha_cung_cap) <> '' AND tb.nha_cung_cap IS DISTINCT FROM ncc.ten

UNION ALL
SELECT 'LOCATION_TEXT','thiet_bi', tb.id, tb.ma_thiet_bi,
  ('vi_tri(text)="' || COALESCE(tb.vi_tri,'∅') || '" ≠ dm_vi_tri="' || COALESCE(vt.ten,'∅') || '"')
FROM public.thiet_bi tb JOIN public.dm_vi_tri vt ON vt.id = tb.vi_tri_id
WHERE tb.vi_tri IS NOT NULL AND btrim(tb.vi_tri) <> '' AND tb.vi_tri IS DISTINCT FROM vt.ten

UNION ALL
SELECT 'LOCATION_UNLINKED','thiet_bi', tb.id, tb.ma_thiet_bi,
  ('vi_tri(text)="' || tb.vi_tri || '" nhưng vi_tri_id=∅')
FROM public.thiet_bi tb
WHERE tb.vi_tri IS NOT NULL AND btrim(tb.vi_tri) <> '' AND tb.vi_tri_id IS NULL

UNION ALL
SELECT 'JSONB_INVALID','thiet_bi', tb.id, tb.ma_thiet_bi,
  ('thuoc_tinh không phải object: type=' || jsonb_typeof(tb.thuoc_tinh))
FROM public.thiet_bi tb
WHERE tb.thuoc_tinh IS NOT NULL AND jsonb_typeof(tb.thuoc_tinh) <> 'object';

ALTER VIEW public.v_doi_soat_du_lieu SET (security_invoker = true);

CREATE OR REPLACE VIEW public.v_doi_soat_tong_hop AS
SELECT loai_conflict, count(*) AS so_ban_ghi
FROM public.v_doi_soat_du_lieu
GROUP BY loai_conflict
ORDER BY count(*) DESC;

ALTER VIEW public.v_doi_soat_tong_hop SET (security_invoker = true);

GRANT SELECT ON public.v_doi_soat_du_lieu TO authenticated, service_role;
GRANT SELECT ON public.v_doi_soat_tong_hop TO authenticated, service_role;
