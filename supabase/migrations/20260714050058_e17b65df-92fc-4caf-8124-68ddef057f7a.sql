-- ============================================================================
-- Liên kết hệ thống — SỬA & TỐI ƯU LÕI DB (Prompt 2)
-- Chỉ ALTER / CREATE OR REPLACE / CREATE INDEX. Không đập bảng, không mất dữ liệu.
-- ============================================================================

-- 1) CHUẨN HÓA "ĐANG HIỆU LỰC" THEO THỜI GIAN (SCD2) --------------------------
-- trang_thai chỉ còn là trạng thái VẬN HÀNH ('hoat_dong' | 'tam_ngung').
UPDATE public.lien_ket_he_thong SET trang_thai = 'tam_ngung' WHERE trang_thai = 'ngung';

ALTER TABLE public.lien_ket_he_thong
  DROP CONSTRAINT IF EXISTS lien_ket_he_thong_trang_thai_check;
ALTER TABLE public.lien_ket_he_thong
  ALTER COLUMN trang_thai SET DEFAULT 'hoat_dong';
ALTER TABLE public.lien_ket_he_thong
  ADD CONSTRAINT lien_ket_he_thong_trang_thai_check
  CHECK (trang_thai IN ('hoat_dong','tam_ngung'));

-- Một liên kết ĐANG HIỆU LỰC khi hieu_luc_den IS NULL.
-- Bỏ unique cũ theo trang_thai, tạo lại theo hieu_luc_den IS NULL.
DROP INDEX IF EXISTS public.ux_lkht_canh_hieu_luc;
CREATE UNIQUE INDEX ux_lkht_canh_hieu_luc
  ON public.lien_ket_he_thong (he_thong_nguon_id, he_thong_dich_id, loai_lien_ket_id, lop)
  WHERE hieu_luc_den IS NULL;

-- 2) HƯỚNG CẠNH + LAN TRUYỀN TÁC ĐỘNG (khai ở DANH MỤC) ----------------------
ALTER TABLE public.dm_loai_lien_ket
  ADD COLUMN IF NOT EXISTS co_huong boolean NOT NULL DEFAULT false;
ALTER TABLE public.dm_loai_lien_ket
  ADD COLUMN IF NOT EXISTS lan_truyen_tac_dong boolean NOT NULL DEFAULT true;

-- Quy ước hướng cho cạnh CÓ HƯỚNG: nguồn = bên CUNG CẤP, đích = bên PHỤ THUỘC.
UPDATE public.dm_loai_lien_ket SET co_huong = false, lan_truyen_tac_dong = true  WHERE ma = 'DAU_NOI_VAT_LY';
UPDATE public.dm_loai_lien_ket SET co_huong = false, lan_truyen_tac_dong = true  WHERE ma = 'LUONG_TIN_HIEU';
UPDATE public.dm_loai_lien_ket SET co_huong = true,  lan_truyen_tac_dong = true  WHERE ma = 'PHU_THUOC_DICH_VU';
UPDATE public.dm_loai_lien_ket SET co_huong = false, lan_truyen_tac_dong = false WHERE ma = 'DU_PHONG';

-- 5) INDEX TỐI ƯU TRUY VẤN ĐỒ THỊ --------------------------------------------
CREATE INDEX IF NOT EXISTS ix_lkht_nguon_active
  ON public.lien_ket_he_thong (he_thong_nguon_id) WHERE hieu_luc_den IS NULL;
CREATE INDEX IF NOT EXISTS ix_lkht_dich_active
  ON public.lien_ket_he_thong (he_thong_dich_id) WHERE hieu_luc_den IS NULL;
CREATE INDEX IF NOT EXISTS ix_lkht_loai
  ON public.lien_ket_he_thong (loai_lien_ket_id);
CREATE INDEX IF NOT EXISTS ix_lkht_hieuluc
  ON public.lien_ket_he_thong (hieu_luc_tu, hieu_luc_den);

-- 3) VIEW CẠNH ĐỊNH HƯỚNG (nguồn cho traversal + panel đi ra/đi vào) ----------
DROP VIEW IF EXISTS public.v_canh_dieu_huong;
CREATE VIEW public.v_canh_dieu_huong
WITH (security_invoker = on) AS
-- Cạnh có hướng: 1 dòng tu=nguon -> den=dich
SELECT
  lk.id                 AS lien_ket_id,
  lk.he_thong_nguon_id  AS tu,
  lk.he_thong_dich_id   AS den,
  lk.loai_lien_ket_id,
  llk.ma                AS loai_ma,
  llk.lan_truyen_tac_dong,
  llk.co_huong
FROM public.lien_ket_he_thong lk
JOIN public.dm_loai_lien_ket llk ON llk.id = lk.loai_lien_ket_id
WHERE lk.hieu_luc_den IS NULL AND llk.co_huong = true
UNION ALL
-- Cạnh hai chiều (co_huong=false): 2 dòng (nguon->dich)
SELECT
  lk.id, lk.he_thong_nguon_id, lk.he_thong_dich_id,
  lk.loai_lien_ket_id, llk.ma, llk.lan_truyen_tac_dong, llk.co_huong
FROM public.lien_ket_he_thong lk
JOIN public.dm_loai_lien_ket llk ON llk.id = lk.loai_lien_ket_id
WHERE lk.hieu_luc_den IS NULL AND llk.co_huong = false
UNION ALL
-- Cạnh hai chiều: dòng ngược (dich->nguon)
SELECT
  lk.id, lk.he_thong_dich_id, lk.he_thong_nguon_id,
  lk.loai_lien_ket_id, llk.ma, llk.lan_truyen_tac_dong, llk.co_huong
FROM public.lien_ket_he_thong lk
JOIN public.dm_loai_lien_ket llk ON llk.id = lk.loai_lien_ket_id
WHERE lk.hieu_luc_den IS NULL AND llk.co_huong = false;

GRANT SELECT ON public.v_canh_dieu_huong TO authenticated;

-- 4) PHÂN TÍCH TÁC ĐỘNG AN TOÀN VỚI CHU TRÌNH -------------------------------
-- Chạy trên v_canh_dieu_huong, chỉ theo cạnh lan_truyen_tac_dong=true,
-- mang theo path uuid[] + điều kiện den <> ALL(path) để chặn vòng lặp.
CREATE OR REPLACE FUNCTION public.phan_tich_tac_dong(p_he_thong_id uuid)
RETURNS TABLE (
  he_thong_id uuid,
  ma text,
  ten text,
  do_sau integer,
  duong_dan uuid[]
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH RECURSIVE duyet AS (
    SELECT c.den AS he_thong_id, 1 AS do_sau, ARRAY[p_he_thong_id, c.den] AS duong_dan
    FROM public.v_canh_dieu_huong c
    WHERE c.tu = p_he_thong_id AND c.lan_truyen_tac_dong = true
    UNION
    SELECT c.den, d.do_sau + 1, d.duong_dan || c.den
    FROM public.v_canh_dieu_huong c
    JOIN duyet d ON c.tu = d.he_thong_id
    WHERE c.lan_truyen_tac_dong = true
      AND c.den <> ALL(d.duong_dan)
  )
  SELECT DISTINCT ON (d.he_thong_id)
    d.he_thong_id, ht.ma, ht.ten, d.do_sau, d.duong_dan
  FROM duyet d
  JOIN public.dm_he_thong ht ON ht.id = d.he_thong_id
  WHERE d.he_thong_id <> p_he_thong_id
  ORDER BY d.he_thong_id, d.do_sau ASC;
$$;

GRANT EXECUTE ON FUNCTION public.phan_tich_tac_dong(uuid) TO authenticated;

-- 6) CẬP NHẬT v_do_thi_he_thong: chỉ liên kết đang hiệu lực + cột co_huong ----
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
  llk.co_huong,
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
LEFT JOIN public.dm_don_vi dvd ON dvd.id = hd.don_vi_id
WHERE lk.hieu_luc_den IS NULL;

GRANT SELECT ON public.v_do_thi_he_thong TO authenticated;