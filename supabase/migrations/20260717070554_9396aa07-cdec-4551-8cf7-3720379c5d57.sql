-- 1) Suy từ hậu tố mã (CLA/CRA/DAN/PBA/PCA/PLK/THO)
UPDATE public.dm_he_thong h
SET don_vi_id = dv.id
FROM public.dm_don_vi dv
WHERE h.don_vi_id IS NULL
  AND h.ma ~ ('_' || dv.ma || '$')
  AND dv.ma IN ('CLA','CRA','DAN','PBA','PCA','PLK','THO');

-- UPKL nằm ở đơn vị PBA (đã xác nhận qua tài sản đang lắp)
UPDATE public.dm_he_thong
SET don_vi_id = (SELECT id FROM public.dm_don_vi WHERE ma = 'PBA' LIMIT 1)
WHERE don_vi_id IS NULL AND ma = 'MAY_VHF_UPKL';

-- 2) Với các hệ thống chưa gán mà có tài sản đang lắp: lấy đơn vị phổ biến nhất từ tài sản
WITH cand AS (
  SELECT t.he_thong_id, t.don_vi_id, COUNT(*) AS c,
         ROW_NUMBER() OVER (PARTITION BY t.he_thong_id ORDER BY COUNT(*) DESC) AS rn
  FROM public.thiet_bi t
  JOIN public.dm_he_thong h ON h.id = t.he_thong_id
  WHERE h.don_vi_id IS NULL AND t.don_vi_id IS NOT NULL
  GROUP BY t.he_thong_id, t.don_vi_id
)
UPDATE public.dm_he_thong h
SET don_vi_id = c.don_vi_id
FROM cand c
WHERE c.rn = 1 AND h.id = c.he_thong_id AND h.don_vi_id IS NULL;