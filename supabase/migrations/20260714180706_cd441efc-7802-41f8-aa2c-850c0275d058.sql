CREATE OR REPLACE VIEW public.v_tuoi_tho AS
SELECT
  t.id,
  t.ma_thiet_bi,
  t.nam_san_xuat,
  t.nam_dua_vao_khai_thac,
  t.so_nam_su_dung AS tuoi_tho_thiet_ke_nam,
  t.ty_le_tuoi_tho AS ty_le_tuoi_tho_nhap_tay,
  COALESCE(NULLIF(t.nam_dua_vao_khai_thac, 0), NULLIF(t.nam_san_xuat, 0)) AS nam_goc,
  CASE
    WHEN t.so_nam_su_dung IS NULL OR t.so_nam_su_dung <= 0 THEN NULL
    WHEN COALESCE(NULLIF(t.nam_dua_vao_khai_thac, 0), NULLIF(t.nam_san_xuat, 0)) IS NULL THEN NULL
    ELSE LEAST(100, GREATEST(0,
      ROUND(((EXTRACT(YEAR FROM now())::int
              - COALESCE(NULLIF(t.nam_dua_vao_khai_thac, 0), NULLIF(t.nam_san_xuat, 0)))::numeric
             / t.so_nam_su_dung) * 100)
    ))
  END::int AS ty_le_tuoi_tho,
  CASE
    WHEN t.so_nam_su_dung IS NULL OR t.so_nam_su_dung <= 0 THEN NULL
    WHEN NULLIF(t.nam_dua_vao_khai_thac, 0) IS NULL THEN NULL
    ELSE GREATEST(0,
      ROUND((t.so_nam_su_dung
             - (EXTRACT(YEAR FROM now())::int - t.nam_dua_vao_khai_thac))::numeric, 1)
    )
  END AS tuoi_tho_con_lai_nam,
  CASE
    WHEN t.so_nam_su_dung IS NULL OR t.so_nam_su_dung <= 0 THEN NULL
    WHEN NULLIF(t.nam_dua_vao_khai_thac, 0) IS NULL THEN NULL
    ELSE t.nam_dua_vao_khai_thac + t.so_nam_su_dung
  END AS nam_thay_the
FROM public.thiet_bi t;

GRANT SELECT ON public.v_tuoi_tho TO authenticated;
GRANT ALL ON public.v_tuoi_tho TO service_role;

COMMENT ON VIEW public.v_tuoi_tho IS
  'Task 12 — Nguồn duy nhất cho tỷ lệ tuổi thọ / còn lại / năm thay thế. Đồng bộ với src/lib/mirats/lifecycle.ts. Cột thiet_bi.ty_le_tuoi_tho đã deprecated (giữ để tương thích).';
COMMENT ON COLUMN public.thiet_bi.ty_le_tuoi_tho IS
  'DEPRECATED (Task 12): giá trị nhập tay không còn là nguồn sự thật. Đọc public.v_tuoi_tho.ty_le_tuoi_tho.';
