-- Chỉ sửa hệ thống AMHS: hoán đổi tên thành phần (vai trò) và tên thiết bị (máy cụ thể)
CREATE TEMP TABLE _amhs_swap AS
SELECT htp.id AS tp_id, htp.ten AS tp_ten, tb.id AS tb_id, tb.ten_thiet_bi AS tb_ten
FROM he_thong_thanh_phan htp
JOIN gan_chuc_nang gc ON gc.thanh_phan_id = htp.id AND gc.den_ngay IS NULL
JOIN thiet_bi tb ON tb.id = gc.thiet_bi_id
WHERE htp.he_thong_id = (SELECT id FROM dm_he_thong WHERE ten ILIKE '%AMHS%' LIMIT 1);

-- Thành phần nhận tên vai trò (đang nằm ở thiết bị)
UPDATE he_thong_thanh_phan h
SET ten = s.tb_ten, updated_at = now()
FROM _amhs_swap s
WHERE h.id = s.tp_id;

-- Thiết bị nhận tên máy cụ thể (đang nằm ở thành phần)
UPDATE thiet_bi t
SET ten_thiet_bi = s.tp_ten, updated_at = now()
FROM _amhs_swap s
WHERE t.id = s.tb_id;

DROP TABLE _amhs_swap;