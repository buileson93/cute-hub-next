DROP VIEW IF EXISTS public.v_do_thi_he_thong;

CREATE VIEW public.v_do_thi_he_thong
WITH (security_invoker = on) AS
SELECT
  lk.id,
  lk.he_thong_nguon_id AS nguon_id,
  hn.ten               AS nguon_ten,
  nhn.ten              AS nguon_nhom,
  dvn.ten              AS nguon_don_vi,
  lk.he_thong_dich_id  AS dich_id,
  hd.ten               AS dich_ten,
  nhd.ten              AS dich_nhom,
  dvd.ten              AS dich_don_vi,
  lk.loai_lien_ket_id,
  llk.ma               AS loai_ma,
  llk.ten              AS loai_ten,
  llk.mau_sac,
  llk.kieu_net,
  lk.lop,
  lk.huong,
  lk.vai_tro_du_phong,
  lk.giao_dien_nguon,
  lk.giao_dien_dich,
  lk.giao_thuc,
  lk.trang_thai,
  lk.don_vi_id_snapshot
FROM public.lien_ket_he_thong lk
JOIN public.dm_he_thong hn ON hn.id = lk.he_thong_nguon_id
JOIN public.dm_he_thong hd ON hd.id = lk.he_thong_dich_id
JOIN public.dm_loai_lien_ket llk ON llk.id = lk.loai_lien_ket_id
LEFT JOIN public.dm_nhom_he_thong nhn ON nhn.id = hn.nhom_he_thong_id
LEFT JOIN public.dm_nhom_he_thong nhd ON nhd.id = hd.nhom_he_thong_id
LEFT JOIN public.dm_don_vi dvn ON dvn.id = hn.don_vi_id
LEFT JOIN public.dm_don_vi dvd ON dvd.id = hd.don_vi_id;

GRANT SELECT ON public.v_do_thi_he_thong TO authenticated;