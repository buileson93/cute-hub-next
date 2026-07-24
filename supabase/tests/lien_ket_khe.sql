-- ============================================================================
-- LIÊN KẾT MỨC KHE/CỔNG (supporting-link, RFC 8345) — pgTAP.
-- (a) CHECK chặn khe tự nối; (b) roll-up khe -> hệ thống đúng;
-- (c) RLS: chỉ can_manage_equipment mới ghi được lien_ket_khe;
-- (d) v_lien_ket_hieu_luc trả đúng ảnh chụp tại một mốc thời gian.
-- Toàn bộ chạy trong 1 transaction rồi ROLLBACK -> không để lại dữ liệu/ext.
-- Chạy:  psql -f supabase/tests/lien_ket_khe.sql
-- ============================================================================

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(12);

-- ---- CẤU TRÚC --------------------------------------------------------------
SELECT has_table('public', 'lien_ket_khe', 'bảng lien_ket_khe tồn tại');
SELECT has_view('public', 'v_lien_ket_tu_khe', 'view roll-up v_lien_ket_tu_khe tồn tại');
SELECT has_function(
  'public', 'v_lien_ket_hieu_luc', ARRAY['timestamp with time zone'],
  'hàm v_lien_ket_hieu_luc(timestamptz) tồn tại'
);
SELECT ok(
  (SELECT count(*) FROM pg_indexes
   WHERE schemaname='public' AND tablename='lien_ket_khe'
     AND indexdef ILIKE '%UNIQUE%' AND indexdef ILIKE '%hieu_luc_den IS NULL%') >= 1,
  'có unique index theo quy ước hieu_luc_den IS NULL (như 1B)'
);

-- ---- DỰNG DỮ LIỆU FIXTURE (bypass RLS: đang chạy với vai trò owner) --------
-- 2 hệ thống, mỗi hệ thống 1 thành phần (khe); + 2 khe cùng 1 hệ thống.
DO $$
DECLARE
  v_ht_a uuid; v_ht_b uuid; v_loai uuid;
BEGIN
  INSERT INTO dm_he_thong(id, ma, ten) VALUES
    (gen_random_uuid(), 'ZZTEST_HT_A', 'HT A test'),
    (gen_random_uuid(), 'ZZTEST_HT_B', 'HT B test');
  SELECT id INTO v_ht_a FROM dm_he_thong WHERE ma='ZZTEST_HT_A';
  SELECT id INTO v_ht_b FROM dm_he_thong WHERE ma='ZZTEST_HT_B';

  SELECT id INTO v_loai FROM dm_loai_lien_ket ORDER BY thu_tu LIMIT 1;

  INSERT INTO he_thong_thanh_phan(id, he_thong_id, ma_thanh_phan, ten) VALUES
    (gen_random_uuid(), v_ht_a, 'ZZTP_A1', 'Khe A1'),
    (gen_random_uuid(), v_ht_a, 'ZZTP_A2', 'Khe A2'),
    (gen_random_uuid(), v_ht_b, 'ZZTP_B1', 'Khe B1');
END $$;

-- ---- (a) CHECK CHẶN KHE TỰ NỐI ---------------------------------------------
SELECT throws_ok(
  $$INSERT INTO lien_ket_khe(khe_nguon_id, khe_dich_id, loai_lien_ket_id)
    SELECT tp.id, tp.id, (SELECT id FROM dm_loai_lien_ket ORDER BY thu_tu LIMIT 1)
    FROM he_thong_thanh_phan tp WHERE tp.ma_thanh_phan='ZZTP_A1'$$,
  '23514',
  NULL,
  '(a) CHECK lkk_khong_tu_noi chặn khe tự nối'
);

-- ---- (b) ROLL-UP KHE -> HỆ THỐNG -------------------------------------------
-- Liên kết A1 (HT A) <-> B1 (HT B) -> phải xuất hiện 1 cạnh hệ thống A->B.
INSERT INTO lien_ket_khe(khe_nguon_id, khe_dich_id, loai_lien_ket_id, hieu_luc_tu)
SELECT a.id, b.id, (SELECT id FROM dm_loai_lien_ket ORDER BY thu_tu LIMIT 1),
       '2024-01-01 00:00+00'
FROM he_thong_thanh_phan a, he_thong_thanh_phan b
WHERE a.ma_thanh_phan='ZZTP_A1' AND b.ma_thanh_phan='ZZTP_B1';

-- Liên kết A1 <-> A2 (cùng HT A) -> KHÔNG được roll-up thành cạnh hệ thống.
INSERT INTO lien_ket_khe(khe_nguon_id, khe_dich_id, loai_lien_ket_id, hieu_luc_tu)
SELECT a1.id, a2.id, (SELECT id FROM dm_loai_lien_ket ORDER BY thu_tu LIMIT 1),
       '2024-01-01 00:00+00'
FROM he_thong_thanh_phan a1, he_thong_thanh_phan a2
WHERE a1.ma_thanh_phan='ZZTP_A1' AND a2.ma_thanh_phan='ZZTP_A2';

SELECT is(
  (SELECT count(*)::int FROM v_lien_ket_tu_khe v
   JOIN dm_he_thong hn ON hn.id=v.he_thong_nguon_id
   JOIN dm_he_thong hd ON hd.id=v.he_thong_dich_id
   WHERE hn.ma='ZZTEST_HT_A' AND hd.ma='ZZTEST_HT_B'),
  1,
  '(b) 2 khe thuộc 2 hệ thống -> đúng 1 cạnh hệ thống A->B'
);

SELECT is(
  (SELECT count(*)::int FROM v_lien_ket_tu_khe v
   JOIN dm_he_thong hn ON hn.id=v.he_thong_nguon_id
   JOIN dm_he_thong hd ON hd.id=v.he_thong_dich_id
   WHERE hn.ma='ZZTEST_HT_A' AND hd.ma='ZZTEST_HT_A'),
  0,
  '(b) 2 khe cùng 1 hệ thống -> KHÔNG tạo cạnh hệ thống'
);

-- ---- (d) v_lien_ket_hieu_luc THEO THỜI ĐIỂM --------------------------------
-- Thêm 1 liên kết đã đóng: hiệu lực 2023-01 .. 2023-06.
INSERT INTO lien_ket_khe(khe_nguon_id, khe_dich_id, loai_lien_ket_id, hieu_luc_tu, hieu_luc_den)
SELECT a2.id, b.id, (SELECT id FROM dm_loai_lien_ket ORDER BY thu_tu LIMIT 1),
       '2023-01-01 00:00+00', '2023-06-01 00:00+00'
FROM he_thong_thanh_phan a2, he_thong_thanh_phan b
WHERE a2.ma_thanh_phan='ZZTP_A2' AND b.ma_thanh_phan='ZZTP_B1';

-- Ảnh chụp giữa 2023 -> chỉ liên kết đã đóng còn hiệu lực (2 cạnh A1<->B1 chưa tồn tại lúc đó).
SELECT is(
  (SELECT count(*)::int FROM v_lien_ket_hieu_luc('2023-03-01 00:00+00')),
  1,
  '(d) ảnh chụp 2023-03: chỉ 1 liên kết còn hiệu lực'
);

-- Ảnh chụp sau 2023-06 -> liên kết đã đóng biến mất, chỉ còn các liên kết mở (2024).
SELECT is(
  (SELECT count(*)::int FROM v_lien_ket_hieu_luc('2023-07-01 00:00+00')),
  0,
  '(d) ảnh chụp 2023-07: liên kết đã đóng không còn hiệu lực'
);

-- Ảnh chụp hiện tại -> 2 liên kết mở (A1<->B1 và A1<->A2), liên kết đã đóng không tính.
SELECT is(
  (SELECT count(*)::int FROM v_lien_ket_hieu_luc('2024-02-01 00:00+00')),
  2,
  '(d) ảnh chụp 2024-02: 2 liên kết đang mở còn hiệu lực'
);

-- ---- (c) RLS: chỉ can_manage_equipment mới GHI được ------------------------
-- Cấu trúc policy: write policy dùng can_manage_equipment; select policy giới hạn đơn vị.
SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='lien_ket_khe'
      AND cmd='ALL'
      AND qual ILIKE '%can_manage_equipment%'
      AND with_check ILIKE '%can_manage_equipment%'
  ),
  '(c) policy ghi lien_ket_khe yêu cầu can_manage_equipment (USING + WITH CHECK)'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid='public.lien_ket_khe'::regclass),
  '(c) RLS đã bật trên lien_ket_khe'
);

SELECT * FROM finish();
ROLLBACK;
