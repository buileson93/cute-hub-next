
UPDATE thiet_bi t
SET vi_tri_id = m.matched_id
FROM (
  SELECT t2.ma_thiet_bi,
    (SELECT v.id FROM dm_vi_tri v
       WHERE lower(trim(v.ten)) = lower(trim(t2.vi_tri))
       ORDER BY (v.ma LIKE 'VT_' || replace(coalesce(dv.ma,''),'-','_') || '_%') DESC,
                length(v.ma) DESC
       LIMIT 1) AS matched_id
  FROM thiet_bi t2
  LEFT JOIN dm_don_vi dv ON dv.id = t2.don_vi_id
  WHERE t2.vi_tri IS NOT NULL AND trim(t2.vi_tri) <> '' AND t2.vi_tri_id IS NULL
) m
WHERE t.ma_thiet_bi = m.ma_thiet_bi AND m.matched_id IS NOT NULL;
