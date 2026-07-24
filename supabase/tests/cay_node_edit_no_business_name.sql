-- pgTAP: cay_node_edit không được giữ ten nghiệp vụ cho node thật.
--
-- Chạy sau khi migration `cay_node_edit_null_ten_for_real_nodes` đã áp dụng.
-- Nguồn sự thật (SSoT) tên là các bảng gốc: dm_phan_loai / dm_nhom_he_thong /
-- dm_he_thong / thiet_bi. Cột cay_node_edit.ten CHỈ được phép giữ giá trị cho
-- node nháp (không có bản ghi gốc tương ứng).

BEGIN;
SELECT plan(4);

-- 1) pl: không dòng nào có ten khi tồn tại dm_phan_loai.ma khớp
SELECT is(
  (SELECT COUNT(*)::int FROM public.cay_node_edit c
    WHERE c.kind = 'pl'
      AND c.ten IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.dm_phan_loai t WHERE t.ma = c.ma)),
  0,
  'cay_node_edit(pl).ten phải NULL khi node pl có bản ghi thật'
);

-- 2) nh
SELECT is(
  (SELECT COUNT(*)::int FROM public.cay_node_edit c
    WHERE c.kind = 'nh'
      AND c.ten IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.dm_nhom_he_thong t WHERE t.ma = c.ma)),
  0,
  'cay_node_edit(nh).ten phải NULL khi node nh có bản ghi thật'
);

-- 3) ht
SELECT is(
  (SELECT COUNT(*)::int FROM public.cay_node_edit c
    WHERE c.kind = 'ht'
      AND c.ten IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.dm_he_thong t WHERE t.ma = c.ma)),
  0,
  'cay_node_edit(ht).ten phải NULL khi node ht có bản ghi thật'
);

-- 4) tb — bản ghi thật khớp qua thiet_bi.ma_thiet_bi
SELECT is(
  (SELECT COUNT(*)::int FROM public.cay_node_edit c
    WHERE c.kind = 'tb'
      AND c.ten IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.thiet_bi t WHERE t.ma_thiet_bi = c.ma)),
  0,
  'cay_node_edit(tb).ten phải NULL khi node tb có bản ghi thật (ma_thiet_bi)'
);

SELECT * FROM finish();
ROLLBACK;
