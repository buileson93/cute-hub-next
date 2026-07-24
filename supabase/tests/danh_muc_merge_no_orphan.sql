-- N1 phase 2 — pgTAP: merge_danh_muc + undo_merge_danh_muc
-- Spec: docs/superpowers/specs/n1-danh-muc-quality.md §7

BEGIN;
SELECT plan(9);

-- ------------------------------------------------------------
-- Seed: 2 nha_san_xuat + 3 model trỏ tới drop_id
-- ------------------------------------------------------------
DO $$
DECLARE
  v_keep uuid := gen_random_uuid();
  v_drop uuid := gen_random_uuid();
  v_loai uuid;
  v_admin uuid := gen_random_uuid();
BEGIN
  -- Tạo user admin ảo
  INSERT INTO auth.users(id, email) VALUES (v_admin, 'admin.n1@test.local')
    ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (v_admin, 'admin');

  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);

  -- Loại thiết bị dùng chung
  INSERT INTO public.dm_loai_thiet_bi(ma, ten) VALUES ('LTB_N1_MERGE', 'Loại test N1 merge')
    RETURNING id INTO v_loai;

  -- 2 nha_san_xuat
  INSERT INTO public.dm_nha_san_xuat(id, ma, ten) VALUES (v_keep, 'NSX_N1_KEEP', 'NSX Keep');
  INSERT INTO public.dm_nha_san_xuat(id, ma, ten) VALUES (v_drop, 'NSX_N1_DROP', 'NSX Drop');

  -- 3 model trỏ tới v_drop
  INSERT INTO public.dm_model(ma, ten, nha_san_xuat_id, loai_thiet_bi_id)
  VALUES
    ('MDL_N1_A','Model A', v_drop, v_loai),
    ('MDL_N1_B','Model B', v_drop, v_loai),
    ('MDL_N1_C','Model C', v_drop, v_loai);

  PERFORM set_config('_test.keep', v_keep::text, false);
  PERFORM set_config('_test.drop', v_drop::text, false);
  PERFORM set_config('_test.admin', v_admin::text, false);
END $$;

-- ------------------------------------------------------------
-- Test 1: RPC tồn tại
-- ------------------------------------------------------------
SELECT has_function('public','merge_danh_muc',
  ARRAY['text','uuid','uuid','text'],
  'merge_danh_muc(text, uuid, uuid, text) exists');

SELECT has_function('public','undo_merge_danh_muc',
  ARRAY['text','uuid'],
  'undo_merge_danh_muc(text, uuid) exists');

-- ------------------------------------------------------------
-- Test 2: Cột merged_into và deactivated_at đã có
-- ------------------------------------------------------------
SELECT has_column('public','dm_nha_san_xuat','merged_into',
  'dm_nha_san_xuat.merged_into exists');
SELECT has_column('public','dm_nha_san_xuat','deactivated_at',
  'dm_nha_san_xuat.deactivated_at exists');

-- ------------------------------------------------------------
-- Test 3: merge → 0 orphan + audit + trạng thái drop
-- ------------------------------------------------------------
DO $$
BEGIN
  PERFORM public.merge_danh_muc(
    'dm_nha_san_xuat',
    (current_setting('_test.keep'))::uuid,
    (current_setting('_test.drop'))::uuid,
    'test merge N1'
  );
END $$;

SELECT is(
  (SELECT count(*)::int FROM public.dm_model
     WHERE nha_san_xuat_id = (current_setting('_test.drop'))::uuid),
  0,
  '3 dm_model không còn trỏ tới drop_id sau merge'
);

SELECT is(
  (SELECT count(*)::int FROM public.dm_model
     WHERE nha_san_xuat_id = (current_setting('_test.keep'))::uuid),
  3,
  '3 dm_model đã trỏ sang keep_id'
);

SELECT is(
  (SELECT active FROM public.dm_nha_san_xuat
     WHERE id = (current_setting('_test.drop'))::uuid),
  false,
  'drop_id bị vô hiệu hoá'
);

SELECT is(
  (SELECT merged_into FROM public.dm_nha_san_xuat
     WHERE id = (current_setting('_test.drop'))::uuid),
  (current_setting('_test.keep'))::uuid,
  'drop_id.merged_into = keep_id'
);

SELECT is(
  (SELECT count(*)::int FROM public.audit_log
     WHERE action='merge_danh_muc'
       AND entity='dm_nha_san_xuat'
       AND entity_id = current_setting('_test.drop')),
  1,
  'Có 1 dòng audit_log merge_danh_muc'
);

-- ------------------------------------------------------------
-- Test 4: Undo khôi phục ngược
-- ------------------------------------------------------------
DO $$
BEGIN
  PERFORM public.undo_merge_danh_muc(
    'dm_nha_san_xuat',
    (current_setting('_test.drop'))::uuid
  );
END $$;

SELECT is(
  (SELECT count(*)::int FROM public.dm_model
     WHERE nha_san_xuat_id = (current_setting('_test.drop'))::uuid),
  3,
  'Undo: 3 dm_model đã trỏ lại drop_id'
);

SELECT is(
  (SELECT active FROM public.dm_nha_san_xuat
     WHERE id = (current_setting('_test.drop'))::uuid),
  true,
  'Undo: drop_id đã được kích hoạt lại'
);

SELECT * FROM finish();
ROLLBACK;
