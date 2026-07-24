-- pgTAP: Import tự tạo dm_model khi model chưa tồn tại
-- Kỳ vọng:
--  * Thiết bị mới có model_id trỏ tới dm_model mới tạo (không NULL)
--  * loai_thiet_bi_id trên thiết bị KHÔNG bị ép về NULL khi dm_model mới chưa có loại
--  * Trigger trg_thiet_bi_require_model_biu chặn INSERT thiếu model_id
begin;
select plan(5);

-- Chuẩn bị: một loại thiết bị và hãng sẵn có
insert into public.dm_loai_thiet_bi(id, ma, ten) values ('11111111-1111-1111-1111-111111111111','TEST_LOAI','Loại test')
  on conflict (id) do nothing;
insert into public.dm_nha_san_xuat(id, ma, ten) values ('22222222-2222-2222-2222-222222222222','TEST_NSX','NSX test')
  on conflict (id) do nothing;

-- 1) INSERT thiet_bi không có model_id → phải bị chặn
select throws_ok(
  $$ insert into public.thiet_bi(ma_thiet_bi, ten_thiet_bi, loai_thiet_bi_id)
       values ('TB_TEST_NULLMODEL','TB test không model','11111111-1111-1111-1111-111111111111') $$,
  NULL, NULL,
  'INSERT thiet_bi không có model_id phải bị chặn'
);

-- 2) Tạo dm_model mới (shell) — không có loai_thiet_bi_id
insert into public.dm_model(id, ma, ten)
values ('33333333-3333-3333-3333-333333333333','MODEL_AUTO_TEST','Model tự tạo test');

select ok(
  exists(select 1 from public.dm_model where id = '33333333-3333-3333-3333-333333333333' and loai_thiet_bi_id is null),
  'dm_model shell tồn tại với loai_thiet_bi_id NULL'
);

-- 3) INSERT thiet_bi trỏ vào model shell + khai loai_thiet_bi_id tay
insert into public.thiet_bi(ma_thiet_bi, ten_thiet_bi, model_id, loai_thiet_bi_id)
values ('TB_TEST_AUTO','TB test auto','33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111');

select is(
  (select model_id from public.thiet_bi where ma_thiet_bi = 'TB_TEST_AUTO'),
  '33333333-3333-3333-3333-333333333333'::uuid,
  'model_id được giữ đúng sau INSERT'
);

select is(
  (select loai_thiet_bi_id from public.thiet_bi where ma_thiet_bi = 'TB_TEST_AUTO'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'loai_thiet_bi_id KHÔNG bị ép về NULL khi model chưa có loại'
);

-- 4) Cập nhật loai_thiet_bi_id cho model → cascade đúng xuống thiết bị
update public.dm_model set loai_thiet_bi_id = '11111111-1111-1111-1111-111111111111'
where id = '33333333-3333-3333-3333-333333333333';

select is(
  (select loai_thiet_bi_id from public.thiet_bi where ma_thiet_bi = 'TB_TEST_AUTO'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Cascade từ dm_model.loai_thiet_bi_id xuống thiet_bi khớp'
);

select * from finish();
rollback;
