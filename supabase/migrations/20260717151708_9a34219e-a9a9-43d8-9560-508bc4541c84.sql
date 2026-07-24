-- Dọn cột ten nghiệp vụ sót trong cay_node_edit cho node đã có bản ghi thật.
-- SSoT tên: dm_phan_loai / dm_nhom_he_thong / dm_he_thong / thiet_bi.
-- Idempotent: WHERE ten IS NOT NULL đảm bảo không chạm dòng đã sạch.
-- Không đụng du_lieu (thu_tu, mau, ten_mindmap) và không đụng node nháp
-- (không có bản ghi gốc tương ứng).

UPDATE public.cay_node_edit c
SET ten = NULL
WHERE c.ten IS NOT NULL
  AND c.kind = 'pl'
  AND EXISTS (SELECT 1 FROM public.dm_phan_loai t WHERE t.ma = c.ma);

UPDATE public.cay_node_edit c
SET ten = NULL
WHERE c.ten IS NOT NULL
  AND c.kind = 'nh'
  AND EXISTS (SELECT 1 FROM public.dm_nhom_he_thong t WHERE t.ma = c.ma);

UPDATE public.cay_node_edit c
SET ten = NULL
WHERE c.ten IS NOT NULL
  AND c.kind = 'ht'
  AND EXISTS (SELECT 1 FROM public.dm_he_thong t WHERE t.ma = c.ma);

UPDATE public.cay_node_edit c
SET ten = NULL
WHERE c.ten IS NOT NULL
  AND c.kind = 'tb'
  AND EXISTS (SELECT 1 FROM public.thiet_bi t WHERE t.ma_thiet_bi = c.ma);

COMMENT ON COLUMN public.cay_node_edit.ten IS
  'CHỈ dùng cho node nháp (chưa có bản ghi ở bảng gốc). Với node thật, tên đọc/ghi tại bảng gốc (dm_phan_loai/dm_nhom_he_thong/dm_he_thong/thiet_bi) — xem renameEntity().';
