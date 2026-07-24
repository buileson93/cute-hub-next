
-- ============================================================================
-- TASK 10 — Master-data một nguồn sự thật cho thiet_bi
--   * Backfill *_id từ text (chuẩn hoá không dấu, gộp khoảng trắng) khi
--     match duy nhất trong danh mục tương ứng.
--   * Mở rộng trigger thiet_bi_sync_ref_text: khi ghi TEXT trực tiếp mà thiếu
--     FK, tự resolve FK theo tên chuẩn hoá (chỉ khi match duy nhất). Nếu FK
--     có sẵn thì text luôn là snapshot của tên FK (nguồn sự thật = FK).
--   * Trigger nghe thêm cả các cột text và cột phan_loai_id, vi_tri_id.
-- ============================================================================

-- Chuẩn hoá tên: hạ dấu + lowercase + gộp khoảng trắng.
CREATE OR REPLACE FUNCTION public.chuan_hoa_ten(s text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT btrim(regexp_replace(
    lower(translate(
      regexp_replace(unaccent(coalesce(s, '')), '\s+', ' ', 'g'),
      'đĐ', 'dD'
    )),
    '\s+', ' ', 'g'
  ));
$$;

-- Cần extension unaccent (idempotent).
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Trigger function mới: đồng bộ 2 chiều FK ↔ text (FK là nguồn sự thật).
CREATE OR REPLACE FUNCTION public.thiet_bi_sync_ref_text()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_cnt int;
BEGIN
  -- Hàm nội bộ: nếu có FK → text = ten của FK (snapshot).
  -- Nếu chỉ có text (FK NULL) → thử resolve FK theo tên chuẩn hoá,
  --   chỉ gán khi match DUY NHẤT (an toàn, không tự merge).

  -- nha_san_xuat
  IF NEW.nha_san_xuat_id IS NOT NULL THEN
    SELECT ten INTO NEW.nha_san_xuat FROM public.dm_nha_san_xuat WHERE id = NEW.nha_san_xuat_id;
  ELSIF NEW.nha_san_xuat IS NOT NULL AND btrim(NEW.nha_san_xuat) <> '' THEN
    SELECT id INTO v_id FROM public.dm_nha_san_xuat
      WHERE public.chuan_hoa_ten(ten) = public.chuan_hoa_ten(NEW.nha_san_xuat)
      LIMIT 2;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    IF v_cnt = 1 THEN
      NEW.nha_san_xuat_id := v_id;
      SELECT ten INTO NEW.nha_san_xuat FROM public.dm_nha_san_xuat WHERE id = v_id;
    END IF;
  END IF;

  -- nha_cung_cap
  IF NEW.nha_cung_cap_id IS NOT NULL THEN
    SELECT ten INTO NEW.nha_cung_cap FROM public.dm_nha_cung_cap WHERE id = NEW.nha_cung_cap_id;
  ELSIF NEW.nha_cung_cap IS NOT NULL AND btrim(NEW.nha_cung_cap) <> '' THEN
    SELECT id INTO v_id FROM public.dm_nha_cung_cap
      WHERE public.chuan_hoa_ten(ten) = public.chuan_hoa_ten(NEW.nha_cung_cap)
      LIMIT 2;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    IF v_cnt = 1 THEN
      NEW.nha_cung_cap_id := v_id;
      SELECT ten INTO NEW.nha_cung_cap FROM public.dm_nha_cung_cap WHERE id = v_id;
    END IF;
  END IF;

  -- model
  IF NEW.model_id IS NOT NULL THEN
    SELECT ten INTO NEW.model FROM public.dm_model WHERE id = NEW.model_id;
  ELSIF NEW.model IS NOT NULL AND btrim(NEW.model) <> '' THEN
    SELECT id INTO v_id FROM public.dm_model
      WHERE public.chuan_hoa_ten(ten) = public.chuan_hoa_ten(NEW.model)
      LIMIT 2;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    IF v_cnt = 1 THEN
      NEW.model_id := v_id;
      SELECT ten INTO NEW.model FROM public.dm_model WHERE id = v_id;
    END IF;
  END IF;

  -- vi_tri
  IF NEW.vi_tri_id IS NOT NULL THEN
    SELECT ten INTO NEW.vi_tri FROM public.dm_vi_tri WHERE id = NEW.vi_tri_id;
  ELSIF NEW.vi_tri IS NOT NULL AND btrim(NEW.vi_tri) <> '' THEN
    SELECT id INTO v_id FROM public.dm_vi_tri
      WHERE public.chuan_hoa_ten(ten) = public.chuan_hoa_ten(NEW.vi_tri)
      LIMIT 2;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    IF v_cnt = 1 THEN
      NEW.vi_tri_id := v_id;
      SELECT ten INTO NEW.vi_tri FROM public.dm_vi_tri WHERE id = v_id;
    END IF;
  END IF;

  -- phan_loai
  IF NEW.phan_loai_id IS NOT NULL THEN
    SELECT ten INTO NEW.phan_loai FROM public.dm_phan_loai WHERE id = NEW.phan_loai_id;
  ELSIF NEW.phan_loai IS NOT NULL AND btrim(NEW.phan_loai) <> '' THEN
    SELECT id INTO v_id FROM public.dm_phan_loai
      WHERE public.chuan_hoa_ten(ten) = public.chuan_hoa_ten(NEW.phan_loai)
      LIMIT 2;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    IF v_cnt = 1 THEN
      NEW.phan_loai_id := v_id;
      SELECT ten INTO NEW.phan_loai FROM public.dm_phan_loai WHERE id = v_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Cập nhật trigger để nghe cả cột text + phan_loai_id + vi_tri_id.
DROP TRIGGER IF EXISTS trg_thiet_bi_sync_ref_text ON public.thiet_bi;
CREATE TRIGGER trg_thiet_bi_sync_ref_text
BEFORE INSERT OR UPDATE OF
  nha_san_xuat_id, nha_cung_cap_id, model_id, vi_tri_id, phan_loai_id,
  nha_san_xuat,    nha_cung_cap,    model,    vi_tri,    phan_loai
ON public.thiet_bi
FOR EACH ROW EXECUTE FUNCTION public.thiet_bi_sync_ref_text();

-- ---------------------------------------------------------------------------
-- Backfill: cập nhật các FK còn NULL từ text khi match DUY NHẤT.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  n_nsx int; n_ncc int; n_model int; n_vt int; n_pl int;
  n_left_nsx int; n_left_ncc int; n_left_model int; n_left_vt int; n_left_pl int;
BEGIN
  WITH cand AS (
    SELECT t.id AS tb_id,
           (SELECT array_agg(d.id) FROM public.dm_nha_san_xuat d
              WHERE public.chuan_hoa_ten(d.ten) = public.chuan_hoa_ten(t.nha_san_xuat)) AS ids
      FROM public.thiet_bi t
     WHERE t.nha_san_xuat_id IS NULL
       AND t.nha_san_xuat IS NOT NULL AND btrim(t.nha_san_xuat) <> ''
  )
  UPDATE public.thiet_bi t SET nha_san_xuat_id = c.ids[1]
    FROM cand c
   WHERE t.id = c.tb_id AND array_length(c.ids, 1) = 1;
  GET DIAGNOSTICS n_nsx = ROW_COUNT;

  WITH cand AS (
    SELECT t.id AS tb_id,
           (SELECT array_agg(d.id) FROM public.dm_nha_cung_cap d
              WHERE public.chuan_hoa_ten(d.ten) = public.chuan_hoa_ten(t.nha_cung_cap)) AS ids
      FROM public.thiet_bi t
     WHERE t.nha_cung_cap_id IS NULL
       AND t.nha_cung_cap IS NOT NULL AND btrim(t.nha_cung_cap) <> ''
  )
  UPDATE public.thiet_bi t SET nha_cung_cap_id = c.ids[1]
    FROM cand c
   WHERE t.id = c.tb_id AND array_length(c.ids, 1) = 1;
  GET DIAGNOSTICS n_ncc = ROW_COUNT;

  WITH cand AS (
    SELECT t.id AS tb_id,
           (SELECT array_agg(d.id) FROM public.dm_model d
              WHERE public.chuan_hoa_ten(d.ten) = public.chuan_hoa_ten(t.model)) AS ids
      FROM public.thiet_bi t
     WHERE t.model_id IS NULL
       AND t.model IS NOT NULL AND btrim(t.model) <> ''
  )
  UPDATE public.thiet_bi t SET model_id = c.ids[1]
    FROM cand c
   WHERE t.id = c.tb_id AND array_length(c.ids, 1) = 1;
  GET DIAGNOSTICS n_model = ROW_COUNT;

  WITH cand AS (
    SELECT t.id AS tb_id,
           (SELECT array_agg(d.id) FROM public.dm_vi_tri d
              WHERE public.chuan_hoa_ten(d.ten) = public.chuan_hoa_ten(t.vi_tri)) AS ids
      FROM public.thiet_bi t
     WHERE t.vi_tri_id IS NULL
       AND t.vi_tri IS NOT NULL AND btrim(t.vi_tri) <> ''
  )
  UPDATE public.thiet_bi t SET vi_tri_id = c.ids[1]
    FROM cand c
   WHERE t.id = c.tb_id AND array_length(c.ids, 1) = 1;
  GET DIAGNOSTICS n_vt = ROW_COUNT;

  WITH cand AS (
    SELECT t.id AS tb_id,
           (SELECT array_agg(d.id) FROM public.dm_phan_loai d
              WHERE public.chuan_hoa_ten(d.ten) = public.chuan_hoa_ten(t.phan_loai)) AS ids
      FROM public.thiet_bi t
     WHERE t.phan_loai_id IS NULL
       AND t.phan_loai IS NOT NULL AND btrim(t.phan_loai) <> ''
  )
  UPDATE public.thiet_bi t SET phan_loai_id = c.ids[1]
    FROM cand c
   WHERE t.id = c.tb_id AND array_length(c.ids, 1) = 1;
  GET DIAGNOSTICS n_pl = ROW_COUNT;

  -- Đếm dòng còn lệch (không match được → cần con người xử lý).
  SELECT COUNT(*) INTO n_left_nsx FROM public.thiet_bi
    WHERE nha_san_xuat_id IS NULL AND nha_san_xuat IS NOT NULL AND btrim(nha_san_xuat) <> '';
  SELECT COUNT(*) INTO n_left_ncc FROM public.thiet_bi
    WHERE nha_cung_cap_id IS NULL AND nha_cung_cap IS NOT NULL AND btrim(nha_cung_cap) <> '';
  SELECT COUNT(*) INTO n_left_model FROM public.thiet_bi
    WHERE model_id IS NULL AND model IS NOT NULL AND btrim(model) <> '';
  SELECT COUNT(*) INTO n_left_vt FROM public.thiet_bi
    WHERE vi_tri_id IS NULL AND vi_tri IS NOT NULL AND btrim(vi_tri) <> '';
  SELECT COUNT(*) INTO n_left_pl FROM public.thiet_bi
    WHERE phan_loai_id IS NULL AND phan_loai IS NOT NULL AND btrim(phan_loai) <> '';

  RAISE NOTICE '[TASK10] Backfill: nsx=% ncc=% model=% vi_tri=% phan_loai=%',
    n_nsx, n_ncc, n_model, n_vt, n_pl;
  RAISE NOTICE '[TASK10] Còn lệch (không match duy nhất, cần review): nsx=% ncc=% model=% vi_tri=% phan_loai=%',
    n_left_nsx, n_left_ncc, n_left_model, n_left_vt, n_left_pl;
END $$;
