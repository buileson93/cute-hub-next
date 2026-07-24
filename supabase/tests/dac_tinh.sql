-- TASK 55: pgTAP tests for Đặc tính (multi-value tags at Model layer).
-- Verifies schema, view semantics, seed catalog, and RLS on dm_dac_tinh / dm_model_dac_tinh.

BEGIN;
SELECT plan(14);

-- 1) Existence
SELECT has_table('public', 'dm_dac_tinh', 'Bảng dm_dac_tinh tồn tại');
SELECT has_table('public', 'dm_model_dac_tinh', 'Bảng nối dm_model_dac_tinh tồn tại');
SELECT has_view ('public', 'v_thiet_bi_dac_tinh', 'View v_thiet_bi_dac_tinh tồn tại');

-- 2) Nhom constraint
SELECT col_has_check('public', 'dm_dac_tinh', 'nhom', 'Cột nhom có CHECK constraint');

-- 3) Seed đủ 11 mã chuẩn, gom theo nhom
SELECT is(
  (SELECT count(*)::int FROM public.dm_dac_tinh
   WHERE ma IN ('THU','PHAT','GHI_AM','DIEU_TAN','KHUECH_DAI','DO_LUONG',
                'VHF','HF','UHF','CHONG_SET','NGUON_DIEN')),
  11,
  'Seed đủ 11 đặc tính chuẩn'
);
SELECT is(
  (SELECT count(*)::int FROM public.dm_dac_tinh WHERE nhom='chuc_nang'),
  6, 'Nhóm chuc_nang có 6 mã'
);
SELECT is(
  (SELECT count(*)::int FROM public.dm_dac_tinh WHERE nhom='bang_tan'),
  3, 'Nhóm bang_tan có 3 mã'
);
SELECT is(
  (SELECT count(*)::int FROM public.dm_dac_tinh WHERE nhom='khac'),
  2, 'Nhóm khac có 2 mã'
);

-- 4) Không backfill từ loại: bảng nối rỗng ngay sau migration
SELECT is(
  (SELECT count(*)::int FROM public.dm_model_dac_tinh),
  0,
  'Không có bản ghi mapping nào được tạo tự động (không backfill từ loại)'
);

-- 5) View trả đặc tính của thiết bị qua Mẫu — sandbox setup
--    Tạo model tạm, thiết bị tạm, gán 1 đặc tính rồi kiểm tra view.
DO $$
DECLARE
  v_model uuid;
  v_tb    uuid;
  v_dt    uuid;
BEGIN
  SELECT id INTO v_dt FROM public.dm_dac_tinh WHERE ma='VHF';

  INSERT INTO public.dm_model (ma, ten)
  VALUES ('__TEST_MODEL_DT__', '__test_model_dt__')
  RETURNING id INTO v_model;

  INSERT INTO public.thiet_bi (ma_thiet_bi, ten_thiet_bi, model_id)
  VALUES ('__TEST_TB_DT__', '__test_tb_dt__', v_model)
  RETURNING id INTO v_tb;

  INSERT INTO public.dm_model_dac_tinh (model_id, dac_tinh_id)
  VALUES (v_model, v_dt);

  PERFORM set_config('mirats.test_tb', v_tb::text, true);
  PERFORM set_config('mirats.test_model', v_model::text, true);
  PERFORM set_config('mirats.test_dt', v_dt::text, true);
END $$;

SELECT is(
  (SELECT count(*)::int
     FROM public.v_thiet_bi_dac_tinh
     WHERE thiet_bi_id = current_setting('mirats.test_tb')::uuid
       AND dac_tinh_id = current_setting('mirats.test_dt')::uuid),
  1,
  'View v_thiet_bi_dac_tinh trả đúng đặc tính của thiết bị qua Mẫu'
);

-- 6) RLS: policies tồn tại (ktv không ghi được, admin/phong_kt ghi được)
SELECT policies_are(
  'public', 'dm_dac_tinh',
  ARRAY['dm_dac_tinh_read_active', 'dm_dac_tinh_write_manager'],
  'dm_dac_tinh có đúng 2 policy: read active + write manager'
);
SELECT policies_are(
  'public', 'dm_model_dac_tinh',
  ARRAY['dm_model_dac_tinh_read_active', 'dm_model_dac_tinh_write_manager'],
  'dm_model_dac_tinh có đúng 2 policy: read active + write manager'
);

-- 7) RLS enabled
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid='public.dm_dac_tinh'::regclass),
  true,
  'RLS bật trên dm_dac_tinh'
);
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid='public.dm_model_dac_tinh'::regclass),
  true,
  'RLS bật trên dm_model_dac_tinh'
);

-- 8) KHÔNG đụng loại: dm_loai_thiet_bi và thiet_bi.loai_thiet_bi_id vẫn nguyên
SELECT has_column('public', 'thiet_bi', 'loai_thiet_bi_id',
  'loai_thiet_bi_id vẫn tồn tại — task không đụng loại');

-- Cleanup sandbox
DELETE FROM public.thiet_bi WHERE ma_thiet_bi='__TEST_TB_DT__';
DELETE FROM public.dm_model  WHERE ma='__TEST_MODEL_DT__';

SELECT * FROM finish();
ROLLBACK;
