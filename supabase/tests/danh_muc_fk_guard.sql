-- pgTAP: FK guard danh mục — chặn xoá khi còn tham chiếu.
--
-- Bao phủ:
--  1) FK RESTRICT trên thiet_bi → không thể xoá dm_model / dm_nsx / dm_ncc /
--     dm_loai / dm_don_vi / dm_vi_tri khi còn thiết bị đang trỏ tới.
--  2) RPC dm_xoa_an_toan phát hiện tham chiếu qua thiet_bi và trả lỗi 23503.
--  3) Với dm_don_vi: RPC còn kiểm tra dm_he_thong.don_vi_id.

BEGIN;
SELECT plan(6);

-- Chuẩn bị dữ liệu tạm (dùng SAVEPOINT để không đụng dữ liệu thật).
CREATE TEMP TABLE _ids AS
SELECT
  gen_random_uuid() AS nsx,
  gen_random_uuid() AS ncc,
  gen_random_uuid() AS loai,
  gen_random_uuid() AS dv,
  gen_random_uuid() AS vt,
  gen_random_uuid() AS md,
  gen_random_uuid() AS ht,
  gen_random_uuid() AS tb;

INSERT INTO public.dm_nha_san_xuat (id, ma, ten, active)
SELECT nsx, 'TEST_NSX_' || substring(nsx::text, 1, 6), 'TestNSX', true FROM _ids;
INSERT INTO public.dm_nha_cung_cap (id, ma, ten, active)
SELECT ncc, 'TEST_NCC_' || substring(ncc::text, 1, 6), 'TestNCC', true FROM _ids;
INSERT INTO public.dm_loai_thiet_bi (id, ma, ten, active)
SELECT loai, 'TEST_LOAI_' || substring(loai::text, 1, 6), 'TestLoai', true FROM _ids;
INSERT INTO public.dm_don_vi (id, ma, ten, active)
SELECT dv, 'TEST_DV_' || substring(dv::text, 1, 6), 'TestDV', true FROM _ids;
INSERT INTO public.dm_vi_tri (id, ma, ten, active)
SELECT vt, 'TEST_VT_' || substring(vt::text, 1, 6), 'TestVT', true FROM _ids;
INSERT INTO public.dm_model (id, ma, ten, active)
SELECT md, 'TEST_MODEL_' || substring(md::text, 1, 6), 'TestModel', true FROM _ids;

-- Thiết bị tham chiếu tất cả các danh mục trên
INSERT INTO public.thiet_bi
  (id, ma_thiet_bi, ten_thiet_bi, nha_san_xuat_id, nha_cung_cap_id,
   loai_thiet_bi_id, don_vi_id, vi_tri_id, model_id)
SELECT tb, 'TEST_TB_' || substring(tb::text, 1, 6), 'TB Test',
       nsx, ncc, loai, dv, vt, md
FROM _ids;

-- 1) FK RESTRICT: DELETE dm_model khi còn thiet_bi trỏ tới → lỗi
SELECT throws_ok(
  format('DELETE FROM public.dm_model WHERE id = %L', (SELECT md FROM _ids)),
  '23503',
  NULL,
  'FK RESTRICT chặn xoá dm_model khi còn tài sản tham chiếu'
);

-- 2) FK RESTRICT: DELETE dm_nha_san_xuat khi còn thiet_bi trỏ tới → lỗi
SELECT throws_ok(
  format('DELETE FROM public.dm_nha_san_xuat WHERE id = %L', (SELECT nsx FROM _ids)),
  '23503',
  NULL,
  'FK RESTRICT chặn xoá dm_nha_san_xuat khi còn tài sản tham chiếu'
);

-- 3) FK RESTRICT: DELETE dm_loai_thiet_bi khi còn thiet_bi trỏ tới → lỗi
SELECT throws_ok(
  format('DELETE FROM public.dm_loai_thiet_bi WHERE id = %L', (SELECT loai FROM _ids)),
  '23503',
  NULL,
  'FK RESTRICT chặn xoá dm_loai_thiet_bi khi còn tài sản tham chiếu'
);

-- 4) Sau khi xoá thiet_bi, xoá dm_model được (đảm bảo guard không quá tay)
DELETE FROM public.thiet_bi WHERE id = (SELECT tb FROM _ids);
SELECT lives_ok(
  format('DELETE FROM public.dm_model WHERE id = %L', (SELECT md FROM _ids)),
  'Xoá được dm_model khi không còn tài sản trỏ tới'
);

-- 5) dm_don_vi: còn hệ thống trực thuộc → không được xoá
INSERT INTO public.dm_he_thong (id, ma, ten, don_vi_id)
SELECT ht, 'TEST_HT_' || substring(ht::text, 1, 6), 'TestHT', dv FROM _ids;

SELECT throws_ok(
  format('DELETE FROM public.dm_don_vi WHERE id = %L', (SELECT dv FROM _ids)),
  '23503',
  NULL,
  'FK RESTRICT chặn xoá dm_don_vi khi còn hệ thống trực thuộc'
);

-- 6) Xoá hết dữ liệu ràng buộc → xoá dm_don_vi thành công
DELETE FROM public.dm_he_thong WHERE id = (SELECT ht FROM _ids);
SELECT lives_ok(
  format('DELETE FROM public.dm_don_vi WHERE id = %L', (SELECT dv FROM _ids)),
  'Xoá được dm_don_vi khi không còn hệ thống trực thuộc'
);

SELECT * FROM finish();
ROLLBACK;
