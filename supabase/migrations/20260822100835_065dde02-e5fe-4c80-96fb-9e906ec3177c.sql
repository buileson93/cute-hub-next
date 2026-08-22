-- Formalizing v_giay_phep from dump to official migration
-- This view gộp cả giay_phep (tài sản) và giay_phep_khai_thac (hệ thống)
-- WITH (security_invoker = 'on') ensures it respects underlying RLS

CREATE OR REPLACE VIEW public.v_giay_phep WITH (security_invoker = 'on') AS
 WITH base AS (
         SELECT g.id,
            'giay_phep'::text AS nguon,
            COALESCE(g.so_giay_phep, g.ma_giay_phep) AS so_giay_phep,
            g.ma_giay_phep,
            COALESCE(lg.ten, 'Giấy phép'::text) AS loai,
            lg.ma AS loai_ma,
            g.ngay_cap,
            g.ngay_het_han,
            nc.ten AS noi_cap,
            g.file_giay_phep AS file_url,
            g.ghi_chu,
            NULL::text AS gp_cu,
            'thiet_bi'::text AS pham_vi,
            g.thiet_bi_id,
            NULL::uuid AS he_thong_id,
            tb.don_vi_id,
            dv.ma AS don_vi_ma,
            dv.ten AS don_vi_ten,
            COALESCE(tb.ten_thiet_bi, tb.ma_thiet_bi) AS ten_doi_tuong,
            NULL::text AS kieu_thiet_bi,
            g.created_at,
            g.updated_at
           FROM ((((public.giay_phep g
             LEFT JOIN public.dm_loai_giay_phep lg ON ((lg.id = g.loai_giay_phep_id)))
             LEFT JOIN public.dm_noi_cap nc ON ((nc.id = g.noi_cap_id)))
             LEFT JOIN public.thiet_bi tb ON ((tb.id = g.thiet_bi_id)))
             LEFT JOIN public.dm_don_vi dv ON ((dv.id = tb.don_vi_id)))
        UNION ALL
         SELECT k.id,
            'gpkt'::text AS nguon,
            k.gp_so AS so_giay_phep,
            k.gp_so AS ma_giay_phep,
            'Giấy phép khai thác'::text AS loai,
            'GPKT'::text AS loai_ma,
            public.parse_vn_date(k.gp_ngay) AS ngay_cap,
            public.parse_vn_date(k.gp_han) AS ngay_het_han,
            k.dia_diem AS noi_cap,
            k.file_gpkt AS file_url,
            k.muc_dich AS ghi_chu,
            k.gp_cu,
            'he_thong'::text AS pham_vi,
            NULL::uuid AS thiet_bi_id,
            k.he_thong_id,
            ht.don_vi_id,
            dv.ma AS don_vi_ma,
            COALESCE(dv.ten, k.don_vi) AS don_vi_ten,
            COALESCE(k.ten_he_thong_theo_gp, ht.ten) AS ten_doi_tuong,
            k.kieu_thiet_bi,
            k.created_at,
            k.updated_at
           FROM ((public.giay_phep_khai_thac k
             LEFT JOIN public.dm_he_thong ht ON ((ht.id = k.he_thong_id)))
             LEFT JOIN public.dm_don_vi dv ON ((dv.id = ht.don_vi_id)))
        )
 SELECT b.id,
    b.nguon,
    b.so_giay_phep,
    b.ma_giay_phep,
    b.loai,
    b.loai_ma,
    b.ngay_cap,
    b.ngay_het_han,
    b.noi_cap,
    b.file_url,
    b.ghi_chu,
    b.gp_cu,
    b.pham_vi,
    b.thiet_bi_id,
    b.he_thong_id,
    b.don_vi_id,
    b.don_vi_ma,
    b.don_vi_ten,
    b.ten_doi_tuong,
    b.kieu_thiet_bi,
    b.created_at,
    b.updated_at,
    (b.ngay_het_han - CURRENT_DATE) AS so_ngay_con_lai,
        CASE
            WHEN (b.ngay_het_han IS NULL) THEN 'none'::text
            WHEN (b.ngay_het_han < CURRENT_DATE) THEN 'expired'::text
            WHEN (b.ngay_het_han <= (CURRENT_DATE + 60)) THEN 'expiring'::text
            ELSE 'valid'::text
        END AS trang_thai,
    (EXISTS ( SELECT 1
           FROM base b2
          WHERE ((b2.gp_cu IS NOT NULL) AND (b2.id <> b.id) AND (btrim(b2.gp_cu) = btrim(b.so_giay_phep))))) AS bi_thay_the
   FROM base b;

-- GRANTS
GRANT SELECT ON public.v_giay_phep TO authenticated;
GRANT ALL ON public.v_giay_phep TO service_role;
