-- ============================================================================
-- Kiểm thử tích hợp: apply_import_batch / preview_rollback_import_batch /
-- rollback_import_batch.
--
-- Bao phủ: apply thành công, lỗi giữa chừng -> rollback toàn bộ, retry,
-- idempotent, snapshot before/after + target_id, RETIRE không xóa cứng,
-- preview chặn record có lịch sử, rollback khôi phục update/retire và chặn
-- record có dữ liệu phụ thuộc, ghi audit_log.
--
-- Chạy: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/import_apply_rollback.sql
-- Toàn bộ nằm trong 1 giao dịch và ROLLBACK ở cuối -> KHÔNG để lại dữ liệu.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  admin_uid uuid;
  bid uuid;
  ht_upd uuid; ht_ret uuid; ht_keep uuid;
  created_ht uuid;
  res jsonb; prev jsonb;
  cnt int; txt text; ok boolean;
BEGIN
  -- Lấy một admin bất kỳ để mô phỏng ngữ cảnh gọi RPC.
  SELECT user_id INTO admin_uid FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  IF admin_uid IS NULL THEN RAISE EXCEPTION 'setup: cần ít nhất một tài khoản admin'; END IF;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', admin_uid)::text, true);

  -- ---- Seed danh mục để update / retire / keep ----
  INSERT INTO public.dm_he_thong(ma,ten,thu_tu)        VALUES ('TST_UPD','Ten cu',1)          RETURNING id INTO ht_upd;
  INSERT INTO public.dm_he_thong(ma,ten,thu_tu,active) VALUES ('TST_RET','He thong ret',1,true) RETURNING id INTO ht_ret;
  INSERT INTO public.dm_he_thong(ma,ten,thu_tu)        VALUES ('TST_KEEP','He thong keep',1)   RETURNING id INTO ht_keep;

  INSERT INTO public.import_batch(created_by,file_name,file_hash,source,status)
    VALUES (admin_uid,'apply_test.xlsx','APPLY_TEST_HASH','allinone','staged') RETURNING id INTO bid;

  INSERT INTO public.import_item(batch_id,entity,target_table,row_index,action,status,normalized_row) VALUES
    (bid,'dm_nhom_he_thong','dm_nhom_he_thong',1,'create','valid','{"ma":"TST_NHOM","ten":"Nhom test","thu_tu":1}'),
    (bid,'dm_he_thong','dm_he_thong',2,'create','valid','{"ma":"TST_HT","ten":"HT tao moi","thu_tu":1}');
  INSERT INTO public.import_item(batch_id,entity,target_table,row_index,action,status,target_id,normalized_row)
    VALUES (bid,'dm_he_thong','dm_he_thong',3,'update','valid',ht_upd,'{"ten":"Ten moi"}');
  INSERT INTO public.import_item(batch_id,entity,target_table,row_index,action,status,target_id,normalized_row)
    VALUES (bid,'dm_he_thong','dm_he_thong',4,'retire','valid',ht_ret,'{"active":false}');
  INSERT INTO public.import_item(batch_id,entity,target_table,row_index,action,status,target_id,normalized_row)
    VALUES (bid,'dm_he_thong','dm_he_thong',5,'keep','valid',ht_keep,'{}');
  -- Dòng hỏng (target_id không tồn tại) để ép apply thất bại giữa chừng.
  INSERT INTO public.import_item(batch_id,entity,target_table,row_index,action,status,target_id,normalized_row)
    VALUES (bid,'dm_he_thong','dm_he_thong',6,'update','valid',gen_random_uuid(),'{"ten":"x"}');

  -- ---- TEST 1: lỗi giữa chừng -> hoàn tác toàn bộ ----
  BEGIN
    PERFORM public.apply_import_batch(bid, NULL);
    RAISE EXCEPTION 'assert: apply phải lỗi vì có dòng hỏng';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE 'assert:%' THEN RAISE; END IF;
  END;
  SELECT count(*) INTO cnt FROM public.dm_nhom_he_thong WHERE ma='TST_NHOM';
  IF cnt <> 0 THEN RAISE EXCEPTION 'assert TEST1: apply lỗi nhưng vẫn ghi (cnt=%)', cnt; END IF;
  SELECT count(*) INTO cnt FROM public.import_item WHERE batch_id=bid AND applied_at IS NOT NULL;
  IF cnt <> 0 THEN RAISE EXCEPTION 'assert TEST1: có applied_at sau lỗi (cnt=%)', cnt; END IF;
  RAISE NOTICE 'PASS TEST1: lỗi giữa chừng -> rollback toàn bộ';

  -- ---- TEST 2: retry sau khi sửa (bỏ qua dòng hỏng) ----
  UPDATE public.import_item SET status='skipped' WHERE batch_id=bid AND row_index=6;
  res := public.apply_import_batch(bid, NULL);
  IF (res->>'created')::int<>2 OR (res->>'updated')::int<>1
     OR (res->>'retired')::int<>1 OR (res->>'kept')::int<>1 THEN
    RAISE EXCEPTION 'assert TEST2: summary sai: %', res; END IF;
  SELECT id INTO created_ht FROM public.dm_he_thong WHERE ma='TST_HT';
  IF created_ht IS NULL THEN RAISE EXCEPTION 'assert TEST2: TST_HT chưa tạo'; END IF;
  SELECT ten INTO txt FROM public.dm_he_thong WHERE id=ht_upd;
  IF txt<>'Ten moi' THEN RAISE EXCEPTION 'assert TEST2: update chưa áp dụng (%)', txt; END IF;
  SELECT active INTO ok FROM public.dm_he_thong WHERE id=ht_ret;
  IF ok<>false THEN RAISE EXCEPTION 'assert TEST2: retire chưa áp dụng'; END IF;
  RAISE NOTICE 'PASS TEST2: retry apply thành công';

  -- ---- TEST 3: snapshot before/after + target_id ----
  SELECT before_snapshot->>'ten' INTO txt FROM public.import_item WHERE batch_id=bid AND row_index=3;
  IF txt<>'Ten cu' THEN RAISE EXCEPTION 'assert TEST3: before_snapshot sai (%)', txt; END IF;
  SELECT after_snapshot->>'ten' INTO txt FROM public.import_item WHERE batch_id=bid AND row_index=3;
  IF txt<>'Ten moi' THEN RAISE EXCEPTION 'assert TEST3: after_snapshot sai (%)', txt; END IF;
  SELECT count(*) INTO cnt FROM public.import_item WHERE batch_id=bid AND row_index=2 AND target_id=created_ht;
  IF cnt<>1 THEN RAISE EXCEPTION 'assert TEST3: target_id của create chưa lưu'; END IF;
  RAISE NOTICE 'PASS TEST3: snapshot + target_id';

  -- ---- TEST 4: idempotent (apply lại không tạo trùng) ----
  res := public.apply_import_batch(bid, NULL);
  IF (res->>'created')::int<>0 OR (res->>'updated')::int<>0 THEN
    RAISE EXCEPTION 'assert TEST4: apply lại phải 0 thay đổi (%)', res; END IF;
  SELECT count(*) INTO cnt FROM public.dm_he_thong WHERE ma='TST_HT';
  IF cnt<>1 THEN RAISE EXCEPTION 'assert TEST4: idempotent thất bại (cnt=%)', cnt; END IF;
  RAISE NOTICE 'PASS TEST4: idempotent';

  -- ---- TEST 5: tạo dữ liệu phụ thuộc -> preview chặn ----
  INSERT INTO public.thiet_bi(ma_thiet_bi,ten_thiet_bi,he_thong_id) VALUES ('TST_TB','TB test',created_ht);
  prev := public.preview_rollback_import_batch(bid);
  IF (prev->>'cannot')::int<>1 THEN RAISE EXCEPTION 'assert TEST5: preview cannot phải =1 (%)', prev; END IF;
  SELECT count(*) INTO cnt FROM jsonb_array_elements(prev->'items') e
    WHERE (e->>'target_id')=created_ht::text AND (e->>'can_rollback')='false';
  IF cnt<>1 THEN RAISE EXCEPTION 'assert TEST5: dòng tạo TST_HT phải bị chặn'; END IF;
  RAISE NOTICE 'PASS TEST5: preview liệt kê dòng có lịch sử';

  -- ---- TEST 6: rollback khôi phục + chặn record có lịch sử ----
  res := public.rollback_import_batch(bid);
  IF (res->>'blocked')::int<>1 THEN RAISE EXCEPTION 'assert TEST6: blocked phải =1 (%)', res; END IF;
  SELECT count(*) INTO cnt FROM public.dm_nhom_he_thong WHERE ma='TST_NHOM';
  IF cnt<>0 THEN RAISE EXCEPTION 'assert TEST6: nhom chưa bị xóa khi rollback'; END IF;
  SELECT count(*) INTO cnt FROM public.dm_he_thong WHERE id=created_ht;
  IF cnt<>1 THEN RAISE EXCEPTION 'assert TEST6: TST_HT phải còn (bị chặn vì có lịch sử)'; END IF;
  SELECT ten INTO txt FROM public.dm_he_thong WHERE id=ht_upd;
  IF txt<>'Ten cu' THEN RAISE EXCEPTION 'assert TEST6: update chưa khôi phục (%)', txt; END IF;
  SELECT active INTO ok FROM public.dm_he_thong WHERE id=ht_ret;
  IF ok<>true THEN RAISE EXCEPTION 'assert TEST6: retire chưa khôi phục'; END IF;
  RAISE NOTICE 'PASS TEST6: rollback + chặn record có lịch sử (không xóa cứng)';

  -- ---- TEST 7: audit_log ----
  SELECT count(*) INTO cnt FROM public.audit_log WHERE detail->>'batch_id'=bid::text;
  IF cnt<6 THEN RAISE EXCEPTION 'assert TEST7: audit thiếu (cnt=%)', cnt; END IF;
  RAISE NOTICE 'PASS TEST7: audit_log ghi % dòng', cnt;

  RAISE NOTICE '==== TẤT CẢ TEST PASS ====';
END $$;

ROLLBACK;  -- Không để lại bất kỳ dữ liệu test nào.
